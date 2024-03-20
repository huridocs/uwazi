import React, { ChangeEventHandler } from 'react';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import ThesauriAPI from 'app/V2/api/thesauri';
import { ClientThesaurus } from 'app/apiResponseTypes';
import { sanitizeThesaurusValues } from '../helpers';

const ImportButton = ({
  onSuccess,
  onFailure,
  thesaurus,
}: {
  onSuccess: Function;
  onFailure: Function;
  thesaurus: ClientThesaurus;
}) => {
  const importThesauri: ChangeEventHandler<HTMLInputElement> = async e => {
    if (e.target.files && e.target.files[0]) {
      try {
        const sanitizedThesaurus = sanitizeThesaurusValues(thesaurus, thesaurus.values);
        const data = await ThesauriAPI.importThesaurus(sanitizedThesaurus, e.target.files[0]);
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
