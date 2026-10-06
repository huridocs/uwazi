/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AddThesaurusValueModal } from '../AddThesaurusValueModal.js';

const flatScopes = [{ id: 'root', label: '<root>', existingLabels: ['Amnistía', 'Idle'] }];

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

const renderModal = (
  onSave: (label: string, groupId: string) => void | Promise<void> = jest.fn(),
  saving = false,
  scopes = flatScopes
) => {
  const onClose = jest.fn();
  const view = render(
    <div className="tw-content">
      <AddThesaurusValueModal
        thesaurusName="Estado"
        scopes={scopes}
        saving={saving}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  );
  return { onSave, onClose, view };
};

const submitLabel = (label: string) => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: label } });
  const form = screen.getByRole('dialog').querySelector('form');
  if (!form) {
    throw new Error('missing form');
  }
  fireEvent.submit(form);
};

describe('AddThesaurusValueModal', () => {
  it('renders one label field with Cancel and Save in a portaled sm modal', () => {
    renderModal();

    const dialog = screen.getByRole('dialog', { name: 'Add thesaurus value' });
    expect(dialog.closest('.tw-content')).not.toBeNull();
    expect(dialog.parentElement).not.toBe(document.body);
    expect(screen.queryByRole('combobox', { name: 'Group' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'New value in Estado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByText('Added at the end of the thesaurus.')).toBeInTheDocument();
  });

  it('keeps Save inactive for a blank label and while save is in flight', () => {
    const { unmount } = render(
      <AddThesaurusValueModal
        thesaurusName="Estado"
        scopes={[{ id: 'root', label: '<root>', existingLabels: ['Amnistía'] }]}
        saving={false}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    );
    const save = screen.getByRole('button', { name: 'Save' });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    expect(save).toBeDisabled();
    unmount();

    renderModal(jest.fn(), true);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Fresh' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('names an existing fold match and otherwise says the value is added at the end', () => {
    renderModal();
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'amnistia' } });
    expect(screen.getByText(/already exists/)).toHaveTextContent('Save selects it');
    expect(screen.getByText(/already exists/)).toHaveTextContent('Amnistía');
    expect(screen.queryByText('Added at the end of the thesaurus.')).not.toBeInTheDocument();
  });

  it('says a new label is added at the end', () => {
    renderModal();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Fresh' } });
    expect(screen.getByText('Added at the end of the thesaurus.')).toBeInTheDocument();
  });

  it('submits with preventDefault and stopPropagation', () => {
    const preventDefault = jest.spyOn(Event.prototype, 'preventDefault');
    const stopPropagation = jest.spyOn(Event.prototype, 'stopPropagation');
    const { onSave } = renderModal();
    submitLabel('Fresh');
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith('Fresh', 'root');
    preventDefault.mockRestore();
    stopPropagation.mockRestore();
  });

  it('closes from Cancel', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('saves into the chosen group and matches labels only in that group', () => {
    const { onSave } = renderModal(jest.fn(), false, [
      { id: 'root', label: '<root>', existingLabels: ['Idle'] },
      { id: 'asia', label: 'Asia', existingLabels: ['India'] },
    ]);
    expect(screen.getByRole('combobox', { name: 'Group' })).toHaveValue('root');
    fireEvent.change(screen.getByRole('combobox', { name: 'Group' }), {
      target: { value: 'asia' },
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'india' } });
    expect(screen.getByText(/already exists/)).toHaveTextContent('India');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nepal' } });
    expect(screen.getByText('Added in Asia.')).toBeInTheDocument();
    submitLabel('Nepal');
    expect(onSave).toHaveBeenCalledWith('Nepal', 'asia');
  });
});
