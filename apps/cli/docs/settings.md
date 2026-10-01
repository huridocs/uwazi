# settings

Read and change a tenant's settings document: site name, languages, menu links, library filters,
feature configuration, sync targets and the rest of what the admin settings screens edit. Both
commands run in one tenant (`--tenant`). Shared options, output and exit codes are in the
[README](../README.md).

| Command           | Tenancy    | Does                                                   |
| ----------------- | ---------- | ------------------------------------------------------ |
| `settings get`    | `--tenant` | Prints the whole settings document, as stored          |
| `settings update` | `--tenant` | Changes top-level fields and prints the document after |

## settings get

```sh
yarn uwazi settings get --tenant acme > settings.json
```

No request. Prints the stored document as it is, including fields the settings schema does not
know and the `sync` targets with their credentials: treat the output as a secret. A tenant that
has no settings document prints `{}`.

## settings update

```sh
yarn uwazi settings update --tenant acme --request '{"site_name":"Acme archive"}'
yarn uwazi settings update --tenant acme --request - < settings.json
```

The request is any part of the settings document; `--schema` prints its shape. It runs the same
use case as the admin settings screen.

### How fields are merged

- **Each top-level field sent replaces the stored one; the others stay as they are.**
- **Nested values are replaced whole.** Sending `{"features":{"ocr":{…}}}` drops every other key
  of `features`. To change one key, send the whole object with that key changed.
- **A top-level field cannot be removed.** `null` is rejected, and sending `{}` for an object
  leaves an empty object.
- `_id` and `__v` are accepted and ignored, so a document from `settings get` can be sent back.

> This differs from `tenants update`, which merges and removes with `null`. Check `--schema` when
> in doubt.

### Rules checked

- Unknown fields are rejected, except directly under `features`, which also keeps feature keys
  the schema does not declare.
- `languages`: when not empty, exactly one language has `"default": true`. Keys are ISO 639-1
  codes.
- `links` (the menu): a link of type `link` needs a `url` and has no sublinks; a link of type
  `group` has no `url`.

Breaking a rule fails with `validation.failed` (exit 2), and nothing is saved.

### What else happens

Saving is one transaction with these side effects:

- **Menu and filter translations.** Renaming, adding or removing a menu link or a library filter
  group updates the matching keys of the `Menu` and `Filters` translation contexts. New links get
  their ids.
- **Connected browsers** receive the new settings, through a queued job.
- **Enabling `features.segmentation`** (absent before, `{"url":…}` now) queues a job that requests
  the tenant's idle segmentations, as [`segmentation queue-idle`](segmentation.md) does.
- **Turning `newNameGeneration` on** regenerates the name settings of every template, after the
  save, using the default language.

Jobs run on the queue worker, not in the CLI process: the command returns once they are queued.

### Languages are not installed here

`languages` is stored like any other field. Adding a language here does not create its
translations or the entities' copies in that language, and removing one deletes nothing: that is
what the admin "Languages" screen does. Sending `"languages":[]` empties the list. Change
`languages` here only to edit a language that is already installed, such as its label.

### Round trip

`get`, edit, `update` works as long as the stored document only has fields the schema knows.
When it has others — left by older versions or other tools — `update` rejects the document as a
whole with `validation.failed` naming those fields. Send only the fields you change instead; the
unknown ones are kept as they are.

Output: the whole document after saving, as `settings get` prints it.

| Code                | Exit | When                                          |
| ------------------- | ---- | --------------------------------------------- |
| `validation.failed` | 2    | An unknown field, a wrong type, a broken rule |
