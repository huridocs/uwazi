# CSV Import V2 — Context 10 (Deterministic failures the dashboard can explain)

Date: 2026-10-15  
Owner: CSV Import V2 initiative  
Status: implemented (2026-10-15). The sections below are the design that was built.

## 1) Why this file exists

Three partner-facing gaps showed up on the same surface: a CSV that can never succeed still burns the queue retry budget, and the import page does not tell the uploader what to fix.

This file is the agreed scope for that slice. It records what the code does today, what we will change, and what we will leave alone.

Companion docs:

- `AI Contexts/CSV/csv-v2-context-09.md` (canonical pipeline status)
- `AI Contexts/CSV/csv-v2-context-07-error-taxonomy.md` (row-error taxonomy; this slice is import-level `failure`, not a new row-error code)
- `AI Contexts/CSV/csv-v2-context-03-headerAnalyzer.md` (header analyzer already aggregates issues)
- `AI Contexts/CSV/csv-v2-front-end-notes.md` (socket and read contracts the dashboard uses)

## 2) The three requirements

1. A malformed CSV is a deterministic failure. An unclosed quote (`value1,"value2,value3,value4`) and the other parse failures csvtojson already raises (`column_mismatched`, missing header row) must not enter the retry loop. Retry stays for outcomes that can change between runs (storage/S3 unreachable, a row still missing a translation). A static file that cannot be parsed will fail the same way every time.
2. That same failure must be readable on the persisted import, on the CSV v2 import page, not only in the in-progress task notification. The uploader has to be able to open the import later and fix the file.
3. A missing language column must say which property is missing which language. `HEADER_VALIDATION_FAILED` / "Header validation failed" is not enough. Reasonable effort: surface the issues the analyzer already builds. Do not rewrite header validation.

## 3) What the code does today

### 3.1 Malformed CSV is retried

Parse happens while staging rows, inside extraction:

- `CsvReader.stream` turns parser failures into `CsvReaderError`, keeping `error.message`.
- csvtojson's message for an unclosed quote is `Error: unclosed_quote. JSON Line number: <n> near: <buffered text>` (`node_modules/csvtojson/v2/CSVError.js`). `CsvReaderError` drops the structured `err` / `line` / `extra` fields and keeps only that string.
- `CsvExtractUploadedZipJob.handleError` persists `failure` and emits `csvImport:extract:error` with that same `error.message`.
- Retry is decided only by `error instanceof NonRetryableJobError`. `CsvReaderError` is a plain `Error`, so the import is stored as `retrying` with `failure.retryable: true`, and the original error is rethrown.
- The queue retries until `retryCount` reaches `maxRetries`. Only then `markAsFailed` flips status to `failed`. It does not rewrite `failure`, so `retryable` stays `true`.

Contrast: a ZIP with no `import.csv` is already `NonRetryableJobError` (`CsvImportFileNormalizer`) and fails once.

Storage and S3 errors are not `CsvReaderError`. They must stay retryable.

### 3.2 The toast has the parse text; the import page does not, while it matters

The task notification (`CsvImportTasksSubscriber` → `notifyError`) shows the socket `message` as soon as `csvImport:extract:error` fires. That is the parser string.

`handleError` does write `csv_imports.failure.message` to that same string. The import page still hides it:

- `UploadStatus` renders Failure details only when `status === failed`.
- During the retry loop the status is `retrying`, so the card is absent. The toast is the only place the text appears.
- No `failure.code`, no `failure.issues`. Nothing is written to `csv_import_row_errors`, because staging never finishes. The Errors table stays empty.
- After the queue gives up, the raw parser string can show up in Failure details, still without a code, and still marked retryable.

Requirement 2 is: fail once, and leave a stable, user-facing failure on the import that the page already knows how to show.

### 3.3 Missing languages are already diagnosed, then thrown away in the UI

`CsvHeaderAnalyzer` aggregates every header problem and throws `CsvHeaderAnalyzerError`. For languages it already records:

- `MissingLanguageColumn` — property, plus `columns` = every missing language key, default included. Message: `Property "<name>" uses languages, but is missing columns for: <keys>.` There is no separate default-language error. A missing default is the same gap as any other missing language.

`CsvPreflightJob.analyzeHeaders` persists that list:

- `failure.message`: `"Header validation failed"`
- `failure.code`: `HEADER_VALIDATION_FAILED`
- `failure.retryable`: `false`
- `failure.stage`: `preflight:preparation:headers`
- `failure.issues`: the analyzer issues
- status: `failed` (non-retryable). This path is already correct.

Then the job rethrows `new NonRetryableJobError(new Error('Header validation failed'))`. The socket payload is only that sentence.

The detail read (`GetCsvImportEntitiesImportUseCase`) returns the full import, issues included. Two later steps drop them:

- `ListCsvImportEntitiesImportsUseCase` copies `failure` without `issues`.
- `UploadStatus` prints `failure.message`, `failure.stage`, `failure.code`, and `failure.retryable`. The client type `CsvImportFailure` has no `issues` field, so the page shows "Header validation failed" and code `HEADER_VALIDATION_FAILED`.

The analyzer does not need a new validation. The page needs to render `failure.issues`.

## 4) Design

Stay inside `app/api/csv.v2/**` plus the CSV upload page. Do not change the queue, dispatcher, or `NonRetryableJobError`. Classification stays "throw `NonRetryableJobError` from the CSV job", which is the existing contract.

### 4.1 Parse failures fail once

In the extract job, a `CsvReaderError` is wrapped in `NonRetryableJobError` before `handleError` (same pattern as "import.csv not found"). `handleError` then sets `failed` and `retryable: false` on the first attempt.

