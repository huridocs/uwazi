import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Map } from 'immutable';
import { t, I18NLink } from 'app/I18N';
import { Icon } from 'UI';
import { actions } from 'app/BasicReducer';

export class ViewDocButton extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    e.stopPropagation();
    const { targetReference, openReferencesTab } = this.props;
    if (targetReference) {
      openReferencesTab();
    }
  }

  render() {
    const { sharedId, processed, searchTerm, file, targetReference } = this.props;
    const isEntity = !file;
    const type = isEntity ? 'entity' : 'document';
    const referenceQueryParams = targetReference ?
      `ref=${targetReference.get('_id')}&refStart=${targetReference.getIn(['range', 'start'])}` +
      `&refEnd=${targetReference.getIn(['range', 'end'])}` : '';

    const documentViewUrl = searchTerm ? `/${type}/${sharedId}?searchTerm=${searchTerm}&${referenceQueryParams}` :
      `/${type}/${sharedId}?${referenceQueryParams}`;

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
  targetReference: PropTypes.instanceOf(Map),
  openReferencesTab: PropTypes.func.isRequired,
};

export function mapStateToProps(state, props) {
  return {
    searchTerm: props.storeKey ? state[props.storeKey].search.searchTerm : ''
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    openReferencesTab: () => _dispatch => _dispatch(actions.set('viewer.sidepanel.tab', 'references'))
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewDocButton);
