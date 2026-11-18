import type { DatavizDefinition } from '#shared/types/datavizSchema.js';

/** GET /api/dataviz (admins only) */
type DatavizListResponse = { rows: DatavizDefinition[] };

/** GET /api/dataviz/:id (admins only) */
type DatavizDefinitionResponse = DatavizDefinition;

export type { DatavizListResponse, DatavizDefinitionResponse };
