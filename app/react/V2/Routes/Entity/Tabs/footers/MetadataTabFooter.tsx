import React from 'react';
import type { MetadataEditingHost } from '#V2/Routes/Entity/Components/context/index.js';
import { MetadataDisplayFooter } from '#V2/Routes/Entity/Components/index.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

type MetadataTabFooterProps = {
  host: MetadataEditingHost;
};

const MetadataTabFooter = ({ host }: MetadataTabFooterProps) => (
  <EntityTabFooter>
    <MetadataDisplayFooter host={host} />
  </EntityTabFooter>
);

export { MetadataTabFooter };
