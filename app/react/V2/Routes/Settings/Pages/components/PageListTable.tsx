/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Button, Pill } from '#app/V2/Components/UI/index.js';
import { I18NLinkV2 as I18NLink, Translate } from '#app/I18N/index.js';
import { TablePage } from '../PagesList.js';
import { getPageDraftUrl, getPageUrl } from './pageUrls.js';

const EntityViewHeader = () => <Translate>Entity Page</Translate>;
const TitleHeader = () => <Translate>Title</Translate>;
const UrlHeader = () => <Translate>URL</Translate>;
const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const ActionCell = ({ cell }: CellContext<TablePage, string>) => {
  const pageUrl = getPageUrl(cell.getValue());
  const isEntityView = cell.row.original.entityView;

  return (
    <div className="flex justify-end gap-2">
      <I18NLink to={`/${pageUrl}`} target="_blank" aria-disabled={isEntityView}>
        <Button variant="ghost" disabled={isEntityView}>
          <Translate>View</Translate>
        </Button>
      </I18NLink>
      <I18NLink to={`/settings/pages/edit/${cell.getValue()}`}>
        <Button variant="ghost">
          <Translate>Edit</Translate>
        </Button>
      </I18NLink>
    </div>
  );
};

const YesNoPill = ({ cell }: CellContext<TablePage, boolean>) => {
  const { color, label }: { color: 'primary' | 'gray'; label: React.ReactElement } = cell.getValue()
    ? { color: 'primary', label: <Translate>Yes</Translate> }
    : { color: 'gray', label: <Translate>No</Translate> };

  return <Pill color={color}>{label}</Pill>;
};

const UrlCell = ({ cell }: CellContext<TablePage, string>) => {
  const url = `/${getPageUrl(cell.getValue())}`;
  return url;
};

const List = ({ items }: { items: TablePage[] }) => (
  <ul className="flex flex-wrap max-w-md gap-8 list-disc list-inside">
    {items.map(item => (
      <li key={item._id}>{item.title}</li>
    ))}
  </ul>
);

export {
  YesNoPill,
  ActionCell,
  EntityViewHeader,
  TitleHeader,
  UrlHeader,
  ActionHeader,
  UrlCell,
  getPageUrl,
  getPageDraftUrl,
  List,
};
