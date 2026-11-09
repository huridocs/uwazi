# Image thumbnails

Date: 2026-11-06
Status: implementation is in `app/api/imageThumbnails`. Node-wide flag, file-created listener, and a separate thumbnail controller are decided. `locationExists` and the front end are still open.

## Decided

- No thumbnail row on the file, and no extra column. The parent file is unchanged.
- A give-up is `thumbnails/640/<filename>.skip` in object storage. The route stops when that object is there. A queued or running job is the only reason not to enqueue while the JPEG is still missing. Failed jobs are not that reason.
- A response that streams the original, because the JPEG is not ready yet, is not cached. The app sends `Cache-Control: no-store`. Whether the load balancer honors that is an ask for the team.
- JPEG quality starts at 60. It is one constant in code, not an environment setting. Change that constant to try another quality. Existing objects stay as they were until they are deleted.
- `FEATURE_FLAG_IMAGE_THUMBNAILS` gates enqueueing the thumbnail job only. Missing or any value other than `true` means do not enqueue. Cards and compact metadata use `/files/thumbnails/` either way.

## Feature flag

`FEATURE_FLAG_IMAGE_THUMBNAILS` exists so the job can stay off until the libraries in Requirements are installed. It does not gate the route change.

Cards and compact metadata request `GET /files/thumbnails/<parent filename>`. If the JPEG is missing, that route streams the original. That is the same bytes as today, so the route change needs no flag.

The flag gates both places that enqueue the job: file creation (upload, entity save, CSV, preserve sync) and the missing-thumbnail request. Off, neither enqueues. The route still falls back to the original. On, both enqueue.

Nice to have, for a partial install: the flag on means the job is enqueued. The job then does what the installed libraries can do. A JPEG still becomes a thumbnail when the JPEG decoder is present, even if HEIC is not. A file the installed libraries cannot decode fails that job. It does not turn the flag off, and it does not stop JPEG jobs.

## Goal

Library cards and compact metadata should load a small image from `GET /files/thumbnails/:filename`. The full asset stays on the files routes, for the entity page, the library side panel, and anywhere else the image is actually being looked at.

The load balancer already rate-limits these routes. The files routes are set high because they are what cards request today. Once cards and compact metadata use the thumbnails route, the files routes can be limited more aggressively, and the thumbnails route can keep the high limit a library needs (hundreds of previews on one page). Nothing in Uwazi implements that limit. This work only moves the traffic.

## What the thumbnails route is

`GET /files/thumbnails/:filename` in `app/api/files/routes.ts`. The filename is the parent file's stored name, the same token `GET /files/:filename` uses. There is no second, thumbnail-only filename in the URL.

`DownloadThumbnailController` serves this route. `DownloadFileController` only streams the original file row. The thumbnail controller does not list thumbnails, and it does not call `getThumbnails`. PDF cards do not use this route yet. They request `/api/files/<documentId>.jpg` on the deprecated files route. This work points those cards at `/files/thumbnails/<documentId>.jpg` so they sit on the thumbnail limit. The files route stays the way to fetch the PDF itself.

The route does not guess why an object is missing. See Request rule. With the flag on, a library that asks for 300 images enqueues 300 jobs. That is acceptable: workers, tenant priority, and the mercy system already stop one tenant from taking the queue.

With the flag on, generation also runs when an eligible image is created (upload, entity save, CSV import, preserve sync — the paths that already go through file creation). New files should then hit the route with the derivative already there.

## Request rule

Eligibility is the filename extension. Nothing else. No mimetype sniff, no "is it animated?", no reading the missing object as a signal.

| Extension | A thumbnail should exist |
| --- | --- |
| `.jpg` `.jpeg` `.jpe` `.jfif` `.png` `.webp` `.gif` `.bmp` `.avif` `.heic` `.heif` `.tif` `.tiff` | Yes |
| Anything else, including `.svg` and video | No |

`.gif` is in the list, so a thumbnail is expected. The job writes the first frame. The route does not detect animation.

The route then does only this:

