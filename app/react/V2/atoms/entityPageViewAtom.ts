import { atom } from 'jotai';
import type { EntityPageViewData } from '#V2/Routes/Entity/Components/EntityPageView/types.js';

/**
 * Holds the entity-view page payload for the current Entity V2 screen.
 * Cleared when leaving the entity (or when the template has no entityViewPage).
 * Used by EntityData / scripts that need datasets outside the React page tree.
 */
const entityPageViewAtom = atom<EntityPageViewData | null>(null);

export { entityPageViewAtom };
