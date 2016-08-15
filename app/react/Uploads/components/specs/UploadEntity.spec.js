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
      edit: jasmine.createSpy('edit'),
      finishEdit: jasmine.createSpy('finishEdit'),
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

  it('should not pass active prop if not metadataBeingEdited', () => {
    render();
    expect(component.find(RowList.Item).props().active).toBeUndefined();
  });

  it('should pass active prop true if metadataBeingEdited its the same', () => {
    props = {
      entity: Immutable.fromJS({_id: 'entityId', title: 'title'}),
      metadataBeingEdited: {_id: 'entityId'}
    };
    render();
    expect(component.find(RowList.Item).props().active).toBe(true);
  });

  it('should pass active prop false if metadataBeingEdited its not the same', () => {
    props = {
      entity: Immutable.fromJS({_id: 'entityId', title: 'title'}),
      metadataBeingEdited: {_id: 'anotherId'}
    };
    render();
    expect(component.find(RowList.Item).props().active).toBe(false);
  });

  describe('onClick', () => {
    it('should edit', () => {
      render();

      component.find(RowList.Item).simulate('click');
      expect(props.edit).toHaveBeenCalledWith(props.entity.toJS());
    });

    describe('when clicking on the same document being edited', () => {
      it('should finishEdit', () => {
        props.metadataBeingEdited = {_id: 'entityId'};
        render();

        component.find(RowList.Item).simulate('click');
        expect(props.finishEdit).toHaveBeenCalled();
        expect(props.edit).not.toHaveBeenCalled();
        expect(props.loadEntity).not.toHaveBeenCalled();
      });
    });
  });
});
