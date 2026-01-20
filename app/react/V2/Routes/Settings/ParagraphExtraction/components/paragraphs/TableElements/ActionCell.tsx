import React from 'react';

import { Translate } from '#app/I18N/index.js';

import { Button } from '#V2/Components/UI/index.js';

const ActionCell = (action: () => void) => (
  <Button className="leading-4" styling="outline" onClick={action}>
    <Translate>View</Translate>
  </Button>
);

export { ActionCell };
