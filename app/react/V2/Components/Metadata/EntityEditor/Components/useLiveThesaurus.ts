import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import type { MultiselectListOption } from '#V2/Components/Forms/index.js';
import { thesauriAtom } from '#V2/atoms/index.js';
import { thesaurusToOptions } from '../functions/relationshipFieldHelpers.js';

const useLiveThesaurus = (
  thesaurus: ClientThesaurus | undefined,
  options: MultiselectListOption[],
  freshIds: ReadonlySet<string>
) => {
  const thesauri = useAtomValue(thesauriAtom);
  const live = thesaurus
    ? (thesauri.find(item => item._id === thesaurus._id) ?? thesaurus)
    : undefined;
  const built = useMemo(
    () => (live ? thesaurusToOptions([live], { content: live._id }, freshIds) : undefined),
    [live, freshIds]
  );

  return { live, options: built ?? options };
};

export { useLiveThesaurus };
