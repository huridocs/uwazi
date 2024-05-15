import { atomWithReset } from 'jotai/utils';

const globalErrorsAtom = atomWithReset([]);

export { globalErrorsAtom };
