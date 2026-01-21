import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';


import { t } from '#app/I18N/index.js';
import formater from '#app/Metadata/helpers/formater.js';
import Icon from '#UI/Icon/Icon.js';
import Immutable from 'immutable';


const conformQuote = text => (
  <div className="relationship-quote">
    <span className="quoteIconStart">
      <Icon icon="quote-left" />
    </span>
    {text}
    <span className="quoteIconEnd">
      <Icon icon="quote-right" />
    </span>
  </div>
);

const conformDl = ({ label, name, value }) => (
  <dl className="item-property-default" key={name}>
    <dt>{label}</dt>
    <dd>{Array.isArray(value) ? value.map(v => v.value).join(', ') : value}</dd>
  </dl>
);

conformDl.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

const extendedMetadata = (relationship, text, relationTypes, thesauris) => {
  const formattedMetadata = formater.prepareMetadata(
    relationship.toJS(),
    relationTypes,
    thesauris
  ).metadata;
  return (
    <div className="relationship-metadata">
      <div className="item-metadata">
        {formattedMetadata.map(conformDl)}
        {text &&
          conformDl({
            label: t('System', 'Text'),
            name: 'text',
            value: conformQuote(text),
          })}
      </div>
    </div>
  );
};

const justText = text => <div className="relationship-metadata">{conformQuote(text)}</div>;

const HubRelationshipMetadata = props => {
  const { relationship, relationTypes, thesauris } = props;
  const text = relationship.getIn(['reference', 'text']);
  const metadata = relationship.get('metadata');

  if (metadata && metadata.size) {
    return extendedMetadata(relationship, text, relationTypes, thesauris);
  }

  if (text) {
    return justText(text);
  }

  return null;
};

HubRelationshipMetadata.defaultProps = {
  relationship: Immutable.Map({}),
};

HubRelationshipMetadata.propTypes = {
  relationship: PropTypes.instanceOf(Immutable.Map),
  relationTypes: PropTypes.instanceOf(Immutable.List).isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
};

export function mapStateToProps({ relationTypes, thesauris }) {
  return { relationTypes, thesauris };
}

export default connect(mapStateToProps)(HubRelationshipMetadata);
