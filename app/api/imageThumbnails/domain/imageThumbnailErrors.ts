/* eslint-disable max-classes-per-file */
import { DomainError } from '#api/core/domain/error/DomainError.js';

class ImageThumbnailRejected extends DomainError {
  constructor(cause: Error) {
    super('Cannot create an image thumbnail.', 'file.image_thumbnail_rejected', cause);
  }
}

class ImageThumbnailUnavailable extends DomainError {
  constructor(cause: Error) {
    super('Image thumbnail library is not available.', 'file.image_thumbnail_unavailable', cause);
  }
}

export { ImageThumbnailRejected, ImageThumbnailUnavailable };
