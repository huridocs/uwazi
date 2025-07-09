import React from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom } from 'V2/atoms/settingsAtom';

const FeatureToggle = ({ feature, children }: { feature: string; children: React.ReactNode }) => {
  const settings = useAtomValue(settingsAtom);
  const featureActivated = settings.features?.[feature] ?? false;
  return featureActivated ? <>{children}</> : null;
};

export { FeatureToggle };
