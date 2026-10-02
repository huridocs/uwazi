import { atom } from 'jotai';
import type { EntityPageViewData } from '#V2/Routes/Entity/Components/EntityPageView/types.js';

/**
 * Entity V2 page payload for markdown. Null on Entity V1 (Redux page/entityView).
 * Set during render; cleared on unmount only while this screen still owns it.
 */
const entityPageViewAtom = atom<EntityPageViewData | null>(null);

export { entityPageViewAtom };
