/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';
import React from 'react';
import { Helmet } from 'react-helmet';
import { shallow } from 'enzyme';

import MarkdownViewer from 'app/Markdown';
import { ErrorFallback } from 'app/V2/Components/ErrorHandling';

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
      error: Immutable.fromJS({}),
    };
  });

  const render = () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    component = shallow(<PageViewer.WrappedComponent {...props} />, { context });
    // Force the component to render completely
    component.update();
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

  describe('error handling', () => {
    describe('when there is no error', () => {
      beforeEach(() => {
        props.error = Immutable.fromJS({});
        render();
      });

      it('should render page content', () => {
        expect(component.find(MarkdownViewer).length).toBe(1);
        expect(component.find(ErrorFallback).length).toBe(0);
      });
    });

    describe('when there is a 404 error', () => {
      beforeEach(() => {
        props.error = Immutable.fromJS({
          error: 'Page not found',
          status: 404,
        });
        render();
      });

      it('should handle error without crashing', () => {
        expect(component.exists()).toBe(true);
        expect(component.children().length).toBeGreaterThan(0);
      });
    });

    describe('when there is a 500 error', () => {
      beforeEach(() => {
        props.error = Immutable.fromJS({
          error: 'Internal server error',
          message: 'Something went wrong',
          prettyMessage: 'A server error occurred',
        });
        render();
      });

      it('should handle error without crashing', () => {
        expect(component.exists()).toBe(true);
        expect(component.children().length).toBeGreaterThan(0);
      });
    });

    describe('when error has no meaningful content', () => {
      beforeEach(() => {
        props.error = Immutable.fromJS({
          someOtherProperty: 'value',
        });
        render();
      });

      it('should render page content instead of error', () => {
        expect(component.find(MarkdownViewer).length).toBe(1);
        expect(component.find(ErrorFallback).length).toBe(0);
      });
    });
  });
});
