/** @format */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { IconSelector } from 'app/ReactReduxForms';
import { actions } from 'app/Metadata';
import { FormValue } from 'app/Forms';
import ToggleDisplay from 'app/Layout/ToggleDisplay';
import { bindActionCreators } from 'redux';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';

export const IconFieldBase = ({ model, removeIcon }) => (
  <FormValue model={`${model}.icon`}>
    {(icon = {}) => (
      <div className="icon-selector">
        <ToggleDisplay
          showLabel={
            <span>
              <Translate>add icon</Translate>
              <Icon icon="eye" />
            </span>
          }
          hideLabel={
            <span>
              {<Translate>remove icon</Translate>}
              <Icon icon="eye-slash" />
            </span>
          }
          onHide={() => removeIcon(`${model}.icon`)}
          open={!!icon._id}
        >
          <ul className="search__filter">
            <li>
              <label>
                <Translate>Icon</Translate> / <Translate>Flag</Translate>
              </label>
            </li>
            <li className="wide">
              <IconSelector model=".icon" />
            </li>
          </ul>
        </ToggleDisplay>
      </div>
    )}
  </FormValue>
);

IconFieldBase.propTypes = {
  model: PropTypes.string.isRequired,
  removeIcon: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeIcon: actions.removeIcon }, dispatch);
}

export const IconField = connect(null, mapDispatchToProps)(IconFieldBase);
