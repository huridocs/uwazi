import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useAtomValue } from 'jotai';
import {
  getEntityViewerV2BasePath,
  isEntityViewerV2Enabled,
} from '#app/utils/entityViewerPaths.js';
import { localeAtom, relationshipTypesAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { Entity } from '#V2/api/entities/types.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { useFormatMetadata } from '#V2/Components/Metadata/hooks/useFormatMetadata.js';
import { buildRelationshipsSsrIndex } from '#V2/formatters/relationships/buildRelationshipsSsrIndex.js';
import { RelationshipsSsrIndex } from '../relationships/panel/RelationshipsSsrIndex.js';
import { useRelationshipViews } from '../context/RelationshipsQueryProvider.js';

type EntitySeoProps = {
  entity: Entity;
};

const formatPropertyValues = (property: MetadataProperty): string => {
  switch (property.type) {
    case 'text':
    case 'generatedid':
    case 'numeric':
    case 'markdown':
      return property.values
        .map(item => item.value)
        .filter(Boolean)
        .join(', ');
    case 'select':
    case 'multiselect':
      return property.values
        .map(item => item.translatedLabel || item.label || item.value)
        .filter(Boolean)
        .join(', ');
    case 'link':
      return property.values
        .map(item => item.label || item.value)
        .filter(Boolean)
        .join(', ');
    case 'relationship':
      if (property.mode === 'related') {
        return property.values
          .map(item => item.title)
          .filter(Boolean)
          .join(', ');
      }
      return '';
    default:
      return '';
  }
};

const EntitySeo = ({ entity }: EntitySeoProps) => {
  const locale = useAtomValue(localeAtom);
  const templates = useAtomValue(templatesAtom);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const settings = useAtomValue(settingsAtom);
  const views = useRelationshipViews();
  const { metadata, entityTemplate } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  const summaryRows = useMemo(
    () =>
      metadata
        .map(property => ({
          label: property.label,
          value: formatPropertyValues(property),
        }))
        .filter(row => row.value),
    [metadata]
  );

  const relationTitles = useMemo(
    () =>
      buildRelationshipsSsrIndex(views, relationshipTypes)
        .flatMap(group => group.entities.map(related => related.title))
        .slice(0, 30),
    [relationshipTypes, views]
  );

  const description = useMemo(() => {
    const parts = [entity.title];
    if (entityTemplate?.name) {
      parts.push(entityTemplate.name);
    }
    const preview = summaryRows
      .slice(0, 3)
      .map(row => `${row.label}: ${row.value}`)
      .join('. ');
    if (preview) {
      parts.push(preview);
    }
    return parts.join(' — ').slice(0, 160);
  }, [entity.title, entityTemplate?.name, summaryRows]);

  const canonicalPath = `/${locale}${getEntityViewerV2BasePath(isEntityViewerV2Enabled(settings?.features))}/${entity.sharedId}`;

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: entity.title,
      description,
      inLanguage: entity.language || locale,
      ...(relationTitles.length > 0 && {
        mentions: relationTitles.map(name => ({ '@type': 'Thing', name })),
      }),
    }),
    [entity.title, entity.language, locale, description, relationTitles]
  );

  return (
    <>
      <Helmet>
        <title>{entity.title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalPath} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <aside className="sr-only" data-testid="entity-seo-summary" aria-hidden="true">
        {entityTemplate?.name ? <p>{entityTemplate.name}</p> : null}
        {summaryRows.length > 0 ? (
          <dl>
            {summaryRows.map(row => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <RelationshipsSsrIndex testId="entity-seo-relationships-index" />
      </aside>
    </>
  );
};

export { EntitySeo };
