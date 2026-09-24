/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, settingsAtom, translationsAtom, userAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibraryResultsFooter } from '../LibraryResultsFooter.js';

const adminUser = { _id: 'admin1', role: 'admin', username: 'admin', email: 'admin@uwazi.io' };

const renderFooter = (
  props: { onCreateEntity?: () => void; onUploadPdf?: () => void } = {},
  options: {
    user?: typeof adminUser | Record<string, never>;
    featureFlagLibraryV2?: boolean;
  } = {}
) => {
  const { user = adminUser, featureFlagLibraryV2 = false } = options;
  return render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [translationsAtom, translations],
          [userAtom, user],
          [settingsAtom, { features: { featureFlagLibraryV2 } }],
        ]}
      >
        <LibraryResultsFooter
          onCreateEntity={props.onCreateEntity}
          onUploadPdf={props.onUploadPdf}
        />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );
};

const pdfFileInput = () => {
  const input = document.querySelector('input[type="file"]');
  expect(input).toBeInstanceOf(HTMLInputElement);
  return input as HTMLInputElement;
};

const expectPickerOpens = (input: HTMLInputElement, onUploadPdf: jest.Mock) => {
  expect(input).toHaveAttribute('accept', 'application/pdf,.pdf');
  expect(input).toHaveAttribute('multiple');
  const openPicker = jest.spyOn(input, 'click');
  fireEvent.click(screen.getByRole('button', { name: 'Upload PDF' }));
  expect(openPicker).toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(onUploadPdf).not.toHaveBeenCalled();
};

const expectChosenPdf = (input: HTMLInputElement, onUploadPdf: jest.Mock) => {
  const pdf = new File(['%PDF'], 'judgment.pdf', { type: 'application/pdf' });
  fireEvent.change(input, { target: { files: [pdf] } });
  expect(onUploadPdf).toHaveBeenCalledWith([pdf]);
};

const expectNativePdfPicker = (onUploadPdf: jest.Mock) => {
  const input = pdfFileInput();
  expectPickerOpens(input, onUploadPdf);
  expectChosenPdf(input, onUploadPdf);
};

describe('LibraryResultsFooter', () => {
  it('renders the library action bar when featureFlagLibraryV2 is off', () => {
    renderFooter({}, { featureFlagLibraryV2: false });
    expect(screen.getByTestId('library-results-footer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload PDF' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Import CSV' })).toHaveAttribute(
      'href',
      '/en/settings/csv'
    );
    expect(screen.getByRole('button', { name: 'Export CSV' }).querySelector('svg')).toBeTruthy();
    expect(screen.queryByTestId('library-single-select-actions')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change template' })).not.toBeInTheDocument();
  });

  it('hides editor actions for anonymous users even when the V2 flag is on', () => {
    renderFooter({}, { user: {}, featureFlagLibraryV2: true });
    expect(screen.getByTestId('library-results-footer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create entity' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload PDF' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Import CSV' })).not.toBeInTheDocument();
  });

  it('opens create and the native PDF file picker', () => {
    const onCreateEntity = jest.fn();
    const onUploadPdf = jest.fn();
    renderFooter({ onCreateEntity, onUploadPdf }, { featureFlagLibraryV2: false });
    fireEvent.click(screen.getByRole('button', { name: 'Create entity' }));
    expect(onCreateEntity).toHaveBeenCalledTimes(1);
    expectNativePdfPicker(onUploadPdf);
  });
});
