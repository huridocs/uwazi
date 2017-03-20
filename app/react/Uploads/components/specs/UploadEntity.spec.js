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
      loadInReduxForm: jasmine.createSpy('loadInReduxForm'),
      onClick: jasmine.createSpy('onClick')
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
    it('should call onClick prop', () => {
      render();
      component.find(RowList.Item).simulate('click', {metaKey: false, ctrlKey: false});
      expect(props.onClick).toHaveBeenCalled();
    });
  });
});
