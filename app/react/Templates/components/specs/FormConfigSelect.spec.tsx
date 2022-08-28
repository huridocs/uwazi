/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen, act, fireEvent, RenderResult } from '@testing-library/react';
import { actions } from 'app/BasicReducer';
import { actions as formActions } from 'react-redux-form';
import { Provider } from 'react-redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { store } from 'app/store';
import { t } from 'app/I18N';
import { FormConfigSelect } from '../FormConfigSelect';

describe('FormConfigSelect', () => {
  let reduxStore: MockStoreEnhanced;
  let renderResult: RenderResult;
  let state = {
    locale: 'en',
    template: {
      data: {
        properties: [{ _id: 'property1', content: '1', type: 'select', label: 'My selector' }],
        name: 'template1',
      },
      formState: {
        $form: { errors: [], submitFailed: false },
      },
    },
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

  beforeEach(() => {
    state.locale = 'en';
  });

  const render = () => {
    const initialState = {
      ...defaultState,
      ...state,
    };

    ({ store: reduxStore, renderResult } = renderConnectedContainer(
      <FormConfigSelect type="select" index={0} />,
      () => initialState
    ));
  };

  it('should render fields with the correct data', () => {
    render();
    expect(screen.getByDisplayValue('My selector')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Select')).toBeInTheDocument();
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
    // eslint-disable-next-line jest/no-focused-tests
    fit('should show a warning when changing the select thesaurus', async () => {
      t.resetCachedTranslation();
      render();

      reduxStore.dispatch(actions.update('template.data.properties[0].content', '2'));

      // renderResult.rerender(
      //   <Provider store={reduxStore}>
      //     <FormConfigSelect type="select" index={0} />
      //   </Provider>
      // );

      const warning = screen.findByText('All entities and documents that have already', {
        exact: false,
      });

      expect(warning).toBeInTheDocument();
    });

    it('should not show the warning when changing select thesaurus for new properties', () => {});
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {});

    it('should render the list select with errors', () => {});
  });
});
