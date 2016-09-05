import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import PrintDate from 'app/Layout/PrintDate';
import {selectDocument, unselectDocument} from '../actions/libraryActions';
import {formater} from 'app/Metadata';

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

    // TEST!!
    let populatedMetadata = formater.prepareMetadata(this.props.doc, this.props.templates.toJS(), this.props.thesauris.toJS()).metadata;
    const templateData = this.props.templates.find(t => t.get('_id') === template);
    const showInCardProperties = templateData.get('properties').filter(p => p.get('showInCard'));

    const htmlMetadata = showInCardProperties.map((property, index) => {
      let porpertyData = populatedMetadata.find(p => p.label === property.get('label')).value;
      if (typeof porpertyData !== 'object') {
        return (
          <dl key={index}>
            <dt>{property.get('label')}</dt>
            <dd>{porpertyData}</dd>
          </dl>
        );
      }

      // if (typeof porpertyData === 'object' && porpertyData.length > 0) {
      //   return porpertyData.map((propertyValue, subIndex) =>
      //     <dl key={index + '-' + subIndex}>
      //       <dt>{subIndex === 0 ? property.get('label') : ''}</dt>
      //       <dd>{propertyValue.value}</dd>
      //     </dl>
      //   );
      // }

      if (typeof porpertyData === 'object' && porpertyData.length > 0) {
        return (
          <dl key={index}>
            <dt>{property.get('label')}</dt>
            <dd>{porpertyData.map(d => d.value).join(', ')}</dd>
          </dl>
        );
      }
    });
    // -------

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
        </div>
        <div className="item-metadata">
            <dl>
                <dt><i>Upload date</i></dt>
                <dd><PrintDate utc={creationDate} toLocal={true} /></dd>
            </dl>
            {htmlMetadata}
        </div>
        <ItemFooter>
          <span className={typeIndex}>
            <i className={`item-type__icon fa ${icon}`}></i>
            <span className="item-type__name">{type}</span>
          </span>
          <Link to={documentViewUrl} className="item-shortcut">
            <span className="itemShortcut-arrow">
              <i className="fa fa-external-link"></i>
            </span>
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
  templates: PropTypes.object,
  thesauris: PropTypes.object
};


export function mapStateToProps(state) {
  return {
    selectedDocument: state.library.ui.get('selectedDocument') ? state.library.ui.get('selectedDocument').get('_id') : '',
    templates: state.templates,
    thesauris: state.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({selectDocument, unselectDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Doc);
