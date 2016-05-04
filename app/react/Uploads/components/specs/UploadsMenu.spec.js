import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';
import {Link} from 'react-router';

import {UploadsMenu} from 'app/Uploads/components/UploadsMenu';

fdescribe('ViewerDefaultMenu', () => {
  let component;
  let props;

  let render = () => {
    component = shallow(<UploadsMenu {...props}/>);
  };

  beforeEach(() => {
    props = {
      active: true,
      moveToLibrary: jasmine.createSpy('moveToLibrary'),
      doc: Immutable.fromJS({})
    };
  });

  describe('when no document selected', () => {
    it('should be disabled', () => {
      render();
      expect(component.find('.float-btn__main').hasClass('disabled')).toBe(true);
      expect(component.find('.float-btn__sec').length).toBe(0);
      expect(component.find('.active').length).toBe(0);
    });
  });

  describe('when document selected', () => {
    it('should be active', () => {
      props.documentBeingEdited = 'document';
      render();
      expect(component.find('.active').length).toBe(1);
      expect(component.find('.float-btn__main').hasClass('cta')).toBe(true);
    });
  });

  describe('publish button', () => {
    it('should not be rendered when document has no template', () => {
      render();
      expect(component.find('.publish').length).toBe(0);
    });

    it('should moveToLibrary', () => {
      props.doc = Immutable.fromJS({template: '1', title: 'test'});
      render();
      component.find('.publish').simulate('click');
      expect(props.moveToLibrary).toHaveBeenCalledWith(props.doc.toJS());
    });
  });
  describe('View button', () => {
    it('should not be rendered when document its not processed ', () => {
      render();
      expect(component.find('.view').length).toBe(0);
    });

    it('should render a link to the document', () => {
      props.doc = Immutable.fromJS({_id: '1', title: 'test', processed: true});
      render();
      let link = component.find('.view').find(Link);
      expect(link.props().to).toBe('/document/1');
    });
  });
});
