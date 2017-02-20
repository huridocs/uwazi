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
    return !is(this.props.doc, nextProps.doc) ||
           this.props.active !== nextProps.active ||
           this.props.searchParams && nextProps.searchParams && this.props.searchParams.sort !== nextProps.searchParams.sort;
  }

  render() {
    const {sharedId, type} = this.props.doc.toJS();
    let documentViewUrl = `/${type}/${sharedId}`;

    return <Item onClick={this.select.bind(this, this.props.active)}
                 active={this.props.active}
                 doc={this.props.doc}
                 searchParams={this.props.searchParams}
                 buttons={<I18NLink to={documentViewUrl} className="item-shortcut">
                            <span className="itemShortcut-arrow">
                              <i className="fa fa-file-text-o"></i>
                             </span>
                          </I18NLink>}/>;
  }
}

Doc.propTypes = {
  doc: PropTypes.object,
  searchParams: PropTypes.object,
  active: PropTypes.bool,
  selectDocument: PropTypes.func,
  unselectDocument: PropTypes.func
};


export function mapStateToProps({library}, ownProps) {
  return {
    active: library.ui.get('selectedDocument') ? library.ui.get('selectedDocument').get('_id') === ownProps.doc.get('_id') : false
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({selectDocument, unselectDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Doc);
