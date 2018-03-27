import React from 'react';
import PropTypes from 'prop-types';

const ExtendedTooltip = (props) => {
  if (props.active) {
    const dataSetA = props.payload[0];
    const dataSetB = props.payload[1];

    return (
      <div style={{ backgroundColor: '#fff', border: '1px solid #ccc' }}>
        <div style={{ backgroundColor: '#eee', borderBottom: '1px dashed #ccc', padding: '5px' }}>
          {dataSetA.payload.name}:&nbsp;&nbsp;
          <b style={{ color: '#600' }}>{dataSetA.value + dataSetB.value}</b>
        </div>
        <div style={{ padding: '5px' }}>
          {dataSetA.payload.setALabel}:&nbsp;&nbsp;<b style={{ color: '#600' }}>{dataSetA.value}</b><br />
          {dataSetB.payload.setBLabel}:&nbsp;&nbsp;<b style={{ color: '#600' }}>{dataSetB.value}</b>
        </div>
      </div>
    );
  }
  return null;
};

ExtendedTooltip.defaultProps = {
  payload: [],
  active: false
};

ExtendedTooltip.propTypes = {
  payload: PropTypes.arrayOf(PropTypes.object),
  active: PropTypes.bool,
};

export default ExtendedTooltip;
