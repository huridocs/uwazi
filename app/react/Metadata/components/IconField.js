/** @format */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { IconSelector } from '../../ReactReduxForms/index.js';
import { actions } from '../../Metadata.js';
import { FormValue } from '../../Forms/index.js';
import ToggleDisplay from '../../Layout/ToggleDisplay.js';
import { bindActionCreators } from 'redux';
import { Translate } from '#app/I18N/index.js';
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
