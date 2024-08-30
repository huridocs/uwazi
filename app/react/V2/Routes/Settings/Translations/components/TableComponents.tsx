/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Link } from 'react-router-dom';
import { CellContext } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { ClientTranslationContextSchema } from 'app/istore';
import { Button, Pill } from 'V2/Components/UI';

const LabelHeader = () => <Translate>Name</Translate>;
const TypeHeader = () => <Translate>Type</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const RenderButton = ({ cell }: CellContext<ClientTranslationContextSchema, any>) => (
  <Link to={`edit/${cell.row.original.id}`}>
    <Button styling="light" className="leading-4">
      <Translate>Translate</Translate>
    </Button>
  </Link>
);

const ContextPill = ({ cell }: CellContext<ClientTranslationContextSchema, any>) => (
  <div className="whitespace-nowrap">
    <Pill color="gray">
      <Translate>{cell.renderValue()}</Translate>
    </Pill>
  </div>
);

export { RenderButton, ContextPill, LabelHeader, TypeHeader, ActionHeader };
