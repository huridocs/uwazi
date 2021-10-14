import React from 'react';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import { shallow, ShallowWrapper } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

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

  const render = () => {
    component = shallow(
      <Provider store={store}>
        <MetadataForm
          model="library.sidepanel.metadata"
          template={templates.get(0)}
          templateOptions={Immutable.fromJS([
            { label: 'template1', value: 'templateId' },
            { label: 'template2', value: 'templateId2' },
          ])}
          thesauris={Immutable.fromJS([])}
          storeKey="library"
        />
      </Provider>
    );
  };

  describe('on edit', () => {
    it('should display existing supporting files when editing on the sidepanel', () => {
      render();
      expect(
        component
          .dive()
          .find('Connect(SupportingFiles)')
          .dive()
          .dive()
          .find('.attachment')
      ).toHaveLength(2);
    });

    it('', () => {
      throw new Error('should allow renaming supporting files');
    });

    it('', () => {
      throw new Error('should allow deleting supporting files');
    });

    it('', () => {
      throw new Error('should contemplate template changes');
    });
  });
});
