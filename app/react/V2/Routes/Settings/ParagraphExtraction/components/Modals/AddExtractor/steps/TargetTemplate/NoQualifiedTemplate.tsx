import { Translate } from 'app/I18N';
import React from 'react';

const NoQualifiedTemplatesMessage = () => (
  <div className="flex flex-col gap-10 items-center  font-semibold lead text-xs uppercase">
    <p>
      <Translate className="text-gray-900">No valid target template available</Translate>
    </p>
    <p className="flex flex-col gap-5 text-gray-500 items-center">
      <div id="label-template-requirements">
        <Translate>A target template needs at least</Translate>:
      </div>
      <ul
        className="list-disc list-inside flex flex-col gap-1"
        aria-labelledby="label-template-requirements"
      >
        <li>
          <Translate>1 Rich text property</Translate>
        </li>
        <li>
          <Translate>1 Numeric Property</Translate>
        </li>
      </ul>
    </p>
  </div>
);

export { NoQualifiedTemplatesMessage };
