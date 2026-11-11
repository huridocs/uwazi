# Image thumbnails

Date: 2026-11-06
Status: the module is `app/api/imageThumbnails`, and the backend behavior in this note is implemented. Library cards and compact metadata already request the thumbnails route. The entity page and the library side panel still request the full asset. Still open: the `<img>` audit, copying the derivative on sync, and whether the load balancer honors `Cache-Control: no-store`.

## Module

`app/api/imageThumbnails`, beside `core`, the same way `paragraphExtraction` sits in `app/api`.

Nothing outside the feature calls the use cases, so they do not live under `core`. Nothing else imports them, so this is not a `packages/` module: no public alias, no composition file, no import wall.

The module owns the domain rules, the use cases, the renderer, the job, the listeners, and `DownloadThumbnailController`. `app/api/files/routes.ts` only points `GET /files/thumbnails/:filename` at that controller, because the URL also serves existing PDF thumbnail rows. `FileCreatedEvent` and `FileDeletedEvent` stay core events. The listeners are picked up by the `app/api` listener manifest. The job is registered in `app/queueRegistry.ts`.

`config.imageThumbnails` is the node-wide flag. The shared `Dispatcher` has no thumbnail methods. Creating a thumbnail and counting an active one go through `JobsDispatcher`, inside the module, via `ImageThumbnailJobs`.

## Plan

Library cards and compact metadata load a small image from `GET /files/thumbnails/:filename`. The full asset stays on the files routes, for the entity page, the library side panel, and anywhere else the image is actually being looked at.

The load balancer already rate-limits these routes. The files routes are set high because they are what cards request today. Once cards and compact metadata use the thumbnails route, the files routes can be limited more aggressively, and the thumbnails route can keep the high limit a library needs. Nothing in Uwazi implements that limit. This work only moves the traffic.

### What the thumbnails route is

`GET /files/thumbnails/:filename` in `app/api/files/routes.ts`. The filename is the parent file's stored name, the same token `GET /files/:filename` uses. There is no second, thumbnail-only filename in the URL.

`DownloadThumbnailController` serves this route. `DownloadFileController` only streams the original file row. The thumbnail controller does not list thumbnails, and it does not call `getThumbnails`.

PDF cards used to request `/api/files/<documentId>.jpg` on the deprecated files route. Card URLs for those existing PDF thumbs are `/files/thumbnails/<documentId>.jpg`, so they sit on the thumbnail limit. The files route stays the way to fetch the PDF itself. That name is already the stored thumbnail. The route streams it before it treats a `.jpg` as a parent image that needs a derivative.

The route does not guess why an object is missing. With the flag on, a library that asks for 300 images enqueues 300 jobs. That is acceptable: workers, tenant priority, and the mercy system already stop one tenant from taking the queue.

With the flag on, generation also runs when an eligible image is created (upload, entity save, CSV import, preserve sync — the paths that already go through file creation). New files should then hit the route with the derivative already there.

### Request rule

Eligibility is the filename extension. Nothing else. No mimetype sniff, no "is it animated?", no reading the missing object as a signal.

| Extension | A thumbnail should exist |
| --- | --- |
| `.jpg` `.jpeg` `.jpe` `.jfif` `.png` `.webp` `.gif` `.bmp` `.avif` `.heic` `.heif` `.tif` `.tiff` | Yes |
| Anything else, including `.svg` and video | No |

`.gif` is in the list, so a thumbnail is expected. The job writes the first frame. The route does not detect animation.

Before the steps below, the route streams a thumbnail stored under the requested filename when one exists. A `.jpg` card URL for a PDF then does not fall through into "this parent image needs a derivative."

The route then does only this:

1. Extension says no → stream the original. Stop.
2. Extension says yes → look up `thumbnails/640/<filename>`.
3. The JPEG is there → stream it.
4. A give-up marker is there (`thumbnails/640/<filename>.skip`) → stream the original. Stop.
5. A job for this file is still queued or running → stream the original. Do not enqueue.
6. Otherwise, and `FEATURE_FLAG_IMAGE_THUMBNAILS` is on → enqueue one, stream the original. Flag off → stream the original and do not enqueue.

A queued or running job is the only jobs-table fact the route uses. It stops a second enqueue while that job exists. A failed job is not that fact. Those rows are reviewed and deleted.

When the job gives up (retries exhausted, or a no-retry failure such as a file the decoder rejects), it writes the `.skip` marker and does not write a JPEG. That marker is an object in the thumbnail prefix, not a file row. Later requests hit step 4. Deleting the failed job does not bring the file back. Deleting the marker does: the next view enqueues again, which is the retry after a decoder fix.

A response that streams the original, because the JPEG is not ready yet, is not cached. The app sends `Cache-Control: no-store`. Whether the load balancer honors that is an ask for the team.

