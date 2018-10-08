import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { IconSelector } from 'app/ReactReduxForms';
import { actions } from 'app/Metadata';
import { StoreValue } from 'app/Layout';
import ToggleDisplay from 'app/Layout/ToggleDisplay';
import { bindActionCreators } from 'redux';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';

export const IconField = ({ model, removeIcon }) => (
  <StoreValue model={`${model}.icon`}>{
    icon => (
      <ToggleDisplay
        showLabel={<span><Translate>show icon</Translate><Icon icon="eye" /></span>}
        hideLabel={<span>{<Translate>hide icon</Translate>}<Icon icon="eye-slash" /></span>}
        onHide={() => removeIcon(`${model}.icon`)}
        open={!!icon}
      >
        <ul className="search__filter">
          <li><label><Translate>Icon</Translate> / <Translate>Flag</Translate></label></li>
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
