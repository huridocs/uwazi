import { Translate } from 'app/I18N';
import React, { createRef, LegacyRef, useState } from 'react';
import { FieldArrayWithId, useFieldArray, useForm } from 'react-hook-form';
import ReactPlayer from 'react-player';
import { Icon } from 'UI';

export interface MarkdownMediaProps {
  compact?: boolean;
  editing?: boolean;
  onTimeLinkAdded?: Function;
  config: string;
}

interface TimeLink {
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  label: string;
}

const propsToConfig = (props: MarkdownMediaProps) => {
  const config = { url: '', options: { timelinks: {} } };

  let parsedProps: any = props.config.replace(/\(|\)/g, '').split(',');
  config.url = parsedProps.shift() as string;

  parsedProps = (parsedProps.join(',') || '{}').replace(/&quot;/g, '"');

  try {
    parsedProps = JSON.parse(parsedProps);
  } catch (error) {
    parsedProps = {};
  }

  config.options = parsedProps;

  return config;
};

const formatTimeLinks = (timelinks: any): TimeLink[] =>
  Object.keys(timelinks).map(key => {
    const timeLink = { timeHours: '00', timeMinutes: '00', timeSeconds: '00', label: '' };
    const splitTimes = key.split(':');
    if (splitTimes.length === 2) {
      [timeLink.timeMinutes, timeLink.timeSeconds] = splitTimes;
    } else {
      [timeLink.timeHours, timeLink.timeMinutes, timeLink.timeSeconds] = splitTimes;
    }
    timeLink.label = timelinks[key] as string;
    return timeLink;
  });

