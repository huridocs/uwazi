import { useCallback, useRef, useState } from 'react';
import type { Entity } from '#V2/api/entities/types.js';
import { useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import {
  buildEditEntityDefaultValues,
  useEntityMediaUpload,
  type EditEntityErrors,
  type EditEntityFormValues,
} from '#V2/Components/Metadata/EntityEditor/index.js';
import { useEntityContext } from '../EntityContext.js';

const useEditSource = (entity: Entity, templateId: Parameters<typeof useEntityMediaUpload>[1]) => {
  const [editBase, setEditBase] = useState<Entity>();
  const mediaUpload = useEntityMediaUpload(editBase ?? entity, templateId);
  return { editBase, setEditBase, mediaUpload };
};

const useMetadataEditingForm = () => {
  const { entity } = useEntityContext();
  const templates = useAtomValue(templatesAtom);
  const [saveError, setSaveError] = useState<string>();
  const [editErrors, setEditErrors] = useState<EditEntityErrors>();
  const formCancelRef = useRef<(() => void) | null>(null);
  const form = useForm<EditEntityFormValues>({
    defaultValues: buildEditEntityDefaultValues(entity, templates),
  });
  void form.formState.isDirty;
  const { editBase, setEditBase, mediaUpload } = useEditSource(entity, form.watch('template'));

  const registerCancelEdit = useCallback((handler: () => void) => {
    formCancelRef.current = handler;
    return () => {
      if (formCancelRef.current === handler) formCancelRef.current = null;
    };
  }, []);

  return {
    entity,
    templates,
    form,
    editBase,
    setEditBase,
    mediaUpload,
    saveError,
    setSaveError,
    editErrors,
    setEditErrors,
    formCancelRef,
    registerCancelEdit,
  };
};

export { useMetadataEditingForm };
