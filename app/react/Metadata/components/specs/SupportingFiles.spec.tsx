import React from 'react';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import { shallow, ShallowWrapper } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { SupportingFiles } from '../SupportingFiles';

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

const entity2 = {
  _id: 'entity2_id',
  sharedId: 'entity2_sharedId',
  attachments: [
    {
      _id: 'file1',
      originalname: 'file1.jpg',
      mimetype: 'image/jpeg',
      filename: '1634043075618nraarbdu2ko.jpg',
      size: 2305089,
      entity: 'entity2_sharedId',
      type: 'attachment',
      creationDate: 1634043075634,
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
  entityView: {
    entity: Immutable.fromJS(entity2),
  },
});

describe('Supporting files', () => {
  let component: ShallowWrapper;

  const render = (storeKey?: string) => {
    component = shallow(
      <Provider store={store}>
        <SupportingFiles storeKey={storeKey} />
      </Provider>
    )
      .dive()
      .dive();
  };
  it('should display existing attachments', () => {
    render('library');
    expect(component.find('.attachment-thumbnail')).toHaveLength(2);

    render();
    expect(component.find('.attachment-thumbnail')).toHaveLength(1);
  });

  it('should allow renaming attachments', () => {});

  it('should allow deleting attachments', () => {});
});
