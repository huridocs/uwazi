/** @format */

import * as React from 'react';
import { connect } from 'react-redux';
import { NeedAuthorization } from 'app/Auth';

type PropTypes = {
  semanticSearchActivated: boolean;
  children: React.ReactNode;
};

const FeatureToggleSemanticSearch: React.FC<PropTypes> = ({
  semanticSearchActivated,
  children,
}: PropTypes) =>
  semanticSearchActivated ? (
    <NeedAuthorization roles={['admin']}>{children}</NeedAuthorization>
  ) : null;

FeatureToggleSemanticSearch.defaultProps = {
  semanticSearchActivated: false,
};

export function mapStateToProps({ settings }: any) {
  const features = settings.collection.toJS().features || {};
  return {
    semanticSearchActivated: features.semanticSearch,
  };
}

const container = connect(mapStateToProps)(FeatureToggleSemanticSearch);
export { container as FeatureToggleSemanticSearch };
