import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

type ComponentPropTypes = {
  featureActivated: boolean;
  children: React.ReactNode;
};

type OwnPropTypes = {
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
  const features = settings.collection.get('features');

  return {
    featureActivated: features ? Boolean(get(features.toJS(), ownProps.feature)) : false,
  };
}

const container = connect(mapStateToProps)(FeatureToggle);
export type { ComponentPropTypes, OwnPropTypes };
export { container as FeatureToggle };
