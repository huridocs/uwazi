/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { MarkdownField } from '../MarkdownField.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_context: string, key: string) => key,
}));

jest.mock('../EntityPdfFillField', () => ({
  EntityPdfFillField: ({
    children,
  }: {
    children: (slot?: {
      overlay: React.ReactNode;
      onFocus: () => void;
      onClick: () => void;
    }) => React.ReactNode;
  }) =>
    children({
      overlay: <div data-testid="pdf-fill-overlay" />,
      onFocus: jest.fn(),
      onClick: jest.fn(),
    }),
}));

type FormValues = {
  metadata: { markdown: { value: string }[] };
};

const Harness = ({ value = '', required }: { value?: string; required?: boolean }) => {
  const form = useForm<FormValues>({
    defaultValues: { metadata: { markdown: [{ value }] } },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <MarkdownField<FormValues>
          context="Template"
          label="Markdown"
          field="metadata.markdown.0.value"
          registerOptions={required ? { required: true } : undefined}
          pdfFill={{ name: 'markdown', propertyId: 'p1', coerceType: 'text' }}
        />
        <button type="submit">save</button>
      </form>
    </FormProvider>
  );
};

const HELP_HREF = 'https://guides.github.com/features/mastering-markdown/';

describe('MarkdownField', () => {
  it('starts on Write with textarea, tabs, and pdf-fill overlay', () => {
    render(<Harness value="**hello**" />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id', 'metadata.markdown.0.value');
    expect(textarea).toHaveAttribute('rows', '6');
    expect(textarea).toHaveValue('**hello**');
    expect(screen.getByTestId('pdf-fill-overlay')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Markdown' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Write' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByTestId('markdown-preview')).not.toBeInTheDocument();
  });

  it('renders a help icon linking to the markdown guide', () => {
    render(<Harness value="**hello**" />);

    const help = screen.getByRole('link', { name: 'help' });
    expect(help).toHaveAttribute('href', HELP_HREF);
    expect(help).toHaveAttribute('target', '_blank');
    expect(help).toHaveAttribute('rel', 'noopener noreferrer');
    expect(help).toHaveAttribute('aria-label', 'help');
    expect(help).toHaveClass('ms-auto');
    expect(help.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByText('help')).not.toBeInTheDocument();
    expect(screen.getByTestId('markdown-editor')).toContainElement(help);
  });

  it('previews with V2 Markdown inside the shell and hides pdf-fill overlay', () => {
    render(<Harness value="**hello**" />);

    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pdf-fill-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('markdown-preview').querySelector('strong')).toHaveTextContent(
      'hello'
    );
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps an empty preview box', () => {
    render(<Harness value="" />);

    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));

    expect(screen.getByTestId('markdown-preview')).toBeEmptyDOMElement();
  });

  it('returns to Write and keeps validation errors in Preview', async () => {
    render(<Harness required />);

    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(await screen.findByText(/required/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(screen.getByText(/required/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Write' }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
