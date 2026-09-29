import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import type { Template } from '#app/apiResponseTypes.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { templatesAtom } from '#V2/atoms/index.js';
import type { EntitiesService } from '#V2/services/contracts/EntitiesService.js';
import { useServices } from '#V2/services/index.js';
import { buildMultipleUpdateBody } from './buildMultipleUpdateBody.js';
import { selectionEditFields, type SelectionEditFields } from './selectionEditFields.js';
import { useEditLanguages } from './useEditLanguages.js';

type MultiEditFormValues = {
  metadata: Record<string, unknown>;
  translations: Record<string, Record<string, unknown>>;
};

type MultiEditFormState = {
  templates: Template[];
  initial: SelectionEditFields;
  fields: SelectionEditFields;
  form: UseFormReturn<MultiEditFormValues>;
  onTemplateChange: (templateId: string) => void;
};

const useMultiEditForm = (templateIds: string[]): MultiEditFormState => {
  const templates = useAtomValue(templatesAtom);
  const initial = selectionEditFields(templates, templateIds);
  const [chosenTemplateId, setChosenTemplateId] = useState<string>();
  const fields = chosenTemplateId
    ? selectionEditFields(templates, templateIds, chosenTemplateId)
    : initial;
  const form = useForm<MultiEditFormValues>({
    defaultValues: { metadata: {}, translations: {} },
  });

  return {
    templates,
    initial,
    fields,
    form,
    onTemplateChange: (templateId: string) => setChosenTemplateId(templateId || undefined),
  };
};

type RunMultiEditSaveInput = {
  hits: LibrarySearchHit[];
  active: string;
  languageKeys: string[];
  edit: MultiEditFormState;
  values: MultiEditFormValues;
  multipleUpdate: EntitiesService['multipleUpdate'];
  revalidate: () => void;
  onSaved: () => void;
  setSaving: (saving: boolean) => void;
  setSaveError: (error?: string) => void;
};

const requestMultiEdit = async (input: RunMultiEditSaveInput) => {
  const body = buildMultipleUpdateBody({
    ids: input.hits.map(hit => hit.sharedId),
    activeLanguage: input.active,
    languages: input.languageKeys,
    properties: input.edit.fields.properties,
    metadata: input.values.metadata,
    translations: input.values.translations,
    templateId: input.edit.fields.templateId,
    initialTemplateId: input.edit.initial.templateId,
  });
  if (!body) return false;

  const [, error] = await input.multipleUpdate(body, { language: input.active });
  if (error) return error.detail || error.message;
  return true;
};

const runMultiEditSave = async (input: RunMultiEditSaveInput) => {
  input.setSaving(true);
  input.setSaveError(undefined);
  const saved = await requestMultiEdit(input);
  input.setSaving(false);
  if (saved === true) {
    input.revalidate();
    input.onSaved();
    return;
  }
  if (saved) input.setSaveError(saved);
  else input.onSaved();
};

const useLibraryMultiEdit = (hits: LibrarySearchHit[], onSaved: () => void) => {
  const { entities } = useServices();
  const revalidator = useRevalidator();
  const { active, languages } = useEditLanguages();
  const edit = useMultiEditForm(hits.map(hit => hit.template));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const onSave = edit.form.handleSubmit(values => {
    void runMultiEditSave({
      hits,
      active,
      languageKeys: languages.map(language => language.key),
      edit,
      values,
      multipleUpdate: entities.multipleUpdate.bind(entities),
      revalidate: () => {
        void revalidator.revalidate();
      },
      onSaved,
      setSaving,
      setSaveError,
    });
  });

  return { ...edit, languages, active, saving, saveError, onSave };
};

export type { MultiEditFormValues };
export { useLibraryMultiEdit };
