/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { FormConfigDate } from '../FormConfigDate';

const defineTemplateInStore = (_id?: string, errors: { [key: string]: boolean } = {}) => ({
  data: {
    properties: [
      {
        _id,
        type: 'daterange',
        label: 'My date range',
      },
    ],
    name: 'template1',
  },
  formState: {
    $form: { errors, submitFailed: false },
  },
});

describe('FormConfigSelect', () => {
  let state: any;

  beforeEach(() => {
    state = {
      ...defaultState,
      template: { ...defineTemplateInStore('1') },
      templates: Immutable.fromJS([
        { properties: [{ content: '1', type: 'daterange' }], name: 'template1' },
      ]),
    };
  });

  const render = () => {
    renderConnectedContainer(<FormConfigDate type="multidate" index={0} />, () => state);
  };

  it('should render fields with the correct data', () => {
    render();
    const selector = screen.getByRole('combobox');

    expect(screen.getByDisplayValue('My date range')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Single date range')).toBeInTheDocument();
    expect(selector).toBeDisabled();
  });

  it('should render the label with errors if field is empty', () => {
    state = {
      ...state,
      template: {
        ...defineTemplateInStore('1', { 'properties.0.label.required': true }),
      },
    };

    render();

    const labelInput = screen.getByText('Label').parentElement?.parentElement;
    expect(labelInput?.className).toBe('form-group has-error');
  });

  it('should not disable the type selector if the property is new', () => {
    state = {
      ...state,
      template: {
        ...defineTemplateInStore(),
      },
    };

    render();

    const selector = screen.getByRole('combobox');
    expect(selector).toBeEnabled();
  });
});
