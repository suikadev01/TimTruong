"""Ảnh cơ sở vật chất (trường) và ảnh KTX → Cloudflare R2 + DB.

  uv run etl_images.py              # đồng bộ cả hai CSV
  uv run etl_images.py --dry-run    # tải + kiểm tra, không upload, không ghi DB

Đọc:
  data/_shared/university_images.csv   UniCode,CampusName,SourceUrl,Caption
  data/_shared/dormitory_images.csv    DormitoryName,SourceUrl,Caption

Với mỗi dòng:
  1. Tải SourceUrl về cache data/_shared/images/<hash của URL>.<ext> (git-ignored).
     Đã có trong cache → không tải lại. Tải lỗi (403, link chết) → script in ra
     tên file cần có; tự tải bằng trình duyệt, đặt đúng tên đó rồi chạy lại.
  2. Key R2 = images/<sha256 nội dung gốc>[:16].webp. Key đã có trên R2 → bỏ qua.
     Chưa có → xoay theo EXIF, resize (cạnh dài ≤ MAX_SIDE), chuyển WebP, upload.
  3. Ghi DB: thay toàn bộ UniversityImages / DormitoryImages bằng nội dung CSV
     (SortOrder = thứ tự dòng). Chỉ ghi khi MỌI dòng đều ổn, để không làm mất ảnh
     đang hiển thị chỉ vì một link tạm thời lỗi.

Object trên R2 không bao giờ bị xoá (ảnh bỏ khỏi CSV chỉ mất khỏi DB).
"""

import argparse
import csv
import glob
import hashlib
import io
import os
import sys
import urllib.request
from dataclasses import dataclass

import boto3
from PIL import Image, ImageOps

from db import get_connection  # cũng nạp etl/.env

SHARED_DIR = os.path.join(os.path.dirname(__file__), "data", "_shared")
UNI_CSV = os.path.join(SHARED_DIR, "university_images.csv")
DORM_CSV = os.path.join(SHARED_DIR, "dormitory_images.csv")
CACHE_DIR = os.path.join(SHARED_DIR, "images")

MAX_SIDE = 1600  # px, cạnh dài nhất sau khi resize
WEBP_QUALITY = 80
KEY_PREFIX = "images/"
# Key là hash nội dung → object không bao giờ đổi → cache vĩnh viễn được.
CACHE_CONTROL = "public, max-age=31536000, immutable"
USER_AGENT = "Mozilla/5.0 (compatible; image-fetcher)"

EXT_BY_MIME = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}


@dataclass
class Row:
    label: str  # để in log, vd "university_images.csv:3"
    owner_id: int | None
    campus_id: int | None
    source_url: str
    caption: str | None
    key: str | None = None


# ---------- CSV ----------

def read_csv(path: str) -> list[tuple[int, dict]]:
    """→ [(số dòng trong file, row)], bỏ dòng trống."""
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8", newline="") as f:
        rows = []
        for i, row in enumerate(csv.DictReader(f), start=2):  # dòng 1 là header
            row = {k: (v or "").strip() for k, v in row.items()}
            if any(row.values()):
                rows.append((i, row))
        return rows


def load_rows(cur) -> tuple[list[Row], list[Row], list[str]]:
    """Đọc 2 CSV và resolve UniCode / CampusName / DormitoryName → Id."""
    errors: list[str] = []

    cur.execute('SELECT "Id", "Code" FROM "Universities"')
    uni_id_by_code = {code: id_ for id_, code in cur.fetchall()}
    cur.execute('SELECT "Id", "UniversityId", "Name" FROM "Campuses"')
    campus_id = {(uni_id, name.strip().lower()): id_ for id_, uni_id, name in cur.fetchall()}
    cur.execute('SELECT "Id", "Name" FROM "Dormitories"')
    dorm_id_by_name = {name.strip().lower(): id_ for id_, name in cur.fetchall()}

    uni_rows: list[Row] = []
    for line, r in read_csv(UNI_CSV):
        label = f"university_images.csv:{line}"
        uni_id = uni_id_by_code.get(r.get("UniCode", ""))
        if uni_id is None:
            errors.append(f"{label}: không có University với UniCode '{r.get('UniCode')}'")
            continue
        cid = None
        if r.get("CampusName"):
            cid = campus_id.get((uni_id, r["CampusName"].lower()))
            if cid is None:
                errors.append(f"{label}: trường {r['UniCode']} không có campus '{r['CampusName']}'")
                continue
        if not r.get("SourceUrl"):
            errors.append(f"{label}: thiếu SourceUrl")
            continue
        uni_rows.append(Row(label, uni_id, cid, r["SourceUrl"], r.get("Caption") or None))

    dorm_rows: list[Row] = []
    for line, r in read_csv(DORM_CSV):
        label = f"dormitory_images.csv:{line}"
        dorm_id = dorm_id_by_name.get(r.get("DormitoryName", "").lower())
        if dorm_id is None:
            errors.append(f"{label}: không có Dormitory tên '{r.get('DormitoryName')}' (chạy etl_dormitories.py trước?)")
            continue
        if not r.get("SourceUrl"):
            errors.append(f"{label}: thiếu SourceUrl")
            continue
        dorm_rows.append(Row(label, dorm_id, None, r["SourceUrl"], r.get("Caption") or None))

    return uni_rows, dorm_rows, errors


# ---------- Tải ảnh về cache ----------

