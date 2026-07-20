/* eslint-disable react/no-multi-comp, max-lines */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpTrayIcon,
  LinkSlashIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Controller, FieldValues, Path, RegisterOptions, useFormContext } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import type { ClientFile } from '#app/istore.js';
import { FileType } from '#shared/types/fileType.js';
import { registerMediaAttachment } from '#shared/entitySave/legacyMetadata.js';
import { isUploadId, parseMediaSourceUrl } from '#shared/entitySave/mediaMetadata.js';
import { resolveMediaDisplayUrl } from '#shared/entitySave/resolveMediaDisplayUrl.js';
import { Button, MediaPlayer } from '#V2/Components/UI/index.js';
import { MediaPickerModal } from './MediaPickerModal.js';
import type { MediaPickerMode } from './MediaPickerModal.js';
import { EntityFieldError, getFieldErrorState } from '../functions/fieldErrorState.js';
import { EntityField } from './EntityField.js';

type PlayerRef = NonNullable<React.ComponentProps<typeof MediaPlayer>['playerRef']>;
type PlayerInstance = PlayerRef extends React.RefObject<infer T> ? T : never;

type EditableTimelink = {
  hh: string;
  mm: string;
  ss: string;
  label: string;
};

type MediaFieldProps<TFormValues extends FieldValues = FieldValues> = {
  context: string;
  label: string;
  field: Path<TFormValues>;
  mode: MediaPickerMode;
  registerOptions?: RegisterOptions<TFormValues, Path<TFormValues>>;
  disabled?: boolean;
  attachments: FileType[];
  pendingAttachments: ClientFile[];
  entitySharedId: string;
  onRegisterPendingAttachment: (attachment: ClientFile) => void;
  onRemovePendingAttachment: (fileLocalID: string) => void;
  imageStyle?: 'contain' | 'cover' | 'fill';
};

const TIMELINK_LABEL_MAX = 40;

const padTimePart = (value: string) => value.padStart(2, '0');

const clampTimePart = (value: string, max?: number) => {
  if (value === '') {
    return '';
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return '0';
  }

  const floored = Math.floor(parsed);
  return String(max !== undefined ? Math.min(floored, max) : floored);
};

const secondsToTimelink = (currentTime: number): EditableTimelink => {
  const hours = Math.floor(currentTime / 3600);
  const remainingSeconds = currentTime - hours * 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);

  return {
    hh: padTimePart(String(hours)),
    mm: padTimePart(String(minutes)),
    ss: padTimePart(String(seconds)),
    label: '',
  };
};

const parseTimelinksFromValue = (value: string): EditableTimelink[] => {
  const match = value.match(/^\(([^,]+),\s*({.*})\)$/);

  if (!match) {
    return [];
  }

  try {
    const timelinksData = JSON.parse(match[2]) as { timelinks?: Record<string, string> };
    const timelinks = timelinksData.timelinks || {};

    return Object.entries(timelinks).map(([time, timelinkLabel]) => {
      const parts = time.split(':').map(part => padTimePart(part));
      const [hh = '00', mm = '00', ss = '00'] =
        parts.length === 2 ? ['00', parts[0], parts[1]] : parts;

      return { hh, mm, ss, label: timelinkLabel };
    });
  } catch {
    return [];
  }
};

const parseFieldValue = (value?: string) => {
  if (!value) {
    return { url: '', timelinks: [] as EditableTimelink[] };
  }

  if (value.startsWith('(')) {
    return {
      url: parseMediaSourceUrl(value),
      timelinks: parseTimelinksFromValue(value),
    };
  }

  return { url: value, timelinks: [] as EditableTimelink[] };
};

const encodeTimelinksValue = (url: string, timelinks: EditableTimelink[]) => {
  if (timelinks.length === 0) {
    return url;
  }

  const timelinksObj = timelinks.reduce<Record<string, string>>(
    (current, timelink) => ({
      ...current,
      [`${padTimePart(timelink.hh || '0')}:${padTimePart(timelink.mm || '0')}:${padTimePart(timelink.ss || '0')}`]:
        timelink.label,
    }),
    {}
  );

  return `(${url}, ${JSON.stringify({ timelinks: timelinksObj })})`;
};

const timelinkToSeconds = (timelink: EditableTimelink) =>
  Number(timelink.hh || 0) * 3600 + Number(timelink.mm || 0) * 60 + Number(timelink.ss || 0);

type MediaFieldPreviewProps = {
  url: string;
  timelinks: EditableTimelink[];
  valueKey: string;
  disabled?: boolean;
  onTimelinksChange: (timelinks: EditableTimelink[]) => void;
};

