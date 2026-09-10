import { t } from '#app/I18N/index.js';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { notify } from '#V2/utils/notifyBridge.js';
import { resolveFillValue } from './resolvePdfFillValue.js';
import type { PdfFillCoerceType } from './pdfFillTypes.js';

type ArmedPdfFill = { name: string; propertyId?: string } | null;

type ApplyPdfFillSelectionInput = {
  selection: TextSelection;
  coerceType: PdfFillCoerceType;
  language: string;
  documentLanguage?: string;
  propertyName: string;
  propertyId?: string;
  applyValue: (value: string | number) => void;
  upsertPropertySelection: (
    property: { name: string; id?: string },
    selection: TextSelection
  ) => void;
  setDocumentPdfSelection: (selection: TextSelection | undefined) => void;
  setPdfSelectionMenuOpen: (open: boolean) => void;
  disarmPdfFill: () => void;
  getArmed: () => ArmedPdfFill;
};

const notifyFillTypeError = () => {
  notify(t('System', 'Value cannot be transformed to the correct type', null, false), 'danger');
};

const isArmedForProperty = (armed: ArmedPdfFill, propertyName: string, propertyId?: string) =>
  armed?.name === propertyName && armed.propertyId === propertyId;

const commitPdfFill = ({
  selection,
  propertyName,
  propertyId,
  applyValue,
  upsertPropertySelection,
  setDocumentPdfSelection,
  setPdfSelectionMenuOpen,
  disarmPdfFill,
  getArmed,
  startedArmedForThis,
  value,
}: ApplyPdfFillSelectionInput & { startedArmedForThis: boolean; value: string | number }) => {
  applyValue(value);
  upsertPropertySelection({ name: propertyName, id: propertyId }, selection);
  setDocumentPdfSelection(undefined);
  setPdfSelectionMenuOpen(false);
  if (startedArmedForThis || isArmedForProperty(getArmed(), propertyName, propertyId)) {
    disarmPdfFill();
  }
};

const fillAndCommit = async (input: ApplyPdfFillSelectionInput, startedArmedForThis: boolean) => {
  const filled = await resolveFillValue(
    input.coerceType,
    input.selection.text || '',
    input.language,
    input.documentLanguage
  );
  if (!filled.success) {
    notifyFillTypeError();
    return;
  }
  if (
    startedArmedForThis &&
    !isArmedForProperty(input.getArmed(), input.propertyName, input.propertyId)
  ) {
    return;
  }
  commitPdfFill({ ...input, startedArmedForThis, value: filled.value });
};

const applyPdfFillSelection = async (input: ApplyPdfFillSelectionInput) => {
  if (!input.selection.selectionRectangles?.length) {
    notify(t('System', 'Could not detect the area for the selected text', null, false), 'warning');
    return;
  }
  const startedArmedForThis = isArmedForProperty(
    input.getArmed(),
    input.propertyName,
    input.propertyId
  );
  try {
    await fillAndCommit(input, startedArmedForThis);
  } catch {
    notifyFillTypeError();
  }
};

export { applyPdfFillSelection };
export type { ApplyPdfFillSelectionInput };
