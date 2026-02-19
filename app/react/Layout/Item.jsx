import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { FormatMetadata } from '#app/Metadata/index.js';
import { prioritySortingCriteria } from '#app/utils/prioritySortingCriteria.js';

import { FeatureToggle } from '#app/components/Elements/FeatureToggle.js';
import { FavoriteBanner } from '#app/Favorites/index.js';
import helpers from '#app/Documents/helpers.js';
import { Translate } from '#app/I18N/index.js';
import { RowList, ItemFooter } from './Lists.js';
import { DocumentLanguage } from './DocumentLanguage.js';
import { Icon } from './Icon.js';
import { Tip } from './Tip.js';
import { ItemSnippet } from './ItemSnippet.js';
import { TemplateLabel } from './TemplateLabel.js';

class Item extends Component {
  getSearchSnipett(doc) {
    if (!doc.snippets || !doc.snippets.count) {
      return false;
    }
    return (
      <ItemSnippet onSnippetClick={this.props.onSnippetClick} snippets={doc.snippets} doc={doc} />
    );
  }

  render() {
    const { onClick, onMouseEnter, onMouseLeave, active, additionalIcon, additionalText, buttons } =
      this.props;

    const doc = helpers.performantDocToJSWithoutRelations(this.props.doc);
    const Snippet = additionalText ? (
      <div className="item-snippet-wrapper">
        <div className="item-snippet">{additionalText}</div>
      </div>
    ) : null;
    const baseClasName = `item-document template-${doc.template} ${this.props.markAsDeleted ? ' deleted' : ''}`;
    const itemClassName = `${baseClasName} ${this.props.className || ''}`;
    const itemProps = {
      className: itemClassName,
      onClick,
      onMouseEnter,
      onMouseLeave,
      active,
      tabIndex: '1',
    };

    return (
      <RowList.Item {...itemProps}>
        {this.props.itemHeader}
        <div className="item-info">
          <h2 className="item-name">
            {additionalIcon || ''}
            <Icon className="item-icon item-icon-center" data={doc.icon} />
            <span>{doc[this.props.titleProperty]}</span>
            <DocumentLanguage doc={this.props.doc} />
          </h2>
          {Snippet}
          {this.getSearchSnipett(doc)}
        </div>
        <div className="item-metadata">
          <FormatMetadata
            entity={this.props.noMetadata ? {} : doc}
            sortedProperty={this.props.search.sort}
            additionalMetadata={this.props.additionalMetadata}
            useV2Player
          />
        </div>
        {this.props.markAsDeleted ? (
          <ItemFooter>
            <Translate>Deleted entity</Translate>
          </ItemFooter>
        ) : (
          <ItemFooter>
            <>
              {doc.template ? <TemplateLabel template={doc.template} /> : false}
              {doc.published ? (
                ''
              ) : (
                <Tip icon="lock">
                  <Translate>This entity is restricted from public view.</Translate>
                </Tip>
              )}
            </>
            {this.props.labels}
            {buttons}
          </ItemFooter>
        )}
        <FeatureToggle feature="favorites">
          <div className="item-favorite">
            <FavoriteBanner sharedId={doc.sharedId} />
          </div>
        </FeatureToggle>
      </RowList.Item>
    );
  }
}

Item.defaultProps = {
  onClick: () => {},
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  noMetadata: false,
};

Item.propTypes = {
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  search: PropTypes.object,
  onClick: PropTypes.func,
  onSnippetClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  active: PropTypes.bool,
  noMetadata: PropTypes.bool,
  additionalIcon: PropTypes.object,
  additionalText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  additionalMetadata: PropTypes.array,
  doc: PropTypes.object,
  itemHeader: PropTypes.object,
  buttons: PropTypes.object,
  labels: PropTypes.object,
  className: PropTypes.string,
  titleProperty: PropTypes.string,
  evalPublished: PropTypes.bool,
  markAsDeleted: PropTypes.bool,
};

Item.defaultProps = {
  search: prioritySortingCriteria.get(),
  titleProperty: 'title',
  markAsDeleted: false,
};

const mapStateToProps = ({ templates, thesauris }, ownProps) => {
  const search = ownProps.searchParams;
  const _templates = ownProps.templates || templates;
  return { templates: _templates, thesauris, search };
};

const ItemConnected = connect(mapStateToProps)(Item);
export { Item as ItemView, mapStateToProps, ItemConnected as Item };
