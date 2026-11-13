import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import {
  Controller,
  FieldValues,
  Path,
  RegisterOptions,
  useFormContext,
  type UseFormGetValues,
  type UseFormSetValue,
} from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { Label } from '#V2/Components/Forms/Label.js';
import {
  EntityFieldError,
  getFieldErrorState,
  translationMessageSlot,
} from '../functions/fieldErrorState.js';
import type { EditEntityFormValues } from '../functions/buildEditEntityDefaultValues.js';
import { EntityField } from './EntityField.js';
import { EntityTranslationField } from './EntityTranslationField.js';

const clearTranslatedLink = (
  propertyName: string,
  getValues: UseFormGetValues<EditEntityFormValues>,
  setValue: UseFormSetValue<EditEntityFormValues>
) => {
  const translations = getValues('translations') ?? {};
  const touched = getValues('touchedTranslations') ?? {};
  const nextTranslations = { ...translations };
  const nextTouched = { ...touched };
  Object.entries(translations).forEach(([language, bucket]) => {
    nextTranslations[language] = {
      ...bucket,
      [propertyName]: [{ value: { label: '', url: '' } }],
    };
    nextTouched[language] = { ...(touched[language] ?? {}), [propertyName]: true };
  });
  setValue('translations', nextTranslations, { shouldDirty: true });
  setValue('touchedTranslations', nextTouched, { shouldDirty: true });
};

type LinkFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  translatableName?: string;
};

const LinkField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  registerOptions,
  disabled,
  translatableName,
}: LinkFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();
  const { getValues, setValue } = useFormContext<EditEntityFormValues>();
  const required = Boolean(registerOptions?.required);

  return (
    <EntityField>
      <Controller
        control={control}
        name={field}
        rules={{
          ...registerOptions,
          validate: value => {
            if (!required) {
              return true;
            }
            const url = value.url ? value.url.trim() : '';
            return url.length > 0 || 'Required';
          },
        }}
        render={({ field: fieldValue, fieldState }) => {
          const { label: linkLabel, url } = (fieldValue.value as {
            url: string;
            label?: string;
          }) || {
            label: '',
            url: '',
          };

          const { showError, message } = getFieldErrorState(fieldState);
          const linkSource = String(field);
          const hasLink = Boolean(linkLabel) || Boolean(url);

          return (
            <>
              <div className="flex items-start justify-between gap-2">
                <Label htmlFor={`${field}.url`} hasErrors={showError}>
                  <Translate context={context}>{label}</Translate>
                  {registerOptions?.required && '*'}
                </Label>
                {hasLink && !disabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      fieldValue.onChange({ label: '', url: '' });
                      if (translatableName)
                        clearTranslatedLink(translatableName, getValues, setValue);
                    }}
                    data-testid="clear-field-button"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:cursor-pointer focus:outline-hidden enabled:hover:text-ink-secondary disabled:opacity-50"
                  >
                    <XMarkIcon className="h-3.5 w-3.5 text-ink-muted" />
                    <Translate className="sr-only">Clear</Translate>
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="md:w-1/3">
                  <InputField
                    id={`${field}.label`}
                    label={<Translate>Label</Translate>}
                    type="text"
                    disabled={disabled}
                    name={`${fieldValue.name}.label`}
                    value={linkLabel}
                    hasErrors={showError}
                    onBlur={fieldValue.onBlur}
                    labelVariant="secondary"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      fieldValue.onChange({ ...fieldValue.value, label: event.target.value })
                    }
                  />
                </div>
                <div className="md:w-2/3">
                  <InputField
                    id={`${field}.url`}
                    label={<Translate>URL</Translate>}
                    type="url"
                    disabled={disabled}
                    name={`${fieldValue.name}.url`}
                    ref={fieldValue.ref}
                    value={url}
                    placeholder="https://"
                    hasErrors={showError}
                    onBlur={fieldValue.onBlur}
                    labelVariant="secondary"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      fieldValue.onChange({ ...fieldValue.value, url: event.target.value })
                    }
                  />
                </div>
              </div>
              {translatableName ? (
                <EntityTranslationField
                  propertyName={translatableName}
                  label={label}
                  idPrefix={`${linkSource}.label`}
                  linkPart="label"
                  linkSource={linkSource}
                  messageSlot={translationMessageSlot(showError, message)}
                  disabled={disabled}
                  paired={{ label: `${label} URL`, idPrefix: `${linkSource}.url` }}
                />
              ) : (
                <EntityFieldError showError={showError} message={message} />
              )}
            </>
          );
        }}
      />
    </EntityField>
  );
};

export { LinkField };
