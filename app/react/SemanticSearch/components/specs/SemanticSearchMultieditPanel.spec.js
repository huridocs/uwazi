/** @format */

import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';

import multiReducer from 'app/Multireducer';
import * as metadataActions from 'app/Metadata/actions/actions';
import * as searchActions from 'app/SemanticSearch/actions/actions';
import {
  mapStateToProps,
  mapDispatchToProps,
  SemanticSearchMultieditPanel,
} from '../SemanticSearchMultieditPanel';

describe('SemanticSearchMultieditPanel', () => {
  let state;
  let dispatch;
  let props;

  const mockAction = (obj, fn) => jest.spyOn(obj, fn).mockReturnValue(() => {});
  beforeEach(() => {
    props = {
      storeKey: 'library',
      formKey: 'semanticSearch.multipleEdit',
      searchId: 'searchId',
    };
    state = {
      semanticSearch: {
        multiedit: Immutable.fromJS([
          { searchId: 'doc1', template: 'tpl1' },
          { searchId: 'doc2', template: 'tpl1' },
          { searchId: 'doc3', template: 'tpl2' },
        ]),
        multipleEditForm: {
          metadata: {
            unchangedField: { pristine: true },
            changedField: { pristine: false },
          },
        },
      },
      templates: Immutable.fromJS([
        {
          _id: 'tpl1',
          properties: [{ name: 'p1', type: 'select', content: 't1' }],
        },
        {
          _id: 'tpl2',
          properties: [
            { name: 'p1', type: 'select', content: 't1' },
            { name: 'p2', type: 'text' },
          ],
        },
      ]),
      thesauris: Immutable.fromJS([
        { _id: 't1', name: 'T1', values: [{ _id: 'v1', id: 'v1', label: 'V1' }] },
      ]),
    };
    mockAction(metadataActions, 'loadTemplate');
    mockAction(metadataActions, 'resetReduxForm');
    mockAction(metadataActions, 'multipleUpdate');
    mockAction(searchActions, 'setEditSearchEntities');
    mockAction(searchActions, 'getSearch');
    dispatch = jest.fn().mockImplementation(() => Promise.resolve());
    jest.spyOn(multiReducer, 'wrapDispatch').mockReturnValue(dispatch);
  });

  const getProps = () => ({
    ...props,
    ...mapStateToProps(state),
    ...mapDispatchToProps(dispatch, props),
  });

  const render = () => shallow(<SemanticSearchMultieditPanel {...getProps()} />);

  it('should render multi edit form for semantic search multi edit documents', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  describe('changeTemplate', () => {
    it('should set the template of the entities to the selected one', () => {
      const component = render();
      component.instance().changeTemplate({}, 'tpl3');
      expect(searchActions.setEditSearchEntities.mock.calls).toMatchSnapshot();
    });
  });

  describe('save', () => {
    let formValues;
    let instance;
    let component;
    beforeEach(() => {
      formValues = {
        metadata: { unchangedField: [{ value: 'val1' }], changedField: [{ value: 'val2' }] },
      };
      component = render();
      instance = component.instance();
      spyOn(instance, 'close');
    });

    it('should apply changes to entities and re-fetch the search', async () => {
      await instance.save(formValues);
      expect(metadataActions.multipleUpdate).toHaveBeenCalledWith(state.semanticSearch.multiedit, {
        metadata: { changedField: [{ value: 'val2' }] },
      });
      expect(searchActions.getSearch).toHaveBeenCalledWith('searchId');
      expect(instance.close).toHaveBeenCalled();
    });
    it('should update entities icon if icon changed', async () => {
      formValues.icon = 'icon';
      state.semanticSearch.multipleEditForm.icon = {
        pristine: false,
      };
      await instance.save(formValues);
      expect(metadataActions.multipleUpdate).toHaveBeenCalledWith(state.semanticSearch.multiedit, {
        metadata: { changedField: [{ value: 'val2' }] },
        icon: 'icon',
      });
    });
    it('should set template if common template found', async () => {
      state = {
        ...state,
      };
      state.semanticSearch.multiedit = state.semanticSearch.multiedit.map(item =>
        item.set('template', 'tpl1')
      );
      instance = render().instance();
      spyOn(instance, 'close');
      await instance.save(formValues);
      expect(metadataActions.multipleUpdate).toHaveBeenCalledWith(state.semanticSearch.multiedit, {
        metadata: { changedField: [{ value: 'val2' }] },
        template: 'tpl1',
      });
    });
  });

  describe('close', () => {
    it('should reset form and set entities to an empty list', () => {
      const component = render();
      const instance = component.instance();
      instance.close();
      expect(metadataActions.resetReduxForm).toHaveBeenCalledWith(props.formKey);
      expect(searchActions.setEditSearchEntities).toHaveBeenCalledWith([]);
    });
  });

  describe('open', () => {
    it('should not open side panel if there are no multi edit entities', () => {
      state.semanticSearch.multiedit = Immutable.fromJS([]);
      const component = render();
      expect(component).toMatchSnapshot();
    });
  });
});
