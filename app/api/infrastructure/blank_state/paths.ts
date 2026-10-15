import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Directory of committed blank-state fixture files (one JSON per tenant table). */
const BLANK_STATE_DATA_DIR = path.join(__dirname, 'data');

export { BLANK_STATE_DATA_DIR };
