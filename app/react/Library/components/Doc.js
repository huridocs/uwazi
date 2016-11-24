import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {I18NLink} from 'app/I18N';
import {selectDocument, unselectDocument} from '../actions/libraryActions';

import {Item} from 'app/Layout';
import {is} from 'immutable';

export class Doc extends Component {

  select(active) {
    if (active) {
      return this.props.unselectDocument();
    }
    this.props.selectDocument(this.props.doc);
  }

  shouldComponentUpdate(nextProps) {
    return !is(this.props.doc, nextProps.doc) || this.props.active !== nextProps.active;
  }

  render() {
    const {type, sharedId} = this.props.doc.toJS();
    const documentViewUrl = `/${type}/${sharedId}`;

    return <Item onClick={this.select.bind(this, this.props.active)}
                 active={this.props.active}
                 doc={this.props.doc}
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
