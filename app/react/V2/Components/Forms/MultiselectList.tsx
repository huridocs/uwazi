/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-statements */
/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { Translate } from 'app/I18N';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { InputField, RadioSelect } from '.';
import { Pill } from '../UI/Pill';
import { Label } from './Label';
import { Checkbox } from './Checkbox';
import { setgroups } from 'process';
// import { isEmpty, xor } from 'lodash';

interface Option {
  label: string | React.ReactNode;
  searchLabel: string;
  value: string;
  items?: Option[];
}

interface MultiselectListProps {
  items: Option[];
  onChange: (selectedItems: string[]) => void;
  label?: string | React.ReactNode;
  hasErrors?: boolean;
  className?: string;
  checkboxes?: boolean;
  value?: string[];
  foldableGroups?: boolean;
}

const SelectedCounter = ({ selectedItems }: { selectedItems: string[] }) => (
  <>
    <Translate>Selected</Translate> {selectedItems.length ? `(${selectedItems.length})` : ''}
  </>
);

const MultiselectList = ({
  items,
  onChange = () => {},
  className,
  label,
  hasErrors,
  value = [],
  checkboxes = false,
  foldableGroups = false,
}: MultiselectListProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(value);
  const [showAll, setShowAll] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);

  useEffect(() => {
    if (value) {
      const groups = filteredItems.filter(item => item.items);
      const groupsToOpen = groups
        .filter(group => {
          if (group.items?.find(item => selectedItems.includes(item.value))) {
            return true;
          }
          return false;
        })
        .map(group => group.value);
      setOpenGroups(groupsToOpen);
    }
  }, [value]);

  useEffect(() => {
    let filtered = [...items];
    if (!showAll) {
      filtered = filtered
        .filter(item => {
          const itemiSelected = selectedItems.includes(item.value);
          const containsSelected = item.items?.some(childItem =>
            selectedItems.includes(childItem.value)
          );

          return itemiSelected || containsSelected;
        })
        .map(item => {
          if (item.items) {
            return {
              ...item,
              items: item.items.filter(childItem => selectedItems.includes(childItem.value)),
            };
          }
          return item;
        });
    }

    if (!searchTerm) {
      setFilteredItems(filtered);
      return;
    }

    filtered = filtered
      .filter(({ searchLabel }) => searchLabel.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(item => {
        if (item.items) {
          return {
            ...item,
            items: item.items.filter(({ searchLabel }) =>
              searchLabel.toLowerCase().includes(searchTerm.toLowerCase())
            ),
          };
        }
        return item;
      });

    setFilteredItems(filtered);
  }, [items, searchTerm, showAll, selectedItems]);

  const handleSelect = (_value: string) => {
    let updatedSelections = [];
    if (selectedItems.includes(_value)) {
      updatedSelections = selectedItems.filter(item => item !== _value);
    } else {
      updatedSelections = [...selectedItems, _value];
    }
    setSelectedItems(updatedSelections);
    onChange(updatedSelections);
  };

  const applyFilter = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setShowAll(target.value === 'true');
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
      setAllSelected(false);
      onChange([]);
    } else {
      const allItems = filteredItems
        .reduce((all: Option[], current) => {
          return current.items ? [...all, ...current.items] : [...all, current];
        }, [])
        .filter(f => f)
        .map((item: Option) => item.value);
      const groupsToOpen = filteredItems.filter(item => item.items).map(group => group.value);
      setSelectedItems(allItems);
      onChange(allItems);
      setOpenGroups(oldValue => [...oldValue, ...groupsToOpen]);
      setAllSelected(true);
    }
  };

  const renderButtonItem = (item: Option) => {
    if (item.items) {
      return renderGroup(item);
    }

    const selected = selectedItems.includes(item.value);
    const borderSyles = selected
      ? 'border-sucess-200'
      : 'border-transparent hover:border-primary-300';

    return (
      <li key={item.value} className="mb-4">
        <button
          type="button"
          className={`w-full flex text-left p-2.5 border ${borderSyles} rounded-lg items-center`}
          onClick={() => handleSelect(item.value)}
        >
          <span className="flex-1">{item.label}</span>
          <div className="flex-1">
            <Pill className="float-right" color={selected ? 'green' : 'primary'}>
              {selected ? <Translate>Selected</Translate> : <Translate>Select</Translate>}
            </Pill>
          </div>
        </button>
      </li>
    );
  };

  const renderCheckboxItem = (item: Option) => {
    if (item.items) {
      return renderGroup(item);
    }
    const selected = selectedItems.includes(item.value);
    return (
      <li key={item.value} className="mb-2">
        <Checkbox
          name={item.value}
          label={item.label}
          checked={selected}
          onChange={() => handleSelect(item.value)}
        />
      </li>
    );
  };

  const handleGroupToggle = (groupKey: string) => {
    if (openGroups.includes(groupKey)) {
      setOpenGroups(openGroups.filter(group => group !== groupKey));
    } else {
      setOpenGroups([...openGroups, groupKey]);
    }
  };

  const isGroupOpen = (groupKey: string) => openGroups.includes(groupKey);

  const renderItem = (item: Option) =>
    checkboxes ? renderCheckboxItem(item) : renderButtonItem(item);

  const renderGroup = (group: Option) => {
    const isOpen = isGroupOpen(group.value);
    if (foldableGroups) {
      return (
        <li key={group.value} className="mb-4">
          <div
            className={`flex justify-between p-3 mb-4 rounded-lg ${isOpen ? 'bg-indigo-50' : 'bg-gray-50'}`}
            onClick={() => handleGroupToggle(group.value)}
          >
            <span className="block text-sm font-bold text-gray-900">{group.label}</span>
            <button
              className="text-indigo-800 bg-indigo-200 rounded-[6px] text-xs font-medium px-1.5 py-0.5 flex flex-row items-center justify-center gap-1"
              type="button"
            >
              <div className="w-3 h-3 text-sm">
                {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </div>
              <Translate>Properties</Translate>
            </button>
          </div>
          {isOpen && <ul className="pl-4">{group.items?.map(renderItem)}</ul>}
        </li>
      );
    }

    return (
      <li key={group.value} className="mb-4">
        <span className="block mb-4 text-sm font-bold text-gray-900">{group.label}</span>
        <ul className="">{group.items?.map(renderItem)}</ul>
      </li>
    );
  };

  return (
    <div className={`flex flex-col relative ${className}`}>
      <div className="relative top-0 w-full px-2 mb-4">
        <Label htmlFor="search-multiselect" hideLabel={!label} hasErrors={Boolean(hasErrors)}>
          {label}
        </Label>
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
        <span
          className="absolute right-0 float-right mt-2 mr-3 font-normal text-gray-900 underline cursor-pointer bottom-1"
          onClick={toggleSelectAll}
        >
          {allSelected ? <Translate>Unselect all</Translate> : <Translate>Select all</Translate>}
        </span>
      </div>

      <ul className="px-2 w-full overflow-y-scroll max-h-[calc(100vh_-_9rem)]">
        {filteredItems.map(renderItem)}
      </ul>
    </div>
  );
};

export { MultiselectList };
export type { Option as MultiselectListOption };
