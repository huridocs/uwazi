/* eslint-disable react/no-multi-comp */
import React from 'react';
import { StarIcon } from '@heroicons/react/20/solid';
import { CellContext } from '@tanstack/react-table';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import { TableLanguages } from '../LanguagesList.js';

const DefaultButton = ({ cell, column }: CellContext<TableLanguages, boolean>) => (
  <Button
    variant={cell.row.original.default ? 'primary' : 'secondary'}
    onClick={async () => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4 border-[0.75px]! border-(--color-theme-action-primary)! text-(--color-theme-action-primary)! disabled:border-(--color-theme-action-primary)! disabled:bg-(--color-theme-action-primary)! disabled:text-(--color-theme-action-primary-fg)!"
  >
    <Translate className="sr-only">Default</Translate>
    <StarIcon
      className={
        !cell.row.original.default
          ? 'w-4 text-(--color-theme-action-primary)'
          : 'w-4 text-(--color-theme-action-primary-fg)'
      }
    />
  </Button>
);

const UninstallButton = ({ cell, column }: CellContext<TableLanguages, string>) =>
  !cell.row.original.default ? (
    <Button
      variant="ghost"
      onClick={() => column.columnDef.meta?.action?.(cell.row)}
      className="leading-4"
    >
      <Translate>Uninstall</Translate>
    </Button>
  ) : (
    <> </>
  );

const ResetButton = ({ cell, column }: CellContext<TableLanguages, string>) =>
  cell.row.original.translationAvailable ? (
    <Button
      variant="ghost"
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
