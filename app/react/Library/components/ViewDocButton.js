import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { t, I18NLink } from 'app/I18N';
import { Icon } from 'UI';
import { scrollTo, activateReference } from 'app/Viewer/actions/uiActions';

export class ViewDocButton extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    e.stopPropagation();
    const { targetReference } = this.props;
    if (targetReference) {
      this.props.activateReference(targetReference.toJS());
    }
  }

  render() {
    const { sharedId, processed, searchTerm, file } = this.props;
    const isEntity = !file;
    const type = isEntity ? 'entity' : 'document';

    const documentViewUrl = searchTerm ? `/${type}/${sharedId}?searchTerm=${searchTerm}` : `/${type}/${sharedId}`;
    if (!processed && !isEntity) {
      return false;
    }

    return (
      <I18NLink to={documentViewUrl} className="btn btn-default btn-xs" onClick={this.onClick}>
        <Icon icon="angle-right" directionAware /> { t('System', 'View') }
      </I18NLink>
    );
  }
}

ViewDocButton.defaultProps = {
  searchTerm: '',
  processed: false,
  targetReference: null
};

ViewDocButton.propTypes = {
  file: PropTypes.object,
  sharedId: PropTypes.string.isRequired,
  processed: PropTypes.bool,
  searchTerm: PropTypes.string,
  targetReference: PropTypes.object,
  activateReference: PropTypes.func
};

export function mapStateToProps(state, props) {
  return {
    searchTerm: props.storeKey ? state[props.storeKey].search.searchTerm : ''
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ scrollTo, activateReference }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewDocButton);
