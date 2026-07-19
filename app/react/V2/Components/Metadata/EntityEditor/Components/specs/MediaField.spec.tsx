/* eslint-disable react/no-multi-comp */
/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading, no-param-reassign */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { MediaField } from '../MediaField.js';

const mockSeekTo = jest.fn();
const mockGetCurrentTime = jest.fn(() => 125);

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('#V2/Components/UI/index.js', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  MediaPlayer: ({
    playerRef,
    playing,
  }: {
    playerRef?: React.MutableRefObject<{
      seekTo: typeof mockSeekTo;
      getCurrentTime: typeof mockGetCurrentTime;
    } | null>;
    playing?: boolean;
  }) => {
    if (playerRef) {
      playerRef.current = { seekTo: mockSeekTo, getCurrentTime: mockGetCurrentTime };
    }

    return <div data-testid="media-player" data-playing={playing ? 'true' : 'false'} />;
  },
}));

jest.mock('../MediaPickerModal', () => ({
  MediaPickerModal: () => null,
}));

type FormValues = { media: string };

const mediaWithTimelink = '(/api/files/video.mp4, {"timelinks":{"00:01:02":"intro"}})';

const Harness = ({ defaultValue }: { defaultValue: string }) => {
  const form = useForm<FormValues>({ defaultValues: { media: defaultValue } });

  return (
    <FormProvider {...form}>
      <MediaField
        context="Template"
        label="Video"
        field="media"
        mode="media"
        attachments={[]}
        pendingAttachments={[]}
        entitySharedId="entity1"
        onRegisterPendingAttachment={jest.fn()}
        onRemovePendingAttachment={jest.fn()}
      />
      <output data-testid="form-value">{form.watch('media')}</output>
    </FormProvider>
  );
};

describe('MediaField timelinks', () => {
  beforeEach(() => {
    mockSeekTo.mockClear();
    mockGetCurrentTime.mockClear();
    mockGetCurrentTime.mockReturnValue(125);
  });

  it('renders time inputs as number fields with step 1', () => {
    render(<Harness defaultValue={mediaWithTimelink} />);

    const hours = screen.getByLabelText('Hours');
    const minutes = screen.getByLabelText('Minutes');
    const seconds = screen.getByLabelText('Seconds');

    expect(hours).toHaveAttribute('type', 'number');
    expect(hours).toHaveAttribute('step', '1');
    expect(minutes).toHaveAttribute('type', 'number');
    expect(minutes).toHaveAttribute('step', '1');
    expect(minutes).toHaveAttribute('max', '59');
    expect(seconds).toHaveAttribute('type', 'number');
    expect(seconds).toHaveAttribute('step', '1');
    expect(seconds).toHaveAttribute('max', '59');
  });

  it('adds a timelink from the player current time', () => {
    render(<Harness defaultValue="/api/files/video.mp4" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockGetCurrentTime).toHaveBeenCalled();
    expect(screen.getByTestId('form-value')).toHaveTextContent(
      '(/api/files/video.mp4, {"timelinks":{"00:02:05":""}})'
    );
  });

  it('allows editing existing timelink times on blur', () => {
    render(<Harness defaultValue={mediaWithTimelink} />);

    const minutes = screen.getByLabelText('Minutes');
    fireEvent.change(minutes, { target: { value: '7' } });
    fireEvent.blur(minutes);

    expect(screen.getByTestId('form-value')).toHaveTextContent(
      '(/api/files/video.mp4, {"timelinks":{"00:07:02":"intro"}})'
    );
  });

  it('limits the label to 40 characters', () => {
    render(<Harness defaultValue={mediaWithTimelink} />);

    expect(screen.getByPlaceholderText('Label')).toHaveAttribute('maxLength', '40');
  });

  it('seeks and starts playback when clicking play on a timelink', () => {
    render(<Harness defaultValue={mediaWithTimelink} />);

    fireEvent.click(screen.getByRole('button', { name: '00:01:02' }));

    expect(mockSeekTo).toHaveBeenCalledWith(62, 'seconds');
    expect(screen.getByTestId('media-player')).toHaveAttribute('data-playing', 'true');
  });
});
