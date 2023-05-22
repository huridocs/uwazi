import React, { useState } from 'react';
import { Checkbox } from 'flowbite-react';
import { sortBy } from 'lodash';
import { usePopper } from 'react-popper';
import { Popover, Transition } from '@headlessui/react';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';
import { Pill } from '../UI';

type Option = { label: string; value: string; selected?: boolean };

interface MultiSelectProps {
  label: String | React.ReactNode;
  options: Option[];
  disabled?: boolean;
  onChange?: (options: Option[]) => any;
}

const MultiSelect = ({ label, options, disabled, onChange = () => {} }: MultiSelectProps) => {
  const [optionsState, setOptionsState] = useState<Option[]>(sortBy(options, 'label'));
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-end',
  });

  const selectedOptions = optionsState.filter(option => option.selected);

  return (
    <Popover className="border rounded-lg border-gray-50 relative" data-testid="multiselect-comp">
      <div className="border-b border-gray-50 bg-gray-50 p-2 flex justify-between">
        <div className="text-indigo-700 text-base">{label}</div>
        <div className="left-0">
          <Popover.Button
            ref={setReferenceElement}
            className="text-primary-700 disabled:text-primary-300"
            disabled={disabled}
          >
            <PlusCircleIcon className="text-lg w-6" />
          </Popover.Button>
        </div>
      </div>

      <div className="min-h-fit p-2 flex flex-wrap">
        {selectedOptions.length ? (
          selectedOptions.map((option: Option) => (
            <Pill color="gray" key={option.value} className="mb-2 flex flex-row">
              <span className="flex items-center">{option.label}</span>
              <button
                type="button"
                className="ml-1 text-gray-400 font-bold content-center justify-center"
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
                <XMarkIcon className="text-lg w-6" />
              </button>
            </Pill>
          ))
        ) : (
          <Translate>Nothing selected</Translate>
        )}
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
          className="p-2 w-fit max-w-md rounded max-h-56 overflow-y-auto absolute right-8 shadow-md bg-white"
          as="ul"
        >
          {optionsState.map((option: Option) => (
            <li key={option.label} className="py-1 flex gap-1 align-top">
              <Checkbox
                checked={option.selected}
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
              <span className="ml-2">{option.label}</span>
            </li>
          ))}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export { MultiSelect };
