//import React from 'react';
//import {mount} from 'enzyme';
import Immutable from 'immutable';

import {mapStateToProps} from 'app/Library/components/Doc';

describe('Doc', () => {
  //let component;
  //let props = {
    //previewDoc: 'idOne',
    //_id: 'idOne',
    //title: 'My title',
    //setPreviewDoc: jasmine.createSpy('setPreviewDoc')
  //};

  beforeEach(() => {
    //component = mount(<Doc {...props}/>);
  });

  //describe('when is the document previewed', () => {
    //it('should have the active class', () => {
      //expect(component.find('.item').hasClass('active')).toBe(true);
    //});
  //});

  //describe('when clicking on it', () => {
    //it('should call setPreviewDoc with the id', () => {
      //component.find('.item').simulate('click');
      //expect(props.setPreviewDoc).toHaveBeenCalledWith('idOne');
    //});
  //});

  describe('maped state', () => {
    it('should contain the previewDoc', () => {
      let store = {
        library: {
          ui: Immutable.fromJS({previewDoc: 'docId'}),
          filters: Immutable.fromJS({templates: {}})
        }
      };
      let state = mapStateToProps(store);
      expect(state.previewDoc).toEqual('docId');
      expect(state.templates.toJS()).toEqual({});
    });
  });
});
