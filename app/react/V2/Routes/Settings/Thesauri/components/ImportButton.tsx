import React, { ChangeEventHandler } from 'react';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { importThesaurus } from 'app/Thesauri/actions/thesauriActions';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

const ImportButton = ({
  onSuccess,
  onFailure,
  thesaurus,
}: {
  onSuccess: Function;
  onFailure: Function;
  thesaurus: ThesaurusSchema;
}) => {
  const importThesauri: ChangeEventHandler<HTMLInputElement> = async e => {
    if (e.target.files && e.target.files[0]) {
      try {
        await importThesaurus(thesaurus, e.target.files[0]);
        onSuccess();
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
