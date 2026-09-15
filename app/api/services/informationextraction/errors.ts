/* eslint-disable max-classes-per-file */
class ExtractorNotFound extends Error {
  constructor(extractorId: string) {
    super(`Extractor with ID ${extractorId} not found.`);
  }
}

class ModelNotReadyError extends Error {
  constructor(extractorId: string) {
    super(`Model for extractor with ID ${extractorId} is not ready.`);
  }
}

export { ExtractorNotFound, ModelNotReadyError };
