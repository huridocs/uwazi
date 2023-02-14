import React from 'react';
import { shallow } from 'enzyme';
import EntityLink from '../EntityLink.js';
import PagesContext from '../Context';

describe('EntityLink', () => {
  let props;
  let entity;

  beforeEach(() => {
    entity = { _id: '123', sharedId: 'abc' };
    props = {
      children: 'I want this as the link content',
    };
  });

  it('should generate a link based on the entity sharedId and if it has file or not', () => {
    const component = shallow(
      <PagesContext.Provider value={entity}>
        <EntityLink {...props} />
      </PagesContext.Provider>
    )
      .dive()
      .dive();

    expect(component).toMatchSnapshot();
  });
});
