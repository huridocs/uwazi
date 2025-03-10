import React, { createContext, useContext, useMemo, useState } from 'react';
import { templatesAtom } from 'V2/atoms';
import { useAtomValue } from 'jotai';
import { MultiselectListOption } from 'app/V2/Components/Forms';
import { AddExtractorSteps } from './steps';
import { formatTemplatesToOptions } from '../../../utils/formatters';
import { filterPXQualifiedTemplates } from '../../../utils/filterPXQualifiedTemplates';

interface AddExtractorContextType {
  targetTemplateId: string;
  setTargetTemplateId: (id: string) => void;
  sourceTemplateId: string;
  setSourceTemplateId: (id: string) => void;
  richTextId: string;
  setRichTextId: (id: string) => void;
  numericId: string;
  setNumericId: (id: string) => void;
  relationshipId: string;
  setRelationshipId: (id: string) => void;
  targetTemplateOptions: MultiselectListOption[];
  step: keyof typeof AddExtractorSteps;
  setStep: (step: number) => void;
  setShowModal: (showModal: boolean) => void;
}

export const AddExtractorContext = createContext<AddExtractorContextType | undefined>(undefined);

export const AddExtractorProvider: React.FC<{
  children: React.ReactNode;
  setShowModal: (showModal: boolean) => void;
}> = ({ children, setShowModal }) => {
  const templates = useAtomValue(templatesAtom);
  const [step, setStep] = useState<keyof typeof AddExtractorSteps>(1);

  const [targetTemplateId, setTargetTemplateId] = useState<string>('');
  const [sourceTemplateId, setSourceTemplateId] = useState<string>('');
  const [richTextId, setRichTextId] = useState<string>('');
  const [numericId, setNumericId] = useState<string>('');
  const [relationshipId, setRelationshipId] = useState<string>('');

  const targetTemplateOptions = formatTemplatesToOptions(
    templates.filter(filterPXQualifiedTemplates)
  );

  const value = useMemo(
    () => ({
      targetTemplateId,
      setTargetTemplateId,
      sourceTemplateId,
      setSourceTemplateId,
      richTextId,
      setRichTextId,
      numericId,
      setNumericId,
      relationshipId,
      setRelationshipId,
      targetTemplateOptions,
      step,
      setStep,
      setShowModal,
    }),
    [
      targetTemplateId,
      sourceTemplateId,
      richTextId,
      numericId,
      relationshipId,
      targetTemplateOptions,
      step,
      setShowModal,
    ]
  );

  return <AddExtractorContext.Provider value={value}>{children}</AddExtractorContext.Provider>;
};

// Custom hook to use the context
export const useAddExtractorContext = () => {
  const context = useContext(AddExtractorContext);
  if (context === undefined) {
    throw new Error('useAddExtractor must be used within an AddExtractorProvider');
  }
  return context;
};

// Helper type for components that need the context
export type AddExtractorContextProps = {
  children: React.ReactNode;
};
