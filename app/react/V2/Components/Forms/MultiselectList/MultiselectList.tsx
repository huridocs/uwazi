/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-lines */
/* eslint-disable max-statements */
import React, { useEffect, useState, useRef } from 'react';
import { isString } from 'lodash';
import { captureException } from '@sentry/react';
import { t, Translate } from 'app/I18N';
import { debounce, isClient } from 'app/utils';
import { Label } from '../Label';
import { Checkbox } from '../Checkbox';
import { MultiselectListButtonItem } from './MultiselectListButtonItem';
import { MultiselectListGroup } from './MultiselectListGroup';
import { InputField, RadioSelect } from '..';

interface MultiselectListOption {
  label: string | React.ReactNode;
  searchLabel: string;
  value: string;
  items?: MultiselectListOption[];
  suggested?: boolean;
}

interface MultiselectListProps {
  items: MultiselectListOption[];
  onChange?: (selectedValues: string[]) => void;
  onSearch?: (search: string, items?: MultiselectListOption[]) => Promise<MultiselectListOption[]>;
  selectedValues?: string[];
  label?: string | React.ReactNode;
  hasErrors?: boolean;
  className?: string;
  checkboxes?: boolean;
  foldableGroups?: boolean;
  singleSelect?: boolean;
  allowSelelectAll?: boolean;
  startOnSelected?: boolean;
  search?: string;
  suggestions?: boolean;
  itemClassName?: string;
  itemContainerClassName?: string;
  hideFilters?: boolean;
  blankState?: string | React.ReactNode;
}

const renderChild = (child: string | React.ReactNode) =>
  isString(child) ? <Translate>{child}</Translate> : child;

const defaultSearch = async (search: string, items?: MultiselectListOption[]) => {
  const filtered: MultiselectListOption[] = [];

  const labelIncludesSearch = (_label: string) => {
    const a = _label
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    const b = search
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    return a.includes(b);
  };

  items?.forEach(item => {
    const matchesSearch = !search || labelIncludesSearch(item.searchLabel);

    const containsChildrenMatchingSearch =
      !search || item.items?.some(childItem => labelIncludesSearch(childItem.searchLabel));

    if (matchesSearch || containsChildrenMatchingSearch) {
      filtered.push({
        ...item,
        items: item.items?.filter(childItem =>
          childItem.searchLabel.toLowerCase().includes(search.toLowerCase())
        ),
      });
    }
  });

  return Promise.resolve(filtered);
};

