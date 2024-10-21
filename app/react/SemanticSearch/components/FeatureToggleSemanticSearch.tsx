/** @format */

import * as React from 'react';
import { connect } from 'react-redux';
import { NeedAuthorization } from 'app/Auth';

type PropTypes = {
  semanticSearchActivated: boolean;
  children: React.ReactNode;
};

const FeatureToggleSemanticSearch: React.FC<PropTypes> = ({
  semanticSearchActivated = false,
  children,
}: PropTypes) =>
  semanticSearchActivated ? (
    <NeedAuthorization roles={['admin']}>{children}</NeedAuthorization>
  ) : null;

function mapStateToProps({ settings }: any) {
  const features = settings.collection.toJS().features || {};
  return {
    semanticSearchActivated: features.semanticSearch,
  };
}

const container = connect(mapStateToProps)(FeatureToggleSemanticSearch);
export { container as FeatureToggleSemanticSearch, mapStateToProps };
