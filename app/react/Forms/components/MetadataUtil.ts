/** @format */
import { MetadataObject } from 'api/entities';
import { PropertyValueSchema } from 'shared/commonTypes';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

export function AllowMoType<T>(propType: PropTypes.Requireable<T>) {
  return PropTypes.oneOfType([propType, PropTypes.arrayOf(PropTypes.shape({ value: propType }))]);
}

export interface Props<T extends PropertyValueSchema> {
  value: MetadataObject<T>[] | T | undefined | string;
  onChange: (event: any) => void;
}

export function UnwrapMetadataObject<T extends PropertyValueSchema>(props: Props<T>) {
  const { value, onChange } = props;
  if (!Array.isArray(value)) {
    return { value, onChange, isMo: false };
  }
  const unpackedValue = value.length && value[0].value ? value[0].value : undefined;
  const packingOnChange = (event: any) => {
    const newValue = event.hasOwnProperty('target') ? event.target.value : event;
    onChange(newValue.hasOwnProperty('value') ? [newValue] : [{ value: newValue }]);
  };
  return { value: unpackedValue, onChange: packingOnChange, isMo: true };
}

export class WrappedControl<T extends PropertyValueSchema> extends Component<Props<T>, {}> {
  render() {
    const { value, onChange } = UnwrapMetadataObject<T>(this.props);
    //return <input type="text" className="form-control" onChange={onChange} value={value || ''} />;
    return React.Children.map(this.props.children, c => {
      if (!React.isValidElement<Props<T>>(c)) {
        return c;
      }
      return React.cloneElement(c, { ...c.props, value: value || '', onChange });
    });
  }
}
