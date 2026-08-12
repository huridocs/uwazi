import type { UseFormReturn } from 'react-hook-form';
import type { Entity } from '#V2/api/entities/types.js';
import type { FileType } from '#shared/types/fileType.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import type { EditEntityFormValues } from './functions/buildEditEntityDefaultValues.js';
import type { EditEntityErrors } from './functions/editEntityErrors.js';
import type { EntityMediaUpload } from './hooks/useEntityMediaUpload.js';
import type { PdfFillHost } from './Components/EntityPdfFill.js';

type DocumentFieldMutations = {
  renameDocument: (document: FileType, originalname: string) => Promise<void>;
  removeDocument: (_id: string) => Promise<void>;
};

type EditEntityProps = {
  formId: string;
  form: UseFormReturn<EditEntityFormValues>;
  mediaUpload: EntityMediaUpload;
  documentMutations?: DocumentFieldMutations;
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
  pdfFill?: PdfFillHost;
  mainDocumentId?: string;
};

export type { EditEntityProps, DocumentFieldMutations };