### Where the UI uses which bytes

Thumbnails:

- Library cards.
- Compact metadata (table cells, inherited compact images, selection chips).

Full asset:

- Entity page.
- Library side panel (`LibraryEntityPreview` and the same entity body it renders).

Those two are the known full-asset surfaces. Shared components need an explicit "thumb" vs "full" choice at the call site. Which card field becomes the thumb (image property, media-that-is-an-image, PDF preview) is a UI pass, not a rule of the route.

### Storage name

`{sourceFileId}.jpg` next to the original is out. An uploaded file can already have that name.

Community practice is to keep derivatives out of the original key space:

- ImageMagick's thumbnail guide treats a subdirectory as a first-class scheme: original `photo_name.jpg`, thumbnail `thumbs/photo_name.jpg` (`-path thumbs`). A suffix in the same directory (`_tn`, `_thumb`, `_small`) is the other scheme they list.
- AWS's own note on thumbnail lambdas is the same idea: write the derivative under a different prefix, or the new object is indistinguishable from an upload and gets processed again.

A suffix in the original directory can still collide with an uploaded name. A prefix cannot, because uploads never write there.

| | |
| --- | --- |
| URL | `/files/thumbnails/<parent stored filename>` |
| Object key | `thumbnails/640/<parent stored filename>` |

The `640` segment is the variant, so a later size does not overwrite this one. The URL does not change if the variant changes; the route knows which prefix is current. Delete and sync derive the key by adding the prefix. They do not invent a new filename.

The bytes are always JPEG. The object may be named `photo.png` because that is the parent's name. The response sets `Content-Type: image/jpeg`. The extension on the key is the parent's, not a claim about the encoding.

PDF derivatives already on disk stay `{documentId}.jpg` where they are. This prefix is for the image derivatives we are adding.

### One file row

No second row and no new column. The parent file is unchanged. The route loads the parent by filename, checks read permission on that parent, then looks up `thumbnails/640/<filename>`. The derivative response is `image/jpeg`. The parent's mimetype stays whatever the upload stored.

`getThumbnails` is not on this route. It feeds `Entity.setPreview` for PDF document previews. Image derivatives are not rows, so they do not enter that list. Cards request `/files/thumbnails/<parent>` on their own.

### Rendition