1. Extension says no → stream the original. Stop.
2. Extension says yes → look up `thumbnails/640/<filename>`.
3. The JPEG is there → stream it.
4. A give-up marker is there (`thumbnails/640/<filename>.skip`) → stream the original. Stop.
5. A job for this file is still queued or running → stream the original. Do not enqueue.
6. Otherwise, and `FEATURE_FLAG_IMAGE_THUMBNAILS` is on → enqueue one, stream the original. Flag off → stream the original and do not enqueue.

A queued or running job is the only jobs-table fact the route uses. It stops a second enqueue while that job exists. A failed job is not that fact. Those rows are reviewed and deleted, so a later request, with the flag on, would see "no JPEG, no job" and enqueue again.

When the job gives up (retries exhausted, or a no-retry failure such as a file the decoder rejects), it writes the `.skip` marker and does not write a JPEG. That marker is an object in the thumbnail prefix, not a file row. Later requests hit step 4. Deleting the failed job does not bring the file back. Deleting the marker does: the next view enqueues again, which is the retry after a decoder fix.

PDF card URLs are `/files/thumbnails/<documentId>.jpg`, and that name is already the stored thumbnail. Before the steps above, the route streams a thumbnail stored under the requested filename when one exists. A `.jpg` card URL then does not fall through into "this parent image needs a derivative."

## Where the UI uses which bytes

Thumbnails, this work:

- Library cards.
- Compact metadata (table cells, inherited compact images, selection chips).

Full asset, leave them:

- Entity page.
- Library side panel (`LibraryEntityPreview` and the same entity body it renders).

Those two are the known full-asset surfaces. Before implementation we still walk every `<img>` that today points at `/api/files/`, because a card and a side panel can share a component. Shared components need an explicit "thumb" vs "full" choice at the call site. Which card field becomes the thumb (image property, media-that-is-an-image, PDF preview) is a UI pass we align when we touch the cards, not a rule of the route.

## Storage name

`{sourceFileId}.jpg` next to the original is out. An uploaded file can already have that name.

Community practice is to keep derivatives out of the original key space:

- ImageMagick's thumbnail guide treats a subdirectory as a first-class scheme: original `photo_name.jpg`, thumbnail `thumbs/photo_name.jpg` (`-path thumbs`). A suffix in the same directory (`_tn`, `_thumb`, `_small`) is the other scheme they list.
- AWS's own note on thumbnail lambdas is the same idea: write the derivative under a different prefix, or the new object is indistinguishable from an upload and gets processed again.

A suffix in the original directory can still collide with an uploaded name. A prefix cannot, because uploads never write there.

Working scheme:

| | |
| --- | --- |
| URL | `/files/thumbnails/<parent stored filename>` |
| Object key | `thumbnails/640/<parent stored filename>` |

The `640` segment is the variant, so a later size does not overwrite this one. The URL does not change if the variant changes; the route knows which prefix is current. Delete and sync derive the key by adding the prefix. They do not invent a new filename.

The bytes are always JPEG. The object may be named `photo.png` because that is the parent's name. The response sets `Content-Type: image/jpeg`. The extension on the key is the parent's, not a claim about the encoding.

PDF derivatives already on disk stay `{documentId}.jpg` where they are. This prefix is for the image derivatives we are adding. Card URLs for those existing PDF thumbs only change prefix: `/files/thumbnails/<documentId>.jpg`.

## One file row

Decided: no second row and no new column. The route loads the parent by filename, checks read permission on that parent, then looks up `thumbnails/640/<filename>`. The derivative response is `image/jpeg`. The parent's mimetype stays whatever the upload stored.

`getThumbnails` is not on this route. It feeds `Entity.setPreview` for PDF document previews. Image derivatives are not rows, so they do not enter that list. Cards request `/files/thumbnails/<parent>` on their own.

## Rendition

