/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { FormProvider, useForm } from 'react-hook-form';
import type { ClientThesaurus, ClientUserSchema } from '#app/apiResponseTypes.js';
import type { ThesaurusInput } from '#shared/contracts/Thesaurus.js';
import { thesauriAtom, userAtom } from '#V2/atoms/index.js';
import { ServicesProvider } from '#V2/services/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import type { EditEntityFormValues } from '../../functions/buildEditEntityDefaultValues.js';
import type { DisplayProperty } from '../../functions/relationshipGrouping.js';
import { EMPTY_ICON } from '../IconField.js';
import { EditEntityPropertyField } from '../../EditEntityPropertyField.js';

const mockUpsert = jest.fn();

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/atoms/requestStatusAtom.js', () => ({
  useRequestStatus: () => ({ notify: jest.fn() }),
}));

const admin: ClientUserSchema = {
  _id: 'admin',
  role: 'admin',
  username: 'admin',
  email: 'admin@example.com',
};

const thesaurus: ClientThesaurus = {
  _id: 'status',
  name: 'Estado',
  values: [
    { id: 'group', label: 'Group', values: [{ id: 'child', label: 'Child' }] },
    { id: 'idle', label: 'Idle' },
  ],
};

const selectProperty: DisplayProperty = {
  _id: 'status-field',
  type: 'select',
  name: 'status',
  label: 'Estado',
  content: 'status',
};

const multiProperty: DisplayProperty = {
  ...selectProperty,
  _id: 'topics-field',
  type: 'multiselect',
  name: 'topics',
  label: 'Topics',
};

const EditForm = ({
  metadata,
  children,
}: {
  metadata: EditEntityFormValues['metadata'];
  children: React.ReactNode;
}) => {
  const form = useForm<EditEntityFormValues>({
    defaultValues: {
      title: '',
      template: 'template',
      showIcon: false,
      icon: EMPTY_ICON,
      metadata,
      translations: {},
      touchedTranslations: {},
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
      {children}
      <pre data-testid="metadata">{JSON.stringify(form.watch('metadata'))}</pre>
    </FormProvider>
  );
};

const renderField = (
  property: DisplayProperty,
  values: EditEntityFormValues['metadata'],
  disabled = false
) => {
  const store = createStore();
  store.set(userAtom, admin);
  store.set(thesauriAtom, [thesaurus]);
  render(
    <ServicesProvider value={createTestServices({ thesauri: { upsert: mockUpsert } })}>
      <Provider store={store}>
        <EditForm metadata={values}>
          <EditEntityPropertyField
            property={property}
            disabled={disabled}
            activeTemplateId="template"
            thesauri={[thesaurus]}
            templates={[]}
            metadataProperties={[]}
            entitySharedId="entity"
            entityAttachments={[]}
            pendingAttachments={[]}
            registerPendingAttachment={() => undefined}
            removePendingAttachmentIfUnused={() => undefined}
            relationshipLookup={async () => []}
            relationshipLookupSearch={async () => []}
          />
        </EditForm>
      </Provider>
    </ServicesProvider>
  );
};

const metadata = () => JSON.parse(screen.getByTestId('metadata').textContent ?? '{}');

const saveFresh = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add value' }));
  fireEvent.change(screen.getByRole('textbox', { name: /New value in Estado/ }), {
    target: { value: 'Fresh' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
};

describe('thesaurus fields', () => {
  beforeEach(() => {
    mockUpsert.mockReset();
    mockUpsert.mockImplementation(async (input: ThesaurusInput) => [
      {
        _id: input._id,
        name: input.name,
        values: input.values.map(value => ({
          id: value.id ?? 'server-new',
          label: value.label,
          values: value.values,
        })),
      },
    ]);
  });

  it('clears a select without the in-field X', async () => {
    renderField(selectProperty, { status: [{ value: 'idle', label: 'Idle' }] });
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.queryByTestId('clear-field-button')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => expect(metadata().status).toEqual([]));
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('adds a select value and badges it New', async () => {
    renderField(selectProperty, {});
    expect(screen.getByRole('button', { name: 'Add value' })).toBeInTheDocument();
    await saveFresh();
    await waitFor(() =>
      expect(metadata().status).toEqual([{ value: 'server-new', label: 'Fresh' }])
    );
    expect(screen.getByText('New')).toHaveClass('bg-carbon-tint', 'text-carbon');
    expect(screen.queryByTestId('clear-field-button')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('appends a multiselect value and does not show Clear', async () => {
    renderField(multiProperty, { topics: [{ value: 'idle', label: 'Idle' }] });

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    await saveFresh();
    await waitFor(() =>
      expect(metadata().topics).toEqual([
        { value: 'idle', label: 'Idle' },
        { value: 'server-new', label: 'Fresh' },
      ])
    );
    expect(await screen.findByText('New')).toHaveClass('bg-carbon-tint', 'text-carbon');
  });

  it('does not show Add value on a select without a thesaurus', () => {
    renderField({ ...selectProperty, content: undefined, name: 'plain', label: 'Plain' }, {});
    expect(screen.queryByRole('button', { name: 'Add value' })).not.toBeInTheDocument();
  });

  it('hides Clear on a disabled select', () => {
    renderField(selectProperty, { status: [{ value: 'idle', label: 'Idle' }] }, true);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('clear-field-button')).not.toBeInTheDocument();
  });
});
