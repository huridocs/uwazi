/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { createStore, Provider } from 'jotai';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { RelationshipField } from '../RelationshipField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
  I18NLinkV2: ({ children }: { children: React.ReactNode }) => <a href="/entity">{children}</a>,
}));

jest.mock('#V2/Components/Metadata/Components/RelationshipConnectionsTable.js', () => ({
  RelationshipConnectionsTable: () => <div data-testid="relationship-connections" />,
}));

type FormValues = { rels: MetadataValue[] };

const selected: MetadataValue[] = [{ value: 'e1', label: 'Ana', type: 'entity' }];

const Harness = ({ value, disabled }: { value: MetadataValue[]; disabled?: boolean }) => {
  const form = useForm<FormValues>({ defaultValues: { rels: value } });
  const store = createStore();
  store.set(relationshipTypesAtom, []);

  return (
    <Provider store={store}>
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
        <RelationshipField<FormValues> label="People" field="rels" disabled={disabled} />
        <output data-testid="form-value">{JSON.stringify(form.watch('rels'))}</output>
      </FormProvider>
    </Provider>
  );
};

describe('RelationshipField clear', () => {
  it('clears the selected entities', () => {
    render(<Harness value={selected} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByTestId('form-value')).toHaveTextContent('[]');
    expect(screen.getByTestId('relationship-connections')).toBeInTheDocument();
  });

  it('shows no clear control when there are no entities or the field is disabled', () => {
    const { unmount } = render(<Harness value={[]} />);

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    unmount();

    render(<Harness value={selected} disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });
});
