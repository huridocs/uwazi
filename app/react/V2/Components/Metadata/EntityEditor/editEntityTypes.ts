import type { UseFormReturn } from 'react-hook-form';
import type { Entity } from '#V2/api/entities/types.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import type { EditEntityFormValues } from './functions/buildEditEntityDefaultValues.js';
import type { EditEntityErrors } from './functions/editEntityErrors.js';
import type { EntityMediaUpload } from './hooks/useEntityMediaUpload.js';

type EditEntityProps = {
  formId: string;
  form: UseFormReturn<EditEntityFormValues>;
  mediaUpload: EntityMediaUpload;
  entity?: Entity;
  onSave?: (editedEntity: EntitySaveInput) => void | Promise<void>;
  disabled?: boolean;
  errors?: EditEntityErrors;
  onDirtyChange?: (isDirty: boolean) => void;
  onEditSource?: (entityId: string, label: string, templateId?: string) => void;
  relationshipLookup?: (params: {
    search: string;
    template?: string;
    limit?: number;
  }) => Promise<{ value: string; label: string }[]>;
};

export type { EditEntityProps };
