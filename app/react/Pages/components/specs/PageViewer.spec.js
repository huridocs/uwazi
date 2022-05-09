import Immutable from 'immutable';
import React from 'react';
import { Helmet } from 'react-helmet';
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

    it('should render the script', () => {
      const scriptElement = component.find(Script);
      expect(scriptElement).toMatchSnapshot();
    });

    describe('Helmet', () => {
      it('should render the page helmet', () => {
        expect(component.find(Helmet).find('title').text()).toBe('Page 1');
      });

      it('should not overwrite the page title', () => {
        props.setBrowserTitle = false;
        render();
        expect(component.find(Helmet).length).toBe(0);
      });
    });
  });
});
