import React from 'react';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import { shallow, ShallowWrapper } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { actions, Form } from 'react-redux-form';

import { MetadataForm } from '../MetadataForm';

const templates = Immutable.fromJS([
  {
    name: 'template1',
    _id: 'templateId',
    properties: [{ name: 'field1', label: 'label1', type: 'text' }],
    commonProperties: [{ name: 'title', label: 'Title' }],
  },
  {
    name: 'template2',
    _id: 'templateId2',
    properties: [{ name: 'field1', label: 'label1', type: 'text' }],
    commonProperties: [{ name: 'title', label: 'Title' }],
  },
]);

const entity1 = {
  _id: 'entity_id',
  sharedId: 'entity_sharedId',
  attachments: [
    {
      _id: 'file1',
      originalname: 'file1.jpg',
      mimetype: 'image/jpeg',
      filename: '1634043075618nraarbdu2ko.jpg',
      size: 2305089,
      entity: 'entity_sharedId',
      type: 'attachment',
      creationDate: 1634043075634,
      __v: 0,
    },
    {
      _id: 'file2',
      originalname: 'file2.jpeg',
      mimetype: 'image/jpeg',
      filename: '16340430795962bgts67kme8.jpeg',
      size: 5287,
      entity: 'entity_sharedId',
      type: 'attachment',
      creationDate: 1634043079601,
      __v: 0,
    },
  ],
};

const mockStore = configureMockStore([thunk]);
const store = mockStore({
  library: {
    sidepanel: {
      metadata: entity1,
    },
  },
});

describe('Supporting files', () => {
  let component: ShallowWrapper;
  const onSubmit = jasmine.createSpy('onSubmit');
  const changeTemplate = jasmine.createSpy('changeTemplate');

  const render = () => {
    component = shallow(
      <Provider store={store}>
        <MetadataForm
          model="library.sidepanel.metadata"
          templates={templates}
          template={templates.get(0)}
          templateOptions={Immutable.fromJS([
            { label: 'template1', value: 'templateId' },
            { label: 'template2', value: 'templateId2' },
          ])}
          thesauris={Immutable.fromJS([])}
          metadata={{
            _id: [{ value: 'docId' }],
            template: [{ value: 'templateId' }],
            title: [{ value: 'testTitle' }],
            metadata: [{ value: { field1: 'field1value', field2: 'field2value' } }],
          }}
          storeKey="library"
          onSubmit={onSubmit}
          changeTemplate={changeTemplate}
        />
      </Provider>
    ).dive();
  };

  describe('on edit', () => {
    beforeEach(() => {
      spyOn(actions, 'remove').and.returnValue({ type: 'deleting' });
    });

    it('should display existing supporting files when editing on the sidepanel', () => {
      render();
      expect(
        component
          .find('Connect(SupportingFiles)')
          .dive()
          .dive()
          .find('.attachment')
      ).toHaveLength(2);
    });

    it('should submit with existing supporting files', () => {
      const entity = {
        _id: '123',
        template: 'templateId',
        language: 'en',
        attachments: [{ _id: 'file1', originalname: 'file1.jpeg' }],
      };
      render();
      component.find(Form).simulate('submit', entity);
      expect(onSubmit).toHaveBeenLastCalledWith(entity, 'library.sidepanel.metadata');
    });

    it('should allow deleting supporting files', () => {
      render();
      component
        .find('Connect(SupportingFiles)')
        .dive()
        .dive()
        .find('button')
        .first()
        .simulate('click');
      expect(actions.remove).toHaveBeenCalledWith('library.sidepanel.metadata.attachments', 0);
    });

    it('', () => {
      throw new Error('should contemplate template changes');
    });
  });
});
