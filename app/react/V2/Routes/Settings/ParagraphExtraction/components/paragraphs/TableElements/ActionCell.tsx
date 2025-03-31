import React from 'react';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';

const ActionCell = (action: () => void) => (
  <Button className="leading-4" styling="outline" onClick={action}>
    <Translate>View</Translate>
  </Button>
);

export { ActionCell };
