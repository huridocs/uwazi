import React, { useCallback, useEffect, useRef, useState } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { TextCursorInputStrokeIcon } from '#V2/Components/CustomIcons/index.js';
import { useDocumentPdf } from '#V2/Routes/Entity/Components/context/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { propertyHasSelection } from '../functions/propertySelectionHelpers.js';
import { ListeningChip } from './ListeningChip.js';
import { usePdfFill } from './PdfFillContext.js';
import type { PdfFillPlacement, PdfFillTarget } from './pdfFillTypes.js';
import { resolveFillValue } from './resolvePdfFillValue.js';

type EntityPdfFillSlot = {
  overlay?: React.ReactNode;
  labelAccessory?: React.ReactNode;
  latched: boolean;
  onFocus: () => void;
  onClick: () => void;
};

type EntityPdfFillProps = {
  target: PdfFillTarget;
  label: string;
  disabled?: boolean;
  placement?: PdfFillPlacement;
  applyValue: (value: string | number) => void;
  children: (slot: EntityPdfFillSlot) => React.ReactNode;
};

const EntityPdfFill = ({
  target,
  label,
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
  const { armedPdfFill, pdfFillCommitNonce, armPdfFill, disarmPdfFill } = useDocumentPdf();
  const [isFilling, setIsFilling] = useState(false);
  const fillInFlight = useRef(false);
  const lastNonceOnArm = useRef(pdfFillCommitNonce);

  const { name: propertyName, propertyId, coerceType } = target;
  const armedRef = useRef(armedPdfFill);
  armedRef.current = armedPdfFill;
  const targetRef = useRef({ name: propertyName, propertyId });
  targetRef.current = { name: propertyName, propertyId };
  const isArmed = Boolean(
    armedPdfFill && armedPdfFill.name === propertyName && armedPdfFill.propertyId === propertyId
  );
  const showFill = Boolean(isEditing && documentPdfSelection && !disabled && !armedPdfFill);
  const showClear =
    Boolean(isEditing && !disabled) &&
    propertyHasSelection(savedPropertySelections, draftPropertySelections, {
      name: propertyName,
      id: propertyId,
    });

  const onArm = useCallback(() => {
    if (!isEditing || disabled) return;
    lastNonceOnArm.current = pdfFillCommitNonce;
    armPdfFill({ name: propertyName, propertyId, label });
  }, [armPdfFill, disabled, isEditing, label, pdfFillCommitNonce, propertyId, propertyName]);

  const onFill = useCallback(async () => {
    if (!documentPdfSelection || fillInFlight.current) return;

    if (!documentPdfSelection.selectionRectangles?.length) {
      notify(
        t('System', 'Could not detect the area for the selected text', null, false),
        'warning'
      );
      return;
    }

    const armedAtStart = armedRef.current;
    const startedArmedForThis =
      armedAtStart?.name === propertyName && armedAtStart.propertyId === propertyId;

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

      if (startedArmedForThis) {
        const armedNow = armedRef.current;
        if (armedNow?.name !== propertyName || armedNow.propertyId !== propertyId) {
          return;
        }
      }

      applyValue(filled.value);
      upsertPropertySelection({ name: propertyName, id: propertyId }, documentPdfSelection);
      setDocumentPdfSelection(undefined);
      setPdfSelectionMenuOpen(false);
      if (
        startedArmedForThis ||
        (armedRef.current?.name === propertyName && armedRef.current.propertyId === propertyId)
      ) {
        disarmPdfFill();
      }
    } catch {
      notify(t('System', 'Value cannot be transformed to the correct type', null, false), 'danger');
    } finally {
      fillInFlight.current = false;
      setIsFilling(false);
    }
  }, [
    applyValue,
    coerceType,
    disarmPdfFill,
    documentLanguage,
    documentPdfSelection,
    language,
    propertyId,
    propertyName,
    setDocumentPdfSelection,
    setPdfSelectionMenuOpen,
    upsertPropertySelection,
  ]);

  useEffect(() => {
    if (!isArmed || pdfFillCommitNonce === lastNonceOnArm.current) return;
    lastNonceOnArm.current = pdfFillCommitNonce;
    onFill().catch(() => undefined);
  }, [isArmed, onFill, pdfFillCommitNonce]);

  useEffect(
    () => () => {
      const armed = armedRef.current;
      const key = targetRef.current;
      if (armed?.name === key.name && armed.propertyId === key.propertyId) {
        disarmPdfFill();
      }
    },
    [disarmPdfFill]
  );

  const onClear = useCallback(() => {
    clearPropertySelection({ name: propertyName, id: propertyId });
  }, [clearPropertySelection, propertyId, propertyName]);

  const fillButton = showFill ? (
    <button
      type="button"
      disabled={Boolean(disabled || isFilling)}
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
        <TextCursorInputStrokeIcon className="size-3.5 shrink-0" aria-hidden />
      </span>
    </button>
  ) : null;

  const slot: EntityPdfFillSlot = {
    overlay: placement === 'beside' ? undefined : fillButton,
    labelAccessory: isArmed ? <ListeningChip label={label} onStop={disarmPdfFill} /> : undefined,
    latched: isArmed,
    onFocus: onArm,
    onClick: onArm,
  };

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
          <div className="min-w-0">{children(slot)}</div>
          {fillButton}
        </div>
        {clearButton}
      </>
    );
  }

  return (
    <>
      {children(slot)}
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
export type { EntityPdfFillSlot };
