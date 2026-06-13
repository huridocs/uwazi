import type { DatavizManualDataPayload } from '#shared/types/datavizSchema.js';
import { parseManualDataPayload } from '#shared/dataviz/manualData.js';
import { DatavizInvalidQueryError } from '../errors.js';

const validateManualData = (manualData?: DatavizManualDataPayload): void => {
  try {
    parseManualDataPayload(manualData ?? {});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid manual data';
    throw new DatavizInvalidQueryError(message);
  }
};

export { validateManualData };
