import { Translate } from 'app/I18N';
import React from 'react';

const NoQualifiedTemplatesMessage = () => (
  <div className="flex flex-col gap-2 items-center text-gray-500">
    <p className="text-xl">
      <Translate>No valid target template available</Translate>
    </p>
    <p>
      <Translate>Qualified templates should have &quot;Rich Text&quot; property</Translate>
    </p>
  </div>
);

export { NoQualifiedTemplatesMessage };
