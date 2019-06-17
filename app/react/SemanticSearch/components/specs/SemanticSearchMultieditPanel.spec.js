import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';

import * as multiReducer from 'app/MultiReducer';
import * as metadataActions from 'app/Metadata/actions/actions';
import * as searchActions from 'app/SemanticSearch/actions/actions';
import { mapStateToProps, mapDispatchToProps, SemanticSearchMultieditPanel } from '../SemanticSearchMultieditPanel';

describe('SemanticSearchMultieditPanel', () => {
  let state;
  let dispatch;
  let props;

  const mockAction = (obj, fn) => jest.spyOn(obj, fn).mockReturnValue(() => {});
  beforeEach(() => {
    props = {
      storeKey: 'library',
      formKey: 'semanticSearch.multipleEdit',
      searchId: 'searchId'
    };
    state = {
      semanticSearch: {
        multiedit: Immutable.fromJS([
          { searchId: 'doc1', template: 'tpl1' },
          { searchId: 'doc2', template: 'tpl1' },
          { searchId: 'doc3', template: 'tpl3' },
        ]),
        multipleEditForm: {
          metadata: {
            unchangedField: { pristine: true },
            changedField: { pristine: false },
          }
        }
      },
      templates: Immutable.fromJS([
        {
          _id: 'tpl1',
          properties: [
            { name: 'p1', type: 'select', content: 't1' },
          ],
        },
        {
          _id: 'tpl2',
          properties: [
            { name: 'p1', type: 'select', content: 't1' },
            { name: 'p2', type: 'text' },
          ]
        }
      ]),
      thesauris: Immutable.fromJS([
        { _id: 't1', name: 'T1', values: [{ _id: 'v1', id: 'v1', label: 'V1' }] }
      ])
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
    ...mapDispatchToProps(dispatch, props)
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
    it('should apply changes to entities and refetch the search', async () => {
      const component = render();
      const formValues = {
        metadata: {
          unchangedField: 'val1',
          changedField: 'val2'
        }
      };
      const instance = component.instance();
      spyOn(instance, 'close');
      await component.instance().save(formValues);
      expect(metadataActions.multipleUpdate.mock.calls).toMatchSnapshot();
      expect(searchActions.getSearch).toHaveBeenCalledWith('searchId');
      expect(instance.close).toHaveBeenCalled();
    });
  });
});
