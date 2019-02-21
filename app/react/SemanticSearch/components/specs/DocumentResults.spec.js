import React from 'react';
import { DocumentResults } from '../DocumentResults';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

describe('DocumentResults', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({}),
      filters: { threshold: 10 },
      selectTab: jasmine.createSpy('selectTab'),
      selectSnippet: jasmine.createSpy('selectSnippet')
    };

    component = shallow(<DocumentResults {...props}/>);
  });

  describe('render', () => {
    it('should render a result', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
