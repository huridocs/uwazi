import React from 'react';
import { connect } from 'react-redux';

export type ComponentPropTypes = {
  featureActivated: boolean;
  children: React.ReactNode;
};

export type OwnPropTypes = {
  feature: string;
};

const FeatureToggle: React.FC<ComponentPropTypes> = ({
  featureActivated,
  children,
}: ComponentPropTypes) => (featureActivated ? <React.Fragment>{children}</React.Fragment> : null);

FeatureToggle.defaultProps = {
  featureActivated: false,
};

function mapStateToProps({ settings }: any, ownProps: OwnPropTypes) {
  const features = settings.collection.get('features') || {};
  return {
    featureActivated: features.get(ownProps.feature),
  };
}

const container = connect(mapStateToProps)(FeatureToggle);
export { container as FeatureToggle };
