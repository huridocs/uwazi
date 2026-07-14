import React, { useMemo } from 'react';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { MultiselectListOption } from '#V2/Components/Forms/index.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { EntityFieldError, getFieldErrorState } from '../functions/fieldErrorState.js';
import { RelationshipFieldEditor } from './RelationshipFieldEditor.js';
import { EntityField } from './EntityField.js';

type RelationshipFieldProps<TFormValues extends FieldValues = FieldValues> = {
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  lookupSearch?: (search: string) => Promise<MultiselectListOption[]>;
  targetTemplateId?: string;
  relationTypeId?: string;
  inheritColumnLabels?: string[];
};

const RelationshipField = <TFormValues extends FieldValues = FieldValues>({
  label,
  field,
  registerOptions,
  disabled,
  lookupSearch,
  targetTemplateId,
  relationTypeId,
  inheritColumnLabels = [],
}: RelationshipFieldProps<TFormValues>) => {
  const { control, getFieldState, formState } = useFormContext<TFormValues>();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const fieldState = getFieldState(field, formState);
  const { showError, message } = getFieldErrorState(fieldState);

  const relationLabel = useMemo(
    () => relationshipTypes.find(type => type._id === relationTypeId)?.name,
    [relationTypeId, relationshipTypes]
  );

  const columns = inheritColumnLabels.map(columnLabel => ({ label: columnLabel }));

  return (
    <EntityField>
      <Controller
        control={control}
        name={field}
        rules={registerOptions}
        render={({ field: fieldController }) => (
          <>
            <RelationshipFieldEditor
              title={label}
              relationLabel={relationLabel}
              targetTemplateId={targetTemplateId}
              values={(fieldController.value as MetadataValue[] | undefined) ?? []}
              onChange={fieldController.onChange}
              columns={columns}
              lookupSearch={lookupSearch}
              disabled={disabled}
              searchId={String(field)}
            />
            <EntityFieldError showError={showError} message={message} />
          </>
        )}
      />
    </EntityField>
  );
};

export { RelationshipField };