const MarkdownMedia = (props: MarkdownMediaProps) => {
  const [newTimeline, setNewTimeline] = useState<TimeLink>({
    timeHours: '00',
    timeMinutes: '00',
    timeSeconds: '00',
    label: '',
  });
  const { options } = propsToConfig(props);
  const originalTimelinks = formatTimeLinks(options?.timelinks || {});
  const [playingTimelinkIndex, setPlayingTimelinkIndex] = useState<number>(-1);
  const { control, register, getValues } = useForm<{ timelines: TimeLink[] }>({
    defaultValues: { timelines: originalTimelinks },
  });
  const { fields, remove, append } = useFieldArray<{ timelines: TimeLink[] }>({
    control,
    name: 'timelines',
  });

  const playerRef: LegacyRef<ReactPlayer> | undefined = createRef();

  const seekTo = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
  };

  const constructTimelinksString = (timelinks: TimeLink[], url: string) => {
    const timelinksObj = timelinks.reduce((current: any, timelink) => {
      current[`${timelink.timeHours}:${timelink.timeMinutes}:${timelink.timeSeconds}`] =
        timelink.label;
      return current;
    }, {});
    return `(${url}, ${JSON.stringify({ timelinks: timelinksObj })})`;
  };

  const timeLinks = (_timelinks: any) => {
    const timelinks = _timelinks || {};
    return Object.keys(timelinks).map((timeKey, index) => {
      const seconds = timeKey
        .split(':')
        .reverse()
        .reduce((_seconds, n, _index) => _seconds + parseInt(n, 10) * 60 ** _index, 0);

      let displayTime = timeKey;
      if (displayTime.split(':').length === 2) {
        displayTime = `00:${displayTime}`;
      }

      return (
        <div
          className="timelink"
          key={timeKey + index.toString()}
          onClick={() => {
            seekTo(seconds);
            setPlayingTimelinkIndex(index);
          }}
          title={timelinks[timeKey]}
        >
          <b>
            <Icon icon={index === playingTimelinkIndex ? 'pause' : 'play'} />
          </b>
          <b>{displayTime}</b>
          <span>{timelinks[timeKey]}</span>
        </div>
      );
    });
  };

  const updateTimelinks = (
    payload: { action: 'append' | 'remove'; index?: number },
    url: string
  ) => {
    switch (payload.action) {
      case 'append':
        append(newTimeline);
        setNewTimeline({ timeHours: '00', timeMinutes: '00', timeSeconds: '00', label: '' });
        break;
      case 'remove':
        remove(payload.index);
        break;
      default:
    }
    const fullTimelinksString = constructTimelinksString(getValues().timelines, url);
    if (props.onTimeLinkAdded) props.onTimeLinkAdded(fullTimelinksString);
  };

  const renderNewTimeLinkForm = (url: string) => (
    <div className="new-timelink">
      <div className="timestamp">
        <input
          type="text"
          onChange={event => {
            setNewTimeline({ ...newTimeline, timeHours: event.target.value });
          }}
          className="timestamp-hours"
          placeholder="00"
          required
          value={newTimeline.timeHours}
        />
        <span className="seperator">:</span>
        <input
          type="text"
          onChange={event => {
            setNewTimeline({ ...newTimeline, timeMinutes: event.target.value });
          }}
          className="timestamp-minutes"
          placeholder="00"
          required
          value={newTimeline.timeMinutes}
        />
        <span className="seperator">:</span>
        <input
          type="text"
          onChange={event => {
            setNewTimeline({ ...newTimeline, timeSeconds: event.target.value });
          }}
          className="timestamp-seconds"
          placeholder="00"
          required
          value={newTimeline.timeSeconds}
        />
      </div>
      <input
        type="text"
        onChange={event => {
          setNewTimeline({ ...newTimeline, label: event.target.value });
        }}
        className="timestamp-label"
        placeholder="Enter title"
        value={newTimeline.label}
      />
      <button
        type="button"
        className="new-timestamp-btn"
        onClick={() => {
          updateTimelinks({ action: 'append' }, url);
        }}
      >
        <Icon icon="plus" />
      </button>
    </div>
  );

  const renderSingleTimeLinkInputs = (
    field: FieldArrayWithId<TimeLink>,
    url: string,
    index: number
  ) => (
    <div className="new-timelink" key={index}>
      <div className="timestamp">
        <input
          type="text"
          className="timestamp-hours"
          placeholder="00"
          key={field.id}
          {...register(`timelines.${index}.timeHours`)}
        />
        <span className="seperator">:</span>
        <input
          type="text"
          className="timestamp-minutes"
          placeholder="00"
          key={field.id}
          {...register(`timelines.${index}.timeMinutes`)}
        />
        <span className="seperator">:</span>
        <input
          type="text"
          className="timestamp-seconds"
          placeholder="00"
          key={field.id}
          {...register(`timelines.${index}.timeSeconds`)}
        />
      </div>
      <input
        type="text"
        className="timestamp-label"
        placeholder="Enter title"
        key={field.id}
        {...register(`timelines.${index}.label`)}
      />
      <button
        type="button"
        className="delete-timestamp-btn"
        onClick={() => {
          updateTimelinks({ action: 'remove', index }, url);
        }}
      >
        <Icon icon="trash-alt" />
      </button>
    </div>
  );

  const renderTimeLinksForm = (url: string) => (
    <>
      {fields.map((field: FieldArrayWithId<TimeLink>, index: number) =>
        renderSingleTimeLinkInputs(field, url, index)
      )}
      {renderNewTimeLinkForm(url)}
    </>
  );

  const config = propsToConfig(props);
  const { compact, editing } = props;
  const dimensions: { width: string; height?: string } = { width: '100%' };
  if (compact) {
    dimensions.height = '100%';
  }

  return (
    <div className={`video-container ${compact ? 'compact' : ''}`}>
      <div>
        <ReactPlayer
          className="react-player"
          ref={playerRef}
          url={config.url}
          {...dimensions}
          controls
        />
      </div>
      {!editing && <div>{timeLinks(config.options.timelinks)}</div>}
      {editing && (
        <div className="timelinks-form">
          <button
            type="button"
            className="add-timelink"
            onClick={() => {
              const currentTime = playerRef.current?.getCurrentTime() as number;
              const hours = Math.floor(currentTime / 3600);
              const remainingSeconds = currentTime - hours * 3600;
              const minutes = Math.floor(remainingSeconds / 60);
              const seconds = Math.floor(remainingSeconds % 60);
              setNewTimeline({
                timeHours: hours < 10 ? `0${hours.toString()}` : hours.toString(),
                timeMinutes: minutes < 10 ? `0${minutes.toString()}` : minutes.toString(),
                timeSeconds: seconds < 10 ? `0${seconds.toString()}` : seconds.toString(),
                label: '',
              });
            }}
          >
            <Translate>Add timelink</Translate>
          </button>
          <h5>
            <Translate>Timelinks</Translate>
          </h5>
          {renderTimeLinksForm(config.url)}
        </div>
      )}
      <p className="print-view-alt">{config.url}</p>
    </div>
  );
};

export default MarkdownMedia;
