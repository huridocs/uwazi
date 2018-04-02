import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Map, List } from 'immutable';

import { t } from 'app/I18N';
import formater from 'app/Metadata/helpers/formater';

const conformQuote = text => (
  <div className="relationship-quote">
    <i className="quoteIconStart fa fa-quote-left" />
    {text}
    <i className="quoteIconEnd fa fa-quote-right" />
  </div>
);

const conformDl = ({ label, name, value }) => (
  <dl className="item-property-default" key={name}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </dl>
);

conformDl.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

const extendedMetadata = (relationship, text, relationTypes, thesauris) => {
  const formattedMetadata = formater.prepareMetadata(relationship.toJS(), relationTypes, thesauris).metadata;
  return (
    <div className="relationship-metadata">
      <div className="item-metadata">
        {formattedMetadata.map(conformDl)}
        {text && conformDl({
          label: t('System', 'Text'),
          name: 'text',
          value: conformQuote(relationship.getIn(['range', 'text']))
        })}
      </div>
    </div>
  );
};

const justText = text => (
  <div className="relationship-metadata">
    {conformQuote(text)}
  </div>
);

const HubRelationshipMetadata = (props) => {
  const { relationship, relationTypes, thesauris } = props;
  const text = relationship.getIn(['range', 'text']);
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
  relationship: Map({})
};

HubRelationshipMetadata.propTypes = {
  relationship: PropTypes.instanceOf(Map),
  relationTypes: PropTypes.instanceOf(List).isRequired,
  thesauris: PropTypes.instanceOf(List).isRequired
};

export function mapStateToProps({ relationTypes, thesauris }) {
  return { relationTypes, thesauris };
}

export default connect(mapStateToProps)(HubRelationshipMetadata);
