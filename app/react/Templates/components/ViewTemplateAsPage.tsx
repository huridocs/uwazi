import React from 'react';

import { Tip } from 'app/Layout';

import { ToggleChildren } from 'app/Settings/components/ToggleChildren';

export const ViewTemplateAsPage = () => (
  <div>
    <label>
      Display as page
      <Tip icon="info-circle">
        Entity can be displayed in a custom page. For that, a custom page needs to be created in
        Pages, and then selected here.
      </Tip>
    </label>
    <ToggleChildren toggled={false} />
  </div>
);
