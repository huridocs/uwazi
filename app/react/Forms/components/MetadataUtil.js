/** @format */
import PropTypes from 'prop-types';

export function AllowMoType(propType) {
  return PropTypes.oneOfType([propType, PropTypes.arrayOf(PropTypes.shape({ value: propType }))]);
}

export function UnwrapMetadataObject(props) {
  let isMo = false;
  let { value, onChange } = props;
  if (Array.isArray(value)) {
    isMo = true;
    if (value.length) {
      [{ value }] = value;
    } else {
      value = undefined;
    }
    onChange = event => {
      props.onChange([{ value: event.target.value }]);
    };
  }
  return { isMo, value, onChange };
}
