import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button } from '../../V2/Components/UI.js';

const ActionCell = (action: () => void) => (
  <Button className="leading-4" styling="outline" onClick={action}>
    <Translate>View</Translate>
  </Button>
);

export { ActionCell };
