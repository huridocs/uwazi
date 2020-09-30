import React from 'react';
import { connect } from 'react-redux';
import Immutable from 'immutable';

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
}: ComponentPropTypes) => (featureActivated ? <>{children}</> : null);

FeatureToggle.defaultProps = {
  featureActivated: false,
};

function mapStateToProps({ settings }: any, ownProps: OwnPropTypes) {
  const features = settings.collection.get('features') || Immutable.fromJS({});
  return {
    featureActivated: features.get(ownProps.feature),
  };
}

const container = connect(mapStateToProps)(FeatureToggle);
export { container as FeatureToggle };
