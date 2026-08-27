/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import * as entitiesAPI from '#V2/api/entities/index.js';
import { DocumentInteractionProvider } from '#V2/Routes/Entity/Components/context/DocumentInteractionContext.js';
import { useDocumentPdf } from '#V2/Routes/Entity/Components/context/index.js';
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

jest.mock('#V2/Routes/Entity/Components/context/MetadataEditingContext.js', () => ({
  useMetadataEditing: () => ({ isEditing: true }),
}));

const pdfFillHost = (overrides: Partial<PdfFillHost> = {}): PdfFillHost => ({
  isEditing: true,
  language: 'en',
  savedPropertySelections: mockSaved,
  documentPdfSelection: mockSelection,
  draftPropertySelections: mockDraft,
  upsertPropertySelection,
  clearPropertySelection,
  setDocumentPdfSelection,
  setPdfSelectionMenuOpen,
  ...overrides,
});

const CommitHarness = () => {
  const { requestPdfFillCommit } = useDocumentPdf();
  return (
    <button type="button" data-testid="commit-pdf-fill" onClick={requestPdfFillCommit}>
      commit-pdf-fill
    </button>
  );
};

const Host = ({
  children,
  pdfFillOverrides,
}: {
  children: React.ReactNode;
  pdfFillOverrides?: Partial<PdfFillHost>;
}) => {
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
    <DocumentInteractionProvider>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <FormProvider {...form}>
        <PdfFillProvider value={pdfFillHost(pdfFillOverrides)}>
          <CommitHarness />
          {children}
        </PdfFillProvider>
      </FormProvider>
    </DocumentInteractionProvider>
  );
};

const arm = (control: HTMLElement) => {
  fireEvent.focus(control);
};

const commitFill = () => {
  fireEvent.click(screen.getByTestId('commit-pdf-fill'));
};

