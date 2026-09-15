import { ClientSettingsLinkSchema, ClientSublink } from '#app/apiResponseTypes.js';
import uniqueID from '#shared/uniqueID.js';

type Link = Omit<ClientSettingsLinkSchema, 'sublinks'> & {
  rowId?: string;
  subRows?: (ClientSublink & { rowId?: string })[];
};

const createRowId = () => `tmp_${uniqueID()}`;

const dropTemporaryAndMongooseIds = <T extends { id?: string; _id?: string }>(
  item: T
): Omit<T, '_id' | 'id'> & { id?: string } => {
  const { _id: _mongooseId, id, ...rest } = item;
  if (id && !id.startsWith('tmp_')) {
    return { ...rest, id };
  }
  return rest;
};

const sanitizeIds = (_link: Link): ClientSettingsLinkSchema => {
  const { rowId: _deletedRowId, subRows, ...link } = { ..._link };
  const sanitizedLink: ClientSettingsLinkSchema = dropTemporaryAndMongooseIds(link);
  if (subRows) {
    sanitizedLink.sublinks = subRows.map(sublink => {
      const { rowId: _deletedSubrowId, ...rest } = sublink;
      return dropTemporaryAndMongooseIds(rest);
    });
  }
  return sanitizedLink;
};

const formatMenuLinks = (links: ClientSettingsLinkSchema[]): Link[] =>
  (links || []).map(link => {
    const { _id: _mongooseId, sublinks, ...rest } = link;
    const tableLink: Link = { ...rest, rowId: rest.id! };
    if (sublinks) {
      tableLink.subRows = sublinks.map(sublink => {
        const { _id: _subMongooseId, ...subRest } = sublink;
        return { ...subRest, rowId: subRest.id! };
      });
    }
    return tableLink;
  });

export type { Link };
export { createRowId, formatMenuLinks, sanitizeIds };
