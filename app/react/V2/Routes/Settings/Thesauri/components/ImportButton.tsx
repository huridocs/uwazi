import React, { ChangeEventHandler } from 'react';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';

const ImportButton = ({ onChange }: { onChange: ChangeEventHandler<HTMLInputElement> }) => {
  return (
    <Button
      styling="outline"
      data-testid="thesaurus-import-items"
      onClick={() => (document.querySelector('input#import') as HTMLElement).click()}
    >
      <Translate>Import</Translate>
      <input type="file" id="import" hidden onChange={onChange} />
    </Button>
  );
};

export { ImportButton };
