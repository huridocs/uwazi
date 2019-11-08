/** @format */
import { MetadataObject } from 'api/entities';
import { PropertyValueSchema } from 'shared/commonTypes';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

export function UnwrapMOs<T extends PropertyValueSchema>(value: MetadataObject<T>[]) {
  return value.map(v => v.value);
}

export function WrapMOs<T extends PropertyValueSchema>(value: (T | null)[]) {
  return value.map(v => ({
    value: v,
  }));
}

export function AllowMoType<T>(propType: PropTypes.Requireable<T>) {
  return PropTypes.oneOfType([propType, PropTypes.arrayOf(PropTypes.shape({ value: propType }))]);
}

export interface Props<T extends PropertyValueSchema> {
  value: MetadataObject<T>[] | T | undefined;
  onChange: (event: any) => void;
}

export function UnwrapMetadataObject<T extends PropertyValueSchema>(props: Props<T>) {
  const { value, onChange } = props;
  if (!Array.isArray(value)) {
    return { value, onChange };
  }
  const unpackedValue = value.length && value[0].value ? value[0].value : undefined;
  const packingOnChange = (event: any) => {
    onChange([{ value: event.hasOwnProperty('target') ? event.target.value : event }]);
  };
  return { value: unpackedValue, onChange: packingOnChange };
}

export class WrappedControl<T extends PropertyValueSchema> extends Component<Props<T>, {}> {
  render() {
    const { value, onChange } = UnwrapMetadataObject<T>(this.props);
    //return <input type="text" className="form-control" onChange={onChange} value={value || ''} />;
    return React.Children.map(this.props.children, c => {
      if (!React.isValidElement<Props<T>>(c)) {
        return c;
      }
      return React.cloneElement(c, { ...c.props, value, onChange });
    });
  }
}
