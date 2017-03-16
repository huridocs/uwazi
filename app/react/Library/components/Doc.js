import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {I18NLink} from 'app/I18N';

import {Item} from 'app/Layout';
import {is} from 'immutable';

export class Doc extends Component {

  shouldComponentUpdate(nextProps) {
    return !is(this.props.doc, nextProps.doc) ||
           this.props.active !== nextProps.active ||
           this.props.searchParams && nextProps.searchParams && this.props.searchParams.sort !== nextProps.searchParams.sort;
  }

  onClick(e) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.doc, this.props.active);
    }
  }

  render() {
    const {sharedId, type} = this.props.doc.toJS();
    let documentViewUrl = `/${type}/${sharedId}`;

    return <Item onClick={this.onClick.bind(this)}
                 active={this.props.active}
                 doc={this.props.doc}
                 searchParams={this.props.searchParams}
                 buttons={<I18NLink to={documentViewUrl} className="item-shortcut" onClick={(e) => e.stopPropagation()}>
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
  onClick: PropTypes.func
};


export function mapStateToProps({library, user}, ownProps) {
  return {
    active: !!library.ui.get('selectedDocuments').find((doc) => doc.get('_id') === ownProps.doc.get('_id'))
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Doc);
