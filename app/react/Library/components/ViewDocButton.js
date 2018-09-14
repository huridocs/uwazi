import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { t, I18NLink } from 'app/I18N';
import { Icon } from 'UI';

export class ViewDocButton extends Component {
  render() {
    const { sharedId, type, processed, searchTerm } = this.props;
    const isEntity = type === 'entity';
    const documentViewUrl = searchTerm ? `/${type}/${sharedId}?searchTerm=${searchTerm}` : `/${type}/${sharedId}`;

    if (!processed && !isEntity) {
      return false;
    }

    return (
      <I18NLink to={documentViewUrl} className="btn btn-default btn-xs" onClick={e => e.stopPropagation()}>
        <Icon icon="angle-right" /> { t('System', 'View') }
      </I18NLink>);
  }
}

ViewDocButton.defaultProps = {
  searchTerm: '',
  processed: false,
};

ViewDocButton.propTypes = {
  type: PropTypes.string.isRequired,
  sharedId: PropTypes.string.isRequired,
  processed: PropTypes.bool,
  searchTerm: PropTypes.string,
};

export function mapStateToProps(state, props) {
  return {
    searchTerm: state[props.storeKey].search.searchTerm
  };
}


export default connect(mapStateToProps)(ViewDocButton);
