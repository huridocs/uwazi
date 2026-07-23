import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { t } from '#app/I18N/index.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import type { EntitiesService } from '#V2/services/contracts/EntitiesService.js';
import { filterCollaboratorCandidates } from './shareUtils.js';

type LookupDeps = {
  entities: EntitiesService;
  assignmentsRef: MutableRefObject<MemberWithPermission[]>;
  appendMatch: (match: MemberWithPermission) => boolean;
  loadFailed: boolean;
};

const lookupMatchError = (matches: MemberWithPermission[] | undefined) => {
  if (matches === undefined) return t('System', 'An error occurred', null, false);
  if (matches.length === 0) return t('System', 'No user or group found', null, false);
  if (matches.length > 1) return t('System', 'Multiple matches found', null, false);
  return '';
};

const useShareLookup = ({ entities, assignmentsRef, appendMatch, loadFailed }: LookupDeps) => {
  const [lookupTerm, setLookupTerm] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [showLookupHint, setShowLookupHint] = useState(false);
  const [adding, setAdding] = useState(false);
  const lookupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lookupError && !adding) lookupInputRef.current?.focus();
  }, [lookupError, adding]);

  const handleAdd = async () => {
    const term = lookupTerm.trim();
    if (!term || adding || loadFailed) return;

    setAdding(true);
    setLookupError('');
    const [results, error] = await entities.searchCollaborators(term);
    const matches =
      error || !results
        ? undefined
        : filterCollaboratorCandidates(term, results, assignmentsRef.current);
    const matchError = lookupMatchError(matches);
    if (matchError) setLookupError(matchError);
    else if (matches?.[0] && appendMatch(matches[0])) setLookupTerm('');
    setAdding(false);
  };

  return {
    lookupTerm,
    lookupError,
    showLookupHint,
    adding,
    lookupInputRef,
    handleAdd,
    setLookupTerm,
    setLookupError,
    setShowLookupHint,
  };
};

export { useShareLookup };
