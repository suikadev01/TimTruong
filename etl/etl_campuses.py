"""Cơ sở (campus) của các trường: data/_shared/campuses.csv → bảng Campuses.

  uv run etl_campuses.py     # chạy sau etl_universities.py

Cột CSV: UniCode,Name,Address,OldAddress
  - UniCode + Name: bắt buộc; (UniCode, Name) là khoá để upsert (không phân biệt hoa thường).
  - Address: địa chỉ mới (sau sáp nhập 2025, không còn quận/huyện).
  - OldAddress: địa chỉ cũ mà mọi người vẫn quen (vd '..., Quận 5, TP.HCM'). Cả hai có thể để trống.

Đồng bộ DB theo CSV: campus có trong CSV thì thêm/cập nhật (giữ nguyên Id),
campus không còn trong CSV thì bị xoá. Ảnh gắn với campus bị xoá vẫn còn,
chỉ thành ảnh chung của trường (CampusId = NULL); chạy lại etl_images.py để gắn lại.
Đổi tên campus trong CSV = xoá campus cũ + thêm campus mới.

Lỗi bất kỳ dòng nào → không ghi gì vào DB.
"""

import csv
import os
import sys

from db import get_connection

CSV_FILE = os.path.join(os.path.dirname(__file__), "data", "_shared", "campuses.csv")
COLUMNS = ["Name", "Address", "OldAddress"]

INSERT_SQL = """
    INSERT INTO "Campuses" ("UniversityId", "Name", "Address", "OldAddress")
    VALUES (%(UniversityId)s, %(Name)s, %(Address)s, %(OldAddress)s)
"""

UPDATE_SQL = """
    UPDATE "Campuses" SET
        "Name"       = %(Name)s,
        "Address"    = %(Address)s,
        "OldAddress" = %(OldAddress)s
    WHERE "Id" = %(Id)s
"""


def load_csv(uni_id_by_code: dict[str, int]) -> tuple[list[dict], list[str]]:
    rows, errors = [], []
    seen: dict[tuple[int, str], int] = {}

    with open(CSV_FILE, encoding="utf-8", newline="") as f:
        for line, raw in enumerate(csv.DictReader(f), start=2):  # dòng 1 là header
            r = {k: (v or "").strip() for k, v in raw.items()}
            if not any(r.values()):
                continue
            label = f"campuses.csv:{line}"

            uni_id = uni_id_by_code.get(r.get("UniCode", ""))
            if uni_id is None:
                errors.append(f"{label}: không có University với UniCode '{r.get('UniCode')}'")
                continue
            if not r.get("Name"):
                errors.append(f"{label}: thiếu Name")
                continue

            key = (uni_id, r["Name"].lower())
            if key in seen:
                errors.append(f"{label}: trùng campus '{r['Name']}' với dòng {seen[key]}")
                continue
            seen[key] = line

            row = {c: r.get(c) or None for c in COLUMNS}
            row["UniversityId"] = uni_id
            rows.append(row)

    return rows, errors


def run() -> int:
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute('SELECT "Id", "Code" FROM "Universities"')
        uni_id_by_code = {code: id_ for id_, code in cur.fetchall()}

        rows, errors = load_csv(uni_id_by_code)
        print(f"Loaded {len(rows)} campuses from CSV")

        if errors:
            print(f"\n✗ {len(errors)} lỗi — KHÔNG ghi DB:")
            for e in errors:
                print(f"  - {e}")
            return 1

        cur.execute('SELECT "Id", "UniversityId", "Name" FROM "Campuses"')
        existing = {(uni_id, name.strip().lower()): (id_, name) for id_, uni_id, name in cur.fetchall()}

        # CSV rỗng mà DB đang có campus → gần như chắc chắn là nhầm file / nhầm DB.
        if not rows and existing:
            print(f"✗ CSV không có campus nào nhưng DB đang có {len(existing)} — dừng để tránh xoá hết.")
            return 1

        inserted = updated = deleted = 0
        csv_keys = set()
        for row in rows:
            key = (row["UniversityId"], row["Name"].lower())
            csv_keys.add(key)
            if key in existing:
                cur.execute(UPDATE_SQL, {**row, "Id": existing[key][0]})
                updated += 1
            else:
                cur.execute(INSERT_SQL, row)
                inserted += 1

        for key in existing.keys() - csv_keys:
            campus_id, name = existing[key]
            cur.execute('DELETE FROM "Campuses" WHERE "Id" = %s', (campus_id,))
            deleted += 1
            print(f"  Deleted campus '{name}' (Id {campus_id})")

        conn.commit()

    print(f"Done — inserted: {inserted}, updated: {updated}, deleted: {deleted}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1:
        sys.exit(__doc__)  # không nhận tham số; in hướng dẫn thay vì chạy nhầm
    sys.exit(run())
