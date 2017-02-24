import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {I18NLink} from 'app/I18N';
import {selectDocument, unselectDocument, unselectAllDocuments} from '../actions/libraryActions';

import {Item} from 'app/Layout';
import {is} from 'immutable';

export class Doc extends Component {

  select(e) {
    if (!(e.metaKey || e.ctrlKey) || !this.props.authorized) {
      this.props.unselectAllDocuments();
    }

    if (this.props.active && this.props.multipleSelected && !(e.metaKey || e.ctrlKey)) {
      return this.props.selectDocument(this.props.doc);
    }

    if (this.props.active) {
      return this.props.unselectDocument(this.props.doc.get('_id'));
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

    return <Item onClick={this.select.bind(this)}
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
  authorized: PropTypes.bool,
  multipleSelected: PropTypes.bool,
  selectDocument: PropTypes.func,
  unselectDocument: PropTypes.func,
  unselectAllDocuments: PropTypes.func
};


export function mapStateToProps({library, user}, ownProps) {
  return {
    active: !!library.ui.get('selectedDocuments').find((doc) => doc.get('_id') === ownProps.doc.get('_id')),
    multipleSelected: library.ui.get('selectedDocuments').size > 1,
    authorized: !!user.get('_id')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({selectDocument, unselectDocument, unselectAllDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Doc);
