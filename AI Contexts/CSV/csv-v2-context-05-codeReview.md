## CSV Import V2 — Context Doc 05 Code Review Notes

**Date:** 2025‑12‑01
**Focus:** CsvExtractUploadedZipJob validation/guard reasoning

### 1. Motivation

- The recent code review raised questions about the optional guards inside `CsvExtractUploadedZipJob` (`getImportStoragePath`, `handleExtractionSuccess`, `handleError`). They are not there to defend against normal happy-path flows, but rather to catch once-in-a-lifetime situations where a worker executes after somebody (or something) deleted or mutated the `csv_imports` record it was meant to operate on. Examples include retention sweeps, manual cleanup, or a test scenario where the document disappears between registration and job execution.
- Without these checks the job could continue into file normalization or status updates with a missing `storage.path`, which would result in confusing downstream errors and a retry storm. Throwing a `NonRetryableJobError` (and persisting it) makes the failure explicit, keeps the UI informed, and stops needless retries.

### 2. Suggested tightening strategies

| Goal | Approach |
| --- | --- |
| Guarantee a storage path once registration completes | Add a helper in the registration flow that throws if `storage.path` is absent, and persist the path as part of the job dispatch payload so every downstream stage receives it explicitly (`CsvExtractUploadedZipJob` no longer needs to fetch it). |
| Make status updates safe even if the import has vanished | Have the dispatcher read the import before every downstream dispatch, assert the document exists (maybe via `CsvImportDomain.assertExists(import)`), and pass the sanitized object to the job. Jobs can then skip optional branches and rely on the dispatcher’s pre-check. |
| Keep domains strict for downstream jobs | Introduce a domain-level assertion (e.g., `CsvImportDomain.ensureStoragePath(import)`/`assertExists`) that throws early when invariants are missing. Call it at the dispatcher boundary so only fully-formed domains reach the job logic. |

### 3. Next steps

- Discuss with the team which of the above tightening strategies to adopt. If we choose to bake the values into the dispatch payload or make new domain assertions, the job’s optional guards can be simplified or removed.
- Once a direction is agreed, update this file (and `csv-v2-context-05.md`) with the chosen approach so future reviewers understand why the guards existed and how they were resolved.

