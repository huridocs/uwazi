import { useCallback, useRef, useState } from 'react';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, MixedAccessLevels } from '#shared/types/permissionSchema.js';
import { memberKey } from './shareUtils.js';

const useShareAssignments = (setDirty: (value: boolean) => void) => {
  const [assignments, setAssignments] = useState<MemberWithPermission[]>([]);
  const assignmentsRef = useRef(assignments);
  assignmentsRef.current = assignments;

  const commitAssignments = useCallback(
    (updater: (prev: MemberWithPermission[]) => MemberWithPermission[]) => {
      setAssignments(prev => {
        const next = updater(prev);
        assignmentsRef.current = next;
        return next;
      });
    },
    []
  );

  const replaceAssignments = useCallback(
    (next: MemberWithPermission[]) => {
      commitAssignments(() => next);
    },
    [commitAssignments]
  );

  const updateMember = (index: number, level: MixedAccessLevels) => {
    commitAssignments(prev => {
      const next = [...prev];
      next[index] = { ...next[index], level };
      return next;
    });
    setDirty(true);
  };

  const removeMember = (index: number) => {
    commitAssignments(prev => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const appendMatch = (match: MemberWithPermission) => {
    if (assignmentsRef.current.some(member => memberKey(member) === memberKey(match))) {
      return false;
    }
    commitAssignments(prev => {
      if (prev.some(member => memberKey(member) === memberKey(match))) return prev;
      return [...prev, { ...match, level: match.level || AccessLevels.READ }];
    });
    setDirty(true);
    return true;
  };

  return {
    assignments,
    assignmentsRef,
    replaceAssignments,
    updateMember,
    removeMember,
    appendMatch,
  };
};

export { useShareAssignments };
