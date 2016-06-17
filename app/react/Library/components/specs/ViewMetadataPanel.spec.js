import React from 'react';
import {shallow} from 'enzyme';
import configureMockStore from 'redux-mock-store';
import Immutable from 'immutable';
import documents from 'app/Documents';

//import DocumentForm from '../../containers/DocumentForm';
import PanelContainer, {ViewMetadataPanel} from '../ViewMetadataPanel';
import SidePanel from 'app/Layout/SidePanel';

describe('ViewMetadataPanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      doc: {metadata: []},
      unselectDocument: jasmine.createSpy('unselectDocument')
    };
  });

  let render = () => {
    component = shallow(<ViewMetadataPanel {...props}/>);
  };

  it('should render a SidePanel', () => {
    render();

    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBeUndefined();
  });

  describe('when props.open', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();

      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  describe('on close', () => {
    it('should should unselectDocument', () => {
      render();
      component.find('i').simulate('click');
      expect(props.unselectDocument).toHaveBeenCalled();
    });
  });

  //describe('onSubmit', () => {
    //it('should saveDocument', () => {
      //props.saveDocument = jasmine.createSpy('saveDocument');
      //props.docBeingEdited = true;
      //render();

      //let doc = 'doc';
      //component.find(DocumentForm).simulate('submit', doc);

      //expect(props.saveDocument).toHaveBeenCalledWith(doc);
    //});
  //});

  describe('PanelContainer', () => {
    let state = {
      library: {
        ui: Immutable.fromJS({
          selectedDocument: Immutable.fromJS({})
        }),
        filters: Immutable.fromJS({templates: ['templates'], thesauris: ['thesauris']})
      }
    };

    const mockStore = configureMockStore([]);

    let renderContainer = () => {
      spyOn(documents.helpers, 'prepareMetadata');
      let store = mockStore(state);
      component = shallow(<PanelContainer />, {context: {store}});
    };

    it('should prepare doc with template and thesauris', () => {
      renderContainer();
      expect(documents.helpers.prepareMetadata).toHaveBeenCalledWith(
        state.library.ui.get('selectedDocument').toJS(),
        state.library.filters.get('templates').toJS(),
        state.library.filters.get('thesauris').toJS()
      );
    });

    it('should be closed when panel is not viewMetadataPanel', () => {
      state.library.ui = state.library.ui.remove('selectedDocument');
      renderContainer();
      expect(component.props().open).toBe(false);
    });

    it('should be open when panel is ViewMetadataPanel', () => {
      state.library.ui = state.library.ui.set('selectedDocument', Immutable.fromJS({}));
      renderContainer();
      expect(component.props().open).toBe(true);
    });
  });
});
