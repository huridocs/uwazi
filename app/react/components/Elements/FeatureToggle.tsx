import React from 'react';
import { connect } from 'react-redux';

type ComponentPropTypes = {
  featureActivated: boolean;
  children: React.ReactNode;
};

type OwnPropTypes = {
  feature: string;
};

const FeatureToggle: React.FC<ComponentPropTypes> = ({
  featureActivated = false,
  children,
}: ComponentPropTypes) => (featureActivated ? <>{children}</> : null);

function mapStateToProps({ settings }: any, ownProps: OwnPropTypes) {
  const features = settings.collection.get('features');

  return {
    featureActivated: features ? Boolean(features.getIn(ownProps.feature.split('.'))) : false,
  };
}

const container = connect(mapStateToProps)(FeatureToggle);
export type { ComponentPropTypes, OwnPropTypes };
export { container as FeatureToggle };
