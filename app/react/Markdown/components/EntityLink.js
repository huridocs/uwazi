/** @format */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { I18NLink } from 'app/I18N';
import PagesContext from './Context';

export default class EntityLink extends Component {
  render() {
    const { children } = this.props;
    return (
      <PagesContext.Consumer>
        {entity => {
          const sharedId = entity.toJS ? entity.get('sharedId') : entity.sharedId;
          const url = `/entity/${sharedId}`;
          return <I18NLink to={url}>{children}</I18NLink>;
        }}
      </PagesContext.Consumer>
    );
  }
}

EntityLink.defaultProps = {
  children: '',
};

EntityLink.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]),
};
