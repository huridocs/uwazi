/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityLanguageBar } from '../EntityLanguageBar';

const mockSetLanguage = jest.fn(() => Promise.resolve());
const mockCancelEdit = jest.fn();

jest.mock('#V2/Routes/Entity/Components/context/EntityLanguageContext.js', () => ({
  useEntityLanguage: () => ({
    language: 'en',
    languages: [
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Spanish' },
    ],
    isLoading: false,
    setLanguage: mockSetLanguage,
  }),
}));

jest.mock('#V2/Routes/Entity/Components/context/MetadataEditingContext.js', () => ({
  useMetadataEditing: () => ({
    isEditing: false,
    isDirty: false,
    isSaving: false,
    cancelEdit: mockCancelEdit,
  }),
}));

describe('EntityLanguageBar', () => {
  beforeEach(() => {
    mockSetLanguage.mockClear();
    mockCancelEdit.mockClear();
  });

  it('always renders the compact language dropdown, not desktop pills', async () => {
    const user = userEvent.setup();
    render(<EntityLanguageBar />);

    const trigger = screen.getByRole('button', { name: 'Language' });
    expect(trigger).toHaveTextContent('EN');
    expect(trigger).toHaveClass(
      'inline-flex',
      'items-center',
      'gap-1.5',
      'h-8',
      'rounded-md',
      'bg-warm',
      'ps-2.5',
      'pe-2',
      'text-xs',
      'hover:bg-parchment',
      'hover:text-ink'
    );
    expect(trigger).not.toHaveClass('px-3');
    expect(trigger).not.toHaveClass('py-1.5');
    expect(trigger).not.toHaveClass('gap-1');
    expect(trigger.querySelector('svg')).toHaveClass('size-3.5');
    expect(screen.queryByRole('group', { name: 'Language selection' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Language: ES' })).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole('listbox', { name: 'Language selection' })).toBeInTheDocument();

    const active = screen.getByRole('option', { name: 'EN' });
    const inactive = screen.getByRole('option', { name: 'ES' });
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(active).toHaveClass('bg-warm', 'text-ink');
    expect(active).not.toHaveClass('bg-vellum');
    expect(inactive).toHaveClass('text-ink-secondary', 'hover:bg-parchment');

    await user.click(inactive);
    expect(mockSetLanguage).toHaveBeenCalledWith('es');
  });
});
