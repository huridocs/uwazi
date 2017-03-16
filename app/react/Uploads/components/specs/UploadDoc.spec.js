import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';

import {UploadDoc} from 'app/Uploads/components/UploadDoc';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';

describe('UploadDoc', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({_id: 'docId', title: 'doc title', template: 'templateId'}),
      templates: Immutable.fromJS([{templates: 'templates'}]),
      onClick: jasmine.createSpy('onClick'),
      loadInReduxForm: jasmine.createSpy('loadInReduxForm'),
      showModal: jasmine.createSpy('showModal')
    };
  });

  let render = () => {
    component = shallow(<UploadDoc {...props} />);
  };

  it('should render the title', () => {
    render();
    expect(component.find(ItemName).children().text()).toBe('doc title');
  });

  describe('showModal', () => {
    it('should not call showModal if modal false', () => {
      render();
      component.instance().showModal(false);
      expect(props.showModal).not.toHaveBeenCalled();
    });
  });

  it('should render success status by default', () => {
    expect(component.find(RowList.Item).props().status).toBe('success');
    expect(component.find(ItemFooter.Label).props().status).toBe('success');
  });

  describe('when document uploaded is false', () => {
    it('should render danger status', () => {
      props = {
        doc: Immutable.fromJS({title: 'doc title', uploaded: false})
      };
      render();
      expect(component.find(RowList.Item).props().status).toBe('danger');
      expect(component.find(ItemFooter.Label).props().status).toBe('danger');
    });
  });

  describe('when document conversion failed', () => {
    it('should render danger status', () => {
      props = {
        doc: Immutable.fromJS({title: 'doc title', uploaded: true, processed: false})
      };
      render();
      expect(component.find(RowList.Item).props().status).toBe('danger');
      expect(component.find(ItemFooter.Label).props().status).toBe('danger');
    });
  });

  describe('when document has uploading progress', () => {
    it('should render info status and the progressBar', () => {
      props = {
        doc: Immutable.fromJS({title: 'doc title', uploaded: false}),
        progress: 0
      };
      render();
      expect(component.find(RowList.Item).props().status).toBe('processing');
      expect(component.find(ItemFooter.ProgressBar).props().progress).toBe(0);
    });
  });

  describe('when document its being processed', () => {
    it('should render info status and the progressBar with 100%', () => {
      props = {
        doc: Immutable.fromJS({title: 'doc title', uploaded: true})
      };
      render();
      expect(component.find(RowList.Item).props().status).toBe('processing');
      expect(component.find(ItemFooter.ProgressBar).props().progress).toBe(100);
    });
  });

  describe('when document has no template', () => {
    it('should render warning status', () => {
      props = {doc: Immutable.fromJS({title: 'doc title', processed: true})};
      render();
      expect(component.find(RowList.Item).props().status).toBe('warning');
    });
  });

  describe('onClick', () => {
    it('should call onClick prop', () => {
      render();
      component.find(RowList.Item).simulate('click', {metaKey: false, ctrlKey: false});
      expect(props.onClick).toHaveBeenCalled();
    });
  });
});
