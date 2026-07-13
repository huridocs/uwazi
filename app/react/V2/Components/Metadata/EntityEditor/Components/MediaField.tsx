/* eslint-disable react/no-multi-comp, max-lines */
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { registerMediaAttachment } from '#V2/api/entities/save/index.js';
import { Button, MediaPlayer } from '#V2/Components/UI/index.js';
import { resolveMediaDisplayUrl } from '../functions/resolveMediaDisplayUrl.js';
import { MediaPickerModal, MediaPickerMode } from './MediaPickerModal.js';
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
  imageStyle?: 'contain' | 'cover' | 'fill';
};

const padTimePart = (value: string) => value.padStart(2, '0');

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
    const match = value.match(/^\(([^,]+),/);
    return {
      url: match ? match[1].trim() : value,
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
      [`${padTimePart(timelink.hh)}:${padTimePart(timelink.mm)}:${padTimePart(timelink.ss)}`]:
        timelink.label,
    }),
    {}
  );

  return `(${url}, ${JSON.stringify({ timelinks: timelinksObj })})`;
};

const timelinkToSeconds = (timelink: EditableTimelink) =>
  Number(timelink.hh) * 3600 + Number(timelink.mm) * 60 + Number(timelink.ss);

const emptyTimelink = (): EditableTimelink => ({
  hh: '00',
  mm: '00',
  ss: '00',
  label: '',
});

const revokeBlobUrl = (url: string | null) => {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

type MediaFieldPreviewProps = {
  url: string;
  timelinks: EditableTimelink[];
  disabled?: boolean;
  onTimelinksChange: (timelinks: EditableTimelink[]) => void;
};

const MediaFieldPreview = ({
  url,
  timelinks,
  disabled,
  onTimelinksChange,
}: MediaFieldPreviewProps) => {
  const playerRef = React.useRef<PlayerInstance>(null);

  const handleSeek = (timelink: EditableTimelink) => {
    playerRef.current?.seekTo(timelinkToSeconds(timelink), 'seconds');
  };

  const updateTimelink = (index: number, patch: Partial<EditableTimelink>) => {
    onTimelinksChange(
      timelinks.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  };

  const removeTimelink = (index: number) => {
    onTimelinksChange(timelinks.filter((_item, itemIndex) => itemIndex !== index));
  };

  const addTimelink = () => {
    onTimelinksChange([...timelinks, emptyTimelink()]);
  };

  return (
    <div className="flex flex-col gap-4">
      <MediaPlayer className="m-auto" playerRef={playerRef} url={url} width={500} height={300} />

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

        {timelinks.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            <Translate>No timelinks added</Translate>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {timelinks.map((timelink, index) => (
              <li
                // eslint-disable-next-line react/no-array-index-key
                key={`timelink-${index}`}
                className="flex flex-wrap items-center gap-2 rounded-md border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-2"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm"
                  onClick={() => handleSeek(timelink)}
                  aria-label={`${timelink.hh}:${timelink.mm}:${timelink.ss}`}
                >
                  <PlayIcon className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  disabled={disabled}
                  value={timelink.hh}
                  onChange={event => updateTimelink(index, { hh: event.target.value })}
                  className="w-10 rounded border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-1 text-center text-sm"
                  aria-label="Hours"
                />
                <span>:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  disabled={disabled}
                  value={timelink.mm}
                  onChange={event => updateTimelink(index, { mm: event.target.value })}
                  className="w-10 rounded border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-1 text-center text-sm"
                  aria-label="Minutes"
                />
                <span>:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  disabled={disabled}
                  value={timelink.ss}
                  onChange={event => updateTimelink(index, { ss: event.target.value })}
                  className="w-10 rounded border border-(--color-theme-control-border) bg-(--color-theme-control-bg) p-1 text-center text-sm"
                  aria-label="Seconds"
                />
                <input
                  type="text"
                  disabled={disabled}
                  value={timelink.label}
                  onChange={event => updateTimelink(index, { label: event.target.value })}
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
  imageStyle = 'fill',
}: MediaFieldProps<TFormValues>) => {
  const { control } = useFormContext<TFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const previewObjectUrlRef = useRef<string | null>(null);
  const required = Boolean(registerOptions?.required);

  const allAttachments = useMemo(
    () => [...attachments, ...pendingAttachments],
    [attachments, pendingAttachments]
  );

  useEffect(
    () => () => {
      revokeBlobUrl(previewObjectUrlRef.current);
    },
    []
  );

  return (
    <EntityField data-testid={String(field)}>
      <Controller
        control={control}
        name={field}
        rules={{
          ...registerOptions,
          validate: value =>
            !required || (typeof value === 'string' && value.trim().length > 0) || 'Required',
        }}
        render={({ field: mediaField, fieldState }) => {
          const rawValue = typeof mediaField.value === 'string' ? mediaField.value : '';
          const { timelinks } = parseFieldValue(rawValue);
          const previewUrl = resolveMediaDisplayUrl(rawValue, allAttachments);
          const hasValue = rawValue.trim().length > 0;
          const { showError, message } = getFieldErrorState(fieldState);

          const updatePreviewObjectUrl = (nextUrl: string) => {
            if (previewObjectUrlRef.current && previewObjectUrlRef.current !== nextUrl) {
              revokeBlobUrl(previewObjectUrlRef.current);
            }
            previewObjectUrlRef.current = nextUrl.startsWith('blob:') ? nextUrl : null;
          };

          const updateValue = async (
            nextUrl: string,
            localFile?: File,
            nextTimelinks: EditableTimelink[] = timelinks
          ) => {
            if (localFile) {
              const attachment = await registerMediaAttachment(entitySharedId, localFile);
              onRegisterPendingAttachment(attachment);
              const fileLocalID = attachment.fileLocalID ?? attachment._id;
              updatePreviewObjectUrl(
                resolveMediaDisplayUrl(fileLocalID, [...allAttachments, attachment])
              );
              mediaField.onChange(
                mode === 'media' ? encodeTimelinksValue(fileLocalID, nextTimelinks) : fileLocalID
              );
              return;
            }

            updatePreviewObjectUrl(nextUrl);
            if (mode === 'media') {
              mediaField.onChange(encodeTimelinksValue(nextUrl, nextTimelinks));
              return;
            }

            mediaField.onChange(nextUrl);
          };

          const handleUnlink = () => {
            revokeBlobUrl(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
            mediaField.onChange('');
          };

          const handleTimelinksChange = (nextTimelinks: EditableTimelink[]) => {
            if (!rawValue) {
              return;
            }

            mediaField.onChange(encodeTimelinksValue(rawValue, nextTimelinks));
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
                attachments={attachments}
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
