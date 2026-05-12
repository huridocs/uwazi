import React, { useEffect, useState } from 'react';
import { Checkbox } from 'flowbite-react';
import { usePopper } from 'react-popper';
import { Popover } from '@headlessui/react';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import isString from 'lodash/isString.js';
import { t, Translate } from '#app/I18N/index.js';
import { Pill } from '#V2/Components/UI/index.js';

type Option = { label: string | React.ReactNode; value: string };

interface MultiSelectProps {
  label: string | React.ReactNode;
  options: Option[];
  disabled?: boolean;
  hasErrors?: boolean;
  onChange?: (options: string[]) => any;
  value: string[];
  placeholder?: string | React.ReactNode;
  canBeEmpty?: boolean;
  updatable?: boolean;
}

type MultiSelectHeaderStyle = React.CSSProperties;
const noop = () => undefined;

const renderChild = (child: string | React.ReactNode, className?: string) =>
  isString(child) ? <Translate className={className || ''}>{child}</Translate> : child;

const MultiSelect = ({
  label,
  options,
  disabled,
  hasErrors,
  onChange = noop,
  placeholder = 'No options',
  canBeEmpty = true,
  value,
}: MultiSelectProps) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top-end',
    strategy: 'fixed',
    modifiers: [
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['bottom-end', 'top-start', 'bottom-start'],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          boundary: typeof document !== 'undefined' ? document.documentElement : undefined,
          padding: 8,
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
    ],
  });

  const [currentValue, setCurrentValue] = useState<string[]>(value);
  const headerStyle: MultiSelectHeaderStyle | undefined = hasErrors
    ? {
        backgroundColor: 'var(--color-theme-control-bg-error)',
      }
    : { backgroundColor: 'var(--color-theme-section-header-bg)' };
  const labelStyle: MultiSelectHeaderStyle | undefined = hasErrors
    ? { color: 'var(--color-theme-control-text-error)' }
    : { color: 'var(--color-theme-section-header-fg)' };

  const optionIsSelected = (option: Option) => currentValue.includes(option.value);

  const removeValue = (v: string) => {
    const newValue = currentValue.filter(_v => _v !== v);
    setCurrentValue(newValue);
    onChange(newValue);
  };

  const selectOption = (option: Option) => {
    const newValue = currentValue.includes(option.value)
      ? currentValue.filter(v => v !== option.value)
      : [...currentValue, option.value];

    setCurrentValue(newValue);
    onChange(newValue);
  };

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  return (
    <div
      data-testid="multiselect"
      className="rounded-lg shadow-md"
      style={{
        backgroundColor: 'var(--color-theme-surface-raised)',
        boxShadow: 'var(--color-theme-card-shadow)',
      }}
    >
      <div className="flex h-12 items-center rounded-t-lg px-4" style={headerStyle}>
        <span className="flex-1 text-sm font-semibold" style={labelStyle}>
          {renderChild(label)}
        </span>
        <Popover className="border border-(--color-theme-border-default)@20%">
          <Popover.Button
            ref={setReferenceElement}
            className="disabled:opacity-40"
            style={{ color: 'var(--color-theme-action-primary)' }}
            disabled={disabled || options.length === 0}
          >
            <span className="sr-only">{t('System', 'Select', null, false)}</span>
            <PlusCircleIcon className="w-6 text-lg" />
          </Popover.Button>
          <Popover.Panel
            ref={setPopperElement}
            style={styles.popper}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...attributes.popper}
            as="div"
            className="z-10"
          >
            <ul
              className="mb-2 max-h-56 min-w-56 w-fit max-w-md overflow-y-auto rounded-md p-2 shadow-sm"
              style={{
                backgroundColor: 'var(--color-theme-surface-raised)',
                border:
                  '1px solid color-mix(in srgb, var(--color-theme-border-default) 60%, transparent)',
              }}
              data-testid="multiselect-popover"
            >
              {options.map((option: Option) => (
                <li key={option.value} className="flex gap-2 py-1 align-top">
                  <Checkbox
                    className="cursor-pointer"
                    id={option.value}
                    checked={optionIsSelected(option)}
                    disabled={
                      disabled ||
                      (optionIsSelected(option) && !canBeEmpty && currentValue.length === 1)
                    }
                    onChange={() => {
                      selectOption(option);
                    }}
                  />
                  <label className="w-full cursor-pointer" htmlFor={option.value}>
                    {renderChild(option.label)}
                  </label>
                </li>
              ))}
            </ul>
          </Popover.Panel>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-2 p-4 min-h-fit">
        {currentValue.length
          ? currentValue.map((v: string) => {
              const option = options.find(opt => opt.value === v);
              const isDisabled = disabled || (!canBeEmpty && value.length === 1);
              if (!option) return null;
              return (
                <Pill color="gray" key={option.value} className="flex flex-row gap-2">
                  <span style={{ color: 'var(--color-theme-text-secondary)' }}>
                    {renderChild(option.label)}
                  </span>
                  <button
                    type="button"
                    className={`content-center justify-center text-xs font-bold ${
                      isDisabled ? 'cursor-not-allowed' : ''
                    }`}
                    disabled={isDisabled}
                    style={{
                      color: isDisabled
                        ? 'var(--color-theme-text-muted)'
                        : 'var(--color-theme-text-secondary)',
                    }}
                    onClick={() => {
                      removeValue(v);
                    }}
                  >
                    <Translate className="sr-only">Remove</Translate>
                    <XMarkIcon className="w-4" />
                  </button>
                </Pill>
              );
            })
          : renderChild(placeholder, 'text-(--color-theme-text-muted)')}
      </div>
    </div>
  );
};

export type { MultiSelectProps };
export { MultiSelect };
