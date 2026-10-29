import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** The committed blank-state dump: one portable manifest+COPY stream. */
const BLANK_STATE_DUMP_FILE = path.join(__dirname, 'data', 'blank_state.uwazidump');

export { BLANK_STATE_DUMP_FILE };
