/**
 * @jest-environment jsdom
 */
import React from 'react';
import { RenderResult, fireEvent, screen, act } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import MarkdownMedia from '../MarkdownMedia';

let playerRef: { current: { seekTo: any } };

const mockUseRef = jest.fn().mockImplementation(args => {
  const actual = jest.requireActual<typeof React>('react')
    ? jest.requireActual<typeof React>('react').useRef(args)
    : null;
  if (args === null && actual) {
    playerRef = actual;
    return actual;
  }
  return actual;
});

jest.mock('react', () => ({
  ...jest.requireActual<typeof React>('react'),
  useRef: (args: any) => mockUseRef(args),
}));

describe('MarkdownMedia', () => {
  let renderResult: RenderResult;
  const mockedCreateObjectURL: jest.Mock = jest.fn();
  const mockedRevokeObjectURL: jest.Mock = jest.fn();

  beforeAll(() => {
    URL.createObjectURL = mockedCreateObjectURL;
    mockedCreateObjectURL.mockReturnValue('blob:abc');
    URL.revokeObjectURL = mockedRevokeObjectURL;
    fetchMock.mock('https://www.vimeo.com/253530307', {}, { overwriteRoutes: true });
  });

  afterAll(() => {
    mockedCreateObjectURL.mockReset();
    mockedRevokeObjectURL.mockReset();
  });

  const render = async (compact = false) => {
    const props = {
      compact,
      config:
        '(https://www.vimeo.com/253530307, {"timelinks": {"02:10": "A rude awakening", "05:30": "Finally, you are up!"}})',
    };
    await act(() => {
      ({ renderResult } = renderConnectedContainer(
        <MarkdownMedia {...props} />,
        () => defaultState
      ));
    });
    expect(mockedCreateObjectURL.mock.calls[0].toString()).toEqual('[object Blob]');
  };

  describe('render', () => {
    it('should render an iframe with the correct video id', async () => {
      await render();
      expect(renderResult.asFragment()).toMatchSnapshot();
    });

    it('should use compact class name if compact prop is set', async () => {
      await render(true);
      expect(renderResult.asFragment()).toMatchSnapshot();
    });

    describe('Video timeline', () => {
      it('should render the timelinks', async () => {
        await render();
        const links = renderResult.container.getElementsByClassName('timelink');
        expect(links.length).toBe(2);
      });

      it('should interact with the player', async () => {
        await render();
        const spySeekTo = jest.spyOn(playerRef.current, 'seekTo');
        const firstTimeLink = screen.getAllByText('A rude awakening')[0];

        await act(async () => {
          fireEvent.click(firstTimeLink);
          expect(spySeekTo).toHaveBeenCalledWith(2 * 60 + 10);
        });
        const secondTimeLink = screen.getAllByText('Finally, you are up!')[0];

        await act(async () => {
          fireEvent.click(secondTimeLink);
          expect(spySeekTo).toHaveBeenCalledWith(5 * 60 + 30);
        });
      });
    });
  });
});
