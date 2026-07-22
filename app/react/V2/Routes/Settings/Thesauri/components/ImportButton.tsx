import React, { ChangeEventHandler } from 'react';
import { Translate } from '#app/I18N/index.js';
import { ClientThesaurus } from '#app/apiResponseTypes.js';
import { Button } from '#V2/Components/UI/index.js';
import { useServices } from '#V2/services/index.js';

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
  const { thesauri: thesaurusService } = useServices();

  const importThesauri: ChangeEventHandler<HTMLInputElement> = async e => {
    if (e.target.files && e.target.files[0]) {
      const thesaurus = getThesaurus();
      const [data, error] = await thesaurusService.importFromFile(thesaurus, e.target.files[0]);

      if (error || !data) {
        onFailure(error);
      } else {
        onSuccess(data);
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
      onClick={clickEvent => {
        onClick(clickEvent);
        (document.querySelector('input#import') as HTMLElement).click();
      }}
    >
      <Translate>Import</Translate>
      <input type="file" id="import" hidden onChange={importThesauri} />
    </Button>
  );
};

export { ImportButton };
