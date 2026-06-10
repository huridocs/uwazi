import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';

const MetadataDisplayFooter = () => (
  <div className="flex w-full flex-row items-center justify-between gap-3">
    <div className="flex gap-2">
      <Button variant="secondary">
        <Translate>Edit</Translate>
      </Button>
      <Button variant="secondary">
        <Translate>Share</Translate>
      </Button>
    </div>
    <Button variant="danger">
      <Translate>Delete</Translate>
    </Button>
  </div>
);

export { MetadataDisplayFooter };