const MultiselectList = ({
  items,
  onChange,
  onSearch = defaultSearch,
  className = '',
  label,
  hasErrors,
  selectedValues,
  checkboxes = false,
  foldableGroups = false,
  singleSelect = false,
  allowSelelectAll = false,
  startOnSelected = false,
  search = '',
  suggestions = false,
  hideFilters = false,
  itemClassName,
  itemContainerClassName,
  blankState = <Translate>No items available</Translate>,
}: MultiselectListProps) => {
  const [selections, setSelections] = useState<string[]>(selectedValues || []);
  const [availableItems, setAvailableItems] = useState(items);
  const [showAll, setShowAll] = useState<boolean>(!(startOnSelected && selections.length));
  const [searchTerm, setSearchTerm] = useState(search);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrSuggestedItems, setSelectedOrSuggestedItems] = useState<Set<string>>(
    new Set(selectedValues)
  );
  const [isDirty, setIsDirty] = useState(false);
  const optionsRef = useRef<HTMLUListElement>(null);

  const debouncedSearchRef = useRef(
    debounce(async (term: string, itemList: MultiselectListOption[]) => {
      const results = await onSearch(term, itemList);
      setAvailableItems(results || []);
    }, 500)
  );

  useEffect(() => {
    if (selectedValues) {
      setSelections(selectedValues);
    }
  }, [selectedValues]);

  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  useEffect(() => {
    if (startOnSelected) {
      const groupsToExpand = items
        .filter(item => item.items?.some(childItem => selectedValues?.includes(childItem.value)))
        .map(item => item.value);

      setOpenGroups(groupsToExpand);
    }
  }, [items, selectedValues, startOnSelected]);

  useEffect(() => {
    const newSet = new Set<string>(selections);

    items.forEach(item => {
      if (item.suggested) {
        newSet.add(item.value);
      }

      if (item.items) {
        item.items.forEach(subItem => {
          if (subItem.suggested) {
            newSet.add(subItem.value);
          }
        });
      }
    });

    setSelectedOrSuggestedItems(newSet);
  }, [items, selections]);

  useEffect(() => {
    if (!isDirty && searchTerm) {
      setIsDirty(true);
    }

    if (isDirty) {
      setSearching(true);

      debouncedSearchRef.current(searchTerm, items)?.catch(e => {
        if (isClient) {
          captureException(new Error('Error in useEffect', { cause: e }));
        }
      });

      setSearching(false);
    }
  }, [isDirty, items, searchTerm]);

  useEffect(
    () => () => {
      setIsDirty(false);
      setSearchTerm('');
    },
    []
  );

  const handleSelect = (_value: string) => {
    let newValues;
    if (singleSelect) {
      newValues = selections.includes(_value) ? [] : [_value];
    } else {
      newValues = selections.includes(_value)
        ? selections.filter(item => item !== _value)
        : [...selections, _value];
    }

    setSelections(newValues);
    if (onChange) onChange(newValues);
  };

  const handleSelectAll = () => {
    const allValues: string[] = [];

    items.forEach(item => {
      if (item.items?.length) {
        item.items?.forEach(subItem => allValues.push(subItem.value));
      } else {
        allValues.push(item.value);
      }
    });

    setSelections(allValues);
    if (onChange) onChange(allValues);
  };

  const handleGroupToggle = (groupKey: string) => {
    if (openGroups.includes(groupKey)) {
      setOpenGroups(openGroups.filter(group => group !== groupKey));
    } else {
      setOpenGroups([...openGroups, groupKey]);
    }
  };

  const renderButtonItem = (item: MultiselectListOption) => {
    if (item.items) {
      return renderGroup(item);
    }

    const selected = selections.includes(item.value);

    return (
      <MultiselectListButtonItem
        key={item.value}
        item={item}
        selected={selected}
        onClick={() => handleSelect(item.value)}
        itemClassName={itemClassName}
      />
    );
  };

  const renderCheckboxItem = (item: MultiselectListOption) => {
    if (item.items) {
      return renderGroup(item);
    }
    const selected = selections.includes(item.value);
    return (
      <li
        key={item.value}
        className={`${!selected && searchTerm && !showAll ? 'opacity-70' : ''} ${itemClassName ?? ' rounded-lg mb-2'} `}
      >
        <Checkbox
          name={item.value}
          label={item.label}
          checked={selected}
          onChange={() => handleSelect(item.value)}
        />
      </li>
    );
  };

  const isGroupOpen = (groupKey: string) => openGroups.includes(groupKey);

  const renderItem = (item: MultiselectListOption) => {
    const itemHasSelectedChildren = item.items?.some(
      childItem => selections.includes(childItem.value) || childItem.suggested
    );

    if (
      !showAll &&
      !selections.includes(item.value) &&
      !item.suggested &&
      !itemHasSelectedChildren
    ) {
      return null;
    }

    return checkboxes ? renderCheckboxItem(item) : renderButtonItem(item);
  };

  const renderGroup = (group: MultiselectListOption) => {
    const isOpen = isGroupOpen(group.value);

    return (
      <MultiselectListGroup
        key={group.value}
        label={group.label}
        isOpen={isOpen}
        foldable={foldableGroups}
        onClick={() => handleGroupToggle(group.value)}
        itemContainerClassName={itemContainerClassName}
        itemClassName={itemClassName}
      >
        {group.items?.map(renderItem)}
      </MultiselectListGroup>
    );
  };

  const renderSelectedLabel = () => {
    if (suggestions) {
      return (
        <span className="flex gap-1">
          <Translate>Selected or suggested</Translate>
          {selectedOrSuggestedItems.size ? `(${selectedOrSuggestedItems.size})` : ''}
        </span>
      );
    }

    return (
      <>
        <Translate>Selected</Translate> {selections.length ? `(${selections.length})` : ''}
      </>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="sticky top-0 w-full pt-4 mb-2 bg-white">
        <Label htmlFor="search-multiselect" hideLabel={!label} hasErrors={Boolean(hasErrors)}>
          {label}
        </Label>
        <InputField
          id="search-multiselect"
          label="search-multiselect"
          hideLabel
          onChange={e => {
            if (!isDirty) {
              setIsDirty(true);
            }
            setSearchTerm(e.currentTarget.value);
          }}
          placeholder={t('System', 'Search', null, false)}
          value={searchTerm}
          clearFieldAction={() => setSearchTerm('')}
        />
        {!hideFilters && (
          <div className="flex mx-1 my-4 flex-nowrap" data-testid="multiselectlist-filters">
            <RadioSelect
              name="filter"
              orientation="horizontal"
              options={[
                {
                  label: <Translate data-testid="multiselectlist-show-all">All</Translate>,
                  value: 'true',
                  defaultChecked: !startOnSelected,
                },
                {
                  label: renderSelectedLabel(),
                  value: 'false',
                  disabled: selectedOrSuggestedItems.size === 0,
                  defaultChecked: startOnSelected,
                },
              ]}
              onChange={e => setShowAll(e.currentTarget.value === 'true')}
              className="flex-grow"
            />
            {allowSelelectAll && (
              <button
                type="button"
                className="text-gray-400 underline"
                onClick={() => handleSelectAll()}
              >
                <Translate>Select all</Translate>
              </button>
            )}
          </div>
        )}
      </div>

      {availableItems.length === 0 && !searching && (
        <div className="flex w-full h-full justify-center items-start min-h-[400px]">
          {renderChild(blankState)}
        </div>
      )}
      <ul
        className={`${itemContainerClassName ?? ' w-full px-2 pt-2 grow min-h-[400px]'}`}
        ref={optionsRef}
      >
        {availableItems.map(renderItem)}
      </ul>
    </div>
  );
};
export { MultiselectList };
export type { MultiselectListOption };
