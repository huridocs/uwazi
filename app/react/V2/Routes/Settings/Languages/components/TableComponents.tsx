/* eslint-disable react/no-multi-comp */
import React from 'react';
import { StarIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';
import { Button } from 'V2/Components/UI/Button';
import { CellContext } from '@tanstack/react-table';
import { LanguageSchema } from 'shared/types/commonTypes';

const DefaultButton = ({ cell, column }: CellContext<LanguageSchema, boolean>) => (
  <Button
    styling={cell.row.original.default ? 'solid' : 'light'}
    onClick={async () => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4"
  >
    <Translate className="sr-only">Default</Translate>
    <StarIcon
      className={`${
        !cell.row.original.default
          ? ' w-4 text-white stroke-current stroke-gray-300 stroke-2'
          : 'w-4'
      }`}
    />
  </Button>
);

const UninstallButton = ({ cell, column }: CellContext<LanguageSchema, string>) =>
  !cell.row.original.default ? (
    <Button
      styling="outline"
      onClick={() => column.columnDef.meta?.action?.(cell.row)}
      className="leading-4"
    >
      <Translate>Uninstall</Translate>
    </Button>
  ) : (
    <> </>
  );

const ResetButton = ({ cell, column }: CellContext<LanguageSchema, string>) =>
  cell.row.original.translationAvailable ? (
    <Button
      styling="outline"
      onClick={() => column.columnDef.meta?.action?.(cell.row)}
      className="leading-4"
    >
      <Translate>Reset</Translate>
    </Button>
  ) : (
    <> </>
  );

const LanguageLabel = ({ cell }: any) => (
  <Translate>{`${cell.row.original.label} (${cell.row.original.key})`}</Translate>
);

const LabelHeader = () => <Translate>Language</Translate>;

const DefaultHeader = () => <Translate className="sr-only">Default language</Translate>;

const ResetHeader = () => <Translate className="sr-only">Reset language</Translate>;

const UninstallHeader = () => <Translate className="sr-only">Uninstall language</Translate>;

export {
  LanguageLabel,
  LabelHeader,
  DefaultHeader,
  UninstallHeader,
  DefaultButton,
  UninstallButton,
  ResetButton,
  ResetHeader,
};
