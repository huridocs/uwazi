import React, { useState } from 'react';
import { Checkbox } from 'flowbite-react';
import { isString, sortBy } from 'lodash';
import { usePopper } from 'react-popper';
import { Popover } from '@headlessui/react';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { t, Translate } from 'app/I18N';
import { Label } from './Label';
import { Pill } from '../UI';

type Option = { label: string; value: string; selected?: boolean };

interface MultiSelectProps {
  label: String | React.ReactNode;
  options: Option[];
  disabled?: boolean;
  hasErrors?: boolean;
  onChange?: (options: Option[]) => any;
  placeholder?: String | React.ReactNode;
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
}: MultiSelectProps) => {
  const [optionsState, setOptionsState] = useState<Option[]>(sortBy(options, 'label'));
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top-end',
    strategy: 'absolute',
  });

  const selectedOptions = optionsState.filter(option => option.selected);

  let fieldStyles = 'flex items-center justify-between p-2 border-b border-gray-50';
  fieldStyles = hasErrors ? `${fieldStyles} bg-error-50` : `${fieldStyles} bg-gray-50`;

  return (
    <div data-testid="multiselect">
      <Popover className="border rounded-lg border-gray-50">
        <div className={fieldStyles}>
          <Label htmlFor="" hasErrors={Boolean(hasErrors)}>
            {renderChild(label)}
          </Label>
          <div className="flex items-center">
            <Popover.Button
              ref={setReferenceElement}
              className=" text-primary-700 disabled:text-primary-300"
              disabled={disabled}
            >
              <span className="sr-only">{t('System', 'Select', null, false)}</span>
              <PlusCircleIcon className="w-6 text-lg" />
            </Popover.Button>
          </div>
        </div>

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
                  <Translate className="sr-only">Remove</Translate>
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
