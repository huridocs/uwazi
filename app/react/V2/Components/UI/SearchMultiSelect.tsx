/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { Translate } from 'app/I18N';
import { InputField, RadioSelect } from '../Forms';
import { Pill } from './Pill';

interface SearchMultiselectProps {
  items: { label: string; value: string }[];
  onChange: (selectedItems: string[]) => void;
  className?: string;
}

const SelectedCounter = ({ selectedItems }: { selectedItems: string[] }) => (
  <>
    <Translate>Selected</Translate> {selectedItems.length ? `(${selectedItems.length})` : ''}
  </>
);

const SearchMultiselect = ({ items, onChange, className }: SearchMultiselectProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAll, setShowAll] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    onChange(selectedItems);
  }, [onChange, selectedItems]);

  const handleSelect = (value: string) => {
    if (selectedItems.includes(value)) {
      setSelectedItems(selectedItems.filter(item => item !== value));
    } else {
      setSelectedItems([...selectedItems, value]);
    }
  };

  const applyFilter = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setShowAll(target.value === 'true');
  };

  return (
    <div className={className}>
      <div className="sticky top-0 w-full mb-4">
        <InputField
          id="search-multiselect"
          label="search-multiselect"
          hideLabel
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search"
          value={searchTerm}
          clearFieldAction={() => setSearchTerm('')}
        />
        <RadioSelect
          name="filter"
          orientation="horizontal"
          options={[
            {
              label: <Translate>All</Translate>,
              value: 'true',
              defaultChecked: true,
            },
            {
              label: <SelectedCounter selectedItems={selectedItems} />,
              value: 'false',
              disabled: selectedItems.length === 0,
            },
          ]}
          onChange={applyFilter}
          className="px-1 pt-4"
        />
      </div>

      <ul className="w-full pt-10">
        {items.map(({ label, value }) => {
          const selected = selectedItems.includes(value);
          const hidden =
            !label.toLowerCase().includes(searchTerm.toLowerCase()) || (!showAll && !selected);
          const borderSyles = selected
            ? 'border-sucess-200'
            : 'border-transparent hover:border-primary-300';

          return (
            <li key={value} className={`mb-4 ${hidden ? 'hidden' : ''}`}>
              <button
                type="button"
                className={`w-full flex text-left p-2.5 border ${borderSyles} rounded-lg items-center`}
                onClick={() => handleSelect(value)}
              >
                <span className="flex-1">{label}</span>
                <div className="flex-1">
                  <Pill className="float-right" color={selected ? 'green' : 'primary'}>
                    {selected ? <Translate>Selected</Translate> : <Translate>Select</Translate>}
                  </Pill>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export { SearchMultiselect };
