# ETL — Command Reference

All commands run from `etl/` with [uv](https://docs.astral.sh/uv/) (Python 3.14). uv creates the venv automatically.

## 1. Pick the target database

Every script writes to the database in `etl/.env` (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD`). Copy `.env.example` to start.

> ⚠️ **Check `.env` before running.** Loaders sync the database to the CSVs, so rows missing from a CSV are **deleted** (see the table below). Pointing `.env` at a shared/production DB means you are editing production.

To hit the **local Aspire Postgres** without editing `.env`, override the variables in your shell (`.env` never overrides variables that are already set):

```shell
export POSTGRES_HOST=localhost POSTGRES_PORT=5432 POSTGRES_DATABASE=timtruongdb POSTGRES_USER=postgres
export POSTGRES_PASSWORD=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.aspire/secrets/42e67c03-d051-4e37-8bd4-82c0acd10361/Development.json')))['Parameters:postgres-password'])")
```

(The AppHost must have run at least once so the container and password exist.)

## 2. Load data (CSV → DB)

Run in this order. Majors and admissions look up universities by code, and admissions need majors.

| # | Command | Reads | Writes | Removes rows not in CSV |
|---|---------|-------|--------|-------------------------|
| 1 | `uv run etl_universities.py` | `data/_shared/universities.csv` | Universities | Universities |
| 2 | `uv run etl_majors.py [TARGET ...]` | `data/schools/*/majors/{Year}/*-Majors-{Year}.csv` | Majors, MajorYears | MajorYears of that school/year |
| 3 | `uv run etl_admissions.py [TARGET ...]` | `data/schools/*/admissions/{Year}/*-Admissions-{Year}.csv` | AdmissionRequirements | Requirements of that major/year |
| 4 | `uv run etl_dormitories.py` | `data/_shared/dormitories.csv` | Dormitories + links | Stale links, orphan dorms |
| 5 | `uv run etl_rankings.py` | `data/_shared/university_rankings.csv` | UniversityRankings | Orphan rankings |

Every loader is idempotent (upsert), so re-running is safe.

> ⚠️ Scripts 1, 4 and 5 take **no arguments**. Even `--help` runs them immediately.

## 3. Extract new data from images (image → CSV, Vision-LLM)

Use this when a school publishes a new admission plan (đề án) or a new list of cut-off scores (điểm chuẩn) as images.

1. Put the screenshots in the matching `images/` folder (git-ignored):
   - `data/schools/{Code}-{Short}/majors/{Year}/images/`
   - `data/schools/{Code}-{Short}/admissions/{Year}/images/`
2. Extract:
   ```shell
   uv run extract_majors.py QSC-UIT/2026 -s "<source url>"
   uv run extract_admissions.py QSC-UIT/2025 -s "<source url>"
   ```
3. Review the generated CSV. If any rows were flagged, a `*.review.md` file next to it lists them (also git-ignored). Fix the CSV by hand.
4. Load it with step 2 (`etl_majors.py` / `etl_admissions.py` with the same target).

Needs an LLM key in `.env`: `LLM_PROVIDER=gemini` + `GEMINI_API_KEY`, or `LLM_PROVIDER=openai` + `OPENAI_API_KEY`/`OPENAI_BASE_URL`/`OPENAI_MODEL` (any OpenAI-compatible endpoint).

### Extract flags

| Flag | Meaning |
|------|---------|
| `-s, --source-url URL` | Fill every row's source-URL column(s) |
| `--tuition-source-url URL` | *(majors only)* Overrides `-s` for `TuitionSourceUrl` |
| `--quota-source-url URL` | *(majors only)* Overrides `-s` for `QuotaSourceUrl` |
| `-n, --note "..."` | Extra instruction appended to the prompt for this run, e.g. `"cột cuối là ĐGNL, bỏ dòng Tổng"` |
| `-y, --yes` | Overwrite an existing CSV without asking |

## TARGET syntax

Used by `extract_*` and `etl_majors.py` / `etl_admissions.py`. Leave it out to process everything.

| Form | Scope |
|------|-------|
| `QSC-UIT` | All years of one school |
| `QSC-UIT/2026` or `QSC-UIT-2026` | One school, one year |
| `QSC-UIT QST-HCMUS/2025` | Several targets at once |

## Adding a new school

1. Add a row to `data/_shared/universities.csv` and run `etl_universities.py`.
2. Create `data/schools/{Code}-{Short}/` (e.g. `DSG-STU`) and follow section 3.
