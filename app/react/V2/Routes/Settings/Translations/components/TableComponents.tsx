/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Link } from 'react-router-dom';
import { CellContext } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Button, Pill } from 'V2/Components/UI';
import { TranslationContext } from '../TranslationsList';

const LabelHeader = () => <Translate>Name</Translate>;
const TypeHeader = () => <Translate>Type</Translate>;
const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const RenderButton = ({ cell }: CellContext<TranslationContext, any>) => (
  <Link to={`edit/${cell.row.original.id}`}>
    <Button styling="light" className="leading-4">
      <Translate>Translate</Translate>
    </Button>
  </Link>
);

const ContextPill = ({ cell }: CellContext<TranslationContext, any>) => (
  <div className="whitespace-nowrap">
    <Pill color="gray">
      <Translate>{cell.renderValue()}</Translate>
    </Pill>
  </div>
);

export { RenderButton, ContextPill, LabelHeader, TypeHeader, ActionHeader };
