import { z } from 'zod';
import { MalformedManifestError } from './MalformedManifestError.js';
import type { TableWithColumns } from './tenantTableDiscovery.js';

const MANIFEST_VERSION = 1 as const;

/**
 * The first line of an export stream. Import reads it before the COPY sections; `tables` order is
 * the stream order, and each table's `columns` lists its COPY columns with `tenant_id` first.
 */
const ManifestTableSchema = z
  .object({ name: z.string().min(1), columns: z.array(z.string().min(1)).min(1) })
  .strict();

const ManifestSchema = z
  .object({
    version: z.literal(MANIFEST_VERSION),
    sourceTenant: z.string().min(1),
    schemaVersion: z.number().int().nonnegative(),
    tables: z.array(ManifestTableSchema),
  })
  .strict()
  .superRefine((manifest, ctx) => {
    manifest.tables.forEach((table, index) => {
      if (table.columns[0] !== 'tenant_id') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tables', index, 'columns', 0],
          message: "The first column must be 'tenant_id'",
        });
      }
    });
  });

export type ExportManifest = z.infer<typeof ManifestSchema>;

export function serializeManifest(
  sourceTenant: string,
  schemaVersion: number,
  tables: TableWithColumns[]
): string {
  return JSON.stringify({ version: MANIFEST_VERSION, sourceTenant, schemaVersion, tables });
}

export function parseManifest(line: string): ExportManifest {
  let raw: unknown;
  try {
    raw = JSON.parse(line);
  } catch {
    throw new MalformedManifestError('The first line of the import stream is not JSON.');
  }

  const parsed = ManifestSchema.safeParse(raw);
  if (!parsed.success) {
    const [first] = parsed.error.issues;
    const path = first ? first.path.join('.') : '';
    throw new MalformedManifestError(
      `Invalid manifest${path ? ` at ${path}` : ''}: ${first?.message ?? 'unknown'}`
    );
  }

  return parsed.data;
}

/**
 * Rewrites the tenant_id field of one COPY text row. Export always emits tenant_id as the first
 * column, and tenant names cannot contain tabs, so everything up to the first tab (or the whole
 * line) is the tenant_id.
 */
export function rewriteTenantId(line: string, tenantId: string): string {
  const tab = line.indexOf('\t');
  return tab === -1 ? tenantId : `${tenantId}${line.slice(tab)}`;
}

export { MANIFEST_VERSION };