- Longest side 640 px. Fits a large portrait card and a 2x display. Do not enlarge an image that is already smaller.
- JPEG quality is a single constant, `IMAGE_THUMBNAIL_JPEG_QUALITY`, initial value **60**. Inspect real cards and edit that constant. No external configuration. Existing objects stay as they were until they are deleted.
- EXIF orientation applied before resize.
- Alpha flattened (white). One frame.
- A pixel-count ceiling, `IMAGE_THUMBNAIL_MAX_PIXELS` (`268_402_689`, sharp's own input ceiling), so a hostile image fails the job instead of the worker. The original file stays. The job writes the `.skip` marker.

### Which files

The cutout is the extension list in Request rule. A stored mimetype of `application/octet-stream` does not matter. SVG, video, audio, and remote URLs are out because their extensions are out. PDFs already have their own derivative and are not in this list.

The extension is compared in lowercase. The stored filename, and the object key, keep the uploaded case.

`.heic` / `.heif` and `.bmp` are in the list, so a thumbnail is expected for them. If the binary cannot decode one, the job writes `.skip` and the route stops enqueueing. Shipping libvips with libheif, libde265, and ImageMagick is what makes those extensions succeed instead of skip. See HEIC and Library.

### Feature flag

`FEATURE_FLAG_IMAGE_THUMBNAILS` gates enqueueing only. Missing or any value other than `true` means do not enqueue. Cards and compact metadata use `/files/thumbnails/` either way. If the JPEG is missing, that route streams the original. That is the same bytes as today, so the route change needs no flag.

The flag gates both places that enqueue: file creation (upload, entity save, CSV, preserve sync) and the missing-thumbnail request. Off, neither enqueues. The route still falls back to the original. On, both enqueue.

It is read once with the other environment values and stored as `config.imageThumbnails`, the same way `queueBackend` is. It is a boolean on the config object. It is not a function.

It is node-wide, not per tenant. Every tenant on that Node instance sees the same value. Turning it off stops enqueueing on that server, which is what you want while the image libraries are not installed there. It does not belong on `config.defaultTenant.featureFlags`.

A per-tenant flag is a different mechanism: stored on the tenant and merged over the default tenant, like `fileCacheHeaders` and the rest of `app/api/tenants/featureFlags.ts`. That would limit who enqueues (fewer tenants, fewer jobs at once). It does not come from the environment. The libraries are installed per server, not per tenant, so a tenant flag can be on while that server cannot decode the file. A later option would compose with this one: node off means nobody enqueues; node on and tenant off means that tenant does not. Not built.

For a partial install: the flag on means the job is enqueued. The job then does what the installed libraries can do. A JPEG still becomes a thumbnail when the JPEG decoder is present, even if HEIC is not. A file this binary cannot decode fails that job only. It does not turn the flag off, and it does not stop JPEG jobs. A missing library does not crash the process.

### Delete and sync

Delete of an image file also deletes `thumbnails/640/<filename>` and `thumbnails/640/<filename>.skip` when either is there. Delete runs whether or not the flag is on. A missing object is ignored.

Sync should copy whichever of those two objects exists, with the parent, as part of the file sync. Prefer that copy over making the target generate on first view. If the source has written neither yet, the target does not have a derivative until a later sync. A copied `.skip` stops the target from enqueueing a file that already failed. That copy is not implemented. See Open.

### HEIC

iPhone photos are HEIF with HEVC. Worth supporting. Two limits, both from sharp's maintainer, not from us:

- sharp's published binaries do not include HEVC decode. Patent exposure is why. sharp will use a system libvips that was built with libheif and libde265. ImageMagick has the same requirement. No current Node thumbnail library ships HEVC inside its default binary.
- `sharp.format.heif.input === true` only means the container loader exists. HEVC is `metadata().compression === 'hevc'` on a real iPhone file. libvips 8.18.3 rejects some ordinary iPhone files (`iref` reference limit); 8.18.4 fixes that. Pin with that in mind, and test a real `.heic` on the image we ship.

Safari often transcodes HEIC to JPEG in the file picker, so many browser uploads never arrive as HEIC. API clients, sync, and non-Safari uploads still do.

### Library

sharp is the Node default for this job (libvips, EXIF orientation, header metadata for frame count, used across the Node image tooling). The runtime image cannot be "npm install sharp" alone: BMP wants ImageMagick linked into libvips, HEIC wants libheif and libde265, and the prebuilt sharp tarball has neither. The dependency we are accepting is a libvips build with those two extras, and sharp pointed at it. ImageMagick by itself can decode the same list, including BMP and HEIC, but it is a shell-out and a larger attack surface, and it does not remove the HEIC library requirement.

### Requirements

These must be on the app servers and on the queue workers before `FEATURE_FLAG_IMAGE_THUMBNAILS` is turned on. The deploy itself does not need them while the flag is off. `npm install sharp` alone is not enough: the published sharp binary does not decode iPhone HEIC (HEVC) or BMP.

| Piece | Version | Why |
| --- | --- | --- |
| Node.js | `>= 22.23.2` (already required by Uwazi). sharp itself needs `>= 20.9.0`. | Runtime. |
| sharp | **0.35.5**, compiled from source against the system libvips below. Set `SHARP_FORCE_GLOBAL_LIBVIPS=1` at install so it does not keep its own binary. | The Node library the job calls. |
| libvips | **>= 8.18.7** (`pkg-config --modversion vips-cpp`). 8.18.7 is the version sharp 0.35.5 is built against. 8.18.3 rejects some real iPhone HEIC files; 8.18.4 fixed that, and 8.18.6 treats libheif older than 1.23.2 as untrusted. | Decoder and resizer. |
| libheif | **>= 1.23.2**. 1.23.5 is the version in the current sharp libvips stack. | HEIF container for `.heic` / `.heif`. |
| libde265 | Current stable, linked into that libheif. | HEVC decode. This is what an iPhone photo actually is. x265 is not required: we encode JPEG, not HEIC. |
| ImageMagick 7 (or GraphicsMagick) | A build libvips was compiled against, with the BMP delegate. `vips --vips-config` must show `Magick load: YES`. | `.bmp`. libvips does not decode BMP on its own. |

Poppler stays as it is. PDF thumbnails do not move onto this stack.

Check before deploy, on a worker host:

- `pkg-config --modversion vips-cpp` prints 8.18.7 or newer.
- `vips --vips-config` shows HEIF support and `Magick load: YES`.
- One real iPhone `.heic` and one `.bmp` produce a JPEG through sharp. `sharp.format.heif.input === true` only means the container loader is present. HEVC is `metadata().compression === 'hevc'` on that iPhone file.

## Implemented

### Enqueue

`EnqueueImageThumbnailOnFileCreated` listens to `FileCreatedEvent`. `FilesService.insert` only emits that event. `FilesServiceFactory` does not know about thumbnails. A request for a missing thumbnail still enqueues on its own, through `EnqueueImageThumbnails`. That is not a file creation.

`file.type` tells the files apart. `custom` is a custom upload (logos and other files that are not entity attachments). The listener does enqueue those when the extension is eligible.

It does not enqueue `type: 'thumbnail'` (a PDF thumbnail is already a JPEG named `{documentId}.jpg`) or an attachment that carries a `url` (no local bytes).

`EnqueueImageThumbnails` checks `config.imageThumbnails` first. For each eligible filename it skips when the JPEG is already there, when `.skip` is there, or when `ImageThumbnailJobs.countActive` is greater than zero. Otherwise it enqueues one. The count is a `countDocuments` read on the queue, before the insert. It is not a job, and it is not a method on the shared `Dispatcher`. It cannot move inside the creation job: by then the second row already exists, and two workers can both pass the "already settled" check before either writes. Delete-then-dispatch, as thesaurus denormalize does, was rejected: the thumbnail that job would produce does not change, so the delete only delays it. A running job is not deleted by `deleteByParams` anyway.

The creation job is `CreateImageThumbnailJobHandler`: `@PrivilegedJob()` because an anonymous library request can enqueue it, lock window 60 seconds, max retries 3. The use case no-ops when the extension is out, or the JPEG or `.skip` already exists. A missing parent returns.

`ImageThumbnailUnavailable` (the renderer could not load) is retried and does not write `.skip`. `ImageThumbnailRejected` (the decoder rejected the file), or the last retry, writes a one-byte `.skip` and then fails as non-retryable. Both errors live in `domain/imageThumbnailErrors.ts`.

### Serve

`ServeImageThumbnail` looks up a `type: 'thumbnail'` row for the requested filename first and streams it when the bytes are on disk. Otherwise it loads a parent of type `document`, `attachment`, or `custom`, then follows the request rule. The JPEG response is `image/jpeg` and may be cached. The fallback is the original, with `cache: 'no-store'`.

`DownloadThumbnailController` checks `EntityPermissionChecker` on an entity file (the parent, or the PDF thumbnail row) before streaming. A file that is not an entity file is allowed through, the same as the files route.

### Delete

`DeleteImageThumbnailOnFileDeleted` listens to `FileDeletedEvent`. The payload is `{ fileId, filename }`. `FilesService` emits that and does not know about thumbnails. The listener, for an eligible extension, queues deletion of `thumbnails/640/<filename>` and `thumbnails/640/<filename>.skip`. A missing object is ignored.

The event is emitted inside the transaction, before commit. The listener job does not join that transaction, so a delete that then rolls back can still remove the derivative. That was accepted so `FilesService` stays unaware of thumbnails.

A PDF delete also emits the event for the `{documentId}.jpg` thumbnail row. That name has an eligible extension, so the listener queues a delete of `thumbnails/640/<that name>` too. Nothing was written there. The delete ignores a missing object.

### `fileExists`

`FileStorage.fileExists` checks storage only. On disk that is `fs.access`. On S3 it is a head of the object key. It takes a file row or a `FileLocation`, including `customPath` `thumbnails/640/<filename>`, turns that into a path, and answers whether the object is there. It does not query the files table. The caller loads the row first, with `filesDS.getByFilename`, and then calls `fileExists` to see if that row's bytes are in storage. A derivative has no row, so the same method is called with the `thumbnails/640` location. `createPath` was not changed. Writing a file already creates the directory.

### Front end

Already switched, and not to be extended until the `<img>` audit:

- `app/react/V2/shared/thumbnailRequestUrl.ts` rewrites an eligible `/api/files/` URL to `/files/thumbnails/`. Audio, video, and any other extension stay on `/api/files/`.
- `app/react/V2/Routes/Library/Components/cardModel.ts` uses that helper for card thumbnails, including a document preview `.jpg`.
- `app/react/V2/Components/Metadata/Components/Image.tsx` uses it only when `density` is `compact`. The default density keeps the original URL.

The entity page and `LibraryEntityPreview` do not use the helper.

## Open

1. The `<img>` audit: every current `/api/files/` image, marked thumb or full. A card and a side panel can share a component, and the two call sites above were switched before that walk. Do not add more call sites until it is done.
2. Sync of a file does not yet copy `thumbnails/640/<filename>` or `thumbnails/640/<filename>.skip`. The Delete and sync section still stands. A synced image currently goes through file creation, so with the flag on the target enqueues a new thumbnail instead of copying one.
3. The thumbnail URL returns two different bodies over its life. The first request, before the JPEG exists, returns the original file and `Cache-Control: no-store`. A later request returns the small JPEG and may be cached. The app cannot force the load balancer to obey `no-store`. If the balancer stores the first response by URL and ignores that header, every card keeps receiving the full image from the balancer after the JPEG has been written. Question for the team: on `GET /files/thumbnails/*`, will the load balancer store a response that says `Cache-Control: no-store`? If it will, what do we set so the original is not kept and the JPEG, once it exists, still is?
