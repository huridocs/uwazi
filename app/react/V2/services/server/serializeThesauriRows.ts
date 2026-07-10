import type { Thesaurus } from '#shared/contracts/Thesaurus.js';

/** Mongo ObjectIds → strings, matching HTTP JSON serialization. */
const serializeThesauriRows = <T>(rows: T[]): Thesaurus[] => JSON.parse(JSON.stringify(rows));

export { serializeThesauriRows };