- Longest side 640 px. Fits a large portrait card and a 2x display. Do not enlarge an image that is already smaller.
- JPEG quality is a single constant, initial value **60**. Inspect real cards and edit that constant. No external configuration.
- EXIF orientation applied before resize.
- Alpha flattened (white backing). One frame.
- A pixel-count ceiling so a hostile image fails the job instead of the worker. The original file stays. The job writes the `.skip` marker.

Thumbnails are for cards and compact metadata only. Entity previews and the side panel keep requesting the original.

## Which files

The cutout is the extension list in Request rule. A stored mimetype of `application/octet-stream` does not matter. SVG, video, audio, and remote URLs are out because their extensions are out. PDFs already have their own derivative and are not in this list.

`.heic` / `.heif` and `.bmp` are in the list, so a thumbnail is expected for them. If the binary cannot decode one, the job writes `.skip` and the route stops enqueueing. Shipping libvips with libheif, libde265, and ImageMagick is what makes those extensions succeed instead of skip. See HEIC and Library.

### HEIC

iPhone photos are HEIF with HEVC. Worth supporting. Two limits, both from sharp's maintainer, not from us:

- sharp's published binaries do not include HEVC decode. Patent exposure is why. sharp will use a system libvips that was built with libheif and libde265. ImageMagick has the same requirement. No current Node thumbnail library ships HEVC inside its default binary.
- `sharp.format.heif.input === true` only means the container loader exists. HEVC is `metadata().compression === 'hevc'` on a real iPhone file. libvips 8.18.3 rejects some ordinary iPhone files (`iref` reference limit); 8.18.4 fixes that. Pin with that in mind, and test a real `.heic` on the image we ship.

Safari often transcodes HEIC to JPEG in the file picker, so many browser uploads never arrive as HEIC. API clients, sync, and non-Safari uploads still do.

### Library

sharp is the Node default for this job (libvips, EXIF orientation, header metadata for frame count, used across the Node image tooling). The runtime image cannot be "npm install sharp" alone: BMP wants ImageMagick linked into libvips, HEIC wants libheif and libde265, and the prebuilt sharp tarball has neither. The dependency we are accepting is a libvips build with those two extras, and sharp pointed at it. ImageMagick by itself can decode the same list, including BMP and HEIC, but it is a shell-out and a larger attack surface, and it does not remove the HEIC library requirement.

## Delete and sync

Delete of an image file also deletes `thumbnails/640/<filename>` and `thumbnails/640/<filename>.skip` when either is there.

Sync copies whichever of those two objects exists, with the parent, as part of the file sync. Prefer that copy over making the target generate on first view. If the source has written neither yet, the target does not have a derivative until a later sync. A copied `.skip` stops the target from enqueueing a file that already failed.

## Requirements

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

## Ask the team

The thumbnail URL returns two different bodies over its life. The first request, before the JPEG exists, returns the original file and `Cache-Control: no-store`. A later request returns the small JPEG and may be cached.

The app cannot force the load balancer to obey `no-store`. If the balancer stores the first response by URL and ignores that header, every card keeps receiving the full image from the balancer after the JPEG has been written.

Question for the team: on `GET /files/thumbnails/*`, will the load balancer store a response that says `Cache-Control: no-store`? If it will, what do we set so the original is not kept and the JPEG, once it exists, still is?

## Open

1. The `<img>` audit: every current `/api/files/` image, marked thumb or full, before the route change.
2. Sync of a file does not yet copy `thumbnails/640/<filename>` or `thumbnails/640/<filename>.skip`. The Delete and sync section still stands. A synced image currently goes through file creation, so with the flag on the target enqueues a new thumbnail instead of copying one. TODO until that copy exists.

## Implementation review

### Feature flag: node-wide, not per tenant

These are two different switches. The first pass mixed them.

A **node-wide** flag comes from the environment of that process. Every tenant on that Node instance sees the same value. Turning it off stops enqueueing on that server, which is what you want while the image libraries are not installed there. `FEATURE_FLAG_IMAGE_THUMBNAILS` is this kind of flag. It does not belong on `config.defaultTenant.featureFlags`.

