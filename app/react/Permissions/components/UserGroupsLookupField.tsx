import { Translate } from 'app/I18N';
import React, { useCallback, useRef, useState } from 'react';
import { Icon } from 'UI';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import debounce from 'app/utils/debounce';
import { MemberListItemInfo } from './MemberListItemInfo';

interface UserGroupsLookupFieldProps {
  onChange: (search: string) => void;
  onSelect: (value: MemberWithPermission) => void;
  options: MemberWithPermission[];
}

export const UserGroupsLookupField = ({
  onChange,
  onSelect,
  options,
}: UserGroupsLookupFieldProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedOnChange = useCallback(debounce(onChange, 500), [onChange]);

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShow(true);
    setSearchTerm(event.target.value);
    debouncedOnChange(event.target.value);
  };

  const getOnSelectHandler = (selection: MemberWithPermission) => () => {
    onSelect(selection);
    setShow(false);
  };

  const onKeyPressHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (!selected) {
          setSelected(options.length - 1);
        } else {
          setSelected((selected - 1) % options.length);
        }

        break;
      case 'ArrowDown':
        event.preventDefault();
        if (selected === null) {
          setSelected(0);
        } else {
          setSelected((selected + 1) % options.length);
        }

        break;
      case 'Enter':
        event.preventDefault();
        if (selected !== null) {
          onSelect(options[selected]);
          setShow(false);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setShow(false);
        break;
      default:
        break;
    }
  };

  const optionsListRef = useRef(null);

  return (
    <div className="userGroupsLookupField">
      <input
        type="text"
        placeholder="Add people or groups"
        onChange={onChangeHandler}
        onKeyDown={onKeyPressHandler}
        onBlur={e => {
          if (e.relatedTarget !== optionsListRef.current) {
            setShow(false);
          }
        }}
        onFocus={() => {
          setShow(true);
        }}
        value={searchTerm}
      />
      {show && options.length ? (
        <ul tabIndex={-1} role="listbox" ref={optionsListRef}>
          {options.map((result: MemberWithPermission, index: number) => (
            <li
              key={`${result.type}-${result.refId}`}
              role="option"
              aria-selected={index === selected}
              onClick={getOnSelectHandler(result)}
              className={index === selected ? 'selected' : ''}
            >
              <MemberListItemInfo value={result} />
              <div className="press-enter-note">
                <span>
                  <Translate>Press enter to add</Translate>
                </span>
                <Icon icon="level-down-alt" transform={{ rotate: 90 }} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
