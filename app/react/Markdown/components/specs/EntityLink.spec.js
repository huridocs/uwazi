/** @format */

import React from 'react';
import { shallow } from 'enzyme';

import { Provider } from 'react-redux';
import { createStore } from 'redux';
import EntityLink from '../EntityLink.js';
import PagesContext from '../Context';
import { I18NLink } from 'app/I18N';

describe('EntityLink', () => {
  let props;
  let entity;
  const store = createStore(() => ({}));

  beforeEach(() => {
    entity = { _id: '123', sharedId: 'abc' };
    props = {
      children: 'I want this as the link content',
    };
  });

  it('should generate a link based on the entity sharedId and if it has file or not', () => {
    const component = shallow(
      <Provider store={store}>
        <PagesContext.Provider value={entity}>
          <EntityLink {...props} />
        </PagesContext.Provider>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
