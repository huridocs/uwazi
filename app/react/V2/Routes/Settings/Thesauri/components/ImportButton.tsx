import React, { ChangeEventHandler } from 'react';
import { Translate } from '#app/I18N/index.js';
import { ClientThesaurus } from '#app/apiResponseTypes.js';
import { Button } from '#app/V2/Components/UI/index.js';
import { importThesaurus } from '#app/V2/api/thesauri/index.js';

const ImportButton = ({
  onSuccess,
  onFailure,
  getThesaurus,
  onClick,
  disabled,
}: {
  onSuccess: Function;
  onFailure: Function;
  getThesaurus: () => ClientThesaurus;
  onClick: Function;
  disabled: Boolean;
}) => {
  const importThesauri: ChangeEventHandler<HTMLInputElement> = async e => {
    if (e.target.files && e.target.files[0]) {
      try {
        const thesaurus = getThesaurus();
        const data = await importThesaurus(thesaurus, e.target.files[0]);
        onSuccess(data);
      } catch (ex) {
        onFailure(ex);
      }
    } else {
      onFailure();
    }
    document.querySelector('input#import')!.setAttribute('value', '');
  };
  return (
    <Button
      disabled={disabled === true}
      variant="secondary"
      data-testid="thesaurus-import-items"
      onClick={e => {
        onClick(e);
        (document.querySelector('input#import') as HTMLElement).click();
      }}
    >
      <Translate>Import</Translate>
      <input type="file" id="import" hidden onChange={importThesauri} />
    </Button>
  );
};

export { ImportButton };
