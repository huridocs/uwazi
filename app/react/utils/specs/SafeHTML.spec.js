import React from 'react';

import { shallow } from 'enzyme';

import SafeHTML from '../SafeHTML';

describe('SafeHTML', () => {
  it('should transform <snippet/> tag to <b> (every other tag should be treated as text)', () => {
    const component = shallow(
      <SafeHTML>{'text with <span>some</span> <b>html</b> tags'}</SafeHTML>
    );
    expect(component).toMatchSnapshot();
  });
});
