/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import {
  PropertyConfigurationModal,
  PropertyConfigurationModalProps,
} from '../PropertyConfigurationModal';

describe('Property Configuration Modal', () => {
  let props: PropertyConfigurationModalProps;

  beforeEach(() => {
    props = {
      isOpen: true,
      onAccept: jasmine.createSpy('onAccept'),
      onClose: jasmine.createSpy('onClose'),
      templates: [
        {
          _id: 'templateid1',
          name: 'template 1',
          properties: [
            {
              label: 'Numeric',
              name: 'numeric',
              type: 'numeric',
            },
            {
              label: 'Date',
              name: 'date',
              type: 'date',
            },
            {
              label: 'Text',
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          _id: 'templateid2',
          name: 'template 2',
          properties: [
            {
              label: 'Text',
              name: 'text',
              type: 'text',
            },
          ],
        },
      ],
      currentProperties: [
        {
          template: 'templateid1',
          properties: ['text', 'numeric'],
        },
        {
          template: 'templateid2',
          properties: ['text'],
        },
      ],
    };
  });

  const render = () => {
    renderConnectedContainer(<PropertyConfigurationModal {...props} />, () => defaultState);
  };

  describe('Property configuration modal', () => {
    beforeEach(() => {
      render();
    });
    it('displays numeric, dates and texts', () => {
      const listitem = screen.getAllByRole('listitem', { name: 'group' });
      const list = listitem.at(0)?.querySelectorAll('ul.multiselectChild > li');
      const items: string[] = [];
      list?.forEach(item => {
        const text = item.querySelector('span.multiselectItem-name')?.textContent;
        items.push(text as string);
      });
      expect(items).toEqual(['Date', 'Numeric', 'Text', 'Title']);
    });

    it('should call onAccept when the accept button is clicked', () => {
      const acceptButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(acceptButton);
      expect(props.onAccept).toHaveBeenCalledWith(props.currentProperties);
    });

    it('should call onClose when cancel button is clicked', () => {
      const acceptButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(acceptButton);
      expect(props.onClose).toHaveBeenCalled();
    });
  });
});
