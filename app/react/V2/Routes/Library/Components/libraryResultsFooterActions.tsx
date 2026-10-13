import React, { type ReactNode, type RefObject } from 'react';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';

const iconClassName = 'h-3.5 w-3.5 shrink-0 text-ink-tertiary';
const editorRoles = ['admin', 'editor', 'collaborator'];
const menuItemClassName =
  'flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3 py-1.5 text-left text-xs font-medium leading-tight text-ink-secondary transition-colors hover:bg-warm hover:text-ink';

type PdfInputProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  onUploadPdf?: (files: File[]) => void;
};

const renderPdfFileInput = ({ inputRef, onUploadPdf }: PdfInputProps) => (
  <input
    ref={inputRef}
    type="file"
    accept="application/pdf,.pdf"
    multiple
    hidden
    onChange={event => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = '';
      if (files.length) {
        onUploadPdf?.(files);
      }
    }}
  />
);

type ActionItemsProps = {
  variant: 'bar' | 'menu';
  onCreateEntity?: () => void;
  onExportCsv?: () => void;
  pdfInputRef: RefObject<HTMLInputElement | null>;
  onItemChosen?: () => void;
};

const renderMenuActionItems = ({
  onCreateEntity,
  onExportCsv,
  pdfInputRef,
  onItemChosen,
}: Omit<ActionItemsProps, 'variant'>): ReactNode => {
  const run = (action?: () => void) => {
    onItemChosen?.();
    action?.();
  };

  return (
    <>
      <NeedAuthorization roles={editorRoles}>
        <button
          type="button"
          role="menuitem"
          className={menuItemClassName}
          onClick={() => run(onCreateEntity)}
        >
          <PlusIcon className={iconClassName} aria-hidden />
          <Translate>Create entity</Translate>
        </button>
        <button
          type="button"
          role="menuitem"
          className={menuItemClassName}
          onClick={() => {
            onItemChosen?.();
            pdfInputRef.current?.click();
          }}
        >
          <ArrowUpTrayIcon className={iconClassName} aria-hidden />
          <Translate>Upload PDF</Translate>
        </button>
      </NeedAuthorization>
      <NeedAuthorization roles={['admin']}>
        <I18NLink
          to="/settings/csv"
          role="menuitem"
          className={menuItemClassName}
          onClick={() => onItemChosen?.()}
        >
          <TableCellsIcon className={iconClassName} aria-hidden />
          <Translate>Import CSV</Translate>
        </I18NLink>
      </NeedAuthorization>
      <button
        type="button"
        role="menuitem"
        className={menuItemClassName}
        onClick={() => run(onExportCsv)}
      >
        <ArrowDownTrayIcon className={iconClassName} aria-hidden />
        <Translate>Export CSV</Translate>
      </button>
    </>
  );
};

const renderBarActionItems = ({
  onCreateEntity,
  onExportCsv,
  pdfInputRef,
}: Omit<ActionItemsProps, 'variant' | 'onItemChosen'>): ReactNode => (
  <>
    <NeedAuthorization roles={editorRoles}>
      <LibraryFooterButton icon={<PlusIcon className={iconClassName} />} onClick={onCreateEntity}>
        <Translate>Create entity</Translate>
      </LibraryFooterButton>
      <LibraryFooterButton
        icon={<ArrowUpTrayIcon className={iconClassName} />}
        onClick={() => pdfInputRef.current?.click()}
      >
        <Translate>Upload PDF</Translate>
      </LibraryFooterButton>
    </NeedAuthorization>
    <NeedAuthorization roles={['admin']}>
      <LibraryFooterButton icon={<TableCellsIcon className={iconClassName} />} to="/settings/csv">
        <Translate>Import CSV</Translate>
      </LibraryFooterButton>
    </NeedAuthorization>
    <LibraryFooterButton
      icon={<ArrowDownTrayIcon className={iconClassName} />}
      onClick={onExportCsv}
    >
      <Translate>Export CSV</Translate>
    </LibraryFooterButton>
  </>
);

const renderActionItems = ({ variant, ...props }: ActionItemsProps): ReactNode =>
  variant === 'menu' ? renderMenuActionItems(props) : renderBarActionItems(props);

export type { ActionItemsProps, PdfInputProps };
export { renderActionItems, renderPdfFileInput, editorRoles, iconClassName, menuItemClassName };
