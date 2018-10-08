import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { IconSelector } from 'app/ReactReduxForms';
import { actions } from 'app/Metadata';
import { StoreValue } from 'app/Layout';
import ToggleDisplay from 'app/Layout/ToggleDisplay';
import { bindActionCreators } from 'redux';
import t from 'app/I18N/t';

export const IconField = ({ model, removeIcon }) => (
  <StoreValue model={`${model}.icon`}>{
    icon => (
      <ToggleDisplay
        showLabel="add icon"
        hideLabel="remove icon"
        onHide={() => removeIcon(`${model}.icon`)}
        open={!!icon}
      >
        <ul className="search__filter">
          <li><label>{t('System', 'Icon')} / {t('System', 'Flag')}</label></li>
          <li className="wide">
            <IconSelector model=".icon"/>
          </li>
        </ul>
      </ToggleDisplay>
    )}
  </StoreValue>
);

IconField.propTypes = {
  model: PropTypes.string.isRequired,
  removeIcon: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeIcon: actions.remove }, dispatch);
}

export default connect(null, mapDispatchToProps)(IconField);
