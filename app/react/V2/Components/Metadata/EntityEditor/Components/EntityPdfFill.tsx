import React, { useCallback } from 'react';
import { ViewfinderCircleIcon } from '@heroicons/react/20/solid';
import { t, Translate } from '#app/I18N/index.js';
import { coerceValue } from '#V2/api/entities/index.js';
import {
  useDocumentPdf,
  useEntityLanguage,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { propertyHasSelection } from '../functions/propertySelectionHelpers.js';

type PdfFillCoerceType = 'text' | 'date' | 'numeric';

type PdfFillTarget = {
  name: string;
  propertyId?: string;
  coerceType: PdfFillCoerceType;
};

type EntityPdfFillProps = {
  target: PdfFillTarget;
  disabled?: boolean;
  applyValue: (value: string | number) => void;
  children: (overlay: React.ReactNode) => React.ReactNode;
};

const sanitizeText = (text: string) => text.replace(/[\n\r]+/g, ' ');

const EntityPdfFill = ({ target, disabled, applyValue, children }: EntityPdfFillProps) => {
  const { isEditing } = useMetadataEditing();
  const { language, mainDocument } = useEntityLanguage();
  const {
    documentPdfSelection,
    draftPropertySelections,
    upsertPropertySelection,
    clearPropertySelection,
    setDocumentPdfSelection,
    setPdfSelectionMenuOpen,
  } = useDocumentPdf();

  const { name: propertyName, propertyId, coerceType } = target;
  const showFill = Boolean(isEditing && documentPdfSelection && !disabled);
  const showClear =
    Boolean(isEditing && !disabled) &&
    propertyHasSelection(mainDocument?.propertySelections, draftPropertySelections, {
      name: propertyName,
      id: propertyId,
    });

  const onFill = useCallback(async () => {
    if (!documentPdfSelection) return;

    if (!documentPdfSelection.selectionRectangles?.length) {
      notify(
        t('System', 'Could not detect the area for the selected text', null, false),
        'warning'
      );
    }

    upsertPropertySelection({ name: propertyName, id: propertyId }, documentPdfSelection);

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

    setDocumentPdfSelection(undefined);
    setPdfSelectionMenuOpen(false);
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

  return (
    <>
      {children(
        showFill ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              void onFill();
            }}
            className="absolute inset-y-0 right-2 z-1 my-auto h-fit border-0 bg-transparent p-0 text-carbon disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="click-to-fill"
          >
            <span className="inline-flex items-center gap-1 rounded-sm bg-paper px-0.5 py-px text-xs">
              <Translate>Click to fill</Translate>
              <ViewfinderCircleIcon className="size-3.5 shrink-0" aria-hidden />
            </span>
          </button>
        ) : null
      )}
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          className="w-fit border-0 bg-transparent p-0 text-left text-xs text-carbon hover:underline"
          data-testid="clear-pdf-selection"
        >
          <Translate translationKey="Clear PDF selection">Clear PDF selection</Translate>
        </button>
      ) : null}
    </>
  );
};

export { EntityPdfFill };
export type { PdfFillTarget, PdfFillCoerceType };
