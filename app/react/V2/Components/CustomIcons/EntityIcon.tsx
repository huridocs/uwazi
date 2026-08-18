import React from 'react';
import { Icon } from '#UI/Icon/Icon.js';
import { CountryFlag, hasCountryFlag } from './CoutryFlags.js';

type EntityIconData = {
  _id?: string | null;
  type?: string;
  label?: string;
};

type EntityIconProps = {
  data?: EntityIconData | null;
  className?: string;
};

const isFlagIcon = (data: EntityIconData): boolean => {
  if (data.type === 'Flags') return true;
  if (data.type === 'Icons') return false;
  return Boolean(data._id && hasCountryFlag(data._id));
};

const EntityIcon = ({ data, className }: EntityIconProps) => {
  if (!data?._id || data.type === 'Empty') return null;

  if (isFlagIcon(data)) {
    return (
      <span className={className}>
        <CountryFlag id={data._id} />
      </span>
    );
  }

  return (
    <span className={className}>
      <Icon icon={data._id} />
    </span>
  );
};

export { EntityIcon };
export type { EntityIconData, EntityIconProps };
