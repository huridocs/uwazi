import React from 'react';

import { shallow } from 'enzyme';
import { ResultsSidePanel } from '#app/SemanticSearch/components/ResultsSidePanel.jsx';

describe('DocumentResults', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ResultsSidePanel />);
  });

  describe('render', () => {
    it('should render results filters panel and document side panel', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
