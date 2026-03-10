import React from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom } from 'V2/atoms/settingsAtom';

// Utility function to get nested property value from an object
const getNestedProperty = (obj: any, path: string): any =>
  path
    .split('.')
    .reduce(
      (current, key) => (current && current[key] !== undefined ? current[key] : undefined),
      obj
    );

const FeatureToggle = ({ feature, children }: { feature: string; children: React.ReactNode }) => {
  const settings = useAtomValue(settingsAtom);
  const featureActivated = getNestedProperty(settings.features, feature) ?? false;
  return featureActivated ? <>{children}</> : null;
};

export { FeatureToggle };
