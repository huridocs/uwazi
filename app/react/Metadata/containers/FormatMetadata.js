import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import Immutable from 'immutable';
import { metadataSelectors } from '../selectors';
import Metadata from '../components/Metadata';

const removeUneededProps = ({ templates, thesauris, settings, excludePreview, ...rest }) => rest;

const BaseFormatMetadata = ({
  additionalMetadata,
  sortedProperty,
  entity,
  relationships,
  useV2Player,
  ...props
}) => {
  const template = props.templates.filter(_template => _template.get('_id') === entity.template);
  const templateColor = template.size && template.get(0).get('color');
  const { attachments } = entity;

  return (
    <Metadata
      metadata={additionalMetadata.concat(
        metadataSelectors.formatMetadata(props, entity, sortedProperty, relationships, {
          excludePreview: props.excludePreview,
        })
      )}
      attachments={attachments}
      templateId={entity.template}
      templateColor={templateColor || '#c03b22'}
      compact={!!sortedProperty}
      useV2Player={useV2Player}
      {...removeUneededProps(props)}
    />
  );
};

BaseFormatMetadata.defaultProps = {
  sortedProperty: '',
  additionalMetadata: [],
  relationships: Immutable.fromJS([]),
  excludePreview: false,
  useV2Player: false,
};

BaseFormatMetadata.propTypes = {
  entity: PropTypes.shape({
    metadata: PropTypes.object,
    template: PropTypes.string,
    attachments: PropTypes.array,
  }).isRequired,
  relationships: PropTypes.object,
  additionalMetadata: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.arrayOf(
          PropTypes.shape({
            value: PropTypes.string,
          })
        ),
      ]),
    })
  ),
  sortedProperty: PropTypes.string,
  excludePreview: PropTypes.bool,
  useV2Player: PropTypes.bool,
  templates: PropTypes.array,
};

export function mapStateToProps(state, { entity, sortedProperty = '' }) {
  return {
    templates: state.templates,
    thesauris: state.thesauris,
    settings: state.settings.collection,
    entity,
    sortedProperty,
  };
}

export const FormatMetadata = connect(mapStateToProps)(BaseFormatMetadata);
