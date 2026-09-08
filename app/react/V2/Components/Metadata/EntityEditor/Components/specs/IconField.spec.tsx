/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { EMPTY_ICON, IconField, type EntityIcon } from '../IconField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('#V2/Components/Forms/index.js', () => ({
  SearchSelect: ({
    id,
    value,
    disabled,
    placeholder,
    onChange,
  }: {
    id?: string;
    value?: string;
    disabled?: boolean;
    placeholder?: string;
    onChange?: (value: string) => void;
  }) => (
    <input
      id={id}
      aria-label={placeholder}
      value={value}
      disabled={disabled}
      onChange={event => onChange?.(event.currentTarget.value)}
    />
  ),
}));

type FormValues = {
  showIcon: boolean;
  icon: EntityIcon;
};

const Harness = ({
  defaultValues,
  disabled,
}: {
  defaultValues: FormValues;
  disabled?: boolean;
}) => {
  const form = useForm<FormValues>({ defaultValues });
  const { isDirty } = form.formState;

  return (
    <FormProvider {...form}>
      <IconField disabled={disabled} />
      <output data-testid="show-icon">{String(form.watch('showIcon'))}</output>
      <output data-testid="icon-id">{form.watch('icon')._id ?? ''}</output>
      <output data-testid="dirty">{String(isDirty)}</output>
    </FormProvider>
  );
};

const emptyValues: FormValues = { showIcon: false, icon: EMPTY_ICON };

const iconValues: FormValues = {
  showIcon: true,
  icon: { _id: 'star', type: 'Icons', label: 'star' },
};

describe('IconField', () => {
  it('shows only Add icon when empty', () => {
    render(<Harness defaultValues={emptyValues} />);

    expect(screen.getByRole('button', { name: 'Add icon' })).toHaveAttribute(
      'aria-controls',
      'entity-icon'
    );
    expect(screen.getByRole('button', { name: 'Add icon' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByRole('textbox', { name: 'Select icon...' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove icon' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add icon' })).toHaveClass('bg-warm', 'text-meta');
  });

  it('shows picker and Remove icon when the entity has an icon', () => {
    render(<Harness defaultValues={iconValues} />);

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Select icon...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove icon' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Remove icon' })).toHaveClass('bg-warm', 'text-meta');
    expect(screen.queryByRole('button', { name: 'Add icon' })).not.toBeInTheDocument();
  });

  it('opens the picker on Add icon and collapses on Remove icon', () => {
    render(<Harness defaultValues={emptyValues} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add icon' }));

    expect(screen.getByTestId('show-icon')).toHaveTextContent('true');
    expect(screen.getByRole('textbox', { name: 'Select icon...' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Remove icon' }));

    expect(screen.getByTestId('show-icon')).toHaveTextContent('false');
    expect(screen.getByTestId('icon-id')).toHaveTextContent('');
    expect(screen.queryByRole('textbox', { name: 'Select icon...' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add icon' })).toBeInTheDocument();
  });

  it('marks the form dirty after Remove of an existing icon', () => {
    render(<Harness defaultValues={iconValues} />);

    expect(screen.getByTestId('dirty')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'Remove icon' }));

    expect(screen.getByTestId('show-icon')).toHaveTextContent('false');
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
  });

  it('disables Add icon and Remove icon when the form is disabled', () => {
    const { unmount } = render(<Harness defaultValues={emptyValues} disabled />);

    expect(screen.getByRole('button', { name: 'Add icon' })).toBeDisabled();
    unmount();

    render(<Harness defaultValues={iconValues} disabled />);

    expect(screen.getByRole('button', { name: 'Remove icon' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Select icon...' })).toBeDisabled();
  });
});
