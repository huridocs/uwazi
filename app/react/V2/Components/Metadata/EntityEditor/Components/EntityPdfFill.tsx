import React, { useCallback, useRef, useState } from 'react';
import { ViewfinderCircleIcon } from '@heroicons/react/20/solid';
import { t, Translate } from '#app/I18N/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { propertyHasSelection } from '../functions/propertySelectionHelpers.js';
import { usePdfFill } from './PdfFillContext.js';
import type { PdfFillPlacement, PdfFillTarget } from './pdfFillTypes.js';
import { resolveFillValue } from './resolvePdfFillValue.js';

type EntityPdfFillProps = {
  target: PdfFillTarget;
  disabled?: boolean;
  placement?: PdfFillPlacement;
  applyValue: (value: string | number) => void;
  children: (overlay: React.ReactNode) => React.ReactNode;
};

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
    documentLanguage,
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
      const filled = await resolveFillValue(
        coerceType,
        documentPdfSelection.text || '',
        language,
        documentLanguage
      );
      if (!filled.success) {
        notify(
          t('System', 'Value cannot be transformed to the correct type', null, false),
          'danger'
        );
        return;
      }
      applyValue(filled.value);
      upsertPropertySelection({ name: propertyName, id: propertyId }, documentPdfSelection);
      setDocumentPdfSelection(undefined);
      setPdfSelectionMenuOpen(false);
    } catch {
      notify(t('System', 'Value cannot be transformed to the correct type', null, false), 'danger');
    } finally {
      fillInFlight.current = false;
      setIsFilling(false);
    }
  }, [
    applyValue,
    coerceType,
    documentLanguage,
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
      aria-label={t('System', 'Click to fill', null, false)}
      onClick={() => {
        onFill().catch(() => undefined);
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

export { EntityPdfFill };
export { PdfFillProvider, usePdfFill, defaultPdfFillHost } from './PdfFillContext.js';
export type {
  PdfFillTarget,
  PdfFillCoerceType,
  PdfFillHost,
  PdfFillPlacement,
} from './pdfFillTypes.js';
