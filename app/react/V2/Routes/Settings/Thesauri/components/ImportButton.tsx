import React, { ChangeEventHandler } from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientThesaurus } from '../../apiResponseTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button } from '../../V2/Components/UI.js';
// @ts-expect-error TS(2307): Cannot find module '../../api/V2/api/thesauri.js' ... Remove this comment to see the full error message
import { importThesaurus } from 'api/V2/api/thesauri.js';

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
      styling="outline"
      data-testid="thesaurus-import-items"
      // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
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
