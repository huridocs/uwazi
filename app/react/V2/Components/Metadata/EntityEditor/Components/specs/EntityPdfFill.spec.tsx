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
import { DateField } from '../DateField.js';
import type { EditEntityFormValues } from '../../functions/buildEditEntityDefaultValues.js';
import { PdfFillProvider, type PdfFillHost } from '../EntityPdfFill.js';

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

let mockDraft: PdfFillHost['draftPropertySelections'] = [];
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

const pdfFillHost = (): PdfFillHost => ({
  isEditing: true,
  language: 'en',
  savedPropertySelections: mockSaved,
  documentPdfSelection: mockSelection,
  draftPropertySelections: mockDraft,
  upsertPropertySelection,
  clearPropertySelection,
  setDocumentPdfSelection,
  setPdfSelectionMenuOpen,
});

const Host = ({ children }: { children: React.ReactNode }) => {
  const form = useForm<EditEntityFormValues>({
    defaultValues: {
      title: '',
      template: 'tpl-1',
      showIcon: false,
      icon: { _id: null, type: '', label: '' },
      metadata: {
        simple_text: [{ value: '' }],
        numeric_prop: [{ value: '' }],
        date_prop: [{ value: null }],
      },
    },
  });
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormProvider {...form}>
      <PdfFillProvider value={pdfFillHost()}>{children}</PdfFillProvider>
    </FormProvider>
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

  it('warns and skips fill when selection has no rectangles', async () => {
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
      expect(upsertPropertySelection).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox')).toHaveValue('');
    });
  });

  it('ignores a second click while coerce is in flight', async () => {
    let resolveCoerce: (value: { success: string; value: number }) => void = () => undefined;
    jest.mocked(entitiesAPI.coerceValue).mockImplementation(
      async () =>
        new Promise(resolve => {
          resolveCoerce = resolve;
        })
    );

    mockSelection = {
      text: '42',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };

    render(
      <Host>
        <TextField<EditEntityFormValues>
          context="tpl-1"
          label="Numeric"
          field="metadata.numeric_prop.0.value"
          type="number"
          pdfFill={{ name: 'numeric_prop', propertyId: 'num-1', coerceType: 'numeric' }}
        />
      </Host>
    );

    const fill = screen.getByTestId('click-to-fill');
    fireEvent.click(fill);
    fireEvent.click(fill);

    expect(entitiesAPI.coerceValue).toHaveBeenCalledTimes(1);

    resolveCoerce({ success: 'true', value: 42 });

    await waitFor(() => {
      expect(upsertPropertySelection).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('spinbutton')).toHaveValue(42);
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

  it('coerces numeric selection then upserts', async () => {
    mockSelection = {
      text: ' 42 ',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };
    jest.mocked(entitiesAPI.coerceValue).mockResolvedValue({ success: 'true', value: 42 });

    render(
      <Host>
        <TextField<EditEntityFormValues>
          context="tpl-1"
          label="Numeric"
          field="metadata.numeric_prop.0.value"
          type="number"
          pdfFill={{ name: 'numeric_prop', propertyId: 'num-1', coerceType: 'numeric' }}
        />
      </Host>
    );

    fireEvent.click(screen.getByTestId('click-to-fill'));

    await waitFor(() => {
      expect(entitiesAPI.coerceValue).toHaveBeenCalledWith('42', 'numeric', 'en');
      expect(upsertPropertySelection).toHaveBeenCalledWith(
        { name: 'numeric_prop', id: 'num-1' },
        mockSelection
      );
      expect(screen.getByRole('spinbutton')).toHaveValue(42);
    });
  });

  it('coerces date selection then upserts', async () => {
    mockSelection = {
      text: '2020-01-15',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };
    const epochSeconds = 1579046400;
    jest
      .mocked(entitiesAPI.coerceValue)
      .mockResolvedValue({ success: 'true', value: epochSeconds });

    render(
      <Host>
        <DateField<EditEntityFormValues>
          context="tpl-1"
          label="Date"
          field="metadata.date_prop.0.value"
          pdfFill={{ name: 'date_prop', propertyId: 'date-1', coerceType: 'date' }}
        />
      </Host>
    );

    fireEvent.click(screen.getByTestId('click-to-fill'));

    await waitFor(() => {
      expect(entitiesAPI.coerceValue).toHaveBeenCalledWith('2020-01-15', 'date', 'en');
      expect(upsertPropertySelection).toHaveBeenCalledWith(
        { name: 'date_prop', id: 'date-1' },
        mockSelection
      );
      expect(screen.getByLabelText(/Date/)).toHaveValue('2020-01-15');
    });
  });

  it('notifies danger and skips upsert when coerce fails', async () => {
    mockSelection = {
      text: 'not-a-number',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };
    jest.mocked(entitiesAPI.coerceValue).mockResolvedValue({
      success: '',
      value: 0,
    });

    render(
      <Host>
        <TextField<EditEntityFormValues>
          context="tpl-1"
          label="Numeric"
          field="metadata.numeric_prop.0.value"
          type="number"
          pdfFill={{ name: 'numeric_prop', propertyId: 'num-1', coerceType: 'numeric' }}
        />
      </Host>
    );

    fireEvent.click(screen.getByTestId('click-to-fill'));

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(
        'Value cannot be transformed to the correct type',
        'danger'
      );
      expect(upsertPropertySelection).not.toHaveBeenCalled();
      expect(setDocumentPdfSelection).not.toHaveBeenCalled();
    });
  });
});
