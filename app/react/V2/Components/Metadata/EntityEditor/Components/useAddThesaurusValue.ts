import { useRef, useState } from 'react';
import { useSetAtom } from 'jotai';
import type { ClientThesaurus, ClientThesaurusValue } from '#app/apiResponseTypes.js';
import { t } from '#app/I18N/index.js';
import { sanitizeThesaurusLabel } from '#shared/sanitizationUtils.js';
import type { Thesaurus } from '#shared/contracts/Thesaurus.js';
import { thesauriAtom } from '#V2/atoms/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { useServices } from '#V2/services/index.js';
import { findFoldMatch, idByStoredLabel, withAddedValue } from '../functions/addThesaurusValue.js';

type ApplyThesaurusValue = (
  ids: string[],
  source: ClientThesaurus,
  freshIds: ReadonlySet<string>
) => void;

type UseAddThesaurusValueArgs = {
  thesaurus: ClientThesaurus;
  singleSelect: boolean;
  selectedIds: string[];
  onApply: ApplyThesaurusValue;
};

type SaveRefs = UseAddThesaurusValueArgs & { freshIds: ReadonlySet<string> };

type CreatedValue = {
  id: string;
  source: ClientThesaurus;
  freshIds: ReadonlySet<string>;
};

const clientValues = (values: Thesaurus['values']): ClientThesaurusValue[] =>
  values.map(value =>
    value.values
      ? {
          id: value.id,
          label: value.label,
          values: value.values.map(child =>
            child.name
              ? { id: child.id, label: child.label, name: child.name }
              : { id: child.id, label: child.label }
          ),
        }
      : { id: value.id, label: value.label }
  );

const selectionFor = (singleSelect: boolean, selectedIds: string[], id: string) => {
  if (singleSelect) {
    return [id];
  }
  return selectedIds.includes(id) ? selectedIds : [...selectedIds, id];
};

const sameSelection = (left: string[], right: string[]) =>
  left.length === right.length && left.every((id, index) => id === right[index]);

const createdValue = ({
  current,
  saved,
  clean,
  freshIds,
  groupId,
}: {
  current: ClientThesaurus;
  saved: Thesaurus;
  clean: string;
  freshIds: ReadonlySet<string>;
  groupId: string;
}): CreatedValue | undefined => {
  const values = clientValues(saved.values);
  const id = idByStoredLabel(values, clean, groupId);
  if (!id) {
    return undefined;
  }
  const nextFresh = new Set(freshIds);
  nextFresh.add(id);
  return {
    id,
    freshIds: nextFresh,
    source: { ...current, name: saved.name, values },
  };
};

const replaceThesaurus = (list: ClientThesaurus[], savedId: string, source: ClientThesaurus) =>
  list.map(item =>
    item._id === savedId ? { ...item, name: source.name, values: source.values } : item
  );

type StoreNewValueArgs = {
  current: ClientThesaurus;
  clean: string;
  groupId: string;
  freshIds: ReadonlySet<string>;
  upsert: ReturnType<typeof useServices>['thesauri']['upsert'];
  notify: ReturnType<typeof useRequestStatus>['notify'];
  setFreshIds: (ids: ReadonlySet<string>) => void;
  setThesauri: (update: (list: ClientThesaurus[]) => ClientThesaurus[]) => void;
  applyId: (id: string, source: ClientThesaurus, fresh: ReadonlySet<string>) => void;
  setAdding: (adding: boolean) => void;
};

const storeNewValue = async ({
  current,
  clean,
  groupId,
  freshIds,
  upsert,
  notify,
  setFreshIds,
  setThesauri,
  applyId,
  setAdding,
}: StoreNewValueArgs) => {
  const [saved, error] = await upsert(withAddedValue(current, clean, groupId));
  const created =
    saved && !error ? createdValue({ current, saved, clean, freshIds, groupId }) : undefined;
  if (!saved || error || !created) {
    notify('error', t('System', 'Could not add thesaurus value', null, false));
    return;
  }
  setFreshIds(created.freshIds);
  setThesauri(list => replaceThesaurus(list, saved._id, created.source));
  applyId(created.id, created.source, created.freshIds);
  setAdding(false);
};

const selectExisting = (
  matched: string | undefined,
  apply: (id: string) => void,
  stop: () => void
) => {
  if (!matched) {
    return false;
  }
  apply(matched);
  stop();
  return true;
};

const useSaveDeps = () => ({
  upsert: useServices().thesauri.upsert,
  setThesauri: useSetAtom(thesauriAtom),
  notify: useRequestStatus().notify,
});

const useAddThesaurusValue = ({
  thesaurus,
  singleSelect,
  selectedIds,
  onApply,
}: UseAddThesaurusValueArgs) => {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());
  const { upsert, setThesauri, notify } = useSaveDeps();
  const refs = useRef<SaveRefs>({ thesaurus, singleSelect, selectedIds, onApply, freshIds });
  refs.current = { thesaurus, singleSelect, selectedIds, onApply, freshIds };

  const applyId = (id: string, source: ClientThesaurus, fresh: ReadonlySet<string>) => {
    const nextIds = selectionFor(refs.current.singleSelect, refs.current.selectedIds, id);
    if (!sameSelection(nextIds, refs.current.selectedIds)) {
      refs.current.onApply(nextIds, source, fresh);
    }
  };

  const save = async (label: string, groupId = 'root') => {
    const current = refs.current.thesaurus;
    const clean = sanitizeThesaurusLabel(label);
    const match = clean ? findFoldMatch(current, clean, groupId) : undefined;
    const existing = selectExisting(
      match,
      id => applyId(id, current, refs.current.freshIds),
      () => setAdding(false)
    );
    if (!clean || existing) {
      return;
    }
    setSaving(true);
    try {
      await storeNewValue({
        current,
        clean,
        groupId,
        freshIds: refs.current.freshIds,
        upsert,
        notify,
        setFreshIds,
        setThesauri,
        applyId,
        setAdding,
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    adding,
    saving,
    open: () => setAdding(true),
    close: () => setAdding(false),
    clear: () => refs.current.onApply([], refs.current.thesaurus, refs.current.freshIds),
    save,
  };
};

export { useAddThesaurusValue };
export type { UseAddThesaurusValueArgs };