def cache_stem(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


def get_source_bytes(url: str) -> bytes:
    """Đọc từ cache, chưa có thì tải về. Lỗi → raise kèm hướng dẫn đặt file tay."""
    stem = cache_stem(url)
    cached = glob.glob(os.path.join(CACHE_DIR, stem + ".*"))
    if cached:
        with open(cached[0], "rb") as f:
            return f.read()

    hint = f"tự tải ảnh rồi lưu thành data/_shared/images/{stem}.<jpg|png|webp>"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            mime = (resp.headers.get_content_type() or "").lower()
    except Exception as e:
        raise RuntimeError(f"tải lỗi ({e}) → {hint}") from e

    if not mime.startswith("image/"):
        raise RuntimeError(f"URL trả về '{mime}', không phải ảnh → {hint}")
    validate_image(data)

    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(os.path.join(CACHE_DIR, stem + EXT_BY_MIME.get(mime, ".img")), "wb") as f:
        f.write(data)
    return data


def validate_image(data: bytes) -> None:
    try:
        with Image.open(io.BytesIO(data)) as im:
            im.verify()
    except Exception as e:
        raise RuntimeError(f"file không phải ảnh hợp lệ ({e})") from e


# ---------- Xử lý + R2 ----------

def to_webp(data: bytes) -> bytes:
    with Image.open(io.BytesIO(data)) as im:
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        im.save(out, "WEBP", quality=WEBP_QUALITY, method=6)
        return out.getvalue()


def r2_client():
    missing = [k for k in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET") if not os.environ.get(k)]
    if missing:
        sys.exit(f"Thiếu biến môi trường: {', '.join(missing)} (xem etl/.env.example)")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def existing_keys(s3, bucket: str) -> set[str]:
    keys: set[str] = set()
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=bucket, Prefix=KEY_PREFIX):
        keys.update(obj["Key"] for obj in page.get("Contents", []))
    return keys


def process(rows: list[Row], s3, bucket: str | None, on_r2: set[str]) -> tuple[list[str], int]:
    """Gán row.key, upload ảnh mới. → (lỗi, số ảnh đã upload)."""
    errors: list[str] = []
    uploaded = 0
    for row in rows:
        try:
            data = get_source_bytes(row.source_url)
        except RuntimeError as e:
            errors.append(f"{row.label}: {row.source_url}\n      {e}")
            continue

        row.key = f"{KEY_PREFIX}{hashlib.sha256(data).hexdigest()[:16]}.webp"
        if s3 is None or row.key in on_r2:
            continue

        webp = to_webp(data)
        s3.put_object(Bucket=bucket, Key=row.key, Body=webp, ContentType="image/webp", CacheControl=CACHE_CONTROL)
        on_r2.add(row.key)
        uploaded += 1
        print(f"  ↑ {row.key}  {len(data) // 1024} KB → {len(webp) // 1024} KB  ({row.label})")
    return errors, uploaded


def find_duplicates(rows: list[Row], csv_name: str) -> list[str]:
    seen: dict[tuple, str] = {}
    errors = []
    for row in rows:
        k = (row.owner_id, row.key)
        if k in seen:
            errors.append(f"{row.label}: trùng ảnh với {seen[k]} ({csv_name})")
        else:
            seen[k] = row.label
    return errors


# ---------- DB ----------

def write_db(cur, uni_rows: list[Row], dorm_rows: list[Row]) -> None:
    cur.execute('DELETE FROM "UniversityImages"')
    for order, row in enumerate(uni_rows):
        cur.execute(
            'INSERT INTO "UniversityImages" ("UniversityId", "CampusId", "Key", "Caption", "SourceUrl", "SortOrder") '
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (row.owner_id, row.campus_id, row.key, row.caption, row.source_url, order),
        )
    cur.execute('DELETE FROM "DormitoryImages"')
    for order, row in enumerate(dorm_rows):
        cur.execute(
            'INSERT INTO "DormitoryImages" ("DormitoryId", "Key", "Caption", "SourceUrl", "SortOrder") '
            "VALUES (%s, %s, %s, %s, %s)",
            (row.owner_id, row.key, row.caption, row.source_url, order),
        )


def run(dry_run: bool) -> int:
    with get_connection() as conn, conn.cursor() as cur:
        uni_rows, dorm_rows, errors = load_rows(cur)
        print(f"CSV: {len(uni_rows)} ảnh trường, {len(dorm_rows)} ảnh KTX")

        s3 = bucket = None
        on_r2: set[str] = set()
        if not dry_run:
            s3, bucket = r2_client(), os.environ["R2_BUCKET"]
            on_r2 = existing_keys(s3, bucket)
            print(f"R2: bucket '{bucket}' đang có {len(on_r2)} ảnh")

        uploaded = 0
        for rows in (uni_rows, dorm_rows):
            errs, n = process(rows, s3, bucket, on_r2)
            errors += errs
            uploaded += n
        errors += find_duplicates([r for r in uni_rows if r.key], "university_images.csv")
        errors += find_duplicates([r for r in dorm_rows if r.key], "dormitory_images.csv")

        if errors:
            print(f"\n✗ {len(errors)} lỗi — KHÔNG ghi DB (ảnh đã upload vẫn giữ trên R2):")
            for e in errors:
                print(f"  - {e}")
            return 1

        if dry_run:
            print("\n✓ Dry run: mọi ảnh đều tải/đọc được. Không upload, không ghi DB.")
            return 0

        write_db(cur, uni_rows, dorm_rows)
        conn.commit()

    print(f"\n✓ Done — uploaded: {uploaded}, DB: {len(uni_rows)} UniversityImages, {len(dorm_rows)} DormitoryImages")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Đồng bộ ảnh trường/KTX từ CSV lên R2 + DB.")
    parser.add_argument("--dry-run", action="store_true", help="tải + kiểm tra ảnh, không upload, không ghi DB")
    sys.exit(run(parser.parse_args().dry_run))
