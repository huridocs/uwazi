import React, { ChangeEventHandler } from 'react';
import { Translate } from 'app/I18N';
import { ClientThesaurus } from 'app/apiResponseTypes';
import { Button } from 'app/V2/Components/UI';
import ThesauriAPI from 'app/V2/api/thesauri';

const ImportButton = ({
  onSuccess,
  onFailure,
  getThesaurus,
}: {
  onSuccess: Function;
  onFailure: Function;
  getThesaurus: () => ClientThesaurus;
}) => {
  const importThesauri: ChangeEventHandler<HTMLInputElement> = async e => {
    if (e.target.files && e.target.files[0]) {
      try {
        const thesaurus = getThesaurus();
        const data = await ThesauriAPI.importThesaurus(thesaurus, e.target.files[0]);
        onSuccess(data);
      } catch (ex) {
        onFailure(ex);
      }
    }
  };
  return (
    <Button
      styling="outline"
      data-testid="thesaurus-import-items"
      onClick={() => (document.querySelector('input#import') as HTMLElement).click()}
    >
      <Translate>Import</Translate>
      <input type="file" id="import" hidden onChange={importThesauri} />
    </Button>
  );
};

export { ImportButton };
