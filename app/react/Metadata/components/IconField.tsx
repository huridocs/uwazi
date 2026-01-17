/** @format */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { IconSelector } from '#app/ReactReduxForms/index.jsx';
import { actions } from '#app/Metadata/index.js';
import { FormValue } from '#app/Forms/index.js';
import ToggleDisplay from '#app/Layout/ToggleDisplay.jsx';
import { bindActionCreators } from 'redux';
import { Translate } from '#app/I18N/index.js';
import { Icon } from '#app/V2/Components/UI/index.js';

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
