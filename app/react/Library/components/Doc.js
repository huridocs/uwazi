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
    let {title, _id, creationDate, template} = this.props.doc;
    let documentViewUrl = `/${this.props.doc.type}/${_id}`;
    let typeIndex = 'item-type item-type-0';
    let type = this.props.templates.toJS().reduce((result, templ, index) => {
      if (templ._id === template) {
        typeIndex = 'item-type item-type-' + index;
        return templ.name;
      }
      return result;
    }, '');

    let active;
    if (this.props.selectedDocument) {
      active = this.props.selectedDocument === this.props.doc._id;
    }

    let icon = 'fa-file-text-o';
    let className = 'item-document';
    if (this.props.doc.type === 'entity') {
      icon = 'fa-bank';
      className = 'item-entity';
    }

    return (
      <RowList.Item active={active} onClick={this.select.bind(this, active)} className={className}>
        <div className="item-info">
          <ItemName>{title}</ItemName>
          <span className={typeIndex}>
            <i className={`item-type__icon fa ${icon}`}></i>
            <span className="item-type__name">{type}</span>
          </span>
        </div>
        <div className="item-metadata">
            <dl>
                <dt>Upload date</dt>
                <dd><UTCToLocal utc={creationDate}/></dd>
            </dl>
        </div>
        <ItemFooter>
          <Link to={documentViewUrl} className="item-shortcut">
            <i className="fa fa-external-link"></i>
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
