import { Translate } from 'app/I18N';
import React from 'react';

const NoQualifiedTemplatesMessage = () => (
  <div className="flex flex-col items-center gap-10 text-xs font-semibold uppercase lead">
    <p>
      <Translate className="text-gray-900">No valid target template available</Translate>
    </p>
    <p className="flex flex-col items-center gap-5 text-gray-500">
      <div id="label-template-requirements">
        <Translate>A source template must</Translate>:
      </div>
      <ul
        className="flex flex-col gap-1 list-disc list-inside"
        aria-labelledby="label-template-requirements"
      >
        <li>
          <Translate>Not already been use as source template in another extractor</Translate>
        </li>
        <li>
          <Translate>Not already been use as target template</Translate>
        </li>
      </ul>
    </p>
  </div>
);

export { NoQualifiedTemplatesMessage };
