import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {I18NLink} from 'app/I18N';
import {selectDocument, unselectDocument} from '../actions/libraryActions';

import {Item} from 'app/Layout';
import {fromJS as Immutable} from 'immutable';

export class Doc extends Component {

  select(active) {
    if (active) {
      return this.props.unselectDocument();
    }
    this.props.selectDocument(this.props.doc);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.doc._id !== nextProps.doc._id || this.props.active !== nextProps.active;
  }

  render() {
    const {type, sharedId} = this.props.doc;
    const documentViewUrl = `/${type}/${sharedId}`;

    return <Item onClick={this.select.bind(this, this.props.active)}
                 active={this.props.active}
                 doc={Immutable(this.props.doc)}
                 buttons={<I18NLink to={documentViewUrl} className="item-shortcut">
                            <span className="itemShortcut-arrow">
                              <i className="fa fa-external-link"></i>
                             </span>
                          </I18NLink>}/>;
  }
}

Doc.propTypes = {
  doc: PropTypes.object,
  active: PropTypes.bool,
  selectDocument: PropTypes.func,
  unselectDocument: PropTypes.func
};


export function mapStateToProps({library}, ownProps) {
  return {
    active: library.ui.get('selectedDocument') ? library.ui.get('selectedDocument').get('_id') === ownProps.doc._id : false
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({selectDocument, unselectDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Doc);
