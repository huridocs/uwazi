/** @format */

import * as React from 'react';
import { connect } from 'react-redux';
// @ts-expect-error TS(2307): Cannot find module '../../Auth.js' or its correspo... Remove this comment to see the full error message
import { NeedAuthorization } from '../../Auth.js';

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
