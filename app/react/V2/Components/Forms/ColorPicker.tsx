/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect } from 'react';
import { Popover } from '@headlessui/react';
import { InputField } from 'app/V2/Components/Forms';
import { usePopper } from 'react-popper';

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

const ColorPicker = ({
  name,
  className,
  onChange,
  hasErrors,
  value = defaultColors[0],
  options = defaultColors,
}: ColorPickerProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const changeColor = (color: string) => {
    setLocalValue(color);
    if (onChange && color.match(/^#([0-9a-fA-F]{6})$/)) {
      onChange(color);
    }
  };

  // Popper integration
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
    strategy: 'absolute',
    modifiers: [
      {
        name: 'offset',
        options: { offset: [0, 8] },
      },
    ],
  });

  return (
    <div className={`${className}`}>
      <Popover className="relative">
        {({ close }) => (
          <>
            <Popover.Button
              ref={setReferenceElement}
              className="w-[42px] h-[42px] border border-gray-300 cursor-pointer rounded-lg flex items-center justify-center shadow-sm transition hover:border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div
                data-testid="colorpicker-button"
                className="rounded-md w-6 h-6"
                style={{ backgroundColor: localValue }}
              />
            </Popover.Button>
            <Popover.Panel
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
              className="flex flex-col gap-2 p-2 bg-white rounded-xl shadow-lg w-56 z-20 border border-gray-100"
            >
              <ul
                className="grid grid-cols-5 grid-rows-2 gap-2 mb-2 p-2"
                data-testid="colorpicker-popover"
              >
                {options.map((color: string) => (
                  <li key={color}>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onClick={() => {
                        changeColor(color);
                        close();
                      }}
                    >
                      <span className="sr-only">{color}</span>
                      <div
                        data-testid="colorpicker-button"
                        className="rounded-md w-8 h-8"
                        style={{ backgroundColor: color }}
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <InputField
                id={name}
                type="text"
                name={name}
                value={localValue.slice(1)}
                preText="#"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  changeColor(`#${e.target.value}`);
                }}
                className="w-full text-center border border-gray-200 rounded-md focus:border-primary-400 focus:ring-1 focus:ring-primary-200"
                hasErrors={hasErrors}
              />
            </Popover.Panel>
          </>
        )}
      </Popover>
    </div>
  );
};

export { ColorPicker };
