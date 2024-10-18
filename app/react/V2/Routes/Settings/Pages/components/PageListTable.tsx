/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Link } from 'react-router-dom';
import { kebabCase } from 'lodash';
import { CellContext } from '@tanstack/react-table';
import { Button, Pill } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';
import { TablePage } from '../PagesList';

const getPageUrl = (sharedId: string, title: string) => `page/${sharedId}/${kebabCase(title)}`;

const EntityViewHeader = () => <Translate>Entity Page</Translate>;
const TitleHeader = () => <Translate>Title</Translate>;
const UrlHeader = () => <Translate>URL</Translate>;
const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const ActionCell = ({ cell }: CellContext<TablePage, string>) => {
  const pageUrl = getPageUrl(cell.getValue(), cell.row.original.title);
  const isEntityView = cell.row.original.entityView;

  return (
    <div className="flex justify-end gap-2">
      <Link to={`/${pageUrl}`} target="_blank" aria-disabled={isEntityView}>
        <Button styling="light" disabled={isEntityView}>
          <Translate>View</Translate>
        </Button>
      </Link>
      <Link to={`/settings/pages/page/${cell.getValue()}`}>
        <Button styling="light">
          <Translate>Edit</Translate>
        </Button>
      </Link>
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
  const sharedId = cell.getValue();
  const { title } = cell.row.original;
  const url = `/${getPageUrl(sharedId, title)}`;
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
  List,
};
