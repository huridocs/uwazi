import Immutable from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import MarkdownViewer from 'app/Markdown';

import { PageViewer } from '../PageViewer';
import Script from '../Script';

describe('PageViewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      page: Immutable.fromJS({
        _id: 1,
        title: 'Page 1',
        metadata: /*non-metadata-object*/ { content: 'MarkdownContent', script: 'JSScript' },
      }),
      itemLists: Immutable.fromJS([{ item: 'item' }]),
      datasets: Immutable.fromJS({ key: 'value' }),
    };
  });

  const render = () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    component = shallow(<PageViewer.WrappedComponent {...props} />, { context });
  };

  describe('render', () => {
    beforeEach(() => {
      render();
    });

    it('should render a MarkdownViewer with the markdown and the items for the lists', () => {
      expect(component.find(MarkdownViewer).props().markdown).toBe('MarkdownContent');
      expect(component.find(MarkdownViewer).props().lists).toEqual([{ item: 'item' }]);
    });

    it('should render the script, appending the datasets', () => {
      const scriptElement = component.find(Script);
      expect(scriptElement).toMatchSnapshot();
    });
  });
});
