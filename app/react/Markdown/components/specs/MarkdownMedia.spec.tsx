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

  beforeEach(() => {
    URL.createObjectURL = mockedCreateObjectURL;
    mockedCreateObjectURL.mockReturnValue('blob:abc');
    URL.revokeObjectURL = mockedRevokeObjectURL;
    fetchMock.mock('/api/files/1683080859038pwqi670wk7r.mp4', {}, { overwriteRoutes: true });
    fetchMock.mock(
      'https://www.vimeo.com/253530307',
      { throws: 'CORS error' },
      { overwriteRoutes: true }
    );
  });

  afterEach(() => {
    mockedCreateObjectURL.mockReset();
    mockedRevokeObjectURL.mockReset();
  });
  const onTimeLinkAdded = jest.fn();
  const render = async (
    options: { compact?: boolean; editing?: boolean } = { compact: false, editing: false },
    URL = '/api/files/1683080859038pwqi670wk7r.mp4'
  ) => {
    const props = {
      ...options,
      onTimeLinkAdded,
      config: `${URL}, {"timelinks": {"02:10": "A rude awakening", "05:30": "Finally, you are up!"}})`,
    };
    await act(() => {
      ({ renderResult } = renderConnectedContainer(
        <MarkdownMedia {...props} />,
        () => defaultState
      ));
    });
  };

  describe('render', () => {
    describe('uploaded files', () => {
      it('should render an iframe that displays the video from the blob resource', async () => {
        await render();
        expect(renderResult.asFragment()).toMatchSnapshot();
        expect(mockedCreateObjectURL.mock.calls[0].toString()).toEqual('[object Blob]');
      });

      it('should revoke the created URL ', async () => {
        await act(async () => {
          await render();
        });
        await act(() => {
          renderResult.unmount();
        });

        expect(mockedRevokeObjectURL).toHaveBeenCalledWith('blob:abc');
      });

      it('should render the edition mode', async () => {
        await render({ editing: true });
        expect(renderResult.asFragment()).toMatchSnapshot();
      });
      it('should use compact class name if compact prop is set', async () => {
        await render({ compact: true });
        expect(renderResult.asFragment()).toMatchSnapshot();
      });
    });
    describe('external URLs', () => {
      it('should render an iframe with and point to the external resource', async () => {
        await render({ compact: false, editing: false }, 'https://www.vimeo.com/253530307');
        expect(renderResult.asFragment()).toMatchSnapshot();
        expect(mockedCreateObjectURL).not.toBeCalled();
      });
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

      const playTimeLink = async (
        index: number,
        duration: number,
        status: string,
        spySeekTo: jest.SpyInstance
      ) => {
        const timeLink = renderResult.container.getElementsByClassName('timelink-icon')[index];
        await act(async () => {
          fireEvent.click(timeLink);
          expect(spySeekTo).toHaveBeenCalledWith(duration);
          const icon = renderResult.container.getElementsByClassName('timelink-icon')[index];
          expect(icon.children[0].getAttribute('data-icon')).toEqual(status);
        });
      };
      it('should interact with the player through time line icon', async () => {
        await render();
        const spySeekTo = jest.spyOn(playerRef.current, 'seekTo');
        await playTimeLink(0, 2 * 60 + 10, 'play', spySeekTo);
        await playTimeLink(1, 5 * 60 + 30, 'play', spySeekTo);
        await playTimeLink(1, 5 * 60 + 30, 'pause', spySeekTo);
      });
      const editTimeLink = async (inputs: HTMLElement[], field: string, value: string) => {
        await act(async () => {
          fireEvent.change(inputs.find(x => (x as HTMLInputElement).name === field)!, {
            target: { value },
          });
        });
      };

      it('should allow to add a timelink', async () => {
        await render({ editing: true });
        jest.spyOn(playerRef.current, 'getCurrentTime').mockReturnValue(27784);
        const addLinkBtn = screen.getByText('Add timelink').parentElement!;
        await act(async () => {
          fireEvent.click(addLinkBtn);
        });
        await act(async () => {
          await editTimeLink(
            screen.getAllByRole('textbox'),
            'timelines.2.label',
            'Check at this!'
          )!;
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

      it('should allow to edit a saved timelink', async () => {
        await render({ editing: true });
        const removeTimeLinkButtons = screen.getAllByRole('button', { name: 'Remove timelink' });

        await act(async () => {
          fireEvent.click(removeTimeLinkButtons[0]);
        });
        await act(async () => {
          const inputs = screen.getAllByRole('textbox');
          await editTimeLink(inputs, 'timelines.0.timeHours', '04');
          await editTimeLink(inputs, 'timelines.0.timeMinutes', '42');
          await editTimeLink(inputs, 'timelines.0.timeSeconds', '56');
        });
        await act(async () => {
          expect(onTimeLinkAdded).toHaveBeenCalledWith([
            {
              label: 'Finally, you are up!',
              timeHours: '04',
              timeMinutes: '42',
              timeSeconds: '56',
            },
          ]);
        });
      });

      it('should allow to edit a new timelink', async () => {
        await render({ editing: true });
        const addLinkBtn = screen.getByText('Add timelink').parentElement!;
        await act(async () => {
          fireEvent.click(addLinkBtn);
        });
        const updatedInputs = screen.getAllByRole('textbox');

        await editTimeLink(updatedInputs, 'timelines.2.timeHours', '12');
        await editTimeLink(updatedInputs, 'timelines.2.timeMinutes', '17');
        await editTimeLink(updatedInputs, 'timelines.2.timeSeconds', '34');
        await editTimeLink(updatedInputs, 'timelines.2.label', 'new check point');
        expect(onTimeLinkAdded).toHaveBeenCalledWith([
          { label: 'A rude awakening', timeHours: '00', timeMinutes: '02', timeSeconds: '10' },
          {
            label: 'Finally, you are up!',
            timeHours: '00',
            timeMinutes: '05',
            timeSeconds: '30',
          },
          { label: 'new check point', timeHours: '12', timeMinutes: '17', timeSeconds: '34' },
        ]);
      });

      it('should update the default new timelink', async () => {
        await render({ editing: true });

        fireEvent.change(renderResult.container.getElementsByClassName('timestamp-hours')[2], {
          target: { value: 11 },
        });
        fireEvent.change(renderResult.container.getElementsByClassName('timestamp-minutes')[2], {
          target: { value: 36 },
        });
        fireEvent.change(renderResult.container.getElementsByClassName('timestamp-seconds')[2], {
          target: { value: 45 },
        });
        fireEvent.change(renderResult.container.getElementsByClassName('timestamp-label')[2], {
          target: { value: 'default check point' },
        });

        fireEvent.click(renderResult.container.getElementsByClassName('new-timestamp-btn')[0]);
        expect(onTimeLinkAdded).toHaveBeenCalledWith([
          { label: 'A rude awakening', timeHours: '00', timeMinutes: '02', timeSeconds: '10' },
          {
            label: 'Finally, you are up!',
            timeHours: '00',
            timeMinutes: '05',
            timeSeconds: '30',
          },
          {
            label: 'default check point',
            timeHours: '11',
            timeMinutes: '36',
            timeSeconds: '45',
          },
        ]);
      });
    });
  });
});
