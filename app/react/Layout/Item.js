import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { FormatMetadata } from 'app/Metadata';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

import { FeatureToggle } from 'app/components/Elements/FeatureToggle';
import { FavoriteBanner } from 'app/Favorites';

import { RowList, ItemFooter } from './Lists';
import DocumentLanguage from './DocumentLanguage';
import Icon from './Icon';
import Tip from './Tip';
import ItemSnippet from './ItemSnippet';
import TemplateLabel from './TemplateLabel';

export class Item extends Component {
  getSearchSnipett(doc) {
    if (!doc.snippets || !doc.snippets.count) {
      return false;
    }
    return (
      <ItemSnippet onSnippetClick={this.props.onSnippetClick} snippets={doc.snippets} doc={doc} />
    );
  }

  render() {
    const {
      onClick,
      onMouseEnter,
      onMouseLeave,
      active,
      additionalIcon,
      additionalText,
      buttons,
      user,
    } = this.props;

    const doc = this.props.doc.toJS();
    const Snippet = additionalText ? (
      <div className="item-snippet-wrapper">
        <div className="item-snippet">{additionalText}</div>
      </div>
    ) : null;
    const baseClasName = `item-document template-${doc.template}`;
    const itemClassName = `${baseClasName} ${this.props.className || ''}`;
    const itemProps = {
      className: itemClassName,
      onClick,
      onMouseEnter,
      onMouseLeave,
      active,
      tabIndex: '1',
    };

    const userGroups = (user.get('groups') || []).map(g => g.get('_id'));
    const canEdit =
      doc.permissions &&
      doc.permissions.find(
        ({ level, _id }) =>
          level === 'write' && (_id === user.get('_id') || userGroups.includes(_id))
      );

    return (
      <RowList.Item {...itemProps}>
        {this.props.itemHeader}
        <div className="item-info">
          <div className="item-name">
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
            entity={this.props.noMetadata ? {} : doc}
            sortedProperty={this.props.search.sort}
            additionalMetadata={this.props.additionalMetadata}
            renderLabel={(prop, label) => !prop.noLabel && label}
          />
        </div>
        <ItemFooter>
          <div>
            {doc.template ? <TemplateLabel template={doc.template} /> : false}
            {canEdit ? <Tip icon="pencil-alt">You can edit this property</Tip> : ''}
            {doc.published ? '' : <Tip icon="eye-slash">This entity is not public.</Tip>}
          </div>
          {this.props.labels}
          {buttons}
        </ItemFooter>
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
  user: PropTypes.object,
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
};

Item.defaultProps = {
  search: prioritySortingCriteria.get(),
  titleProperty: 'title',
};

export const mapStateToProps = ({ templates, thesauris, user }, ownProps) => {
  const search = ownProps.searchParams;
  const _templates = ownProps.templates || templates;
  return { templates: _templates, thesauris, search, user };
};

export default connect(mapStateToProps)(Item);
