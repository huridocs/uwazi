import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { getEntityViewerV2Path, isEntityViewerV2Enabled } from '#app/utils/entityViewerPaths.js';
import { relationshipTypesAtom, settingsAtom } from '#V2/atoms/index.js';
import { buildRelationshipsSsrIndex } from '#V2/formatters/relationships/buildRelationshipsSsrIndex.js';
import { useDirectedRelationships } from '#V2/Routes/Entity/Components/context/RelationshipsQueryProvider.js';

type RelationshipsSsrIndexProps = {
  className?: string;
  testId?: string;
};

const RelationshipsSsrIndex = ({
  className = '',
  testId = 'entity-relationships-ssr-index',
}: RelationshipsSsrIndexProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const settings = useAtomValue(settingsAtom);
  const relationships = useDirectedRelationships();
  const groups = useMemo(
    () => buildRelationshipsSsrIndex(relationships, relationshipTypes),
    [relationshipTypes, relationships]
  );
  const entityViewerV2 = isEntityViewerV2Enabled(settings?.features);

  if (groups.length === 0) return null;

  return (
    <nav
      hidden
      className={className}
      aria-hidden="true"
      data-testid={testId}
      data-entity-relationships-ssr-index=""
    >
      {groups.map(group => (
        <section key={group.typeId}>
          <h2>{group.typeName ? group.typeName : <Translate>No label</Translate>}</h2>
          <ul>
            {group.entities.map(related => (
              <li key={related.sharedId}>
                <I18NLinkV2 to={getEntityViewerV2Path(related.sharedId, entityViewerV2)}>
                  {related.title}
                </I18NLinkV2>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
};

export { RelationshipsSsrIndex };
export type { RelationshipsSsrIndexProps };
