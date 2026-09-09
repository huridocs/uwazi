import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { TextCursorInputStrokeIcon } from '#V2/Components/CustomIcons/index.js';
import { ListeningChip } from './ListeningChip.js';
import { usePdfFillField } from './usePdfFillField.js';
import type { PdfFillPlacement, PdfFillTarget } from './pdfFillTypes.js';

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
  const { isArmed, isFilling, showFill, showClear, onArm, onFill, onClear, disarmPdfFill } =
    usePdfFillField({ target, label, disabled, applyValue });

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
export type { EntityPdfFillSlot };
export { PdfFillProvider, usePdfFill, defaultPdfFillHost } from './PdfFillContext.js';
export type {
  PdfFillTarget,
  PdfFillCoerceType,
  PdfFillHost,
  PdfFillPlacement,
} from './pdfFillTypes.js';
