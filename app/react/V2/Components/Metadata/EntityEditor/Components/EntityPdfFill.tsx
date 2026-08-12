import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ViewfinderCircleIcon } from '@heroicons/react/20/solid';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { FieldValues, Path, PathValue, UseFormSetValue } from 'react-hook-form';
import { t, Translate } from '#app/I18N/index.js';
import type { PropertySelectionSchema } from '#shared/types/commonTypes.js';
import { coerceValue } from '#V2/api/entities/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { propertyHasSelection } from '../functions/propertySelectionHelpers.js';
import { EntityField } from './EntityField.js';

type PdfFillCoerceType = 'text' | 'date' | 'numeric';

type PdfFillTarget = {
  name: string;
  propertyId?: string;
  coerceType: PdfFillCoerceType;
};

type PdfFillHost = {
  isEditing: boolean;
  language: string;
  savedPropertySelections?: PropertySelectionSchema[];
  documentPdfSelection: TextSelection | undefined;
  draftPropertySelections: PropertySelectionSchema[];
  upsertPropertySelection: (
    property: { name: string; id?: string },
    selection: TextSelection
  ) => void;
  clearPropertySelection: (property: { name: string; id?: string }) => void;
  setDocumentPdfSelection: (selection: TextSelection | undefined) => void;
  setPdfSelectionMenuOpen: (open: boolean) => void;
};

type PdfFillPlacement = 'overlay' | 'beside';

type EntityPdfFillProps = {
  target: PdfFillTarget;
  disabled?: boolean;
  placement?: PdfFillPlacement;
  applyValue: (value: string | number) => void;
  children: (overlay: React.ReactNode) => React.ReactNode;
};

type EntityPdfFillFieldProps<TFormValues extends FieldValues> = {
  field: Path<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  disabled?: boolean;
  placement?: PdfFillPlacement;
  pdfFill?: PdfFillTarget;
  children: (overlay?: React.ReactNode) => React.ReactNode;
};

const noop = () => undefined;

const defaultPdfFillHost: PdfFillHost = {
  isEditing: false,
  language: 'en',
  documentPdfSelection: undefined,
  draftPropertySelections: [],
  upsertPropertySelection: noop,
  clearPropertySelection: noop,
  setDocumentPdfSelection: noop,
  setPdfSelectionMenuOpen: noop,
};

const PdfFillContext = createContext<PdfFillHost>(defaultPdfFillHost);

const PdfFillProvider = ({
  value,
  children,
}: {
  value: PdfFillHost;
  children: React.ReactNode;
}) => <PdfFillContext.Provider value={value}>{children}</PdfFillContext.Provider>;

const usePdfFill = () => useContext(PdfFillContext);

const applyPdfFillFormValue = <TFormValues extends FieldValues>(
  setValue: UseFormSetValue<TFormValues>,
  field: Path<TFormValues>,
  value: string | number
) => {
  setValue(field, value as PathValue<TFormValues, Path<TFormValues>>, { shouldDirty: true });
};

const sanitizeText = (text: string) => text.replace(/[\n\r]+/g, ' ');

