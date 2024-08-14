import { LoaderFunction } from 'react-router-dom';
import { Row, RowSelectionState } from '@tanstack/react-table';
import { IncomingHttpHeaders } from 'http';
import { assign } from 'lodash';
import { ClientThesaurusValue } from 'app/apiResponseTypes';
import ThesauriAPI from 'V2/api/thesauri';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { httpRequest } from 'shared/superagent';
import uniqueID from 'shared/uniqueID';
import { ThesaurusRow } from './components/TableComponents';

const findItem: (items: ThesaurusRow[], searchedItem: ThesaurusRow) => ThesaurusRow | undefined = (
  items,
  searchedItem
) =>
  items.find(item => {
    const match = item.rowId === searchedItem.rowId;
    return !match && item.subRows?.length && item.subRows?.length > 0
      ? findItem(item.subRows, searchedItem)
      : match;
  });

const sanitizeThesaurusValues = (rows: ThesaurusRow[]): ThesaurusValueSchema[] =>
  (rows || []).map(({ rowId: _rowId, groupId: _groupId, subRows: subItems, ...item }) => {
    const values = subItems?.map(subItem => {
      const { rowId, groupId, ...rest } = subItem;
      return rest;
    });
    return values && values.length ? assign(item, { values }) : item;
  });

const addSelection =
  (selectedRows: RowSelectionState, selection: ThesaurusRow[]) => (item: any) => {
    if (item.rowId in selectedRows) {
      selection.push(item);
    }
  };

const sanitizeThesauri = (thesaurus: ThesaurusSchema) => {
  const sanitizedThesauri = { ...thesaurus };
  sanitizedThesauri.values = sanitizedThesauri
    .values!.filter((value: ThesaurusValueSchema) => value.label)
    .filter((value: ThesaurusValueSchema) => !value.values || value.values.length)
    .map((value: ThesaurusValueSchema) => {
      const _value = { ...value };
      if (_value.values) {
        _value.values = _value.values.filter(_v => _v.label);
      }
      return _value;
    });
  return sanitizedThesauri;
};

const importThesaurus = async (
  thesaurus: ThesaurusSchema,
  file: File
): Promise<ThesaurusSchema> => {
  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const fields = {
    thesauri: JSON.stringify(thesaurus),
  };

  return (await httpRequest('thesauris', fields, headers, file)) as ThesaurusSchema;
};

const editThesaurusLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { _id } }) =>
    (await ThesauriAPI.getThesauri({ _id }, headers))[0];

const emptyThesaurus = {
  rowId: uniqueID(),
  label: '',
  subRows: [{ label: '', rowId: uniqueID() }],
};

const thesaurusAsRow = ({ values, ...item }: ClientThesaurusValue) =>
  ({
    ...item,
    rowId: item.id || uniqueID(),
    subRows: values?.map(val => ({
      ...val,
      rowId: val.id || uniqueID(),
      groupId: item.id,
    })),
  }) as ThesaurusRow;

interface ConfirmationCallback {
  callback: Function;
  arg?: Row<ThesaurusRow>;
}

export {
  sanitizeThesaurusValues,
  sanitizeThesauri,
  importThesaurus,
  addSelection,
  findItem,
  editThesaurusLoader,
  emptyThesaurus,
  thesaurusAsRow,
};

export type { ConfirmationCallback };
