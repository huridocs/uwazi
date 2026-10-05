import React from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { thesauriAtom } from '#V2/atoms/index.js';
import { Select } from '#V2/Components/Forms/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { EntityTabFooter } from '#V2/Routes/Entity/Tabs/EntityTabFooter.js';
import { LibraryMultiEditProperty } from './LibraryMultiEditProperty.js';
import { useLibraryMultiEdit, type MultiEditFormValues } from './useLibraryMultiEdit.js';

const provideForm = (form: UseFormReturn<MultiEditFormValues>, children: React.ReactNode) => {
  const props = { ...form, children };
  return React.createElement(FormProvider<MultiEditFormValues>, props);
};

const FORM_ID = 'library-multi-edit-form';

type LibraryMultiEditProps = {
  hits: LibrarySearchHit[];
  onCancel: () => void;
  onSaved: () => void;
};

const LibraryMultiEdit = ({ hits, onCancel, onSaved }: LibraryMultiEditProps) => {
  const thesauri = useAtomValue(thesauriAtom);
  const edit = useLibraryMultiEdit(hits, onSaved);
  const context = edit.fields.templateId || 'System';
  const templateOptions = [
    ...(edit.fields.templateId
      ? []
      : [{ value: '', label: t('System', 'Select...', null, false) }]),
    ...edit.templates.map(template => ({ value: template._id, label: template.name })),
  ];

  return (
    <div
      data-testid="library-multi-edit"
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-paper"
    >
      <div className="flex shrink-0 items-center px-3 py-3">
        <h2 className="truncate text-sm font-semibold text-ink">
          <Translate>Edit</Translate>
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {provideForm(
          edit.form,
          <form id={FORM_ID} className="flex flex-col gap-4" onSubmit={edit.onSave}>
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-ink">
              <Translate>
                Warning: you are editing multiple entities. The value of each field will be applied
                to all of them.
              </Translate>
            </p>
            {edit.saveError ? (
              <p className="text-sm text-red-600" role="alert">
                {edit.saveError}
              </p>
            ) : null}
            <Select
              id="library-multi-edit-template"
              label={<Translate>Template</Translate>}
              options={templateOptions}
              value={edit.fields.templateId}
              disabled={edit.saving}
              onChange={event => edit.onTemplateChange(event.target.value)}
            />
            {edit.fields.properties.map(property => (
              <LibraryMultiEditProperty
                key={property._id || property.name}
                property={property}
                languages={edit.languages}
                activeLanguage={edit.active}
                context={context}
                disabled={edit.saving}
                thesauri={thesauri}
              />
            ))}
          </form>
        )}
      </div>
      <EntityTabFooter inset="side">
        <div className="flex w-full items-center justify-end gap-2">
          <Button type="button" variant="warm" onClick={onCancel} disabled={edit.saving}>
            <Translate>Cancel</Translate>
          </Button>
          <Button type="submit" variant="success" form={FORM_ID} disabled={edit.saving}>
            <Translate>Save</Translate>
          </Button>
        </div>
      </EntityTabFooter>
    </div>
  );
};

export type { LibraryMultiEditProps };
export { LibraryMultiEdit };
