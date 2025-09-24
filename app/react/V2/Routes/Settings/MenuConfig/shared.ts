// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientSettingsLinkSchema, ClientSublink } from '../../apiResponseTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/uniqueID.js' or i... Remove this comment to see the full error message
import uniqueID from 'shared/uniqueID.js';

type Link = Omit<ClientSettingsLinkSchema, 'sublinks'> & {
  rowId?: string;
  subRows?: (ClientSublink & { rowId?: string })[];
};

const createRowId = () => `tmp_${uniqueID()}`;

const sanitizeIds = (_link: Link): ClientSettingsLinkSchema => {
  const { rowId: _deletedRowId, ...link } = { ..._link };
  const sanitizedLink: ClientSettingsLinkSchema = link;
  if (link._id?.startsWith('tmp_')) {
    delete sanitizedLink._id;
  }
  if (link.subRows) {
    const sublinks =
      link.subRows.map(sublink => {
        const { rowId: _deletedSubrowId, ...rest } = sublink;
        return rest;
      }) || [];
    sanitizedLink.sublinks = sublinks;
  }
  delete link.subRows;
  return sanitizedLink;
};

export type { Link };
export { createRowId, sanitizeIds };
