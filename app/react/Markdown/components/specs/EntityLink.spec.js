import React from 'react';
import { shallow } from 'enzyme';

import EntityLink from '../EntityLink.js';

describe('EntityLink', () => {
  let props;

  beforeEach(() => {
    props = {
      entity: { _id: '123', sharedId: 'abc' },
      children: 'I want this as the link content'
    };
  });

  it('should generate a link based on the entity sharedId and if it has file or not', () => {
    expect(shallow(<EntityLink {...props}/>)).toMatchSnapshot();
  });

  it('should generate a link to the document viewer when it has file', () => {
    props.entity.file = {};
    expect(shallow(<EntityLink {...props}/>)).toMatchSnapshot();
  });
});
