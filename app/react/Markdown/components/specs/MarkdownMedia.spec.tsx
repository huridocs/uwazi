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
  };

  describe('render', () => {
    it('should render an iframe with the correct video id', async () => {
      await render();
      expect(renderResult.asFragment()).toMatchSnapshot();
      expect(mockedCreateObjectURL.mock.calls[0].toString()).toEqual('[object Blob]');
    });
    it('should revoke the created URL and reset it to empty', async () => {
      await render();
      renderResult.unmount();
      expect(mockedRevokeObjectURL).toHaveBeenCalledWith('');
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
      const editTimeLink = async (inputs: HTMLElement[], value: string, field: string) => {
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
            'Check at this!',
            'timelines.2.label'
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
          await editTimeLink(inputs, '04', 'timelines.0.timeHours');
          await editTimeLink(inputs, '42', 'timelines.0.timeMinutes');
          await editTimeLink(inputs, '56', 'timelines.0.timeSeconds');
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
        await editTimeLink(updatedInputs, '12', 'timelines.2.timeHours');
        await editTimeLink(updatedInputs, '17', 'timelines.2.timeMinutes');
        await editTimeLink(updatedInputs, '34', 'timelines.2.timeSeconds');
        await editTimeLink(updatedInputs, 'new check point', 'timelines.2.label');
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
    });
  });
});
