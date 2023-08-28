/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useRef, Ref, useEffect } from 'react';
import { FieldArrayWithId, useFieldArray, useForm } from 'react-hook-form';
import ReactPlayer from 'react-player';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { validMediaFile } from 'app/Metadata/helpers/validator';

interface MarkdownMediaProps {
  compact?: boolean;
  editing?: boolean;
  onTimeLinkAdded?: Function;
  config: string;
  type?: string;
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
  const playerRef: Ref<ReactPlayer> | undefined = useRef(null);

  const [newTimeline, setNewTimeline] = useState<TimeLink>({
    timeHours: '',
    timeMinutes: '',
    timeSeconds: '',
    label: '',
  });
  const [errorFlag, setErrorFlag] = useState(false);
  const { options } = propsToConfig(props);
  const originalTimelinks = formatTimeLinks(options?.timelinks || {});
  const [playingTimelinkIndex, setPlayingTimelinkIndex] = useState<number>(-1);
  const [isVideoPlaying, setVideoPlaying] = useState<boolean>(false);
  const [temporalResource, setTemporalResource] = useState<string>();
  const [mediaURL, setMediaURL] = useState('');
  const { control, register, getValues } = useForm<{ timelines: TimeLink[] }>({
    defaultValues: { timelines: originalTimelinks },
  });
  const { fields, remove, append } = useFieldArray<{ timelines: TimeLink[] }>({
    control,
    name: 'timelines',
  });

  const validMediaUrlRegExp =
    /(^(blob:)?https?:\/\/(?:www\.)?)[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]$/;

  const seekTo = (seconds: number) => {
    const playingStatus = isVideoPlaying;
    playerRef.current?.seekTo(seconds);
    setVideoPlaying(playingStatus);
  };

  const timeLinks = (_timelinks: any) => {
    const timelinks = _timelinks || {};
    return Object.keys(timelinks).map((timeKey, index) => {
      const linkIndex = index;
      const seconds = timeKey
        .split(':')
        .reverse()
        .reduce((_seconds, n, _index) => _seconds + parseInt(n, 10) * 60 ** _index, 0);

      let displayTime = timeKey;
      if (displayTime.split(':').length === 2) {
        displayTime = `00:${displayTime}`;
      }

      return (
        <div className="timelink" key={timeKey + index.toString()} title={timelinks[timeKey]}>
          <b
            className="timelink-icon"
            onClick={() => {
              seekTo(seconds);
              if (linkIndex === playingTimelinkIndex) {
                setVideoPlaying(false);
                setPlayingTimelinkIndex(-1);
              } else {
                setVideoPlaying(true);
                setPlayingTimelinkIndex(linkIndex);
              }
            }}
          >
            <Icon icon={linkIndex === playingTimelinkIndex ? 'pause' : 'play'} />
          </b>
          <div
            className="timelink-time-label"
            onClick={() => {
              seekTo(seconds);
              setPlayingTimelinkIndex(linkIndex);
            }}
          >
            <b>{displayTime}</b>
            <span>{timelinks[timeKey]}</span>
          </div>
        </div>
      );
    });
  };

  const updateParentForm = () => {
    if (props.onTimeLinkAdded) props.onTimeLinkAdded(getValues().timelines);
  };

  const appendTimelinkAndUpdateParent = (timelink?: TimeLink) => {
    const currentTimelink = timelink || newTimeline;
    append(currentTimelink);
    updateParentForm();
  };

