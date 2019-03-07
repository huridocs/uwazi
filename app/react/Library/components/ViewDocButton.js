import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { t, I18NLink } from 'app/I18N';
import { DirectionAwareIcon as Icon } from 'UI';

export class ViewDocButton extends Component {
  render() {
    const { sharedId, processed, searchTerm, file } = this.props;
    const isEntity = !file;
    const type = isEntity ? 'entity' : 'document';
    const documentViewUrl = searchTerm ? `/${type}/${sharedId}?searchTerm=${searchTerm}` : `/${type}/${sharedId}`;
    if (!processed && !isEntity) {
      return false;
    }
    return (
      <I18NLink to={documentViewUrl} className="btn btn-default btn-xs" onClick={e => e.stopPropagation()}>
        <Icon icon="angle-right" /> { t('System', 'View') }
      </I18NLink>
    );
  }
}

ViewDocButton.defaultProps = {
  searchTerm: '',
  processed: false,
};

ViewDocButton.propTypes = {
  file: PropTypes.object,
  sharedId: PropTypes.string.isRequired,
  processed: PropTypes.bool,
  searchTerm: PropTypes.string,
};

export function mapStateToProps(state, props) {
  return {
    searchTerm: props.storeKey ? state[props.storeKey].search.searchTerm : ''
  };
}


export default connect(mapStateToProps)(ViewDocButton);
