/**
 * @jest-environment jsdom
 */
/* eslint-disable react/no-multi-comp -- form provider + probe */
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DEFAULT_DEBOUNCE_MS } from '../useDebouncedDraft.js';
import { useIdleFormValue } from '../useIdleFormValue.js';

const Probe = ({ onRender }: { onRender: () => void }) => {
  onRender();
  const value = useIdleFormValue('title');
  return <span>{value}</span>;
};

const Harness = ({ onRender }: { onRender: () => void }) => {
  const form = useForm({ defaultValues: { title: 'Hearing' } });
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...form}>
      <input
        aria-label="title"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...form.register('title')}
      />
      <Probe onRender={onRender} />
    </FormProvider>
  );
};

describe('useIdleFormValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not rerender while typing, then updates after idle', () => {
    const onRender = jest.fn();
    render(<Harness onRender={onRender} />);
    const rendersAfterMount = onRender.mock.calls.length;
    fireEvent.change(screen.getByLabelText('title'), { target: { value: 'Hearing edited' } });
    expect(onRender).toHaveBeenCalledTimes(rendersAfterMount);
    expect(screen.getByText('Hearing')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });
    expect(screen.getByText('Hearing edited')).toBeInTheDocument();
  });
});
