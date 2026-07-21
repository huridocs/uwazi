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
  const {
    entity,
    assignments,
    visibility,
    lookupTerm,
    lookupError,
    showLookupHint,
    showPublicTip,
    dirty,
    loading,
    loadFailed,
    saving,
    adding,
    generalAccessRef,
    lookupInputRef,
    isPublished,
    controlsDisabled,
    updateMember,
    removeMember,
    handleAdd,
    handleSave,
    setGeneralAccess,
    setLookupTerm,
    setLookupError,
    setShowLookupHint,
  } = useShareEntityModal(sharedIds, onClose);

  return (
    <Modal size="lg" ariaLabel={t('System', 'Share', null, false)}>
      <Modal.Header>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">
            <Translate>Share</Translate>
          </h3>
          <p className="mt-0.5 truncate text-xs text-ink-muted">{entity.title}</p>
        </div>
        <Modal.CloseButton onClick={onClose} disabled={saving} className="ml-0!" />
      </Modal.Header>

      <Modal.Body className="px-0! py-0!">
        <NeedAuthorization roles={['admin', 'editor']}>
          <GeneralAccessSection
            visibility={visibility}
            disabled={controlsDisabled}
            showPublicTip={showPublicTip}
            publicTipId={publicTipId}
            generalAccessRef={generalAccessRef}
            onChange={setGeneralAccess}
          />
        </NeedAuthorization>

        <PeopleLookupSection
          lookupTerm={lookupTerm}
          lookupError={lookupError}
          showLookupHint={showLookupHint}
          disabled={controlsDisabled}
          adding={adding}
          lookupInputRef={lookupInputRef}
          onTermChange={value => {
            setLookupTerm(value);
            if (lookupError) setLookupError('');
          }}
          onToggleHint={() => setShowLookupHint(open => !open)}
          onAdd={handleAdd}
        />

        <section className="px-5 py-3" data-testid="share-members-list">
          <MembersList
            loading={loading}
            loadFailed={loadFailed}
            assignments={assignments}
            showCanSee={!isPublished}
            onChange={updateMember}
            onRemove={removeMember}
          />
        </section>
      </Modal.Body>

      <Modal.Footer>
        {dirty ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              <Translate>Discard changes</Translate>
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleSave().catch(() => undefined);
              }}
              disabled={saving || loading || loadFailed}
            >
              <Translate>Save changes</Translate>
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            <Translate>Close</Translate>
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export type { ShareEntityModalProps };
export { ShareEntityModal };
