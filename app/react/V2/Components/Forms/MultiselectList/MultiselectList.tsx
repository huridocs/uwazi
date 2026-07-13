/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-multi-comp */
/* eslint-disable max-lines */
import React, { useEffect, useState, useRef } from 'react';
import isString from 'lodash/isString.js';
import { t, Translate } from '#app/I18N/index.js';
import { debounce } from '#app/utils/index.js';
import { Label } from '../Label.js';
import { Checkbox } from '../Checkbox.js';
import { CompactSearchInput } from '../CompactSearchInput.js';
import { MultiselectListButtonItem } from './MultiselectListButtonItem.js';
import { MultiselectListGroup } from './MultiselectListGroup.js';
import { InputField, RadioSelect } from '../index.js';

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

const relationshipPanelClassName =
  'flex flex-col overflow-hidden rounded-lg border border-border bg-paper';

const relationshipListClassName = 'w-full max-h-[11.25rem] overflow-y-auto px-2 py-2';

const defaultListClass = 'w-full grow overflow-y-auto px-2 pt-2';

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
  onSearch?: (search: string) => any;
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
  noItems?: string | React.ReactNode;
  id?: string;
  /** Bordered panel layout for entity relationship pickers. */
  panel?: boolean;
}

const WrapChild = ({ children }: { children: string | React.ReactNode }) =>
  isString(children) ? <Translate>{children}</Translate> : children;

const defaultSearch = (search: string, items?: MultiselectListOption[]) => {
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

  return filtered;
};

// eslint-disable-next-line max-statements
const MultiselectList = ({
  items,
  onChange,
  onSearch,
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
  id = 'search-multiselect',
  noItems = <Translate>No items available</Translate>,
  panel = false,
}: MultiselectListProps) => {
  const [selections, setSelections] = useState<string[]>(selectedValues || []);
  const [availableItems, setAvailableItems] = useState<MultiselectListOption[] | undefined>(items);
  const [showAll, setShowAll] = useState<boolean>(!(startOnSelected && selections.length));
  const [searchTerm, setSearchTerm] = useState(search);
  const [isDirty, setIsDirty] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[] | undefined>([]);
  const [selectedOrSuggestedItems, setSelectedOrSuggestedItems] = useState<Set<string>>(
    new Set(selectedValues)
  );
  const optionsRef = useRef<HTMLUListElement>(null);

  const debouncedSearch = useRef(onSearch ? debounce(onSearch, 300) : undefined).current;

  useEffect(() => {
    setAvailableItems(items);
  }, [items]);

  useEffect(() => {
    if (selectedValues) {
      setSelections(selectedValues);
    }
  }, [selectedValues]);

  useEffect(() => {
    setSearchTerm(search);
    setIsDirty(true);
    return () => {
      setIsDirty(false);
      setSearchTerm('');
    };
  }, [search]);

  useEffect(() => {
    if (isDirty && debouncedSearch) {
      debouncedSearch(searchTerm);
    }
  }, [debouncedSearch, isDirty, searchTerm]);

  useEffect(() => {
    if (startOnSelected) {
      const groupsToExpand = availableItems
        ?.filter(item => item.items?.some(childItem => selectedValues?.includes(childItem.value)))
        .map(item => item.value);

      setOpenGroups(groupsToExpand);
    }
  }, [availableItems, selectedValues, startOnSelected]);

  useEffect(() => {
    const newSet = new Set<string>(selections);

    availableItems?.forEach(item => {
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
  }, [availableItems, selections]);

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

    availableItems?.forEach(item => {
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
    if (openGroups?.includes(groupKey)) {
      setOpenGroups(openGroups.filter(group => group !== groupKey));
    } else {
      setOpenGroups([...(openGroups || []), groupKey]);
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
        className={cx(
          !selected && searchTerm && !showAll && 'opacity-70',
          itemClassName ?? (panel ? '' : 'rounded-lg mb-2')
        )}
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
    const isOpen = openGroups?.includes(group.value);

    return (
      <MultiselectListGroup
        key={group.value}
        label={group.label}
        isOpen={!!isOpen}
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

  const renderFilters = () =>
    !hideFilters ? (
      <div
        className={
          panel ? 'flex flex-nowrap border-b border-border px-3 py-2' : 'flex flex-nowrap mx-1 my-4'
        }
        data-testid="multiselectlist-filters"
      >
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
          className="grow"
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
    ) : null;

  const renderSearch = () =>
    panel ? (
      <CompactSearchInput
        id={id}
        placeholder={t('System', 'Search', null, false)}
        value={searchTerm}
        onChange={value => {
          setSearchTerm(value);
          setIsDirty(true);
        }}
      />
    ) : (
      <InputField
        id={id}
        label={label}
        hideLabel
        placeholder={t('System', 'Search', null, false)}
        value={searchTerm}
        clearFieldAction={() => {
          setSearchTerm('');
        }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setSearchTerm(e.currentTarget.value);
          setIsDirty(true);
        }}
      />
    );

  return (
    <div className={cx(panel ? 'flex flex-col' : 'flex h-full flex-col', className)}>
      <div className={panel ? 'flex flex-col' : 'w-full bg-paper'}>
        <Label htmlFor={id} hideLabel={!label} hasErrors={Boolean(hasErrors)}>
          {label}
        </Label>
        {panel ? (
          <div className={cx(relationshipPanelClassName, 'mt-1.5')}>
            {renderSearch()}
            {renderFilters()}
            {availableItems?.length === 0 ? (
              <div className="px-3 py-2 text-xs text-ink-muted">
                <WrapChild>{noItems}</WrapChild>
              </div>
            ) : (
              <ul className={relationshipListClassName} ref={optionsRef}>
                {availableItems?.map(renderItem)}
              </ul>
            )}
          </div>
        ) : (
          <>
            {renderSearch()}
            {renderFilters()}
          </>
        )}
      </div>

      {!panel && availableItems?.length === 0 && (
        <div className="flex h-full w-full grow items-start justify-center">
          <WrapChild>{noItems}</WrapChild>
        </div>
      )}
      {!panel && (
        <ul className={itemContainerClassName ?? defaultListClass} ref={optionsRef}>
          {availableItems?.map(renderItem)}
        </ul>
      )}
    </div>
  );
};
export { MultiselectList, defaultSearch };
export type { MultiselectListOption };
