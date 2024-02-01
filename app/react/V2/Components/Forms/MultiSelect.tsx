import React, { useState } from 'react';
import { Checkbox } from 'flowbite-react';
import { isString, sortBy } from 'lodash';
import { usePopper } from 'react-popper';
import { Popover } from '@headlessui/react';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { t, Translate } from 'app/I18N';
import { Pill } from '../UI';

type Option = { label: string; value: string; selected?: boolean };

interface MultiSelectProps {
  label: String | React.ReactNode;
  options: Option[];
  disabled?: boolean;
  hasErrors?: boolean;
  onChange?: (options: Option[]) => any;
  placeholder?: String | React.ReactNode;
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
}: MultiSelectProps) => {
  const [optionsState, setOptionsState] = useState<Option[]>(sortBy(options, 'label'));
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top-end',
    strategy: 'absolute',
  });

  const selectedOptions = optionsState.filter(option => option.selected);

  return (
    <div data-testid="multiselect" className="overflow-hidden rounded-lg shadow-sm">
      <div className={`flex items-center px-4 h-12 ${hasErrors ? 'bg-error-50' : 'bg-gray-50'}`}>
        <span
          className={`flex-1 font-semibold text-sm ${
            hasErrors ? 'text-pink-800' : 'text-gray-700'
          }`}
        >
          {renderChild(label)}
        </span>
        <Popover className="z-10 border border-gray-50">
          <Popover.Button
            ref={setReferenceElement}
            className=" text-primary-700 disabled:text-primary-300"
            disabled={disabled}
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
              {optionsState.map((option: Option) => (
                <li key={option.label} className="flex gap-2 py-1 align-top">
                  <Checkbox
                    className="cursor-pointer"
                    id={option.value}
                    checked={Boolean(option.selected)}
                    disabled={
                      disabled ||
                      (Boolean(option.selected) && !canBeEmpty && selectedOptions.length === 1)
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const isChecked = e.target.checked;
                      const selected = optionsState.map(opt => {
                        if (opt.value === option.value) {
                          return { ...opt, selected: isChecked };
                        }
                        return opt;
                      });
                      setOptionsState(selected);
                      onChange(selected);
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
        {selectedOptions.length
          ? selectedOptions.map((option: Option) => {
              const isDisabled = disabled || (!canBeEmpty && selectedOptions.length === 1);
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
                      const selected = optionsState.map(opt => {
                        if (opt.value === option.value) {
                          return { value: opt.value, label: opt.label };
                        }
                        return opt;
                      });
                      setOptionsState(selected);
                      onChange(selected);
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