  const renderNewTimeLinkForm = () => (
    <div className="new-timelink">
      <div className="timestamp">
        <input
          type="number"
          onChange={event => {
            let hours = parseInt(event.target.value || '0', 10);
            setNewTimeline({ ...newTimeline, timeHours: hours <= 0 ? '00' : hours.toString() });
          }}
          className="timestamp-hours"
          placeholder="00"
          value={newTimeline.timeHours}
          min="0"
        />
        <span className="seperator">:</span>
        <input
          type="number"
          onChange={event => {
            let minutes = parseInt(event.target.value || '0', 10);
            minutes = minutes > 59 ? 59 : minutes;
            setNewTimeline({
              ...newTimeline,
              timeMinutes: minutes <= 0 ? '00' : minutes.toString(),
            });
          }}
          className="timestamp-minutes"
          placeholder="00"
          value={newTimeline.timeMinutes}
          min="0"
          max="59"
        />
        <span className="seperator">:</span>
        <input
          type="number"
          onChange={event => {
            let seconds = parseInt(event.target.value || '0', 10);
            seconds = seconds > 59 ? 59 : seconds;
            setNewTimeline({
              ...newTimeline,
              timeSeconds: seconds <= 0 ? '00' : seconds.toString(),
            });
          }}
          className="timestamp-seconds"
          placeholder="00"
          value={newTimeline.timeSeconds}
          min="0"
          max="59"
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
          const time = {
            timeHours: newTimeline.timeHours || '00',
            timeMinutes: newTimeline.timeMinutes || '00',
            timeSeconds: newTimeline.timeSeconds || '00',
            label: newTimeline.label,
          };

          appendTimelinkAndUpdateParent(time);
          setNewTimeline({ timeHours: '', timeMinutes: '', timeSeconds: '', label: '' });
        }}
      >
        <Icon icon="plus" />
      </button>
    </div>
  );

  const renderSingleTimeLinkInputs = (field: FieldArrayWithId<TimeLink>, index: number) => (
    <div className="new-timelink" key={index}>
      <div className="timestamp">
        <input
          type="text"
          className="timestamp-hours"
          placeholder="00"
          key={`${field.id}hours`}
          {...register(`timelines.${index}.timeHours`, {
            onChange: _ => updateParentForm(),
          })}
        />
        <span className="seperator">:</span>
        <input
          type="text"
          className="timestamp-minutes"
          placeholder="00"
          key={`${field.id}minutes`}
          {...register(`timelines.${index}.timeMinutes`, {
            onChange: _ => updateParentForm(),
          })}
        />
        <span className="seperator">:</span>
        <input
          type="text"
          className="timestamp-seconds"
          placeholder="00"
          key={`${field.id}seconds`}
          {...register(`timelines.${index}.timeSeconds`, {
            onChange: _ => updateParentForm(),
          })}
        />
      </div>
      <input
        type="text"
        className="timestamp-label"
        placeholder="Enter title"
        key={field.id}
        {...register(`timelines.${index}.label`, {
          onChange: _ => updateParentForm(),
        })}
      />
      <button
        title="Remove timelink"
        type="button"
        className="delete-timestamp-btn"
        onClick={() => {
          remove(index);
          updateParentForm();
        }}
      >
        <Icon icon="trash-alt" />
      </button>
    </div>
  );

  const renderTimeLinksForm = () => (
    <>
      {fields.map((field: FieldArrayWithId<TimeLink>, index: number) =>
        renderSingleTimeLinkInputs(field, index)
      )}
      {renderNewTimeLinkForm()}
    </>
  );

  const config = propsToConfig(props);
  useEffect(() => {
    if (config.url.startsWith('/api/files/')) {
      fetch(config.url)
        .then(async res => {
          if (validMediaFile(res)) {
            return res.blob();
          }
          setErrorFlag(true);
          throw new Error('Invalid file');
        })
        .then(blob => {
          setErrorFlag(false);
          setMediaURL(URL.createObjectURL(blob));
        })
        .catch(_e => {});
    } else if (config.url.match(validMediaUrlRegExp)) {
      setMediaURL(config.url);
      setErrorFlag(false);
    } else {
      if (mediaURL && mediaURL.match(validMediaUrlRegExp) && temporalResource === undefined) {
        setTemporalResource(mediaURL);
      }
      setMediaURL(config.url);
    }
  }, [config.url]);

  useEffect(() => {
    if (
      temporalResource !== undefined &&
      ReactPlayer.canPlay(temporalResource) &&
      !mediaURL.match(validMediaUrlRegExp)
    ) {
      setErrorFlag(false);
      setMediaURL(temporalResource);
    }
  }, [temporalResource, mediaURL]);

  useEffect(() => () => {
    if (config.url.startsWith('/api/files/')) {
      setErrorFlag(false);
      URL.revokeObjectURL(mediaURL);
    }
  });

  const { compact, editing } = props;
  const dimensions: { width: string; height?: string } = { width: '100%' };
  if (compact) {
    dimensions.height = '100%';
  }

  if (errorFlag) {
    return (
      <div className="media-error">
        <Translate>This file type is not supported on media fields</Translate>
      </div>
    );
  }

  return (
    <div className={`video-container ${compact ? 'compact' : ''}`}>
      <div>
        <ReactPlayer
          className="react-player"
          playing={isVideoPlaying}
          ref={playerRef}
          url={mediaURL}
          {...dimensions}
          controls
          onPause={() => {
            setVideoPlaying(false);
          }}
          onPlay={() => {
            setVideoPlaying(true);
          }}
          onError={e => {
            if (e.target.error.message.search(/MEDIA_ELEMENT_ERROR/) === -1) {
              setErrorFlag(true);
            }
          }}
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
              const timelink = {
                timeHours: hours < 10 ? `0${hours.toString()}` : hours.toString(),
                timeMinutes: minutes < 10 ? `0${minutes.toString()}` : minutes.toString(),
                timeSeconds: seconds < 10 ? `0${seconds.toString()}` : seconds.toString(),
                label: '',
              };
              appendTimelinkAndUpdateParent(timelink);
            }}
          >
            <Translate>Add timelink</Translate>
          </button>
          <h5>
            <Translate>Timelinks</Translate>
          </h5>
          {renderTimeLinksForm()}
        </div>
      )}
      <p className="print-view-alt">{config.url}</p>
    </div>
  );
};

export type { TimeLink, MarkdownMediaProps };
export default MarkdownMedia;
