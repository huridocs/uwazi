/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import * as entitiesAPI from '#V2/api/entities/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import { TitleField } from '../TitleField.js';
import { TextField } from '../TextField.js';
import type { EditEntityFormValues } from '../../functions/buildEditEntityDefaultValues.js';

const upsertPropertySelection = jest.fn();
const clearPropertySelection = jest.fn();
const setDocumentPdfSelection = jest.fn();
const setPdfSelectionMenuOpen = jest.fn();

let mockSelection:
  | {
      text: string;
      selectionRectangles: {
        top: number;
        left: number;
        width: number;
        height: number;
        regionId: string;
      }[];
    }
  | undefined = {
  text: 'selected from pdf',
  selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
};

let mockDraft: unknown[] = [];
const mockSaved = [
  {
    name: 'simple_text',
    propertyID: 'prop-1',
    selection: {
      text: 'saved text',
      selectionRectangles: [{ top: 1, left: 1, width: 2, height: 2, page: '1' }],
    },
  },
];

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/utils/notifyBridge.js', () => ({
  notify: jest.fn(),
}));

jest.mock('#V2/api/entities/index.js', () => ({
  coerceValue: jest.fn(),
}));

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  useMetadataEditing: () => ({ isEditing: true }),
  useEntityLanguage: () => ({
    language: 'en',
    mainDocument: { _id: 'file-1', propertySelections: mockSaved },
  }),
  useDocumentPdf: () => ({
    documentPdfSelection: mockSelection,
    draftPropertySelections: mockDraft,
    upsertPropertySelection,
    clearPropertySelection,
    setDocumentPdfSelection,
    setPdfSelectionMenuOpen,
  }),
}));

const Host = ({ children }: { children: React.ReactNode }) => {
  const form = useForm<EditEntityFormValues>({
    defaultValues: {
      title: '',
      template: 'tpl-1',
      showIcon: false,
      icon: { _id: null, type: '', label: '' },
      metadata: { simple_text: [{ value: '' }] },
    },
  });
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...form}>{children}</FormProvider>
  );
};

describe('Entity PDF Click to fill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDraft = [];
    mockSelection = {
      text: 'selected from pdf',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };
    jest.mocked(entitiesAPI.coerceValue).mockResolvedValue({ success: 'true', value: 42 });
  });

  it('renders Click to fill and fills title on click', async () => {
    render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
      </Host>
    );

    const fill = screen.getByTestId('click-to-fill');
    expect(fill).toBeInTheDocument();
    expect(screen.getByText('Click to fill')).toBeInTheDocument();
    expect(fill.tagName).toBe('BUTTON');

    fireEvent.click(fill);

    await waitFor(() => {
      expect(upsertPropertySelection).toHaveBeenCalled();
      expect(screen.getByRole('textbox')).toHaveValue('selected from pdf');
      expect(setDocumentPdfSelection).toHaveBeenCalledWith(undefined);
      expect(setPdfSelectionMenuOpen).toHaveBeenCalledWith(false);
    });
  });

  it('renders Clear PDF selection sibling when a saved selection exists', () => {
    render(
      <Host>
        <TextField<EditEntityFormValues>
          context="tpl-1"
          label="Text"
          field="metadata.simple_text.0.value"
          type="text"
          pdfFill={{ name: 'simple_text', propertyId: 'prop-1', coerceType: 'text' }}
        />
      </Host>
    );

    const clear = screen.getByTestId('clear-pdf-selection');
    expect(clear).toBeInTheDocument();
    expect(clear.tagName).toBe('BUTTON');
    expect(screen.getByText('Clear PDF selection')).toBeInTheDocument();
    expect(clear.closest('[data-testid="click-to-fill"]')).toBeNull();

    fireEvent.click(clear);
    expect(clearPropertySelection).toHaveBeenCalledWith({
      name: 'simple_text',
      id: 'prop-1',
    });
  });

  it('warns when selection has no rectangles', async () => {
    mockSelection = { text: 'no boxes', selectionRectangles: [] };

    render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
      </Host>
    );

    fireEvent.click(screen.getByTestId('click-to-fill'));

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(
        'Could not detect the area for the selected text',
        'warning'
      );
    });
  });

  it('does not nest role=button wrappers around the fill button', () => {
    const { container } = render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
      </Host>
    );

    const fill = screen.getByTestId('click-to-fill');
    expect(fill.parentElement?.getAttribute('role')).not.toBe('button');
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
  });
});
