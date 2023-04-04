/**
 * @jest-environment jsdom
 */
import React from 'react';
import { RenderResult, fireEvent, screen, act } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import MarkdownMedia from '../MarkdownMedia';

let playerRef: { current: { seekTo: any; getCurrentTime: () => number } };

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

  const onTimeLinkAdded = jest.fn();
  const render = async (
    options: { compact?: boolean; editing?: boolean } = { compact: false, editing: false }
  ) => {
    const props = {
      ...options,
      onTimeLinkAdded,
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
    it('should render the edition mode', async () => {
      await render({ editing: true });
      expect(renderResult.asFragment()).toMatchSnapshot();
    });
    it('should use compact class name if compact prop is set', async () => {
      await render({ compact: true });
      expect(renderResult.asFragment()).toMatchSnapshot();
    });

    describe('Video timeline', () => {
      it('should render the timelinks', async () => {
        await render();
        const links = renderResult.container.getElementsByClassName('timelink');
        expect(links.length).toBe(2);
      });

      it('should interact with the player through time line label', async () => {
        await render();
        const spySeekTo = jest.spyOn(playerRef.current, 'seekTo');
        const firstTimeLink = screen.getByText('A rude awakening').parentElement!;

        await act(async () => {
          fireEvent.click(firstTimeLink);
          expect(spySeekTo).toHaveBeenCalledWith(2 * 60 + 10);
        });
        const secondTimeLink = screen.getByText('Finally, you are up!').parentElement!;

        await act(async () => {
          fireEvent.click(secondTimeLink);
          expect(spySeekTo).toHaveBeenCalledWith(5 * 60 + 30);
        });
      });

      it('should interact with the player through time line icon', async () => {
        await render();
        const spySeekTo = jest.spyOn(playerRef.current, 'seekTo');
        const firstTimeLink = renderResult.container.getElementsByClassName('timelink-icon')[0];

        await act(async () => {
          fireEvent.click(firstTimeLink);
          expect(spySeekTo).toHaveBeenCalledWith(2 * 60 + 10);
          const icon = renderResult.container.getElementsByClassName('timelink-icon')[0];
          expect(icon.children[0].getAttribute('data-icon')).toEqual('play');
        });
        const secondTimeLink = renderResult.container.getElementsByClassName('timelink-icon')[1];

        await act(async () => {
          fireEvent.click(secondTimeLink);
          expect(spySeekTo).toHaveBeenCalledWith(5 * 60 + 30);
          const icon = renderResult.container.getElementsByClassName('timelink-icon')[1];
          expect(icon.children[0].getAttribute('data-icon')).toEqual('play');
        });
        await act(async () => {
          fireEvent.click(secondTimeLink);
          expect(spySeekTo).toHaveBeenCalledWith(5 * 60 + 30);
          const icon = renderResult.container.getElementsByClassName('timelink-icon')[1];
          expect(icon.children[0].getAttribute('data-icon')).toEqual('pause');
        });
      });

      it('should allow to add a timelink', async () => {
        await render({ editing: true });
        jest.spyOn(playerRef.current, 'getCurrentTime').mockReturnValue(27784);
        const addLinkBtn = screen.getByText('Add timelink').parentElement!;
        await act(async () => {
          fireEvent.click(addLinkBtn);
        });
        await act(async () => {
          const labelInput = screen
            .getAllByRole('textbox')
            .find(x => (x as HTMLInputElement).name === 'timelines.2.label')!;
          fireEvent.change(labelInput, { target: { value: 'Check at this!' } });
          expect(onTimeLinkAdded).toHaveBeenCalledWith([
            { label: 'A rude awakening', timeHours: '00', timeMinutes: '02', timeSeconds: '10' },
            {
              label: 'Finally, you are up!',
              timeHours: '00',
              timeMinutes: '05',
              timeSeconds: '30',
            },
            { label: 'Check at this!', timeHours: '07', timeMinutes: '43', timeSeconds: '04' },
          ]);
        });
      });
    });
  });
});
