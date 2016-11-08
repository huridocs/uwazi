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

  render() {
    let {type, sharedId} = this.props.doc;
    let documentViewUrl = `/${type}/${sharedId}`;

    let active;
    if (this.props.selectedDocument) {
      active = this.props.selectedDocument === this.props.doc._id;
    }

    return <Item onClick={this.select.bind(this, active)}
                 active={active}
                 doc={Immutable(this.props.doc)}
                 buttons={[
                   <I18NLink to={documentViewUrl} className="item-shortcut" key={0}>
                     <span className="itemShortcut-arrow">
                       <i className="fa fa-external-link"></i>
                      </span>
                   </I18NLink>
                 ]}
           />;
  }
}

Doc.propTypes = {
  doc: PropTypes.object,
  selectedDocument: PropTypes.string,
  selectDocument: PropTypes.func,
  unselectDocument: PropTypes.func
};


export function mapStateToProps({library}) {
  const {ui} = library;
  return {
    selectedDocument: ui.get('selectedDocument') ? ui.get('selectedDocument').get('_id') : ''
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({selectDocument, unselectDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Doc);
