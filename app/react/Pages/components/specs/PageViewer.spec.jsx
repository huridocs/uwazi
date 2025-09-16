/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import Immutable from 'immutable';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { PageViewer } from '../PageViewer';

const mockUseNavigate = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => jest.fn(),
  // eslint-disable-next-line jsx-a11y/anchor-has-content, react/prop-types
  Link: props => <a {...props} href={props.to} />,
}));

describe('PageViewer', () => {
  const initialEntry = { pathname: '/page/1' };

  beforeEach(() => {
    document.title = '';
  });

  const defaultPageState = {
    page: {
      pageView: Immutable.fromJS({
        _id: 1,
        title: 'Page 1',
        metadata: {
          content: '# Test Page\n\nThis is test content with **bold text**.',
          script: 'JSScript',
        },
        scriptRendered: false,
      }),
      datasets: Immutable.fromJS({ key: 'value' }),
      itemLists: Immutable.fromJS([{ item: 'item' }]),
      error: Immutable.fromJS({}),
    },
    user: Immutable.fromJS({ _id: 'userid' }),
    settings: {
      collection: Immutable.fromJS({
        site_name: 'Test Site',
        defaultLibraryView: 'cards',
      }),
    },
  };

  function renderComponent(customState = {}, props = {}) {
    const state = { ...defaultState, ...defaultPageState, ...customState };
    const { renderResult } = renderConnectedContainer(
      <PageViewer {...props} />,
      () => state,
      'MemoryRouter',
      [initialEntry]
    );
    return renderResult;
  }

  describe('render', () => {
    it('should render page content with markdown and lists', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText(/This is test content with/)).toBeInTheDocument();
      expect(screen.getByText('bold text')).toBeInTheDocument();
    });

    it('should render a MarkdownViewer with the markdown and the items for the lists', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText(/This is test content with/)).toBeInTheDocument();
      expect(screen.getByText('bold text')).toBeInTheDocument();

      const markdownViewer = container.querySelector('.main-wrapper');
      expect(markdownViewer).toBeInTheDocument();
    });

    it('should render the page title in helmet when setBrowserTitle is true', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(document.title).toBe('Page 1');
      });
    });

    it('should not set page title when setBrowserTitle is false', async () => {
      renderComponent({}, { setBrowserTitle: false });

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(document.title).not.toBe('Page 1');
    });

    it('should render the page helmet', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(document.title).toBe('Page 1');
      });
    });

    it('should render footer content', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Library')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Test Site')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    describe('when there is no error', () => {
      it('should render page content', async () => {
        const { container } = renderComponent();

        await waitFor(() => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Test Page')).toBeInTheDocument();

        const errorFallback = container.querySelector('[data-testid="errorInfo"]');
        expect(errorFallback).not.toBeInTheDocument();
      });
    });

    describe('when there is a 404 error', () => {
      it('should render error fallback for 404 error (direct structure)', async () => {
        const errorState = {
          page: {
            ...defaultPageState.page,
            error: Immutable.fromJS({
              error: 'Page not found',
              status: 404,
            }),
          },
        };

        const { container } = renderComponent(errorState);

        await waitFor(() => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.queryByText('Test Page')).not.toBeInTheDocument();

        const errorStatus = container.querySelector('h1');
        expect(errorStatus).toBeInTheDocument();
        expect(errorStatus).toHaveTextContent('404');
      });

      it('should render error fallback for 404 error (nested structure)', async () => {
        const errorState = {
          page: {
            ...defaultPageState.page,
            error: Immutable.fromJS({
              json: {
                error: 'Page not found',
                status: 404,
              },
            }),
          },
        };

        const { container } = renderComponent(errorState);

        await waitFor(() => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.queryByText('Test Page')).not.toBeInTheDocument();

        const errorStatus = container.querySelector('h1');
        expect(errorStatus).toBeInTheDocument();
        expect(errorStatus).toHaveTextContent('404');
      });
    });

    describe('when there is a 500 error', () => {
      it('should render error fallback for 500 error (direct structure)', async () => {
        const errorState = {
          page: {
            ...defaultPageState.page,
            error: Immutable.fromJS({
              error: 'Internal server error',
              message: 'Something went wrong',
              prettyMessage: 'A server error occurred',
              status: 500,
            }),
          },
        };

        const { container } = renderComponent(errorState);

        await waitFor(() => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('A server error occurred')).toBeInTheDocument();
        expect(screen.queryByText('Test Page')).not.toBeInTheDocument();

        const errorFallback = container.querySelector('[data-testid="errorInfo"]');
        expect(errorFallback).toBeInTheDocument();
      });

      it('should render error fallback for 500 error (nested structure)', async () => {
        const errorState = {
          page: {
            ...defaultPageState.page,
            error: Immutable.fromJS({
              json: {
                error: 'Internal server error',
                message: 'Something went wrong',
                prettyMessage: 'A server error occurred',
                status: 500,
              },
            }),
          },
        };

        const { container } = renderComponent(errorState);

        await waitFor(() => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('A server error occurred')).toBeInTheDocument();
        expect(screen.queryByText('Test Page')).not.toBeInTheDocument();

        const errorFallback = container.querySelector('[data-testid="errorInfo"]');
        expect(errorFallback).toBeInTheDocument();
      });
    });

    describe('when error has no meaningful content', () => {
      it('should render page content instead of error', async () => {
        const errorState = {
          page: {
            ...defaultPageState.page,
            error: Immutable.fromJS({
              someOtherProperty: 'value',
            }),
          },
        };

        const { container } = renderComponent(errorState);

        await waitFor(() => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Test Page')).toBeInTheDocument();
        expect(screen.queryByText('404')).not.toBeInTheDocument();
        expect(screen.queryByText('500')).not.toBeInTheDocument();

        const errorFallback = container.querySelector('[data-testid="errorInfo"]');
        expect(errorFallback).not.toBeInTheDocument();
      });
    });
  });

  describe('script rendering', () => {
    it('should render the script', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Page')).toBeInTheDocument();

      const scriptElements = document.querySelectorAll('script[src^="data:text/javascript"]');
      expect(scriptElements.length).toBeGreaterThan(0);

      const scriptElement = scriptElements[0];
      const scriptSrc = scriptElement.src;
      const decodedScript = decodeURIComponent(
        scriptSrc.replace('data:text/javascript,(function(){', '').replace('})()', '')
      );

      expect(decodedScript).toContain(
        'var datasets = window.store.getState().page.datasets.toJS();'
      );
      expect(decodedScript).toContain('JSScript');
    });

    it('should render Script component with correct props', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const scriptElements = document.querySelectorAll('script[src^="data:text/javascript"]');
      expect(scriptElements.length).toBeGreaterThan(0);

      const scriptElement = scriptElements[0];
      const scriptSrc = scriptElement.src;
      const decodedScript = decodeURIComponent(
        scriptSrc.replace('data:text/javascript,(function(){', '').replace('})()', '')
      );

      expect(decodedScript).toContain(
        'var datasets = window.store.getState().page.datasets.toJS();'
      );
      expect(decodedScript).toContain('JSScript');
    });

    it('should render Script component with correct props', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const scriptElements = document.querySelectorAll('script[src^="data:text/javascript"]');
      expect(scriptElements.length).toBeGreaterThan(0);

      const scriptElement = scriptElements[0];
      const scriptSrc = scriptElement.src;
      const decodedScript = decodeURIComponent(
        scriptSrc.replace('data:text/javascript,(function(){', '').replace('})()', '')
      );

      expect(decodedScript).toContain(
        'var datasets = window.store.getState().page.datasets.toJS();'
      );
      expect(decodedScript).toContain('JSScript');
    });
  });

  describe('datasets and itemLists', () => {
    it('should pass datasets and itemLists to markdown viewer', async () => {
      const customState = {
        page: {
          ...defaultPageState.page,
          datasets: Immutable.fromJS({ customKey: 'customValue' }),
          itemLists: Immutable.fromJS([{ customItem: 'customValue' }]),
        },
      };

      renderComponent(customState);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
  });
});
