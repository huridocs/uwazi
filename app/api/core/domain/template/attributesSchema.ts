import { z } from 'zod';

const attributesSchema = z.array(z.string()).optional();

const entryCarriesAttributes = (entry: { attributes?: unknown } | null | undefined) =>
  entry?.attributes !== undefined;

export { attributesSchema, entryCarriesAttributes };
