import type { ApiError } from '#shared/apiClient/index.js';
import type { EditEntityErrors } from './editEntityErrors.js';
import { applyValidation } from './editEntityErrors.js';
import type { FormMetadataProperty } from './formatMetadataForForm.js';

type ApplyEntitySaveApiErrorInput = {
  error: ApiError;
  setEditErrors: (errors: EditEntityErrors | undefined) => void;
  setSaveError: (message: string | undefined) => void;
  metadataProperties?: FormMetadataProperty[];
};

const isValidationDump = (message: string) =>
  message.trimStart().startsWith('[{') || message.includes('instancePath');

const handledGeneralSaveError = (error: ApiError): string => {
  const candidates = [error.message, error.title, error.detail].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );
  const safe = candidates.find(candidate => !isValidationDump(candidate));
  return safe ?? 'Validation failed';
};

const apiValidationsToSaveFeedback = (
  validations: ApiError['validations'],
  metadataProperties?: FormMetadataProperty[]
) => {
  const errors: EditEntityErrors = {};
  const metadata: Record<string, string> = {};
  const unmapped = (validations ?? []).reduce((missed, { instancePath, message }) => {
    if (!message) return missed;
    const mapped = applyValidation({ errors, metadata, instancePath, message, metadataProperties });
    return missed || !mapped;
  }, false);

  if (Object.keys(metadata).length > 0) errors.metadata = metadata;
  const fieldErrors = errors.title || errors.template || errors.metadata ? errors : undefined;
  return { fieldErrors, unmapped };
};

const applyEntitySaveApiError = ({
  error,
  setEditErrors,
  setSaveError,
  metadataProperties,
}: ApplyEntitySaveApiErrorInput) => {
  if (error.kind === 'cancelled') return;

  const { fieldErrors, unmapped } = apiValidationsToSaveFeedback(
    error.validations,
    metadataProperties
  );
  setEditErrors(fieldErrors);
  if (fieldErrors && !unmapped) return;

  setSaveError(handledGeneralSaveError(error));
};

const beginEntitySave = ({
  setSaveError,
  setEditErrors,
  clearErrors,
}: {
  setSaveError: ApplyEntitySaveApiErrorInput['setSaveError'];
  setEditErrors: ApplyEntitySaveApiErrorInput['setEditErrors'];
  clearErrors: () => void;
}) => {
  setSaveError(undefined);
  setEditErrors(undefined);
  clearErrors();
};

export { applyEntitySaveApiError, beginEntitySave };
export type { ApplyEntitySaveApiErrorInput };
