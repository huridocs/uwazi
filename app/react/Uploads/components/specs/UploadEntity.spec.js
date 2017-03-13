import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';

import {UploadEntity} from 'app/Uploads/components/UploadEntity';
import {RowList, ItemName} from 'app/Layout/Lists';

describe('UploadEntity', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      entity: Immutable.fromJS({_id: 'entityId', title: 'title', template: 'templateId'}),
      templates: Immutable.fromJS([{templates: 'templates'}]),
      edit: jasmine.createSpy('edit'),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      unselectDocument: jasmine.createSpy('unselectDocument'),
      selectDocument: jasmine.createSpy('selectDocument'),
      loadInReduxForm: jasmine.createSpy('loadInReduxForm')
    };
  });

  let render = () => {
    component = shallow(<UploadEntity {...props} />, {context: {confirm: jasmine.createSpy('confirm')}});
  };

  it('should render the title', () => {
    render();
    expect(component.find(ItemName).children().text()).toBe('title');
  });

  it('should render success status by default', () => {
    expect(component.find(RowList.Item).props().status).toBe('success');
  });

  describe('onClick', () => {
    it('should edit', () => {
      render();

      component.find(RowList.Item).simulate('click', {metaKey: false, ctrlKey: false});
      expect(props.selectDocument).toHaveBeenCalledWith(props.entity);
      expect(props.loadInReduxForm).toHaveBeenCalledWith('uploads.metadata', props.entity.toJS(), props.templates.toJS());
    });

    describe('when already selected', () => {
      it('should unselect it', () => {
        props.active = true;
        render();

        component.find(RowList.Item).simulate('click', {metaKey: false, ctrlKey: false});
        expect(props.unselectAllDocuments).toHaveBeenCalled();
        expect(props.loadInReduxForm).not.toHaveBeenCalled();
      });
    });
  });
});
