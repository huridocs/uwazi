/**
 * @jest-environment jsdom
 */

import React from 'react';
import fetchMock from 'fetch-mock';
import { renderConnectedContainer } from 'app/utils/test/renderConnected';
import { act, fireEvent } from '@testing-library/react';
import * as ReactPlayer from 'react-player';

import MarkdownMedia from '../MarkdownMedia';

describe('MarkdownMedia', () => {
  let props;
  let renderResult;

  const mockedCreateObjectURL = jest.fn();
  const mockedRevokeObjectURL = jest.fn();

  const blob = new Blob([''], { type: 'video/mp4"' });

  beforeAll(() => {
    props = {
      config:
        '(https://www.vimeo.com/253530307, {"timelinks": {"02:10": "A rude awakening", "05:30": "Finally, you are up!"}})',
    };
    fetchMock.mock('https://www.vimeo.com/253530307', {
      body: blob,
      sendAsJson: false,
    });
    URL.createObjectURL = mockedCreateObjectURL;
    mockedCreateObjectURL.mockReturnValue('blob:abc');
    URL.revokeObjectURL = mockedRevokeObjectURL;
  });

  beforeEach(() => {
    props = {
      config:
        '(https://www.vimeo.com/253530307, {"timelinks": {"02:10": "A rude awakening", "05:30": "Finally, you are up!"}})',
    };
  });

  afterAll(() => {
    mockedCreateObjectURL.mockReset();
    mockedRevokeObjectURL.mockReset();
  });

  const render = async () => {
    await act(() => {
      ({ renderResult } = renderConnectedContainer(<MarkdownMedia {...props} />));
    });
  };

  describe('render', () => {
    it('should render an iframe with the correct video id', async () => {
      await render();
      const response = await fetch('https://www.vimeo.com/253530307');
      const expectedBlob = await response.blob();
      expect(mockedCreateObjectURL).toHaveBeenCalledWith(expectedBlob);
      expect(renderResult.container.getElementsByClassName('react-player')[0].children[0].src).toBe(
        'blob:abc'
      );
      expect(renderResult.container).toMatchSnapshot();
      renderResult.unmount();
      expect(mockedCreateObjectURL).toHaveBeenCalledWith(expectedBlob);
    });

    it('should use compact class name if compact prop is set', async () => {
      props.compact = true;
      await render();
      expect(renderResult.container).toMatchSnapshot();
    });

    describe('Video timeline', () => {
      it('should render the timelinks', async () => {
        await render();
        const links = renderResult.container.getElementsByClassName('timelink');
        expect(links.length).toBe(2);
      });

      it('should interact with the player', async () => {
        const MockReactPlayer = p => <div {...p}>ReactPlayer</div>;

        jest
          .spyOn(ReactPlayer, 'default')
          .mockImplementation(componentProps => <MockReactPlayer {...componentProps} />);

        await render();
        const firstTimeLink = await renderResult.container.getElementsByClassName(
          'timelink-icon'
        )[0];
        const secondTimeLink = renderResult.container.getElementsByClassName('timelink-icon')[1];

        await act(() => {
          fireEvent.click(secondTimeLink);
        });
        await act(() => {
          expect(renderResult.container).toMatchSnapshot();
        });

        await act(() => {
          fireEvent.click(firstTimeLink);
        });
        await act(() => {
          expect(renderResult.container).toMatchSnapshot();
        });
      });
    });
  });
});
