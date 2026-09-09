import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentPdf } from '#V2/Routes/Entity/Components/context/index.js';
import { propertyHasSelection } from '../functions/propertySelectionHelpers.js';
import { applyPdfFillSelection } from './applyPdfFillSelection.js';
import { usePdfFill } from './PdfFillContext.js';
import type { PdfFillTarget } from './pdfFillTypes.js';

type UsePdfFillFieldInput = {
  target: PdfFillTarget;
  label: string;
  disabled?: boolean;
  applyValue: (value: string | number) => void;
};

const useArmedTargetRefs = (
  armedPdfFill: ReturnType<typeof useDocumentPdf>['armedPdfFill'],
  target: PdfFillTarget
) => {
  const armedRef = useRef(armedPdfFill);
  armedRef.current = armedPdfFill;
  const targetRef = useRef({ name: target.name, propertyId: target.propertyId });
  targetRef.current = { name: target.name, propertyId: target.propertyId };
  return { armedRef, targetRef };
};

const usePdfFillApply = ({
  target,
  applyValue,
}: Pick<UsePdfFillFieldInput, 'target' | 'applyValue'>) => {
  const pdf = usePdfFill();
  const { armedPdfFill, disarmPdfFill } = useDocumentPdf();
  const [isFilling, setIsFilling] = useState(false);
  const fillInFlight = useRef(false);
  const armedRef = useRef(armedPdfFill);
  armedRef.current = armedPdfFill;

  const onFill = useCallback(async () => {
    if (!pdf.documentPdfSelection || fillInFlight.current) return;
    fillInFlight.current = true;
    setIsFilling(true);
    try {
      await applyPdfFillSelection({
        selection: pdf.documentPdfSelection,
        coerceType: target.coerceType,
        language: pdf.language,
        documentLanguage: pdf.documentLanguage,
        propertyName: target.name,
        propertyId: target.propertyId,
        applyValue,
        upsertPropertySelection: pdf.upsertPropertySelection,
        setDocumentPdfSelection: pdf.setDocumentPdfSelection,
        setPdfSelectionMenuOpen: pdf.setPdfSelectionMenuOpen,
        disarmPdfFill,
        getArmed: () => armedRef.current,
      });
    } finally {
      fillInFlight.current = false;
      setIsFilling(false);
    }
  }, [applyValue, disarmPdfFill, pdf, target.coerceType, target.name, target.propertyId]);

  return { pdf, isFilling, onFill, armedPdfFill, disarmPdfFill };
};

const usePdfFillArm = ({
  target,
  label,
  disabled,
  onFill,
}: UsePdfFillFieldInput & { onFill: () => Promise<void> }) => {
  const { hasMainDocument, isEditing } = usePdfFill();
  const { armedPdfFill, pdfFillCommitNonce, armPdfFill, disarmPdfFill } = useDocumentPdf();
  const lastNonceOnArm = useRef(pdfFillCommitNonce);
  const { armedRef, targetRef } = useArmedTargetRefs(armedPdfFill, target);
  const isArmed = Boolean(
    hasMainDocument &&
    armedPdfFill &&
    armedPdfFill.name === target.name &&
    armedPdfFill.propertyId === target.propertyId
  );

  const onArm = useCallback(() => {
    if (!hasMainDocument || !isEditing || disabled) return;
    lastNonceOnArm.current = pdfFillCommitNonce;
    armPdfFill({ name: target.name, propertyId: target.propertyId, label });
  }, [
    armPdfFill,
    disabled,
    hasMainDocument,
    isEditing,
    label,
    pdfFillCommitNonce,
    target.name,
    target.propertyId,
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
    [armedRef, disarmPdfFill, targetRef]
  );

  return { isArmed, onArm, disarmPdfFill, armedPdfFill, hasMainDocument, isEditing };
};

const usePdfFillField = ({ target, label, disabled, applyValue }: UsePdfFillFieldInput) => {
  const apply = usePdfFillApply({ target, applyValue });
  const arm = usePdfFillArm({ target, label, disabled, applyValue, onFill: apply.onFill });
  const showFill = Boolean(
    apply.pdf.hasMainDocument &&
    apply.pdf.isEditing &&
    apply.pdf.documentPdfSelection &&
    !disabled &&
    !arm.armedPdfFill
  );
  const showClear =
    apply.pdf.hasMainDocument &&
    Boolean(apply.pdf.isEditing && !disabled) &&
    propertyHasSelection(apply.pdf.savedPropertySelections, apply.pdf.draftPropertySelections, {
      name: target.name,
      id: target.propertyId,
    });

  return {
    ...apply,
    ...arm,
    showFill,
    showClear,
    onClear: () => apply.pdf.clearPropertySelection({ name: target.name, id: target.propertyId }),
  };
};

export { usePdfFillField };
