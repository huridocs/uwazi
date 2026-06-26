import React, { useEffect, useId, useRef, useState } from 'react';
import isString from 'lodash/isString.js';
import { Translate } from '#app/I18N/index.js';

const DEFAULT_COMMIT_DELAY_MS = 300;

type InputColorPickerProps = {
  id?: string;
  name?: string;
  value: string;
  onChange?: (color: string) => void;
  label?: string | React.ReactNode;
  disabled?: boolean;
  className?: string;
  commitDelayMs?: number;
};

const InputColorPicker = ({
  id,
  name,
  value,
  onChange,
  label,
  disabled = false,
  className,
  commitDelayMs = DEFAULT_COMMIT_DELAY_MS,
}: InputColorPickerProps) => {
  const generatedId = useId();
  const inputId = id ?? name ?? generatedId;
  const [displayValue, setDisplayValue] = useState(value);
  const onChangeRef = useRef(onChange);
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  useEffect(
    () => () => {
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current);
      }
    },
    []
  );

  const commitColor = (color: string) => {
    onChangeRef.current?.(color);
  };

  const scheduleCommit = (color: string) => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
    }
    commitTimeoutRef.current = setTimeout(() => {
      commitTimeoutRef.current = undefined;
      commitColor(color);
    }, commitDelayMs);
  };

  const flushCommit = (color: string) => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = undefined;
    }
    commitColor(color);
  };

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    const color = event.currentTarget.value;
    setDisplayValue(color);
    scheduleCommit(color);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    flushCommit(event.currentTarget.value);
  };

  return (
    <label
      htmlFor={inputId}
      className={[
        'inline-flex w-fit items-center gap-2',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md shadow-md">
        <span
          aria-hidden="true"
          className="h-6 w-6 rounded-md border border-border"
          style={{ backgroundColor: displayValue }}
        />
        <input
          id={inputId}
          name={name}
          type="color"
          value={displayValue}
          disabled={disabled}
          onInput={handleInput}
          onBlur={handleBlur}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </span>
      {label != null && (
        <span className="text-sm text-ink-secondary">
          {isString(label) ? <Translate>{label}</Translate> : label}
        </span>
      )}
    </label>
  );
};

export type { InputColorPickerProps };
export { InputColorPicker };
