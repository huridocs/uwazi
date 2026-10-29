import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Directory holding the committed blank-state dump. */
const BLANK_STATE_DATA_DIR = path.join(__dirname, 'data');

/** The committed blank-state dump: one portable manifest+COPY stream. */
const BLANK_STATE_DUMP_FILE = path.join(BLANK_STATE_DATA_DIR, 'blank_state.uwazidump');

export { BLANK_STATE_DATA_DIR, BLANK_STATE_DUMP_FILE };
