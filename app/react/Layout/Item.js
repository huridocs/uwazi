import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import formater from '../Metadata/helpers/formater';
import marked from 'app/utils/marked';

import t from '../I18N/t';
import ShowIf from 'app/App/ShowIf';

import {RowList, ItemFooter} from './Lists';
import Icon from './Icon';
import TemplateLabel from './TemplateLabel';
import PrintDate from './PrintDate';
import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

export class Item extends Component {

  formatMetadata(populatedMetadata, creationDate, translationContext) {
    let sortPropertyInMetadata = false;

    const metadata = populatedMetadata
    .filter(p => p.showInCard || 'metadata.' + p.name === this.props.search.sort)
    .map((property, index) => {
      let isSortingProperty = false;

      if ('metadata.' + property.name === this.props.search.sort) {
        sortPropertyInMetadata = true;
        isSortingProperty = true;
      }

      if (property.value && property.value !== '' || property.markdown) {
        let dlClassName = '';

        let value = typeof property.value !== 'object' ? property.value : property.value.map(d => d.value).join(', ');
        if (property.markdown) {
          dlClassName = 'full-width';
          value = <div className="markdownViewer" dangerouslySetInnerHTML={{__html: marked(property.markdown)}}/>;
        }
        return (
          <dl className={dlClassName} key={index}>
            <dt>{t(property.context || translationContext, property.label)}</dt>
            <dd className={isSortingProperty ? 'item-current-sort' : ''}>
              <Icon className="item-icon item-icon-center" data={property.icon} />{value}
            </dd>
          </dl>
        );
      }

      if (!property.value && 'metadata.' + property.name === this.props.search.sort) {
        return (
          <dl key={index}>
            <dd className="item-metadata-empty">{t('System', 'No')} {property.label}</dd>
          </dl>
        );
      }

      return null;
    });

    const isTitleOrCreationDate = this.props.search.sort === 'title' || this.props.search.sort === 'creationDate';

    if (!isTitleOrCreationDate && !sortPropertyInMetadata) {
      metadata.push(
        <dl key={metadata.length}>
          <dd className="item-metadata-empty">Item does not have the sorting property</dd>
        </dl>
      );
    }

    if (!metadata.length && !populatedMetadata.filter(p => p.showInCard).length || this.props.search.sort === 'creationDate') {
      metadata.push(
        <dl key={metadata.length}>
          <dt>Date added</dt>
          <dd className={this.props.search.sort === 'creationDate' ? 'item-current-sort' : ''}><PrintDate utc={creationDate} toLocal={true} /></dd>
        </dl>
      );
    }

    return metadata;
  }

  getMetadata(doc) {
    doc.metadata = doc.metadata || {};
    const populatedMetadata = formater.prepareMetadata(doc, this.props.templates.toJS(), this.props.thesauris.toJS()).metadata;

    if (this.props.additionalMetadata && this.props.additionalMetadata.length) {
      this.props.additionalMetadata.reverse().forEach(metadata => {
        const {label, value} = metadata;
        populatedMetadata.unshift({value, label, icon: metadata.icon, showInCard: true, context: 'System'});
      });
    }

    return this.formatMetadata(populatedMetadata, doc.creationDate, doc.template);
  }

  render() {
    const {onClick, onMouseEnter, onMouseLeave, active, additionalIcon, additionalText,
           templateClassName, buttons, evalPublished} = this.props;

    const doc = this.props.doc.toJS();
    const snippet = additionalText ? <div className="item-snippet">{additionalText}</div> : '';
    const metadata = this.getMetadata(doc);

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
            <ShowIf if={evalPublished && !doc.published}>
              <i className="item-private-icon fa fa-lock"></i>
            </ShowIf>
            {additionalIcon || ''}
            <Icon className="item-icon item-icon-center" data={doc.icon} />
            <span>{doc.title}</span>
            {snippet}
          </div>
        </div>
        <div className="item-metadata">
          {metadata}
        </div>
        <ItemFooter>
          <div className={`item-label-group ${templateClassName || ''}`}>
            <TemplateLabel template={doc.template}/>
          </div>
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
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  active: PropTypes.bool,
  additionalIcon: PropTypes.object,
  additionalText: PropTypes.string,
  additionalMetadata: PropTypes.array,
  doc: PropTypes.object,
  itemHeader: PropTypes.object,
  buttons: PropTypes.object,
  className: PropTypes.string,
  templateClassName: PropTypes.string,
  evalPublished: PropTypes.bool
};

Item.defaultProps = {
  search: prioritySortingCriteria()
};

export const mapStateToProps = ({templates, thesauris}, ownProps) => {
  const search = ownProps.searchParams;
  return {templates, thesauris, search};
};

export default connect(mapStateToProps)(Item);
