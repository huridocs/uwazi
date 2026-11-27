import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { Button, Modal, NeedAuthorization } from '#V2/Components/UI/index.js';
import { GeneralAccessSection } from './GeneralAccessSection.js';
import { MembersList } from './MembersList.js';
import { PeopleLookupSection } from './PeopleLookupSection.js';
import { useShareEntityModal } from './useShareEntityModal.js';

type ShareEntityModalProps = {
  sharedIds: string[];
  onClose: () => void;
};

const publicTipId = 'share-public-caution';

const ShareEntityModal = ({ sharedIds, onClose }: ShareEntityModalProps) => {
  const { entity, controlsDisabled, generalAccess, lookup, members, footer } = useShareEntityModal(
    sharedIds,
    onClose
  );

  return (
    <Modal size="lg" ariaLabel={t('System', 'Permissions', null, false)}>
      <Modal.Header>
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h3 className="shrink-0 text-sm font-semibold text-ink">
            <Translate>Permissions</Translate>
          </h3>
          <p className="min-w-0 truncate text-meta text-ink-tertiary">{entity.title}</p>
        </div>
        <Modal.CloseButton onClick={onClose} disabled={footer.saving} className="ml-0!" />
      </Modal.Header>

      <Modal.Body className="px-0! py-0!">
        <NeedAuthorization roles={['admin', 'editor']}>
          <GeneralAccessSection
            visibility={generalAccess.visibility}
            disabled={controlsDisabled}
            showPublicTip={generalAccess.showPublicTip}
            publicTipId={publicTipId}
            generalAccessRef={generalAccess.generalAccessRef}
            onChange={generalAccess.setGeneralAccess}
          />
        </NeedAuthorization>

        <PeopleLookupSection
          lookupTerm={lookup.lookupTerm}
          lookupError={lookup.lookupError}
          showLookupHint={lookup.showLookupHint}
          disabled={controlsDisabled}
          adding={lookup.adding}
          lookupInputRef={lookup.lookupInputRef}
          onTermChange={value => {
            lookup.setLookupTerm(value);
            if (lookup.lookupError) lookup.setLookupError('');
          }}
          onToggleHint={() => lookup.setShowLookupHint(open => !open)}
          onAdd={lookup.handleAdd}
        />

        <section className="px-5 pt-2 pb-3" data-testid="share-members-list">
          <MembersList
            loading={members.loading}
            loadFailed={members.loadFailed}
            assignments={members.assignments}
            onChange={members.updateMember}
            onRemove={members.removeMember}
          />
        </section>
      </Modal.Body>

      <Modal.Footer>
        {footer.dirty ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={footer.saving}>
              <Translate>Discard changes</Translate>
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                footer.handleSave().catch(() => undefined);
              }}
              disabled={footer.saving || footer.loading || footer.loadFailed}
            >
              <Translate>Save changes</Translate>
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="h-7 cursor-pointer border-0 bg-transparent px-2 text-xs font-medium text-ink-secondary hover:text-ink focus:outline-hidden"
          >
            <Translate>Close</Translate>
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export type { ShareEntityModalProps };
export { ShareEntityModal };
