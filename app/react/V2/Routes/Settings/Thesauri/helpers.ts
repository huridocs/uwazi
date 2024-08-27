import { SetStateAction } from 'react';
import { LoaderFunction } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { Row, RowSelectionState } from '@tanstack/react-table';
import { assign, isEqual, orderBy, remove } from 'lodash';
import { ClientThesaurus, ClientThesaurusValue } from 'app/apiResponseTypes';
import ThesauriAPI from 'V2/api/thesauri';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { httpRequest } from 'shared/superagent';
import uniqueID from 'shared/uniqueID';
import { ThesaurusRow } from './components/TableComponents';

const rootItemMatch = (item: ThesaurusRow, searchedItem: ThesaurusRow) =>
  item.rowId === searchedItem.rowId ? item : undefined;

const findItem: (items: ThesaurusRow[], searchedItem: ThesaurusRow) => ThesaurusRow | undefined = (
  items,
  searchedItem
) =>
  items
    .map(item => {
      let match = rootItemMatch(item, searchedItem);
      match = match || (item.subRows?.length ? findItem(item.subRows, searchedItem) : undefined);
      return match;
    })
    .filter(v => v)[0];

const sanitizeThesaurusValues = (rows: ThesaurusRow[]): ThesaurusValueSchema[] =>
  (rows || []).map(({ rowId: _rowId, groupId: _groupId, subRows: subItems, ...item }) => {
    const values = subItems?.map(subItem => {
      const { rowId, groupId, ...rest } = subItem;
      return rest;
    });
    return values ? assign(item, { values }) : item;
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

const emptyThesaurus = () => ({
  label: '',
  subRows: [{ label: '', rowId: uniqueID() }],
  rowId: uniqueID(),
});

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

const pushItemsIntoValues = (items: ThesaurusRow[], prev: ThesaurusRow[]) => {
  items.forEach(({ groupId, ...newItem }) => {
    if (!groupId) {
      prev.push(newItem);
    } else {
      const prevGroup = prev.find(item => item.rowId === groupId)!;
      const rest = prevGroup.subRows?.filter(item => item.rowId !== newItem.rowId) || [];
      const prevItem = prevGroup.subRows?.find(item => item.rowId === newItem.rowId) || {};
      prevGroup.subRows = [...rest, { ...prevItem, ...newItem }];
    }
  });
};

const removeItem = (prev: ThesaurusRow[], deletedItem: ThesaurusRow) => {
  const removed = remove(prev, item => item.rowId === deletedItem.rowId);
  if (!removed.length) {
    prev
      .filter(prevItem => prevItem.subRows?.length)
      .forEach(prevItem => {
        remove(prevItem.subRows!, subItem => subItem.rowId === deletedItem.rowId);
        if (prevItem.subRows?.length === 0) {
          remove(prev, item => item.rowId === prevItem.rowId);
        }
      });
  }
};

const sortValues =
  (
    thesaurusValues: ThesaurusRow[],
    setThesaurusValues: React.Dispatch<SetStateAction<ThesaurusRow[]>>
  ) =>
  () => {
    const sortedSubRows = thesaurusValues.map(({ subRows, ...item }) =>
      !subRows?.length
        ? item
        : {
            ...item,
            subRows: [...orderBy(subRows, 'label')],
          }
    );
    setThesaurusValues([...orderBy(sortedSubRows, 'label')]);
  };

const addItemSubmit =
  (
    thesaurusValues: ThesaurusRow[],
    setThesaurusValues: React.Dispatch<SetStateAction<ThesaurusRow[]>>
  ) =>
  (items: ThesaurusRow[]) => {
    const prevItem = items.length && findItem(thesaurusValues, items[0]);
    if (!prevItem) {
      setThesaurusValues((prev: ThesaurusRow[]) => {
        pushItemsIntoValues(items, prev);
        return [...prev];
      });
    } else {
      prevItem.label = items[0].label;
      setThesaurusValues([...thesaurusValues]);
    }
  };
const addGroupSubmit =
  (
    thesaurusValues: ThesaurusRow[],
    setThesaurusValues: React.Dispatch<SetStateAction<ThesaurusRow[]>>
  ) =>
  (group: ThesaurusRow) => {
    const prevItem = findItem(thesaurusValues, group);
    if (!prevItem) {
      setThesaurusValues((prev: ThesaurusRow[]) => {
        const subRows = group.subRows?.map(({ groupId: _groupId, ...item }) => item);
        prev.push({ ...group, subRows });
        return [...prev];
      });
    } else {
      setThesaurusValues((prev: ThesaurusRow[]) => {
        pushItemsIntoValues(group.subRows || [], prev);
        const prevGroup = findItem(prev, group)!;
        prevGroup.label = group.label;
        return [...prev];
      });
    }
  };

const compareThesaurus = (
  thesaurus: ClientThesaurus,
  currentStatus: { name: string; values: ThesaurusValueSchema[] }
) => {
  const changedName = thesaurus?.name !== currentStatus?.name;
  const changedValues = !isEqual(thesaurus?.values, currentStatus?.values);
  return changedName || changedValues;
};

export {
  sanitizeThesaurusValues,
  sanitizeThesauri,
  importThesaurus,
  addSelection,
  editThesaurusLoader,
  emptyThesaurus,
  thesaurusAsRow,
  removeItem,
  sortValues,
  addItemSubmit,
  addGroupSubmit,
  compareThesaurus,
};

export type { ConfirmationCallback };
