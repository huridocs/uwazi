/* eslint-disable react/no-multi-comp */
import React, { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button, ConfirmationModal } from '../../V2/Components/UI.js';
import { ConfirmationCallback } from '../helpers';

interface DeletionModalProps {
  confirmCallback: ConfirmationCallback;
  setConfirmCallback: Dispatch<SetStateAction<ConfirmationCallback | undefined>>;
}

const DeletionModal = ({ confirmCallback, setConfirmCallback }: DeletionModalProps) => (
  <ConfirmationModal
    header={<Translate>Delete</Translate>}
    warningText={<Translate>Are you sure you want to delete this item?</Translate>}
    body={
      <Translate className="py-4 text-wrap">
        Changes in the thesaurus will impact all the entities using these values.
      </Translate>
    }
    onCancelClick={() => {
      setConfirmCallback(undefined);
    }}
    onAcceptClick={() => {
      confirmCallback.callback(confirmCallback.arg);
      setConfirmCallback(undefined);
    }}
    dangerStyle
  />
);

const ThesaurusActions = ({ disabled }: { disabled: boolean }) => (
  <div className="flex gap-2">
    <Link to="/settings/thesauri">
      <Button styling="light" type="button" disabled={disabled}>
        <Translate>Cancel</Translate>
      </Button>
    </Link>
    <Button styling="solid" color="success" type="submit" form="edit-thesaurus" disabled={disabled}>
      <Translate>Save</Translate>
    </Button>
  </div>
);

export { DeletionModal, ThesaurusActions };
