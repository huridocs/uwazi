import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { LookupMultiSelect, Switcher } from 'app/ReactReduxForms';
import { Icon } from 'app/UI';

const SelectFilter = ({
  onChange,
  property,
  model,
  label,
  options,
  prefix,
  showBoolSwitch,
  showChartButton,
  chartActions,
  sort,
  lookup,
  totalPossibleOptions,
  allowSelectGroup,
}) => {
  const [chartEnabled, setChartEnabled] = useState(false);

  const chartViewActivateClick = () => {
    if (chartEnabled) {
      chartActions.removeChartProperty(property);
    } else {
      chartActions.addChartProperty(property);
    }
    setChartEnabled(!chartEnabled);
  };

  return (
    <ul className="search__filter is-active">
      <li>
        {showChartButton && (
          <span className="chart-view-activate">
            <button
              type="button"
              className={`btn btn-xs ${chartEnabled ? 'btn-success' : 'btn-white'}`}
              onClick={() => chartViewActivateClick()}
            >
              <Icon icon="chart-bar" />
            </button>
          </span>
        )}
        {label}
        {showBoolSwitch && <Switcher model={`${model}.and`} prefix={prefix} onChange={onChange} />}
      </li>
      <li className="wide">
        <LookupMultiSelect
          model={`${model}.values`}
          prefix={prefix}
          options={options}
          onChange={onChange}
          sort={sort}
          lookup={lookup}
          totalPossibleOptions={totalPossibleOptions}
          allowSelectGroup={allowSelectGroup}
        />
      </li>
    </ul>
  );
};

SelectFilter.defaultProps = {
  onChange: () => {},
  property: {},
  label: '',
  prefix: '',
  showBoolSwitch: false,
  showChartButton: false,
  chartActions: { addChartProperty: () => {}, removeChartProperty: () => {} },
  sort: false,
  options: [],
  lookup: null,
  totalPossibleOptions: 0,
  allowSelectGroup: false,
};

SelectFilter.propTypes = {
  model: PropTypes.string.isRequired,
  property: PropTypes.instanceOf({}),
  onChange: PropTypes.func,
  prefix: PropTypes.string,
  showBoolSwitch: PropTypes.bool,
  showChartButton: PropTypes.bool,
  chartActions: { addChartProperty: PropTypes.func, removeChartProperty: PropTypes.func },
  sort: PropTypes.bool,
  options: PropTypes.array,
  totalPossibleOptions: PropTypes.number,
  lookup: PropTypes.func,
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  allowSelectGroup: PropTypes.bool,
};

export default SelectFilter;