const EntityPdfFill = ({
  target,
  disabled,
  placement = 'overlay',
  applyValue,
  children,
}: EntityPdfFillProps) => {
  const {
    isEditing,
    language,
    savedPropertySelections,
    documentPdfSelection,
    draftPropertySelections,
    upsertPropertySelection,
    clearPropertySelection,
    setDocumentPdfSelection,
    setPdfSelectionMenuOpen,
  } = usePdfFill();
  const [isFilling, setIsFilling] = useState(false);
  const fillInFlight = useRef(false);

  const { name: propertyName, propertyId, coerceType } = target;
  const showFill = Boolean(isEditing && documentPdfSelection && !disabled);
  const showClear =
    Boolean(isEditing && !disabled) &&
    propertyHasSelection(savedPropertySelections, draftPropertySelections, {
      name: propertyName,
      id: propertyId,
    });

  const onFill = useCallback(async () => {
    if (!documentPdfSelection || fillInFlight.current) return;

    if (!documentPdfSelection.selectionRectangles?.length) {
      notify(
        t('System', 'Could not detect the area for the selected text', null, false),
        'warning'
      );
      return;
    }

    fillInFlight.current = true;
    setIsFilling(true);

    try {
      const rawText = documentPdfSelection.text || '';
      if (coerceType === 'text') {
        applyValue(sanitizeText(rawText));
      } else {
        const coerced = await coerceValue(
          coerceType === 'numeric' ? rawText.trim() : rawText,
          coerceType,
          language
        );

        if (!coerced?.success) {
          notify(
            t('System', 'Value cannot be transformed to the correct type', null, false),
            'danger'
          );
          return;
        }

        applyValue(coerced.value);
      }

      upsertPropertySelection({ name: propertyName, id: propertyId }, documentPdfSelection);
      setDocumentPdfSelection(undefined);
      setPdfSelectionMenuOpen(false);
    } finally {
      fillInFlight.current = false;
      setIsFilling(false);
    }
  }, [
    applyValue,
    coerceType,
    documentPdfSelection,
    language,
    propertyId,
    propertyName,
    setDocumentPdfSelection,
    setPdfSelectionMenuOpen,
    upsertPropertySelection,
  ]);

  const onClear = useCallback(() => {
    clearPropertySelection({ name: propertyName, id: propertyId });
  }, [clearPropertySelection, propertyId, propertyName]);

  const fillDisabled = Boolean(disabled || isFilling);
  const fillButton = showFill ? (
    <button
      type="button"
      disabled={fillDisabled}
      onClick={() => {
        void onFill();
      }}
      className={
        placement === 'beside'
          ? 'shrink-0 border-0 bg-transparent p-0 text-carbon disabled:cursor-not-allowed disabled:opacity-50'
          : 'absolute inset-y-0 right-2 z-1 my-auto h-fit border-0 bg-transparent p-0 text-carbon disabled:cursor-not-allowed disabled:opacity-50'
      }
      data-testid="click-to-fill"
    >
      <span className="inline-flex items-center gap-1 rounded-sm bg-paper px-0.5 py-px text-xs">
        <Translate>Click to fill</Translate>
        <ViewfinderCircleIcon className="size-3.5 shrink-0" aria-hidden />
      </span>
    </button>
  ) : null;

  const clearButton = showClear ? (
    <button
      type="button"
      onClick={onClear}
      className="w-fit border-0 bg-transparent p-0 text-left text-xs text-carbon hover:underline"
      data-testid="clear-pdf-selection"
    >
      <Translate translationKey="Clear PDF selection">Clear PDF selection</Translate>
    </button>
  ) : null;

  if (placement === 'beside') {
    return (
      <>
        <div className="flex items-end gap-2">
          <div className="min-w-0">{children(null)}</div>
          {fillButton}
        </div>
        {clearButton}
      </>
    );
  }

  return (
    <>
      {children(fillButton)}
      {clearButton}
    </>
  );
};

const EntityPdfFillField = <TFormValues extends FieldValues>({
  field,
  setValue,
  disabled,
  placement,
  pdfFill,
  children,
}: EntityPdfFillFieldProps<TFormValues>) => (
  <EntityField>
    {pdfFill ? (
      <EntityPdfFill
        target={pdfFill}
        disabled={disabled}
        placement={placement}
        applyValue={value => applyPdfFillFormValue(setValue, field, value)}
      >
        {overlay => children(overlay)}
      </EntityPdfFill>
    ) : (
      children()
    )}
  </EntityField>
);

export {
  EntityPdfFill,
  EntityPdfFillField,
  PdfFillProvider,
  usePdfFill,
  defaultPdfFillHost,
  applyPdfFillFormValue,
};
export type { PdfFillTarget, PdfFillCoerceType, PdfFillHost, PdfFillPlacement };
