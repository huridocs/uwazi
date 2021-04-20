import React from 'react';

import { Tip } from 'app/Layout';

import { ToggleChildren } from 'app/Settings/components/ToggleChildren';
import { t } from 'app/I18N';

export const ViewTemplateAsPage = () => (
  <div>
    <label>
      Display as page
      <Tip icon="info-circle" position="right">
        {t(
          'system',
          'Entity can be displayed in a custom page. For that, a custom page needs to be created in Pages, and then selected here.'
        )}
      </Tip>
    </label>
    <ToggleChildren toggled={false}>
      <select>
        <option>Placeholder 1</option>
        <option>Placeholder 2</option>
      </select>
    </ToggleChildren>
  </div>
);
