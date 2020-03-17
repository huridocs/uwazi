import * as React from 'react';
import { connect } from 'react-redux';

export type PropTypes = {
  feature: string;
  featureActivated: boolean;
  children: React.ReactNode;
};

const FeatureToggle: React.FC<PropTypes> = ({ featureActivated, children }: PropTypes) =>
  featureActivated ? <React.Fragment>{children}</React.Fragment> : null;

FeatureToggle.defaultProps = {
  featureActivated: false,
};

export function mapStateToProps({ settings }: any, ownProps: Partial<PropTypes>) {
  const features = settings.collection.toJS().features || {};
  return {
    featureActivated: features[ownProps.feature || 'void'],
  };
}

const container = connect(mapStateToProps)(FeatureToggle);
export { container as FeatureToggle };
