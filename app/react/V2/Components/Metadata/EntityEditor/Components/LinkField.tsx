import React from 'react';
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
import { isAcceptableLinkUrl } from '#shared/urlValidationUtils.js';
import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { Label } from '#V2/Components/Forms/Label.js';
import {
  EntityFieldError,
  getFieldErrorState,
  translationMessageSlot,
} from '../functions/fieldErrorState.js';
import type { EditEntityFormValues } from '../functions/buildEditEntityDefaultValues.js';
import { EntityField } from './EntityField.js';
import { FieldClearButton } from './FieldClearButton.js';
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

const urlFromEntry = (entry: MetadataObjectSchema) => {
  const raw = entry.value;
  if (!raw || typeof raw !== 'object' || !('url' in raw)) return '';
  return typeof raw.url === 'string' ? raw.url : '';
};

const mainLinkMessage = (value: string, isRequired: boolean) => {
  const url = value.trim();
  if (!url) return isRequired ? 'Required' : undefined;
  return isAcceptableLinkUrl(url) ? undefined : 'Invalid URL';
};

const translationUrlInvalid = (
  propertyName: string | undefined,
  getValues: UseFormGetValues<EditEntityFormValues>
) => {
  if (!propertyName) return false;
  const translations = getValues('translations') ?? {};
  return Object.values(translations).some(bucket =>
    (bucket[propertyName] ?? []).some(entry => !isAcceptableLinkUrl(urlFromEntry(entry)))
  );
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
            const message = mainLinkMessage(value?.url ?? '', required);
            if (message) return message;
            return translationUrlInvalid(translatableName, getValues) ? 'Invalid URL' : true;
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
          const translationServerError =
            fieldState.error?.type === 'server' &&
            fieldState.error.message === 'Invalid URL' &&
            translationUrlInvalid(translatableName, getValues);
          const showMainError =
            showError &&
            (Boolean(mainLinkMessage(url, required)) ||
              (fieldState.error?.type === 'server' && !translationServerError));
          const linkSource = String(field);
          const hasLink = Boolean(linkLabel) || Boolean(url);
          const commitUrl = (next: string) =>
            fieldValue.onChange({ label: linkLabel, url: next.trim() });

          return (
            <>
              <div className="flex items-start justify-between gap-2">
                <Label htmlFor={`${field}.url`} hasErrors={showMainError}>
                  <Translate context={context}>{label}</Translate>
                  {registerOptions?.required && '*'}
                </Label>
                {hasLink && !disabled ? (
                  <FieldClearButton
                    onClick={() => {
                      fieldValue.onChange({ label: '', url: '' });
                      if (translatableName)
                        clearTranslatedLink(translatableName, getValues, setValue);
                    }}
                  />
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
                    hasErrors={showMainError}
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
                    type="text"
                    disabled={disabled}
                    name={`${fieldValue.name}.url`}
                    ref={fieldValue.ref}
                    value={url}
                    placeholder="https://"
                    hasErrors={showMainError}
                    onBlur={() => {
                      if (url.trim() !== url) commitUrl(url);
                      fieldValue.onBlur();
                    }}
                    labelVariant="secondary"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      commitUrl(event.target.value)
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
                  messageSlot={translationMessageSlot(showMainError, message)}
                  disabled={disabled}
                  paired={{ label: `${label} URL`, idPrefix: `${linkSource}.url` }}
                />
              ) : (
                <EntityFieldError showError={showMainError} message={message} />
              )}
            </>
          );
        }}
      />
    </EntityField>
  );
};

export { LinkField };
