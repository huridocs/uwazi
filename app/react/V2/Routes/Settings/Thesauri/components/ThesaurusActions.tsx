/* eslint-disable react/no-multi-comp */
import React, { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { Button, ConfirmationModal } from 'app/V2/Components/UI';
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
