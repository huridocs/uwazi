/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen, RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { store } from 'app/store';
import { t } from 'app/I18N';
import { FormConfigSelect } from '../FormConfigSelect';

const defineTemplateInStore = (
  content: string,
  _id?: string,
  errors: { [key: string]: boolean } = {}
) => ({
  data: {
    properties: [
      {
        _id,
        content,
        type: 'select',
        label: 'My selector',
      },
    ],
    name: 'template1',
  },
  formState: {
    $form: { errors, submitFailed: false },
  },
});

describe('FormConfigSelect', () => {
  let renderResult: RenderResult;
  let reduxStore: MockStoreEnhanced;
  let state: any;

  beforeEach(() => {
    state = {
      ...defaultState,
      locale: 'en',
      template: { ...defineTemplateInStore('1', 'id1') },
      thesauris: Immutable.fromJS([
        { _id: '1', values: [], name: 'Thesauri 1' },
        { _id: '2', values: [], name: 'Thesauri 2' },
      ]),
      templates: Immutable.fromJS([
        { properties: [{ content: '1', type: 'select' }], name: 'template1' },
      ]),
      translations: Immutable.fromJS([
        {
          locale: 'es',
          contexts: [
            {
              _id: '1',
              id: '1',
              label: 'Thesauri 1',
              values: {
                'Thesauri 1': 'Diccionario B',
              },
              type: 'Thesaurus',
            },
            {
              _id: '2',
              id: '2',
              label: 'Thesauri 2',
              values: {
                'Thesauri 2': 'Diccionario A',
              },
              type: 'Thesaurus',
            },
          ],
        },
      ]),
    };
  });

  const render = () => {
    ({ store: reduxStore, renderResult } = renderConnectedContainer(
      <FormConfigSelect type="select" index={0} />,
      () => state
    ));
  };

  it('should render fields with the correct data', () => {
    render();
    expect(screen.getByDisplayValue('My selector')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Single select')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Thesauri 1')).toBeInTheDocument();
  });

  it('should render the select with the sorted translated dictionaries', () => {
    state.locale = 'es';
    jest.spyOn(store!, 'getState').mockImplementationOnce(() => ({ ...state }));
    t.resetCachedTranslation();

    render();
    const options = screen.getAllByText('Diccionario', { exact: false });
    expect(options[0].textContent).toEqual('Diccionario A');
    expect(options[1].textContent).toEqual('Diccionario B');
  });

  describe('validation', () => {
    it('should show a warning when changing the select thesaurus', () => {
      t.resetCachedTranslation();
      render();

      state = { ...state, template: { ...defineTemplateInStore('2', 'id1') } };

      renderResult.rerender(
        <Provider store={reduxStore}>
          <FormConfigSelect type="select" index={0} />
        </Provider>
      );

      const warning = screen.queryByText(
        'By making this change, any values from the previous thesaurus',
        { exact: false }
      );

      expect(warning).toBeInTheDocument();
    });

    it('should not show the warning when changing select thesaurus for new properties', () => {
      render();

      state = { ...state, template: { ...defineTemplateInStore('2') } };

      renderResult.rerender(
        <Provider store={reduxStore}>
          <FormConfigSelect type="select" index={0} />
        </Provider>
      );

      const warning = screen.queryByText('All entities and documents that have', { exact: false });

      expect(warning).not.toBeInTheDocument();
    });
  });

  describe('when the fields are invalid', () => {
    it('should render the label with errors if field is empty', () => {
      state = {
        ...state,
        template: {
          ...defineTemplateInStore('1', 'id1', { 'properties.0.label.required': true }),
        },
      };

      render();

      const labelInput = screen.getByText('Label').parentElement?.parentElement;
      expect(labelInput?.className).toBe('form-group has-error');
    });

    it('should render the label with errors if field is duplicated', () => {
      state = {
        ...state,
        template: {
          ...defineTemplateInStore('1', 'id1', { 'properties.0.label.duplicated': true }),
        },
      };

      render();

      const labelInputContainer = screen.getByText('Label').parentElement?.parentElement;
      expect(labelInputContainer?.className).toBe('form-group has-error');
    });

    it('should render the thesauri selector with errors if its empty', () => {
      state = {
        ...state,
        template: {
          ...defineTemplateInStore('1', 'id1', { 'properties.0.content.required': true }),
        },
      };

      render();
      const thesauriSelectorContainer =
        screen.getAllByText('Thesauri')[0].parentElement?.parentElement;
      expect(thesauriSelectorContainer?.className).toBe('form-group has-error');
    });
  });
});
