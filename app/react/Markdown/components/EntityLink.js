import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { I18NLink } from 'app/I18N';
import PagesContext from './Context';


export default class EntityLink extends Component {
  renderLink(entity) {
    const { children } = this.props;
    const sharedId = entity.toJS ? entity.get('sharedId') : entity.sharedId;
    const file = entity.toJS ? entity.get('file') : entity.file;
    const isEntity = !file;
    const type = isEntity ? 'entity' : 'document';

    const url = `/${type}/${sharedId}`;
    return (
      <I18NLink to={url} onClick={this.onClick}>
        {children}
      </I18NLink>
    );
  }

  render() {
    return (
      <PagesContext.Consumer>
        {entity => this.renderLink(entity)}
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
