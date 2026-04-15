/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Popover } from '@headlessui/react';
import { usePopper } from 'react-popper';
import { InputField } from '#app/V2/Components/Forms/index.js';
import { t, Translate } from '#app/I18N/index.js';

type ColorPickerProps = {
  name: string;
  onChange?: (color: string) => void;
  value?: string;
  className?: string;
  hasErrors?: boolean;
  options?: string[];
};

const defaultColors = [
  '#C03B22',
  '#D9534F',
  '#E91E63',
  '#A03AB1',
  '#6F46B8',
  '#3F51B5',
  '#2196F3',
  '#37BDCF',
  '#359990',
  '#5CB85C',
  '#8BC34A',
  '#CDDC39',
  '#CCBC2F',
  '#F0AD4E',
  '#EC9920',
  '#E46841',
  '#795548',
  '#9E9E9E',
  '#607D8B',
];

const SIX_HEX = /^#([0-9a-fA-F]{6})$/;
const THREE_HEX = /^#([0-9a-fA-F]{3})$/i;

const normalizePickerHex = (raw: string | undefined, fallback: string): string => {
  const s = (raw ?? '').trim();
  if (SIX_HEX.test(s)) return s.toUpperCase();
  const m3 = THREE_HEX.exec(s);
  if (m3) {
    const c = m3[1];
    return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`.toUpperCase();
  }
  return SIX_HEX.test(fallback) ? fallback.toUpperCase() : defaultColors[0];
};

const resolvePopoverPortalTarget = (): HTMLElement | null => {
  if (typeof document === 'undefined') return null;
  return (
    (document.getElementById('v2-modal-portal') as HTMLElement | null) ??
    (document.querySelector('main .tw-content') as HTMLElement | null)
  );
};

const ColorPicker = ({
  name,
  className = '',
  onChange,
  hasErrors,
  value = defaultColors[0],
  options = defaultColors,
}: ColorPickerProps) => {
  const [localValue, setLocalValue] = useState(() => normalizePickerHex(value, defaultColors[0]));

  useEffect(() => {
    setLocalValue(normalizePickerHex(value, defaultColors[0]));
  }, [value]);

  const changeColor = (color: string) => {
    const next = normalizePickerHex(color, localValue);
    setLocalValue(next);
    if (onChange && SIX_HEX.test(next)) {
      onChange(next);
    }
  };

  // Popper integration
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
    strategy: 'fixed',
    modifiers: [
      {
        name: 'offset',
        options: { offset: [0, 8] },
      },
      {
        name: 'preventOverflow',
        options: {
          boundary: undefined,
        },
      },
    ],
  });

  return (
    <div className={className}>
      <Popover className="relative">
        {() => {
          const portalTarget = resolvePopoverPortalTarget();
          const panel = (
            <Popover.Panel
              ref={setPopperElement}
              style={{
                ...styles.popper,
                borderColor:
                  'color-mix(in srgb, var(--color-theme-border-primary) 40%, transparent)',
                backgroundColor: 'var(--color-theme-bg-surface)',
                color: 'var(--color-theme-text-primary)',
              }}
              {...attributes.popper}
              className="z-[120] flex w-56 max-w-[min(100vw-1rem,14rem)] flex-col gap-2 rounded-xl border p-2 shadow-lg"
            >
              <ul
                className="grid max-h-64 grid-cols-5 gap-2 overflow-y-auto p-2"
                data-testid="colorpicker-popover"
              >
                {options.map((color: string) => (
                  <li key={color}>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]"
                      onClick={() => {
                        changeColor(color);
                      }}
                    >
                      <span className="sr-only">{color}</span>
                      <div
                        data-testid="colorpicker-button"
                        className="h-8 w-8 rounded-md"
                        style={{ backgroundColor: color }}
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <label
                className="flex w-fit cursor-pointer flex-row items-center gap-2"
                style={{ color: 'var(--color-theme-text-secondary)' }}
              >
                <Translate>Pick a color</Translate>
                <input
                  type="color"
                  className="h-6 w-6 cursor-pointer rounded-md focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]"
                  data-testid="custom-colorpicker"
                  value={localValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    changeColor(e.target.value);
                  }}
                />
              </label>
              <InputField
                label={t('System', 'Manually set a color', null, false)}
                hideLabel
                id={name}
                type="text"
                name={name}
                value={localValue.slice(1)}
                preText="#"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  changeColor(`#${e.target.value}`);
                }}
                className="w-full text-center"
                hasErrors={hasErrors}
              />
            </Popover.Panel>
          );

          return (
            <>
              <Popover.Button
                ref={setReferenceElement}
                className="flex h-10.5 w-10.5 cursor-pointer items-center justify-center rounded-lg border shadow-md transition focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)]"
                style={{
                  borderColor: 'var(--color-theme-control-border)',
                  backgroundColor: 'var(--color-theme-control-bg)',
                }}
              >
                <div
                  data-testid="colorpicker-button"
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: localValue }}
                />
                <Translate className="sr-only">Template color</Translate>
              </Popover.Button>
              {portalTarget ? createPortal(panel, portalTarget) : panel}
            </>
          );
        }}
      </Popover>
    </div>
  );
};

export { ColorPicker };
