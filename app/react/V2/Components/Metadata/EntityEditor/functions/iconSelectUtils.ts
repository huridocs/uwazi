import { CountryList } from '#app/UI/index.js';

type EntityIcon = {
  _id: string | null;
  type: string;
  label: string;
};

const EMPTY_ICON: EntityIcon = { _id: null, type: 'Empty', label: '' };

const hasEntityIcon = (icon?: EntityIcon | null): boolean =>
  Boolean(icon?._id && icon.type !== 'Empty');

const selectionFromIcon = (icon?: EntityIcon | null): string => {
  if (!hasEntityIcon(icon)) {
    return '';
  }

  return `${icon!.type}:${icon!._id}`;
};

const iconFromSelection = (value: string): EntityIcon => {
  if (!value) {
    return EMPTY_ICON;
  }

  const separatorIndex = value.indexOf(':');
  const type = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);

  if (type === 'Flags') {
    const country = CountryList.get(id);
    return {
      _id: id,
      type,
      label: country?.label ?? id,
    };
  }

  return {
    _id: id,
    type,
    label: id,
  };
};

export type { EntityIcon };
export { EMPTY_ICON, hasEntityIcon, selectionFromIcon, iconFromSelection };
