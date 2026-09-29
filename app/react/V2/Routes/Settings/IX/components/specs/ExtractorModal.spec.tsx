/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientIXExtractorType } from '#V2/shared/types.js';
import { ExtractorModal } from '../ExtractorModal.js';
import { templates, extractors } from '../../helpers/specs/fixtures.js';

const renderComponent = (extractor?: ClientIXExtractorType) => {
  const onAccept = jest.fn();
  const result = render(
    <ExtractorModal
      setShowModal={jest.fn()}
      onClose={jest.fn()}
      onAccept={onAccept}
      templates={templates}
      extractor={extractor}
    />
  );
  return { ...result, onAccept };
};

const nameField = () => screen.getByPlaceholderText('Extractor name');

const expandTemplateGroup = (templateName: string) => {
  const group = screen
    .getAllByRole('button', { name: 'Group' })
    .find(button => new RegExp(templateName).test(button.closest('li')?.textContent || ''));
  fireEvent.click(group!);
};

const goToSourceStep = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
};

const submit = (label: 'Update' | 'Create') => {
  fireEvent.click(screen.getByRole('button', { name: label }));
};

// Templates 1 and 3 both hold `descripcion`, so it is a legitimate common source for an
// extractor targeting `fecha` on those two.
const propertySourceExtractor: ClientIXExtractorType = {
  _id: 'extractor-with-property-source',
  name: 'Fechas',
  property: 'fecha',
  source: { property: 'descripcion' },
  templates: ['1', '3'],
};

describe('ExtractorModal', () => {
  describe('editing an extractor with a property source', () => {
    it('should preselect the current source', () => {
      renderComponent(propertySourceExtractor);
      goToSourceStep();

      expect(screen.getByRole('radio', { name: 'Descripción' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'PDF' })).not.toBeChecked();
    });

    it('should keep the property source when nothing but the name is edited', () => {
      const { onAccept } = renderComponent(propertySourceExtractor);

      fireEvent.change(nameField(), { target: { value: 'Renamed' } });
      goToSourceStep();
      submit('Update');

      expect(onAccept).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: propertySourceExtractor._id,
          name: 'Renamed',
          source: { property: 'descripcion' },
        })
      );
    });

    it('should submit the source the user picks', () => {
      const { onAccept } = renderComponent(propertySourceExtractor);

      goToSourceStep();
      fireEvent.click(screen.getByRole('radio', { name: 'PDF' }));
      submit('Update');

      expect(onAccept).toHaveBeenCalledWith(expect.objectContaining({ source: { pdf: true } }));
    });
  });

  describe('when the stored source is not an available source', () => {
    // `descripcion` exists on template 1 but not on template 2, so it is not a common source here.
    const incoherentExtractor: ClientIXExtractorType = {
      ...propertySourceExtractor,
      templates: ['2'],
    };

    it('should fall back to pdf, and send what it shows', () => {
      const { onAccept } = renderComponent(incoherentExtractor);
      goToSourceStep();

      expect(screen.queryByRole('radio', { name: 'Descripción' })).not.toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'PDF' })).toBeChecked();

      submit('Update');

      expect(onAccept).toHaveBeenCalledWith(expect.objectContaining({ source: { pdf: true } }));
    });
  });

  describe('editing an extractor with a pdf source', () => {
    it('should preselect pdf and keep it', () => {
      const { onAccept } = renderComponent(extractors[0] as ClientIXExtractorType);
      goToSourceStep();

      expect(screen.getByRole('radio', { name: 'PDF' })).toBeChecked();

      submit('Update');

      expect(onAccept).toHaveBeenCalledWith(expect.objectContaining({ source: { pdf: true } }));
    });
  });

  describe('creating an extractor', () => {
    it('should default to pdf', () => {
      const { onAccept } = renderComponent();

      fireEvent.change(nameField(), { target: { value: 'New extractor' } });
      expandTemplateGroup('Mecanismo');
      fireEvent.click(document.getElementById('1-resumen')!);
      goToSourceStep();

      expect(screen.getByRole('radio', { name: 'PDF' })).toBeChecked();

      submit('Create');

      expect(onAccept).toHaveBeenCalledWith(expect.objectContaining({ source: { pdf: true } }));
    });
  });
});