Keep retryable:

- file storage / S3 read or write failures
- unexpected runtime errors that are not `CsvReaderError`

`CsvReaderError` covers the deterministic parse cases we care about: unclosed quote, column count mismatch, missing header row, empty file with no headers. All of those are properties of the uploaded bytes.

### 4.2 The persisted failure is what the toast and the page both show

Keep using `csv_imports.failure`. Do not invent a row error for a file that never staged a row. The Failures card is the right place; the Errors table is for per-row import failures.

On a parse failure, persist:

- `message`: one user sentence, not the parser's `unclosed_quote` / "JSON Line number" wording. This is also the socket `message`, so the toast and the page match.
- `code`: `CSV_PARSE_FAILED`
- `retryable`: `false`
- `stage`: `extracting files` (unchanged)
- `issues`: one issue, reusing the existing shape `{ reason, message, property?, columns? }`

Suggested copy, driven by csvtojson's `err` code when we still have it:

| Parser code                    | `issues[0].reason` | User message                                                                                                            |
| ------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `unclosed_quote`               | `UnclosedQuote`    | `The CSV could not be read because a quoted value was not closed (row <n>). Close the quote and upload the file again.` |
| `column_mismatched`            | `ColumnMismatch`   | `The CSV could not be read because a row does not have the same number of columns as the header (row <n>).`             |
| anything else `CsvReaderError` | `CsvUnreadable`    | `The CSV could not be read. Check that the file is valid CSV and upload it again.`                                      |

csvtojson's `line` is a 0-based data index (the header is not counted; the first data row is `0`). The user sentence shows the spreadsheet row, `line + 2`, and says "row" rather than "line". Confirmed: `value1,"value2` on the first data row reports `line: 0` and is shown as row 2. Do not put `extra` (the raw buffer) in the user message; it can be most of the file.

`CsvReaderError` should carry `reason` and `line` so the job does not scrape them back out of `error.message`.

`failure.message` can be the issue message (one issue today). The page keeps rendering `failure.message`, and also renders `issues` (section 4.3), so a later multi-issue failure uses the same card.

### 4.3 Header issues are shown, not recomputed

No new analyzer rules. One message for every missing language, then display.

Message, still inside `CsvHeaderAnalyzer`:

- One `MissingLanguageColumn` issue per property. `columns` lists every missing language key, including the default. `property` is the column base name (`title`). Those keys are the suffix the file must add (`title__fr`). Language labels ("French") are optional polish; the key is what the partner types into the header. Skip labels in this slice.

Display:

- Add `issues` to the client `CsvImportFailure` type.
- On the import page, under Failure details, list each issue's `message`. When `property` or `columns` is present, show them next to the message so a missing-language row reads as the property plus the language keys, not only a paragraph.
- Include `issues` in the list-use-case `failure` projection so list and detail describe the same object. The imports table does not need to render them in this slice.
- Socket: set the preflight error `message` from the issue messages (joined, capped if there are many) instead of only `"Header validation failed"`. Keep `failure.code` as `HEADER_VALIDATION_FAILED`. The page heading can stay the short message; the issue list is the explanation.

Example the page should be able to show, for a template whose languages are `en` (default), `es`, `fr`, and a file that has `title__en` and `title__es` only:

- Header validation failed
- Property "title" uses languages, but is missing columns for: fr.

And for `title__es` with no `title__en`:

- Property "title" uses languages, but is missing columns for: en.

## 5) Implementation order

Tests first, red for the assertion, then the production change. Scope stays on these files.

1. Extract job: a fixture with an unclosed quote fails as `NonRetryableJobError`, status `failed`, `failure.retryable === false`, `failure.code === 'CSV_PARSE_FAILED'`, and `failure.message` is the user sentence (includes the line when we have one). Assert the socket callback receives that same message. A second case for `column_mismatched` if cheap. Do not assert that S3/storage errors become non-retryable.
2. `CsvReaderError` carries parser `reason` and `line`; `CsvReader` copies them off csvtojson's `CSVError` instead of only `error.message`.
3. Extract `handleError` persists the user message, code, and one issue when the error is a parse failure.
4. Header analyzer: a missing default language is the same `MissingLanguageColumn` issue as any other missing language.
5. Client: `CsvImportFailure.issues`, and `UploadStatus` renders them. List use case returns `issues` on `failure`.
6. Preflight socket message includes the issue text, covered by the existing preflight spec that already expects `HEADER_VALIDATION_FAILED` and the `MissingLanguageColumn` issue.

Frontend work in step 5 follows `docs/frontend.md` when that step starts. This design pass does not.

## 6) Out of scope

- Queue, dispatcher, lock window, `maxRetries`.
- New row-error taxonomy codes. Parse failure is an import-level `failure` because no row was staged.
- Rewriting `CsvHeaderAnalyzer` or the language-column rules.
- Language display labels.
- Thesauri preflight copy. That path has the same shape (`failure.message` is "Thesauri values contain errors", and each issue's `message` is the raw reason code). Fixing it is the same UI once `issues` render, but the copy cleanup is a follow-up, not this slice.
- Failed-rows CSV. A file that fails parsing has no staged rows and no report.

## 7) Acceptance

1. An unclosed quote fails the extract job once. Status is `failed`, `retryable` is false, and the queue does not requeue that job.
2. The import page Failure details and the task notification show the same user sentence, including the line number when the parser provides one.
3. A file missing a non-default language column shows the property name and the missing language key on the import page, not only `HEADER_VALIDATION_FAILED`.
4. A file missing the default language column uses the same missing-column message and code as any other missing language.
5. A storage/S3 failure during extract is still `retrying` / retryable.
