import React from 'react';
import PropTypes from 'prop-types';
import { Map, List } from 'immutable';
import { t } from 'app/I18N';

function conformQuote(text) {
  return (
    <div className="relationship-quote">
      <i className="quoteIconStart fa fa-quote-left" />
      {text}
      <i className="quoteIconEnd fa fa-quote-right" />
    </div>
  );
}

function conformDl([key, value]) {
  return (
    <dl className="item-property-default" key={key}>
      <dt>{key}</dt>
      <dd>{value}</dd>
    </dl>
  );
}

const HubRelationshipMetadata = (props) => {
  const { relationship } = props;
  const text = relationship.getIn(['range', 'text']);
  const metadata = relationship.get('metadata');

  if (metadata && metadata.size) {
    return (
      <div className="relationship-metadata">
        <div className="item-metadata">
          {List(metadata).map(conformDl)}
          {text && conformDl([t('System', 'Text'), conformQuote(relationship.getIn(['range', 'text']))])}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="relationship-metadata">
        {conformQuote(relationship.getIn(['range', 'text']))}
      </div>
    );
  }

  return null;
};

HubRelationshipMetadata.defaultProps = {
  relationship: Map({})
};

HubRelationshipMetadata.propTypes = {
  relationship: PropTypes.instanceOf(Map)
};

export default HubRelationshipMetadata;
