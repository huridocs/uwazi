import type { Thesaurus } from '#shared/contracts/Thesaurus.js';

/** GET /api/dictionaries */
type ThesauriQuery = { _id?: string };

type ThesauriResponse = { rows: Thesaurus[] };

export type { ThesauriQuery, ThesauriResponse };
