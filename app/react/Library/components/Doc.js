import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import UTCToLocal from 'app/Layout/UTCToLocal';
import {selectDocument, unselectDocument} from '../actions/libraryActions';

import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';

export class Doc extends Component {

  select(active) {
    if (active) {
      return this.props.unselectDocument();
    }
    this.props.selectDocument(this.props.doc);
  }

  render() {
    let {title, _id, creationDate, templateId} = this.props.doc;
    let documentViewUrl = '/document/' + _id;
    let type = this.props.templates.toJS().reduce((result, templ) => {
      return templ._id === templateId ? templ.name : result;
    }, '');

    let active;
    if (this.props.selectedDocument) {
      active = this.props.selectedDocument === this.props.doc._id;
    }

    return (
      <RowList.Item active={active} onClick={this.select.bind(this, active)}>
        <div className="item-info">
          <ItemName>{title}</ItemName>
        </div>
        <div className="item-metadata">
            <dl>
                <dt>Upload date</dt>
                <dd><UTCToLocal utc={creationDate}/></dd>
            </dl>
        </div>
        <ItemFooter>
          <ItemFooter.Label>{type}</ItemFooter.Label>
          <Link to={documentViewUrl} className="item-shortcut">
            <i className="fa fa-file-o"></i><span>View</span><i className="fa fa-angle-right"></i>
          </Link>
        </ItemFooter>
      </RowList.Item>
    );
  }
}

Doc.propTypes = {
  doc: PropTypes.object,
  selectedDocument: PropTypes.string,
  selectDocument: PropTypes.func,
  unselectDocument: PropTypes.func,
  creationDate: PropTypes.number,
  templates: PropTypes.object
};


export function mapStateToProps({library}) {
  return {
    selectedDocument: library.ui.get('selectedDocument') ? library.ui.get('selectedDocument').get('_id') : '',
    templates: library.filters.get('templates')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({selectDocument, unselectDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Doc);
