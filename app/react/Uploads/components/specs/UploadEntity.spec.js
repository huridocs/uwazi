import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';

import {UploadEntity} from 'app/Uploads/components/UploadEntity';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';

describe('UploadEntity', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      entity: Immutable.fromJS({_id: 'entityId', title: 'title', template: 'templateId'}),
      templates: Immutable.fromJS([{templates: 'templates'}]),
      editEntity: jasmine.createSpy('editEntity'),
      finishEditEntity: jasmine.createSpy('finishEdit'),
      loadEntity: jasmine.createSpy('loadEntity')
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
    expect(component.find(ItemFooter.Label).props().status).toBe('success');
  });

  it('should not pass active prop if not entityBeingEdited', () => {
    render();
    expect(component.find(RowList.Item).props().active).toBeUndefined();
  });

  it('should pass active prop true if entityBeingEdited its the same', () => {
    props = {
      entity: Immutable.fromJS({_id: 'entityId', title: 'title'}),
      entityBeingEdited: 'entityId'
    };
    render();
    expect(component.find(RowList.Item).props().active).toBe(true);
  });

  it('should pass active prop false if entityBeingEdited its not the same', () => {
    props = {
      entity: Immutable.fromJS({_id: 'entityId', title: 'title'}),
      entityBeingEdited: 'anotherId'
    };
    render();
    expect(component.find(RowList.Item).props().active).toBe(false);
  });

  describe('onClick', () => {
    it('should editEntity', () => {
      render();

      component.find(RowList.Item).simulate('click');
      expect(props.editEntity).toHaveBeenCalledWith(props.entity.toJS(), props.templates.toJS());
    });

    describe('when clicking on the same document being edited', () => {
      it('should finishEdit', () => {
        props.entityBeingEdited = 'entityId';
        render();

        component.find(RowList.Item).simulate('click');
        expect(props.finishEditEntity).toHaveBeenCalled();
        expect(props.editEntity).not.toHaveBeenCalled();
        expect(props.loadEntity).not.toHaveBeenCalled();
      });
    });
  });
});
