/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { EditEntityPropertyField } from '../EditEntityPropertyField.js';
import type { EditEntityFormValues } from '../functions/buildEditEntityDefaultValues.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18NLinkV2: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
}));

const property = {
  _id: 'rel',
  type: 'relationship' as const,
  name: 'inherited_tags',
  label: 'Tags',
  content: 'target-template',
  relationType: 'rel1',
  inherited: true,
  inherit: { property: 'tag-prop' },
};

const Harness = () => {
  const form = useForm<EditEntityFormValues>({
    defaultValues: {
      metadata: {
        inherited_tags: [
          {
            value: 'new-entity',
            label: 'New entity',
            inheritedValue: [{ value: 'tag-1', label: 'Live tag' }],
          },
        ],
      },
    },
  });

  return (
    <FormProvider
      watch={form.watch}
      getValues={form.getValues}
      getErrors={form.getErrors}
      getFieldState={form.getFieldState}
      setError={form.setError}
      clearErrors={form.clearErrors}
      setValue={form.setValue}
      setValues={form.setValues}
      trigger={form.trigger}
      formState={form.formState}
      resetField={form.resetField}
      reset={form.reset}
      resetDefaultValues={form.resetDefaultValues}
      handleSubmit={form.handleSubmit}
      unregister={form.unregister}
      control={form.control}
      register={form.register}
      setFocus={form.setFocus}
      subscribe={form.subscribe}
    >
      <EditEntityPropertyField
        property={property}
        disabled={false}
        activeTemplateId="template"
        thesauri={[]}
        templates={[
          {
            _id: 'target-template',
            properties: [{ _id: 'tag-prop', label: 'Tag' }],
          },
        ]}
        metadataProperties={[property]}
        entityMetadata={{
          inherited_tags: [
            {
              value: 'saved-entity',
              label: 'Saved entity',
              inheritedValue: [{ value: 'old', label: 'Saved tag' }],
            },
          ],
        }}
        entitySharedId="entity"
        entityAttachments={[]}
        pendingAttachments={[]}
        registerPendingAttachment={() => undefined}
        removePendingAttachmentIfUnused={() => undefined}
        relationshipLookup={async () => ({ options: [], total: 0 })}
        relationshipLookupSearch={async () => []}
      />
    </FormProvider>
  );
};

describe('EditEntityPropertyField inherited preview', () => {
  it('shows inherited values from the live form selection', () => {
    render(<Harness />);
    expect(screen.getByText('Live tag')).toBeInTheDocument();
    expect(screen.queryByText('Saved tag')).not.toBeInTheDocument();
  });
});
