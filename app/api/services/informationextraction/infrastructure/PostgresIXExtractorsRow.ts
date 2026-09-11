/** One `ix_extractors` row: the Mongo `ixextractors` document with its ids as hex strings. */
type IXExtractorsRow = {
  _id: string;
  name: string;
  property: string;
  source: { pdf?: boolean; property?: string };
  templates: string[];
};

export type { IXExtractorsRow };
