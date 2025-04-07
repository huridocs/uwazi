/* eslint-disable max-statements */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { templatesAtom } from 'V2/atoms';
import { useAtomValue } from 'jotai';
import { MultiselectListOption } from 'app/V2/Components/Forms';
import { AddExtractorSteps } from './steps';
import { formatTemplatesToOptions } from '../../../utils/formatters';
import { filterPXQualifiedTemplates } from '../../../utils/filterPXQualifiedTemplates';

interface CreateExtractorContextType {
  targetTemplateId: string;
  setTargetTemplateId: (id: string) => void;
  sourceTemplateId: string;
  setSourceTemplateId: (id: string) => void;
  paragraphPropertyId: string;
  setParagraphPropertyId: (id: string) => void;
  paragraphNumberPropertyId: string;
  setParagraphNumberPropertyId: (id: string) => void;
  targetRelationshipId: string;
  setTargetRelationshipId: (id: string) => void;
  sourceRelationshipId: string;
  setSourceRelationshipId: (id: string) => void;
  targetTemplateOptions: MultiselectListOption[];
  step: keyof typeof AddExtractorSteps;
  setStep: (step: number) => void;
  setShowModal: (showModal: boolean) => void;
}

export const CreateExtractorContext = createContext<CreateExtractorContextType | undefined>(
  undefined
);

export const CreateExtractorProvider: React.FC<{
  children: React.ReactNode;
  setShowModal: (showModal: boolean) => void;
}> = ({ children, setShowModal }) => {
  const templates = useAtomValue(templatesAtom);
  const [step, setStep] = useState<keyof typeof AddExtractorSteps>(1);

  const [targetTemplateId, setTargetTemplateId] = useState<string>('');
  const [sourceTemplateId, setSourceTemplateId] = useState<string>('');
  const [paragraphPropertyId, setParagraphPropertyId] = useState<string>('');
  const [paragraphNumberPropertyId, setParagraphNumberPropertyId] = useState<string>('');
  const [targetRelationshipId, setTargetRelationshipId] = useState<string>('');
  const [sourceRelationshipId, setSourceRelationshipId] = useState<string>('');

  const targetTemplateOptions = formatTemplatesToOptions(
    templates.filter(filterPXQualifiedTemplates)
  );

  const value = useMemo(
    () => ({
      targetTemplateId,
      setTargetTemplateId,
      sourceTemplateId,
      setSourceTemplateId,
      paragraphPropertyId,
      setParagraphPropertyId,
      paragraphNumberPropertyId,
      setParagraphNumberPropertyId,
      targetRelationshipId,
      setTargetRelationshipId,
      sourceRelationshipId,
      setSourceRelationshipId,
      targetTemplateOptions,
      step,
      setStep,
      setShowModal,
    }),
    [
      targetTemplateId,
      sourceTemplateId,
      paragraphPropertyId,
      paragraphNumberPropertyId,
      targetRelationshipId,
      sourceRelationshipId,
      targetTemplateOptions,
      step,
      setShowModal,
    ]
  );

  return (
    <CreateExtractorContext.Provider value={value}>{children}</CreateExtractorContext.Provider>
  );
};

export const useCreateExtractorContext = () => {
  const context = useContext(CreateExtractorContext);
  if (context === undefined) {
    throw new Error('useCreateExtractor must be used within an CreateExtractorContext');
  }
  return context;
};

export type CreateExtractorContextProps = {
  children: React.ReactNode;
};
