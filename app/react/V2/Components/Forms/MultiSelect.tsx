import React, { useState } from 'react';
import { Checkbox } from 'flowbite-react';
import { isString } from 'lodash';
import { usePopper } from 'react-popper';
import { Popover } from '@headlessui/react';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { t, Translate } from 'app/I18N';
import { Pill } from '../UI';

type Option = { label: string; value: string };

interface MultiSelectProps {
  label: string | React.ReactNode;
  options: Option[];
  disabled?: boolean;
  hasErrors?: boolean;
  onChange?: (options: string[]) => any;
  value: string[];
  placeholder?: string | React.ReactNode;
  canBeEmpty?: boolean;
}

const renderChild = (child: string | React.ReactNode, className?: string) =>
  isString(child) ? <Translate className={className || ''}>{child}</Translate> : child;

const MultiSelect = ({
  label,
  options,
  disabled,
  hasErrors,
  onChange = () => {},
  placeholder = 'No options',
  canBeEmpty = true,
  value,
}: MultiSelectProps) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top-end',
    strategy: 'absolute',
  });

  const [currentValue, setCurrentValue] = useState<string[]>(value);

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

  return (
    <div data-testid="multiselect" className="rounded-lg shadow-sm">
      <div
        className={`flex items-center px-4 h-12 rounded-t-lg ${
          hasErrors ? 'bg-error-50' : 'bg-gray-50'
        }`}
      >
        <span
          className={`flex-1 font-semibold text-sm ${
            hasErrors ? 'text-pink-800' : 'text-gray-700'
          }`}
        >
          {renderChild(label)}
        </span>
        <Popover className="border border-gray-50">
          <Popover.Button
            ref={setReferenceElement}
            className=" text-primary-700 disabled:text-primary-300"
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
          >
            <ul
              className="max-w-md p-2 mb-2 overflow-y-auto bg-white rounded-md shadow max-h-56 w-fit min-w-56"
              data-testid="multiselect-popover"
            >
              {options.map((option: Option) => (
                <li key={option.label} className="flex gap-2 py-1 align-top">
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
                    {option.label}
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
                  <span className="text-gray-600">{option.label}</span>
                  <button
                    type="button"
                    className={`content-center justify-center text-xs font-bold ${
                      isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    disabled={isDisabled}
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
          : renderChild(placeholder, 'text-gray-500')}
      </div>
    </div>
  );
};

export type { MultiSelectProps };
export { MultiSelect };
