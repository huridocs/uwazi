/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { FormProvider, useForm } from 'react-hook-form';
import { userAtom } from '#V2/atoms/index.js';
import { SearchSelect } from '#V2/Components/Forms/index.js';
import type { ClientUserSchema } from '#app/apiResponseTypes.js';
import type { EditEntityFormValues } from '../../functions/buildEditEntityDefaultValues.js';
import { EMPTY_ICON } from '../IconField.js';
import { MultiselectField } from '../MultiselectField.js';
import { SelectField } from '../SelectField.js';
import { ThesaurusFieldLabel } from '../ThesaurusFieldLabel.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

const admin: ClientUserSchema = {
  _id: 'admin',
  role: 'admin',
  username: 'admin',
  email: 'admin@example.com',
};

const editor: ClientUserSchema = {
  _id: 'editor',
  role: 'editor',
  username: 'editor',
  email: 'editor@example.com',
};

const renderLabel = (role: ClientUserSchema, showAdd: boolean, showClear: boolean) => {
  const onAdd = jest.fn();
  const onClear = jest.fn();
  const store = createStore();
  store.set(userAtom, role);
  render(
    <Provider store={store}>
      <ThesaurusFieldLabel
        htmlFor="metadata.status"
        context="status"
        label="Estado"
        showAdd={showAdd}
        showClear={showClear}
        onAdd={onAdd}
        onClear={onClear}
      />
    </Provider>
  );
  return { onAdd, onClear };
};

const options = [{ label: 'Idle', searchLabel: 'Idle', value: 'idle' }];

const FieldHarness = ({
  kind,
  hideLabel,
}: {
  kind: 'select' | 'multiselect';
  hideLabel?: boolean;
}) => {
  const form = useForm<EditEntityFormValues>({
    defaultValues: {
      title: '',
      template: 't',
      showIcon: false,
      icon: EMPTY_ICON,
      metadata: {},
      translations: {},
      touchedTranslations: {},
    },
  });
  const field =
    kind === 'select' ? (
      <SelectField<EditEntityFormValues>
        context="status"
        label="Estado"
        field="metadata.status"
        options={options}
        hideLabel={hideLabel}
      />
    ) : (
      <MultiselectField<EditEntityFormValues>
        context="status"
        label="Estado"
        field="metadata.status"
        options={options}
        hideLabel={hideLabel}
      />
    );
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
      {field}
    </FormProvider>
  );
};

describe('ThesaurusFieldLabel', () => {
  it('shows Add value to an admin when adding is allowed', () => {
    const { onAdd } = renderLabel(admin, true, false);
    fireEvent.click(screen.getByRole('button', { name: 'Add value' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('hides Add value from non-admins and when the field cannot add', () => {
    renderLabel(editor, true, false);
    expect(screen.queryByRole('button', { name: 'Add value' })).not.toBeInTheDocument();
  });

  it('hides Add value when the field cannot add', () => {
    renderLabel(admin, false, false);
    expect(screen.queryByRole('button', { name: 'Add value' })).not.toBeInTheDocument();
  });

  it('shows Clear only when a single value is selected', () => {
    const { unmount } = render(
      <Provider store={createStore()}>
        <ThesaurusFieldLabel
          htmlFor="metadata.status"
          context="status"
          label="Estado"
          showAdd={false}
          showClear={false}
          onAdd={jest.fn()}
          onClear={jest.fn()}
        />
      </Provider>
    );
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    const { onClear } = renderLabel(admin, true, true);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe('SearchSelect clear control', () => {
  const option = { value: 'idle', searchLabel: 'Idle', label: 'Idle' };

  it('shows clear-field-button when hideClear is absent', () => {
    render(<SearchSelect id="status" label="Estado" options={[option]} value="idle" />);
    expect(screen.getByTestId('clear-field-button')).toBeInTheDocument();
  });

  it('hides the in-field clear when hideClear is set', () => {
    render(<SearchSelect id="status" label="Estado" options={[option]} value="idle" hideClear />);
    expect(screen.queryByTestId('clear-field-button')).not.toBeInTheDocument();
  });
});

describe('select field label hiding', () => {
  it('hides the SearchSelect label and omits the multiselect label', () => {
    const { unmount } = render(<FieldHarness kind="select" hideLabel />);
    expect(screen.getByText('Estado').closest('label')).toHaveClass('sr-only');
    unmount();

    render(<FieldHarness kind="multiselect" hideLabel />);
    expect(screen.queryByText('Estado')).not.toBeInTheDocument();
  });
});
