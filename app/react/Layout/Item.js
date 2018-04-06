import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import formater from '../Metadata/helpers/formater';
import { FormatMetadata } from 'app/Metadata';
import MarkdownViewer from 'app/Markdown';

import t from '../I18N/t';

import { RowList, ItemFooter } from './Lists';
import Icon from './Icon';
import DocumentLanguage from './DocumentLanguage';
import TemplateLabel from './TemplateLabel';
import PrintDate from './PrintDate';
import { get as prioritySortingCriteria } from 'app/utils/prioritySortingCriteria';

export class Item extends Component {
  getSearchSnipett(doc) {
    if (!doc.snippets || !doc.snippets.length) {
      return false;
    }

    if (doc.snippets.length === 1) {
      return (
        <div className="item-snippet-wrapper">
          <div onClick={this.props.onSnippetClick} className="item-snippet" dangerouslySetInnerHTML={{ __html: `${doc.snippets[0].text} ...` }} />
        </div>
      );
    }

    return (
      <div className="item-snippet-wrapper">
        <div onClick={this.props.onSnippetClick} className="item-snippet" dangerouslySetInnerHTML={{ __html: `${doc.snippets[0].text} ...` }} />
        <div>
          <a onClick={this.props.onSnippetClick}>{t('System', 'Show more')}</a>
        </div>
      </div>
    );
  }

  render() {
    const { onClick, onMouseEnter, onMouseLeave, active, additionalIcon,
           additionalText, buttons, evalPublished } = this.props;

    const doc = this.props.doc.toJS();
    const Snippet = additionalText ? <div className="item-snippet-wrapper"><div className="item-snippet">{additionalText}</div></div> : null;

    return (
      <RowList.Item
        className={`item-${doc.type === 'entity' ? 'entity' : 'document'} ${this.props.className || ''}`}
        onClick={onClick || function () {}}
        onMouseEnter={onMouseEnter || function () {}}
        onMouseLeave={onMouseLeave || function () {}}
        active={active}
        tabIndex="1"
        >
        {this.props.itemHeader}
        <div className="item-info">
          <div className="item-name">
            {evalPublished && !doc.published ? <i className="item-private-icon fa fa-lock" /> : false }
            {additionalIcon || ''}
            <Icon className="item-icon item-icon-center" data={doc.icon} />
            <span>{doc[this.props.titleProperty]}</span>
            <DocumentLanguage doc={this.props.doc} />
          </div>
          {Snippet}
          {this.getSearchSnipett(doc)}
        </div>
        <div className="item-metadata">
          <FormatMetadata 
            entity={doc}
            sortedProperty={this.props.search.sort}
            additionalMetadata={this.props.additionalMetadata}
          />
        </div>
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
  evalPublished: PropTypes.bool
};

Item.defaultProps = {
  search: prioritySortingCriteria(),
  titleProperty: 'title'
};

export const mapStateToProps = ({ templates, thesauris }, ownProps) => {
  const search = ownProps.searchParams;
  const _templates = ownProps.templates || templates;
  return { templates: _templates, thesauris, search };
};

export default connect(mapStateToProps)(Item);
