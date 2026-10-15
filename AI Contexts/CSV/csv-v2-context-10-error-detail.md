# CSV Import V2 — Context 10 (Deterministic failures the dashboard can explain)

Date: 2026-10-15  
Owner: CSV Import V2 initiative  
Status: implemented. This file describes the code, not a plan.

## 1) Why this file exists

Three partner-facing gaps were fixed on the same surface: a CSV that can never succeed no longer burns the queue retry budget, and the import page says what to fix.

Companion docs:

- `AI Contexts/CSV/csv-v2-context-09.md` (canonical pipeline status)
- `AI Contexts/CSV/csv-v2-context-07-error-taxonomy.md` (row-error taxonomy; this slice is import-level `failure`, not a new row-error code)
- `AI Contexts/CSV/csv-v2-context-03-headerAnalyzer.md` (header analyzer; its `MissingDefaultLanguage` note is historical)
- `AI Contexts/CSV/csv-v2-front-end-notes.md` (socket and read contracts the dashboard uses)

## 2) What shipped

1. A malformed CSV fails once. An unclosed quote, a column-count mismatch, and a missing header row are properties of the uploaded bytes. Retry stays for outcomes that can change between runs (storage/S3 unreachable).
2. That failure is stored on the import and shown on the CSV v2 import page, in the same words as the task notification.
3. A missing language column names the property and every missing language key. The default language is not a separate error.

## 3) Parse failures

Parse happens while staging rows, inside extraction (`CsvReader` → `CsvImportRowsStager` → `CsvExtractUploadedZipJob`).

`CsvReader` turns csvtojson failures into `CsvReaderError` and keeps `reason` and `line`. csvtojson's `line` is a 0-based data index (the header is not counted; the first data row is `0`). The user sentence shows the spreadsheet row, `line + 2`. The raw parser buffer (`extra`) is not included.

| Parser code         | `CsvReaderError.reason` | User message                                                                                                            |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `unclosed_quote`    | `UnclosedQuote`         | `The CSV could not be read because a quoted value was not closed (row <n>). Close the quote and upload the file again.` |
| `column_mismatched` | `ColumnMismatch`        | `The CSV could not be read because a row does not have the same number of columns as the header (row <n>).`             |
| missing header row  | `CsvUnreadable`         | `The CSV could not be read because it has no header row.`                                                               |
| anything else       | `CsvUnreadable`         | `The CSV could not be read. Check that the file is valid CSV and upload it again.`                                      |

`column_mismatched` is mapped, but csvtojson only raises it when `checkColumn` is on. `CsvReader` does not enable that option, so this branch is not hit by current imports.

`CsvExtractUploadedZipJob.failExtraction` wraps a `CsvReaderError` in `NonRetryableJobError` before `handleError`. The import is stored as `failed` with `retryable: false` on the first attempt. The socket event `csvImport:extract:error` carries the same `error.message`.

Persisted `csv_imports.failure` for a parse error:

- `message`: the user sentence above
- `code`: `CSV_PARSE_FAILED`
- `retryable`: `false`
- `stage`: `extracting files`
- `issues`: one issue, `{ reason, message }`, reusing the existing issue shape

No row is written to `csv_import_row_errors`. Staging never finishes, so the Errors table stays empty. Failure details on the import page are the place to read this.

Storage and S3 errors are not `CsvReaderError`. They stay `retrying` / retryable. A ZIP with no `import.csv` was already non-retryable (`CsvImportFileNormalizer`) and is unchanged.

## 4) Missing language columns

A property is valid in one of two shapes:

- No language suffix (`title`). That single value is copied onto every instance language.
- A column for every instance language (`title__en`, `title__es`, `title__fr`). The default language is one of those columns, not a special case.

`CsvHeaderAnalyzer.collectMissingLanguageColumnIssues` emits one issue per property:

- `reason`: `MissingLanguageColumn`
- `property`: the column base name (`title`)
- `columns`: every missing language key, default included, in `availableLanguages` order
- `message`: `Property "<name>" uses languages, but is missing columns for: <keys>.`

There is no `MissingDefaultLanguage` reason. `title__es` with no `title__en` and `title__en` with no `title__fr` use the same code and the same sentence. The keys are the suffix the file must add (`title__fr`). Language display labels are not included.

`CsvPreflightJob.analyzeHeaders` persists that list and fails the import once:

- `failure.message`: `Header validation failed`
- `failure.code`: `HEADER_VALIDATION_FAILED`
- `failure.retryable`: `false`
- `failure.stage`: `preflight:preparation:headers`
- `failure.issues`: the analyzer issues
- status: `failed`

The thrown error, and therefore `csvImport:preflight:scan:error`, uses the issue messages joined with a space. At most five messages are included; further issues add ` (+N more)`. The persisted heading stays `Header validation failed`. The issue list is the explanation.

## 5) What the import page shows

`UploadStatus` renders Failure details when `status === failed`. It prints `failure.message`, then each issue's `message`, and under that the `property` and `columns` when they are present. It also prints stage, code, and retryable.

`ListCsvImportEntitiesImportsUseCase` includes `failure.issues` when they exist, so list and detail describe the same object. The imports table does not render the issue list. The detail read (`GetCsvImportEntitiesImportUseCase`) returns the full import, issues included.

The task notification (`CsvImportTasksSubscriber`) shows the socket `message`. For a parse failure that is the user sentence. For a header failure that is the joined issue text.

## 6) Out of scope

- Queue, dispatcher, lock window, `maxRetries`.
- New row-error taxonomy codes. A parse failure is an import-level `failure` because no row was staged.
- Language display labels.
- Turning on csvtojson `checkColumn`.
- Thesauri preflight copy. That path still stores `failure.message` as "Thesauri values contain errors", and each issue's `message` is the raw reason code. The page now renders `issues`, but that copy is unchanged.
- Failed-rows CSV. A file that fails parsing has no staged rows and no report.