const MediaFieldPreview = ({
  url,
  timelinks,
  valueKey,
  disabled,
  onTimelinksChange,
}: MediaFieldPreviewProps) => {
  const playerRef = React.useRef<PlayerInstance>(null);
  const [localTimelinks, setLocalTimelinks] = useState(timelinks);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setLocalTimelinks(timelinks);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from committed valueKey only
  }, [valueKey]);

  const commitTimelinks = (next: EditableTimelink[]) => {
    setLocalTimelinks(next);
    onTimelinksChange(next);
  };

  const handlePlay = (timelink: EditableTimelink) => {
    playerRef.current?.seekTo(timelinkToSeconds(timelink), 'seconds');
    setPlaying(true);
  };

  const updateLocalTimelink = (index: number, patch: Partial<EditableTimelink>) => {
    setLocalTimelinks(current =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  };

  const commitTimePart = (index: number, part: 'hh' | 'mm' | 'ss') => {
    const next = localTimelinks.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [part]: padTimePart(item[part] || '0') } : item
    );
    commitTimelinks(next);
  };

  const commitLabel = () => {
    commitTimelinks(localTimelinks);
  };

  const removeTimelink = (index: number) => {
    commitTimelinks(localTimelinks.filter((_item, itemIndex) => itemIndex !== index));
  };

  const addTimelink = () => {
    const currentTime = playerRef.current?.getCurrentTime() ?? 0;
    commitTimelinks([...localTimelinks, secondsToTimelink(currentTime)]);
  };

  return (
    <div className="flex flex-col gap-4">
      <MediaPlayer
        className="m-auto"
        playerRef={playerRef}
        url={url}
        width={500}
        height={300}
        playing={playing}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClickPreview={() => setPlaying(true)}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">
            <Translate>Timelinks</Translate>
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-2 py-1.5"
            onClick={addTimelink}
          >
            <PlusIcon className="w-4 h-4" />
            <Translate>Add</Translate>
          </Button>
        </div>

        {localTimelinks.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            <Translate>No timelinks added</Translate>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {localTimelinks.map((timelink, index) => (
              <li
                // eslint-disable-next-line react/no-array-index-key
                key={`timelink-${index}`}
                className="flex flex-wrap items-center gap-2 rounded-md border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-2"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm"
                  onClick={() => handlePlay(timelink)}
                  aria-label={`${timelink.hh}:${timelink.mm}:${timelink.ss}`}
                >
                  <PlayIcon className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  step={1}
                  min={0}
                  disabled={disabled}
                  value={timelink.hh}
                  onChange={event =>
                    updateLocalTimelink(index, { hh: clampTimePart(event.target.value) })
                  }
                  onBlur={() => commitTimePart(index, 'hh')}
                  className="w-14 rounded border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-1 text-center text-sm"
                  aria-label="Hours"
                />
                <span>:</span>
                <input
                  type="number"
                  step={1}
                  min={0}
                  max={59}
                  disabled={disabled}
                  value={timelink.mm}
                  onChange={event =>
                    updateLocalTimelink(index, { mm: clampTimePart(event.target.value, 59) })
                  }
                  onBlur={() => commitTimePart(index, 'mm')}
                  className="w-14 rounded border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-1 text-center text-sm"
                  aria-label="Minutes"
                />
                <span>:</span>
                <input
                  type="number"
                  step={1}
                  min={0}
                  max={59}
                  disabled={disabled}
                  value={timelink.ss}
                  onChange={event =>
                    updateLocalTimelink(index, { ss: clampTimePart(event.target.value, 59) })
                  }
                  onBlur={() => commitTimePart(index, 'ss')}
                  className="w-14 rounded border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-1 text-center text-sm"
                  aria-label="Seconds"
                />
                <input
                  type="text"
                  disabled={disabled}
                  maxLength={TIMELINK_LABEL_MAX}
                  value={timelink.label}
                  onChange={event => updateLocalTimelink(index, { label: event.target.value })}
                  onBlur={commitLabel}
                  placeholder="Label"
                  className="min-w-32 flex-1 rounded border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-1 text-sm"
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeTimelink(index)}
                  aria-label="Remove timelink"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const MediaField = <TFormValues extends FieldValues = FieldValues>({
  context,
  label,
  field,
  mode,
  registerOptions,
  disabled,
  attachments,
  pendingAttachments,
  entitySharedId,
  onRegisterPendingAttachment,
  onRemovePendingAttachment,
  imageStyle = 'fill',
}: MediaFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const required = Boolean(registerOptions?.required);

  const allAttachments = useMemo(
    () => [...attachments, ...pendingAttachments],
    [attachments, pendingAttachments]
  );

  return (
    <EntityField data-testid={String(field)}>
      <Controller
        control={control}
        name={field}
        rules={{
          ...registerOptions,
          validate: value => {
            if (!required) {
              return true;
            }
            if (typeof value !== 'string') {
              return 'Required';
            }
            const { url } = parseFieldValue(value);
            return url.trim().length > 0 || 'Required';
          },
        }}
        render={({ field: mediaField, fieldState }) => {
          const rawValue = typeof mediaField.value === 'string' ? mediaField.value : '';
          const { timelinks, url: currentUrl } = parseFieldValue(rawValue);
          const previewUrl = resolveMediaDisplayUrl(rawValue, allAttachments);
          const hasValue = rawValue.trim().length > 0;
          const { showError, message } = getFieldErrorState(fieldState);

          const releaseUploadIfReplaced = (previousUrl: string, nextValue: string) => {
            if (!isUploadId(previousUrl)) {
              return;
            }
            const nextParsedUrl = parseFieldValue(nextValue).url;
            if (previousUrl !== nextParsedUrl) {
              onRemovePendingAttachment(previousUrl);
            }
          };

          const updateValue = async (
            nextUrl: string,
            localFile?: File,
            nextTimelinks: EditableTimelink[] = timelinks
          ) => {
            const previousUrl = currentUrl;
            if (localFile) {
              const attachment = await registerMediaAttachment(entitySharedId, localFile);
              const { fileLocalID } = attachment;
              if (!fileLocalID) {
                return;
              }
              onRegisterPendingAttachment(attachment);
              const nextValue =
                mode === 'media' ? encodeTimelinksValue(fileLocalID, nextTimelinks) : fileLocalID;
              mediaField.onChange(nextValue);
              releaseUploadIfReplaced(previousUrl, nextValue);
              return;
            }

            const nextValue =
              mode === 'media' ? encodeTimelinksValue(nextUrl, nextTimelinks) : nextUrl;
            mediaField.onChange(nextValue);
            releaseUploadIfReplaced(previousUrl, nextValue);
          };

          const handleUnlink = () => {
            const previousUrl = currentUrl;
            mediaField.onChange('');
            releaseUploadIfReplaced(previousUrl, '');
          };

          const handleTimelinksChange = (nextTimelinks: EditableTimelink[]) => {
            const { url } = parseFieldValue(rawValue);
            if (!url) {
              return;
            }

            mediaField.onChange(encodeTimelinksValue(url, nextTimelinks));
          };

          return (
            <>
              <div className="text-sm font-bold text-ink">
                <Translate context={context}>{label}</Translate>
                {registerOptions?.required && '*'}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5"
                  onClick={() => setModalOpen(true)}
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  <Translate>{hasValue ? 'Change' : 'Choose'}</Translate>
                </Button>
                {hasValue ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={disabled}
                    className="inline-flex items-center gap-1.5"
                    onClick={handleUnlink}
                  >
                    <LinkSlashIcon className="w-4 h-4" />
                    <Translate>Unlink</Translate>
                  </Button>
                ) : null}
              </div>

              {hasValue ? (
                <div className="mt-3 flex justify-center rounded-md bg-(--color-theme-surface-warm) p-3">
                  {mode === 'image' ? (
                    <img
                      src={previewUrl}
                      alt={label}
                      className="max-w-full rounded-md max-h-96"
                      style={{ objectFit: imageStyle === 'cover' ? 'cover' : 'contain' }}
                    />
                  ) : (
                    <MediaFieldPreview
                      url={previewUrl}
                      timelinks={timelinks}
                      valueKey={rawValue}
                      disabled={disabled}
                      onTimelinksChange={handleTimelinksChange}
                    />
                  )}
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-dashed border-(--color-theme-control-border) bg-(--color-theme-control-bg) px-4 py-8 text-center text-sm text-ink-secondary">
                  <Translate>No media selected</Translate>
                </div>
              )}

              <EntityFieldError showError={showError} message={message} />

              <MediaPickerModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSelect={async (selectedUrl, localFile) =>
                  updateValue(selectedUrl, localFile, mode === 'media' ? timelinks : [])
                }
                mode={mode}
                attachments={allAttachments}
                currentValue={rawValue}
              />
            </>
          );
        }}
      />
    </EntityField>
  );
};

export { MediaField };
export type { MediaFieldProps };
