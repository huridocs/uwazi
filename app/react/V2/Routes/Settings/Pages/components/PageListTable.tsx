/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Link } from 'react-router-dom';
import { kebabCase } from 'lodash';
import { CellContext } from '@tanstack/react-table';
import { Page } from 'app/V2/shared/types';
import { Button, Pill } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';

const getPageUrl = (sharedId: string, title: string) => `page/${sharedId}/${kebabCase(title)}`;

const EntityViewHeader = () => <Translate>Entity Page</Translate>;
const TitleHeader = () => <Translate>Title</Translate>;
const UrlHeader = () => <Translate>URL</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const ActionCell = ({ cell }: CellContext<Page, string>) => {
  const pageUrl = getPageUrl(cell.getValue(), cell.row.original.title);
  const isEntityView = cell.row.original.entityView;

  return (
    <div className="flex justify-end gap-2">
      <Link
        to={`/${cell.row.original.language}/${pageUrl}`}
        target="_blank"
        aria-disabled={isEntityView}
      >
        <Button styling="outline" disabled={isEntityView}>
          <Translate>View</Translate>
        </Button>
      </Link>
      <Link to={`/${cell.row.original.language}/settings/pages/page/${cell.getValue()}`}>
        <Button styling="outline">
          <Translate>Edit</Translate>
        </Button>
      </Link>
    </div>
  );
};

const YesNoPill = ({ cell }: CellContext<Page, boolean>) => {
  const { color, label }: { color: 'primary' | 'gray'; label: React.ReactElement } = cell.getValue()
    ? { color: 'primary', label: <Translate>Yes</Translate> }
    : { color: 'gray', label: <Translate>No</Translate> };

  return <Pill color={color}>{label}</Pill>;
};

const UrlCell = ({ cell }: CellContext<Page, string>) => {
  const sharedId = cell.getValue();
  const { title } = cell.row.original;
  const url = `/${getPageUrl(sharedId, title)}`;
  return url;
};

export {
  YesNoPill,
  ActionCell,
  EntityViewHeader,
  TitleHeader,
  UrlHeader,
  ActionHeader,
  UrlCell,
  getPageUrl,
};
