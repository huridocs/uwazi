import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import formater from '../Metadata/helpers/formater';
import MarkdownViewer from 'app/Markdown';

import t from '../I18N/t';

import {RowList, ItemFooter} from './Lists';
import Icon from './Icon';
import DocumentLanguage from './DocumentLanguage';
import TemplateLabel from './TemplateLabel';
import PrintDate from './PrintDate';
import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

export class Item extends Component {

  formatMetadata(populatedMetadata, creationDate, translationContext) {
    let sortPropertyInMetadata = false;

    const metadata = populatedMetadata
    .map((property, index) => {
      let isSortingProperty = false;

      if ('metadata.' + property.name === this.props.search.sort) {
        sortPropertyInMetadata = true;
        isSortingProperty = true;
      }

      const hasNoValue = !property.value && !property.markdown || !String(property.value).length;
      if (isSortingProperty && hasNoValue) {
        property.value = t('System', 'No value');
      }

      if (property.value && String(property.value).length || property.markdown) {
        let dlClassName = 'item-property-default';

        let value = property.value && property.value.map ? property.value.map(d => d.value).join(', ') : property.value;

        if (property.markdown) {
          dlClassName = 'item-property-markdown';
          value = <MarkdownViewer markdown={property.markdown}/>;
        }

        if (property.type === 'date' || property.type === 'daterange' ||
            property.type === 'multidate' || property.type === 'multidaterange') {
          dlClassName = 'item-property-date';
        }

        if ((property.type === 'multidate' || property.type === 'multidaterange') && property.value.map) {
          value = <span dangerouslySetInnerHTML={{__html: property.value.map(d => d.value).join('<br />')}}></span>;
        }

        return (
          <dl className={dlClassName} key={index}>
            <dt>{t(property.context || translationContext, property.label)}</dt>
            <dd className={isSortingProperty ? 'item-current-sort' : ''}>
              <div className={value.length > 128 ? 'item-metadata-crop' : ''}>
                <Icon className="item-icon item-icon-center" data={property.icon} />{value}
              </div>
            </dd>
          </dl>
        );
      }
      return null;
    });

    const propertiesToAvoid = this.props.search.sort === 'title'
    || this.props.search.sort === 'creationDate'
    || this.props.search.sort === '_score';

    if (!propertiesToAvoid && !sortPropertyInMetadata) {
      const sortingProperty = this.props.templates.reduce((_property, template) => {
        let matchProp = template.get('properties').find(prop => {
          return `metadata.${prop.get('name')}` === this.props.search.sort;
        });
        if (matchProp) {
          matchProp.set('context', template.get('_id'));
        }

        return _property || matchProp;
      }, false);
      metadata.push(
        <dl key={metadata.length}>
          <dt>{t(sortingProperty.get('context'), sortingProperty.get('label'))}</dt>
          <dd className="item-metadata-empty">{t('System', 'No property')}</dd>
        </dl>
      );
    }

    if (creationDate && (!metadata.length && !populatedMetadata.filter(p => p.showInCard).length || this.props.search.sort === 'creationDate')) {
      metadata.push(
        <dl key={metadata.length}>
          <dt>{t('System', 'Date added')}</dt>
          <dd className={this.props.search.sort === 'creationDate' ? 'item-current-sort' : ''}>
            <PrintDate utc={creationDate} toLocal={true} />
          </dd>
        </dl>
      );
    }

    return metadata;
  }

  getMetadata(doc) {
    doc.metadata = doc.metadata || {};
    const populatedMetadata = formater.prepareMetadataForCard(doc, this.props.templates, this.props.thesauris, this.props.search.sort).metadata;

    if (this.props.additionalMetadata && this.props.additionalMetadata.length) {
      this.props.additionalMetadata.reverse().forEach(metadata => {
        const {label, value} = metadata;
        populatedMetadata.unshift({value, label, icon: metadata.icon, showInCard: true, context: 'System'});
      });
    }

    return this.formatMetadata(populatedMetadata, doc.creationDate, doc.template);
  }

  getSearchSnipett(doc) {
    if (!doc.snippets || !doc.snippets.length) {
      return false;
    }

    if (doc.snippets.length === 1) {
      return (
        <div className="item-snippet-wrapper">
          <div onClick={this.props.onSnippetClick} className="item-snippet" dangerouslySetInnerHTML={{__html: doc.snippets[0].text + ' ...'}} />
        </div>
      );
    }

    return (
      <div className="item-snippet-wrapper">
        <div onClick={this.props.onSnippetClick} className="item-snippet" dangerouslySetInnerHTML={{__html: doc.snippets[0].text + ' ...'}} />
        <div>
          <a onClick={this.props.onSnippetClick}>{t('System', 'Show more')}</a>
        </div>
      </div>
    );
  }

  render() {
    const {onClick, onMouseEnter, onMouseLeave, active, additionalIcon, additionalText,
      templateClassName, buttons, evalPublished} = this.props;

    const doc = this.props.doc.toJS();
    const snippet = additionalText ? <div className="item-snippet">{additionalText}</div> : '';
    const metadataElements = this.getMetadata(doc);
    const metadata = metadataElements.length ? <div className="item-metadata">{metadataElements}</div> : '';

    return (
      <RowList.Item
        className={`item-${doc.type === 'entity' ? 'entity' : 'document'} ${this.props.className || ''}`}
        onClick={onClick || function () {}}
        onMouseEnter={onMouseEnter || function () {}}
        onMouseLeave={onMouseLeave || function () {}}
        active={active}>
        {this.props.itemHeader}
        <div className="item-info">
          <div className="item-name">
            {evalPublished && !doc.published ? <i className="item-private-icon fa fa-lock"></i> : false }
            {additionalIcon || ''}
            <Icon className="item-icon item-icon-center" data={doc.icon} />
            <span>{doc[this.props.titleProperty]}</span>
            <DocumentLanguage doc={this.props.doc} />
            {snippet}
          </div>
          {this.getSearchSnipett(doc)}
        </div>
        {metadata}
        <ItemFooter>
          {doc.template ? <TemplateLabel template={doc.template}/> : false}
          {this.props.labels}
          {buttons}
        </ItemFooter>
      </RowList.Item>
    );
  }
}

Item.propTypes = {
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  search: PropTypes.object,
  onClick: PropTypes.func,
  onSnippetClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  active: PropTypes.bool,
  additionalIcon: PropTypes.object,
  additionalText: PropTypes.string,
  additionalMetadata: PropTypes.array,
  doc: PropTypes.object,
  itemHeader: PropTypes.object,
  buttons: PropTypes.object,
  labels: PropTypes.object,
  className: PropTypes.string,
  titleProperty: PropTypes.string,
  templateClassName: PropTypes.string,
  evalPublished: PropTypes.bool
};

Item.defaultProps = {
  search: prioritySortingCriteria(),
  titleProperty: 'title'
};

export const mapStateToProps = ({templates, thesauris}, ownProps) => {
  const search = ownProps.searchParams;
  const _templates = ownProps.templates || templates;
  return {templates: _templates, thesauris, search};
};

export default connect(mapStateToProps)(Item);
