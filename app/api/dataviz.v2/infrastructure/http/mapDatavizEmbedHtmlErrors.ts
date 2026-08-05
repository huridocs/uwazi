import type { Response } from 'express';
import {
  DatavizInvalidQueryError,
  DatavizNotFoundError,
  DatavizProcessingError,
  DatavizSnapshotUnavailableError,
  DatavizUnauthorizedError,
} from '#api/dataviz.v2/domain/errors.js';
import { renderDatavizEmbedErrorHtml } from '#shared/dataviz/embed/renderDatavizEmbedHtml.js';

const mapDatavizEmbedHtmlErrors = (error: unknown, response: Response): boolean => {
  if (error instanceof DatavizNotFoundError) {
    response.status(404).type('html').send(renderDatavizEmbedErrorHtml(error.message, 404));
    return true;
  }

  if (error instanceof DatavizUnauthorizedError) {
    response.status(401).type('html').send(renderDatavizEmbedErrorHtml(error.message, 401));
    return true;
  }

  if (error instanceof DatavizProcessingError || error instanceof DatavizSnapshotUnavailableError) {
    response.status(503).type('html').send(renderDatavizEmbedErrorHtml(error.message, 503));
    return true;
  }

  if (error instanceof DatavizInvalidQueryError) {
    response.status(400).type('html').send(renderDatavizEmbedErrorHtml(error.message, 400));
    return true;
  }

  return false;
};

export { mapDatavizEmbedHtmlErrors };
