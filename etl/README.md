# ETL — thứ tự chạy

Chạy trong thư mục `etl/`. Trước khi chạy, **kiểm tra `.env` đang trỏ tới DB nào**: các loader xoá những dòng không còn trong CSV.

```shell
uv run etl_universities.py   # 1. Trường           ← data/_shared/universities.csv
uv run etl_campuses.py       # 2. Cơ sở (campus)   ← data/_shared/campuses.csv          (cần 1)
uv run etl_majors.py         # 3. Ngành + năm      ← data/schools/*/majors/...          (cần 1)
uv run etl_admissions.py     # 4. Điểm chuẩn       ← data/schools/*/admissions/...      (cần 3)
uv run etl_dormitories.py    # 5. Ký túc xá        ← data/_shared/dormitories.csv       (cần 1)
uv run etl_rankings.py       # 6. Xếp hạng         ← data/_shared/university_rankings.csv (cần 1)
uv run etl_images.py         # 7. Ảnh → R2 + DB    ← data/_shared/*_images.csv          (cần 1, 2, 5)
```

Chạy hết một lần:

```shell
uv run etl_universities.py && uv run etl_campuses.py && uv run etl_majors.py \
  && uv run etl_admissions.py && uv run etl_dormitories.py && uv run etl_rankings.py \
  && uv run etl_images.py
```

Chỉ sửa một CSV thì chỉ cần chạy lại loader của CSV đó, cùng các loader phía sau nó có ghi "cần" bước đó.
Ví dụ: đổi tên campus → chạy `etl_campuses.py` rồi `etl_images.py`.

Ghi chú:
- `etl_universities.py`, `etl_dormitories.py`, `etl_rankings.py` không nhận tham số, kể cả `--help` cũng chạy luôn.
- `etl_images.py --dry-run`: chỉ tải và kiểm tra ảnh, không upload, không ghi DB. Cần thêm biến `R2_*` trong `.env`.
- Chi tiết đầy đủ (TARGET, extract ảnh → CSV bằng LLM): [`docs/ETL.md`](../docs/ETL.md).
