/** @format */

import PropTypes from 'prop-types';
import { MetadataObject, MetadataObjectValue } from 'api/entities/entitiesModel';

export function UnwrapMOs<T extends MetadataObjectValue>(value: MetadataObject<T>[]) {
  return value.map(v => v.value);
}

export function WrapMOs<T extends MetadataObjectValue>(value: (T | null)[]) {
  return value.map(v => ({
    value: v,
  }));
}

export function AllowMoType<T>(propType: PropTypes.Requireable<T>) {
  return PropTypes.oneOfType([propType, PropTypes.arrayOf(PropTypes.shape({ value: propType }))]);
}

export function UnwrapMetadataObject<T extends MetadataObjectValue>(props: {
  value: MetadataObject<T>[] | T | undefined;
  onChange: (event: any) => void;
}) {
  const { value, onChange } = props;
  if (!Array.isArray(value)) {
    return { value, onChange };
  }
  const unpackedValue = value.length ? value[0].value : undefined;
  const packingOnChange = (event: any) => {
    onChange([{ value: event.hasOwnProperty('target') ? event.target.value : event }]);
  };
  return { value: unpackedValue, onChange: packingOnChange };
}
