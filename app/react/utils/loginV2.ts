import { getStore } from '#shared/atomStore/index.js';
import { isLoginV2Enabled } from '#shared/authReturn.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';

const loginV2Enabled = (): boolean => isLoginV2Enabled(getStore().get(settingsAtom)?.features);

export { loginV2Enabled };