describe('Entity PDF fill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDraft = [];
    mockSelection = {
      text: 'selected from pdf',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };
    jest.mocked(entitiesAPI.coerceValue).mockResolvedValue({ success: 'true', value: 42 });
  });

  it('hides all Click to fill when any field is armed with a selection', () => {
    render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
        <TextField<EditEntityFormValues>
          context="tpl-1"
          label="Text"
          field="metadata.simple_text.0.value"
          type="text"
          pdfFill={{ name: 'simple_text', propertyId: 'prop-1', coerceType: 'text' }}
        />
      </Host>
    );

    expect(screen.getAllByTestId('click-to-fill')).toHaveLength(2);
    expect(screen.queryByTestId('listening-chip')).not.toBeInTheDocument();

    arm(screen.getByRole('textbox', { name: /Title/ }));
    expect(screen.getByTestId('listening-chip')).toBeInTheDocument();
    expect(screen.queryByTestId('click-to-fill')).not.toBeInTheDocument();
  });

  it('shows Click to fill when unarmed with a selection', () => {
    render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
      </Host>
    );

    expect(screen.getByTestId('click-to-fill')).toBeInTheDocument();
    expect(screen.getByText('Click to fill')).toBeInTheDocument();
    expect(screen.queryByTestId('listening-chip')).not.toBeInTheDocument();
  });

  it('renders Click to fill and fills title on click without arming', async () => {
    render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
      </Host>
    );

    const fill = screen.getByTestId('click-to-fill');
    expect(fill.tagName).toBe('BUTTON');
    fireEvent.click(fill);

    await waitFor(() => {
      expect(upsertPropertySelection).toHaveBeenCalled();
      expect(screen.getByRole('textbox')).toHaveValue('selected from pdf');
      expect(setDocumentPdfSelection).toHaveBeenCalledWith(undefined);
      expect(setPdfSelectionMenuOpen).toHaveBeenCalledWith(false);
      expect(screen.queryByTestId('listening-chip')).not.toBeInTheDocument();
    });
  });

  it('restores Click to fill after disarm', () => {
    render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
        <TextField<EditEntityFormValues>
          context="tpl-1"
          label="Text"
          field="metadata.simple_text.0.value"
          type="text"
          pdfFill={{ name: 'simple_text', propertyId: 'prop-1', coerceType: 'text' }}
        />
      </Host>
    );

    arm(screen.getByRole('textbox', { name: /Title/ }));
    expect(screen.queryByTestId('click-to-fill')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stop filling Title' }));
    expect(screen.queryByTestId('listening-chip')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('click-to-fill')).toHaveLength(2);
  });

  it('places overlay as a button sibling of the input, not a role=button wrapper', () => {
    render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
      </Host>
    );

    const input = screen.getByRole('textbox');
    const fill = screen.getByTestId('click-to-fill');
    expect(fill.tagName).toBe('BUTTON');
    expect(fill.parentElement).toBe(input.parentElement);
    expect(fill.parentElement?.getAttribute('role')).not.toBe('button');
    expect(input.closest('[role="button"]')).toBeNull();
  });

  it('places Click to fill beside the date input, not inside it', () => {
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

    const input = screen.getByLabelText(/Date/);
    const fill = screen.getByTestId('click-to-fill');
    expect(input.parentElement?.contains(fill)).toBe(false);
    expect(fill.className).not.toContain('absolute');
  });

  it('exposes an accessible name on the fill button', () => {
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

    const fill = screen.getByTestId('click-to-fill');
    expect(fill).toHaveAttribute('aria-label', 'Click to fill');
    expect(fill.querySelector('svg path[d="M9 7v10"]')).not.toBeNull();
  });

  it('warns from overlay and skips fill when selection has no rectangles', async () => {
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
      expect(screen.queryByTestId('listening-chip')).not.toBeInTheDocument();
    });
  });

  it('coerces numeric selection from overlay then upserts', async () => {
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

  it('ignores a second overlay click while coerce is in flight', async () => {
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

  it('parses localized date from overlay then upserts without API', async () => {
    mockSelection = {
      text: '18th July 2025',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };

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
      expect(entitiesAPI.coerceValue).not.toHaveBeenCalled();
      expect(upsertPropertySelection).toHaveBeenCalledWith(
        { name: 'date_prop', id: 'date-1' },
        mockSelection
      );
      expect(screen.getByLabelText(/Date/)).toHaveValue('2025-07-18');
    });
  });

  it('arms on focus, keeps chip on blur, and fills title on commit', async () => {
    render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
      </Host>
    );

    const title = screen.getByRole('textbox');
    arm(title);

    const chip = screen.getByTestId('listening-chip');
    expect(chip).toBeInTheDocument();
    expect(chip.closest('label')).toBeNull();
    expect(screen.getByText('select text or a value')).toBeInTheDocument();

    fireEvent.blur(title);
    expect(screen.getByTestId('listening-chip')).toBeInTheDocument();

    commitFill();

    await waitFor(() => {
      expect(upsertPropertySelection).toHaveBeenCalled();
      expect(title).toHaveValue('selected from pdf');
      expect(setDocumentPdfSelection).toHaveBeenCalledWith(undefined);
      expect(setPdfSelectionMenuOpen).toHaveBeenCalledWith(false);
      expect(screen.queryByTestId('listening-chip')).not.toBeInTheDocument();
    });
  });

  it('disarms from chip close and Escape', () => {
    render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
      </Host>
    );

    arm(screen.getByRole('textbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Stop filling Title' }));
    expect(screen.queryByTestId('listening-chip')).not.toBeInTheDocument();

    arm(screen.getByRole('textbox'));
    expect(screen.getByTestId('listening-chip')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('listening-chip')).not.toBeInTheDocument();
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

    arm(screen.getByRole('textbox'));
    commitFill();

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(
        'Could not detect the area for the selected text',
        'warning'
      );
      expect(upsertPropertySelection).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(screen.getByTestId('listening-chip')).toBeInTheDocument();
    });
  });

  it('ignores a second commit while coerce is in flight', async () => {
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

    arm(screen.getByRole('spinbutton'));
    commitFill();
    commitFill();

    expect(entitiesAPI.coerceValue).toHaveBeenCalledTimes(1);

    resolveCoerce({ success: 'true', value: 42 });

    await waitFor(() => {
      expect(upsertPropertySelection).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('spinbutton')).toHaveValue(42);
    });
  });

  it('does not apply after coerce if the field was disarmed mid-flight', async () => {
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

    const input = screen.getByRole('spinbutton');
    arm(input);
    commitFill();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('listening-chip')).not.toBeInTheDocument();

    resolveCoerce({ success: 'true', value: 42 });

    await waitFor(() => {
      expect(entitiesAPI.coerceValue).toHaveBeenCalled();
    });
    expect(upsertPropertySelection).not.toHaveBeenCalled();
    expect(input).toHaveValue(null);
  });

  it('does not nest role=button wrappers around the listening chip', () => {
    const { container } = render(
      <Host>
        <TitleField<EditEntityFormValues> context="System" label="Title" field="title" />
      </Host>
    );

    arm(screen.getByRole('textbox'));
    const chip = screen.getByTestId('listening-chip');
    expect(chip.getAttribute('role')).not.toBe('button');
    expect(chip.parentElement?.getAttribute('role')).not.toBe('button');
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

    arm(screen.getByRole('spinbutton'));
    commitFill();

    await waitFor(() => {
      expect(entitiesAPI.coerceValue).toHaveBeenCalledWith('42', 'numeric', 'en');
      expect(upsertPropertySelection).toHaveBeenCalledWith(
        { name: 'numeric_prop', id: 'num-1' },
        mockSelection
      );
      expect(screen.getByRole('spinbutton')).toHaveValue(42);
    });
  });

  it('parses localized date client-side then upserts without API', async () => {
    mockSelection = {
      text: '18th July 2025',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };

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

    arm(screen.getByLabelText(/Date/));
    commitFill();

    await waitFor(() => {
      expect(entitiesAPI.coerceValue).not.toHaveBeenCalled();
      expect(upsertPropertySelection).toHaveBeenCalledWith(
        { name: 'date_prop', id: 'date-1' },
        mockSelection
      );
      expect(screen.getByLabelText(/Date/)).toHaveValue('2025-07-18');
    });
  });

  it('parses date with document language when entity language fails', async () => {
    mockSelection = {
      text: '18 de julio de 2025',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };

    render(
      <Host pdfFillOverrides={{ language: 'en', documentLanguage: 'spa' }}>
        <DateField<EditEntityFormValues>
          context="tpl-1"
          label="Date"
          field="metadata.date_prop.0.value"
          pdfFill={{ name: 'date_prop', propertyId: 'date-1', coerceType: 'date' }}
        />
      </Host>
    );

    arm(screen.getByLabelText(/Date/));
    commitFill();

    await waitFor(() => {
      expect(entitiesAPI.coerceValue).not.toHaveBeenCalled();
      expect(upsertPropertySelection).toHaveBeenCalled();
      expect(screen.getByLabelText(/Date/)).toHaveValue('2025-07-18');
    });
  });

  it('tries API coerce with document language after entity language fails', async () => {
    mockSelection = {
      text: 'not-a-date',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };
    const epochSeconds = 1579046400;
    jest
      .mocked(entitiesAPI.coerceValue)
      .mockResolvedValueOnce({ success: '', value: 0 })
      .mockResolvedValueOnce({ success: 'true', value: epochSeconds });

    render(
      <Host pdfFillOverrides={{ language: 'en', documentLanguage: 'fra' }}>
        <DateField<EditEntityFormValues>
          context="tpl-1"
          label="Date"
          field="metadata.date_prop.0.value"
          pdfFill={{ name: 'date_prop', propertyId: 'date-1', coerceType: 'date' }}
        />
      </Host>
    );

    arm(screen.getByLabelText(/Date/));
    commitFill();

    await waitFor(() => {
      expect(entitiesAPI.coerceValue).toHaveBeenNthCalledWith(1, 'not-a-date', 'date', 'en');
      expect(entitiesAPI.coerceValue).toHaveBeenNthCalledWith(2, 'not-a-date', 'date', 'fra');
      expect(upsertPropertySelection).toHaveBeenCalled();
      expect(screen.getByLabelText(/Date/)).toHaveValue('2020-01-15');
    });
  });

  it('falls back to API coerce when localized date parse fails', async () => {
    mockSelection = {
      text: 'not-a-date',
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

    arm(screen.getByLabelText(/Date/));
    commitFill();

    await waitFor(() => {
      expect(entitiesAPI.coerceValue).toHaveBeenCalledWith('not-a-date', 'date', 'en');
      expect(upsertPropertySelection).toHaveBeenCalledWith(
        { name: 'date_prop', id: 'date-1' },
        mockSelection
      );
      expect(screen.getByLabelText(/Date/)).toHaveValue('2020-01-15');
    });
  });

  it('notifies danger when date API fallback coerce fails and stays armed', async () => {
    mockSelection = {
      text: 'not-a-date',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };
    jest.mocked(entitiesAPI.coerceValue).mockResolvedValue({
      success: '',
      value: 0,
    });

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

    arm(screen.getByLabelText(/Date/));
    commitFill();

    await waitFor(() => {
      expect(entitiesAPI.coerceValue).toHaveBeenCalledWith('not-a-date', 'date', 'en');
      expect(notify).toHaveBeenCalledWith(
        'Value cannot be transformed to the correct type',
        'danger'
      );
      expect(upsertPropertySelection).not.toHaveBeenCalled();
      expect(screen.getByTestId('listening-chip')).toBeInTheDocument();
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

    arm(screen.getByRole('spinbutton'));
    commitFill();

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(
        'Value cannot be transformed to the correct type',
        'danger'
      );
      expect(upsertPropertySelection).not.toHaveBeenCalled();
      expect(setDocumentPdfSelection).not.toHaveBeenCalled();
      expect(screen.getByTestId('listening-chip')).toBeInTheDocument();
    });
  });

  it('notifies danger when coerce throws', async () => {
    mockSelection = {
      text: '42',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 4, regionId: '1' }],
    };
    jest.mocked(entitiesAPI.coerceValue).mockRejectedValue(new Error('network'));

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

    arm(screen.getByRole('spinbutton'));
    commitFill();

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(
        'Value cannot be transformed to the correct type',
        'danger'
      );
      expect(upsertPropertySelection).not.toHaveBeenCalled();
    });
  });
});
