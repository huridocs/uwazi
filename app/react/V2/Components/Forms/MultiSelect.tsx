import React, { useState } from 'react';
import { Checkbox } from 'flowbite-react';
import { isString, sortBy } from 'lodash';
import { usePopper } from 'react-popper';
import { Popover, Transition } from '@headlessui/react';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { t, Translate } from 'app/I18N';
import { Pill } from '../UI';

type Option = { label: string; value: string; selected?: boolean };

interface MultiSelectProps {
  label: String | React.ReactNode;
  options: Option[];
  disabled?: boolean;
  onChange?: (options: Option[]) => any;
  placeholder?: String | React.ReactNode;
}

const renderChild = (child: string | React.ReactNode, className?: string) =>
  isString(child) ? <Translate className={className || ''}>{child}</Translate> : child;

const MultiSelect = ({
  label,
  options,
  disabled,
  onChange = () => {},
  placeholder = 'No options',
}: MultiSelectProps) => {
  const [optionsState, setOptionsState] = useState<Option[]>(sortBy(options, 'label'));
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
    strategy: 'absolute',
  });

  const selectedOptions = optionsState.filter(option => option.selected);

  return (
    <div data-testid="multiselect">
      <Popover className="relative border rounded-lg border-gray-50">
        <div className="flex justify-between p-2 border-b bg-gray-50 border-gray-50">
          <div className="text-base text-indigo-700">{renderChild(label)}</div>
          <div className="left-0">
            <Popover.Button
              ref={setReferenceElement}
              className="text-primary-700 disabled:text-primary-300"
              disabled={disabled}
            >
              <span className="sr-only">{t('System', 'Select', null, false)}</span>
              <PlusCircleIcon className="w-6 text-lg" />
            </Popover.Button>
          </div>
        </div>

        <Transition
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Popover.Panel
            ref={setPopperElement}
            style={styles.popper}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...attributes.popper}
            as="div"
          >
            <ul className="max-w-md p-2 overflow-y-auto bg-white rounded shadow-md max-h-56 w-fit">
              {optionsState.map((option: Option) => (
                <li key={option.label} className="flex gap-2 py-1 align-top">
                  <Checkbox
                    className="cursor-pointer"
                    id={option.value}
                    checked={Boolean(option.selected)}
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
                  <label className="cursor-pointer" htmlFor={option.value}>
                    {option.label}
                  </label>
                </li>
              ))}
            </ul>
          </Popover.Panel>
        </Transition>
      </Popover>
      <div className="flex flex-wrap gap-2 px-5 py-4 min-h-fit">
        {selectedOptions.length
          ? selectedOptions.map((option: Option) => (
              <Pill color="gray" key={option.value} className="flex flex-row mb-2">
                <span className="flex items-center">{option.label}</span>
                <button
                  type="button"
                  className="content-center justify-center ml-1 font-bold text-gray-400"
                  disabled={disabled}
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
                  <XMarkIcon className="w-6 text-lg" />
                </button>
              </Pill>
            ))
          : renderChild(placeholder, 'text-gray-500')}
      </div>
    </div>
  );
};

export type { MultiSelectProps };
export { MultiSelect };
