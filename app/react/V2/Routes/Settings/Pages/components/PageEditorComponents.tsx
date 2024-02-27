/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Link } from 'react-router-dom';
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

const HTMLNotification = () => (
  <div className="flex items-center gap-4 p-4 text-primary-700 border-primary-300 bg-primary-100 w-fit">
    <InformationCircleIcon className="w-7 h-7" />
    <div>
      <Translate>Use</Translate>&nbsp;
      <Link
        className="underline hover:text-primary-800"
        target="_blank"
        to="https://guides.github.com/features/mastering-markdown/"
        rel="noopener noreferrer"
      >
        <Translate>Markdown</Translate>
      </Link>
      &nbsp;
      <Translate>syntax to create page content</Translate>.&nbsp;
      <Translate>
        You can also embed advanced components like maps, charts and entity lists in your page.
      </Translate>
      &nbsp;
      <Link
        className="underline hover:text-primary-800"
        target="_blank"
        to="https://uwazi.readthedocs.io/en/latest/admin-docs/analysing-and-visualising-your-collection.html"
        rel="noopener noreferrer"
      >
        <Translate>Click here</Translate>
      </Link>
      &nbsp;
      <Translate>to learn more about the components.</Translate>
    </div>
  </div>
);

const JSNotification = () => (
  <div className="flex items-center gap-4 p-4 text-warning-700 border-warning-300 bg-warning-100 w-fit">
    <ExclamationTriangleIcon className="w-7 h-7" />
    <div>
      <Translate>With great power comes great responsibility!</Translate>
      <br />
      <Translate>
        This area allows you to append custom Javascript to the page. This opens up a new universe
        of possibilities.
      </Translate>
      &nbsp;
      <Translate>
        It could also very easily break the app. Only write code here if you know exactly what you
        are doing.
      </Translate>
    </div>
  </div>
);

export { HTMLNotification, JSNotification };