A **per-tenant** flag is stored on the tenant and merged over the default tenant in config. `fileCacheHeaders` and the rest of `app/api/tenants/featureFlags.ts` are this kind. A tenant record can turn it on or off by itself. The benefit for this job: only the tenants that have it on enqueue, so a page of images on one tenant does not enqueue for the others. The cost: the libraries are installed per server, not per tenant. A tenant flag can be on while that server cannot decode the file, and off on a server that can.

Decided for now: node-wide, from the environment. A per-tenant limit on who enqueues is a later option, and it would be a tenant feature flag, not this env var. The two would compose (node off means nobody enqueues; node on and tenant off means that tenant does not). Not built.

`FEATURE_FLAG_IMAGE_THUMBNAILS` is read once with the other environment values and stored as `config.imageThumbnails`, the same way `queueBackend` is. It is a boolean on the config object. It is not a function, and it is not a tenant feature flag.

### File creation goes through a listener

Decided, and done. `EnqueueImageThumbnailOnFileCreated` listens to `FileCreatedEvent`. `FilesService.insert` only emits that event. `FilesServiceFactory` does not know about thumbnails. A request for a missing thumbnail still enqueues on its own. That is not a file creation.

`file.type` is the parameter that tells the files apart. `custom` is a custom upload (logos and other files that are not entity attachments). The listener does enqueue those when the extension is eligible. Skipping them is `file.type === 'custom'` if we decide they should not have derivatives.

It does not enqueue `type: 'thumbnail'` (a PDF thumbnail is already a JPEG named `{documentId}.jpg`; generating another derivative of it is wrong) or an attachment that carries a `url` (no local bytes).

Delete of the derivative is `DeleteImageThumbnailOnFileDeleted`, on `FileDeletedEvent`. The event carries `fileId` and `filename`. `FilesService` emits that and does not know about thumbnails. The listener deletes `thumbnails/640/<filename>` and the `.skip` object for an eligible extension, whether or not the flag is on. A missing object is ignored. The listener job is queued when the event is emitted, which is before the transaction commits. A delete that then rolls back can still remove the derivative.

### Permissions

Kept. `DownloadThumbnailController` checks `EntityPermissionChecker` on the parent, or on the PDF thumbnail row, before streaming. Same rule as the files route.

### `locationExists`

Still open. Not happy with a second method. `fileExists` cannot point at `thumbnails/640/<filename>` because that key is not a file row. `createPath` was not changed. Writing a file already creates the directory; the new method only answers whether the object is already there. Discuss with the team before changing it.

### Extension case

Decided. The extension is compared in lowercase. The stored filename keeps its case.

### Thumbnail route has its own controller

Decided, and done. `GET /files/thumbnails/:filename` is `DownloadThumbnailController`. `DownloadFileController` only streams the file row it was asked for.

### `countActiveByParams`

Decided: keep it. Delete-then-dispatch, as thesaurus denormalize does, would drop a queued job and insert another. The thumbnail that job would produce does not change, so the delete only delays it. A running job is not deleted by `deleteByParams` anyway, so a second one would still start. The read is the check that stops that.

### Its own module

Decided. Image thumbnails are `app/api/imageThumbnails`, beside `core`, the same way `paragraphExtraction` sits in `app/api`. Nothing outside the feature calls the use cases, so they do not live under `core`, and nothing else imports them, so they are not a `packages/` module.

The module owns the domain rules, the use cases, the renderer, the job, the listeners, and the handler for `GET /files/thumbnails/:filename`. `app/api/files/routes.ts` only points that URL at the handler, because the URL also serves PDF thumbnail rows. `FileCreatedEvent` and `FileDeletedEvent` stay core events. The module subscribes. Listeners are picked up by the `app/api` listener manifest.

`config.imageThumbnails` stays the node-wide flag. The shared `Dispatcher` does not grow thumbnail methods. Creating a thumbnail and counting an active one go through `JobsDispatcher`, inside the module.

### Front end

Left as it is. Do not build on it until the backend review above is finished. The `<img>` audit is still open.
