import React, { type ReactNode } from 'react';
import { I18NLinkV2 } from '#app/I18N/index.js';
import {
  getEntityViewerV2BasePath,
  isEntityViewerV2Enabled,
} from '#app/utils/entityViewerPaths.js';
import { useAtomValue } from 'jotai';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { EntityIcon, type EntityIconData } from '../../CustomIcons/index.js';

type OpenEntityTarget = {
  sharedId: string;
  title: string;
  templateId: string;
};

type EntityOverlayPillProps = {
  sharedId: string;
  templateId: string;
  label: string;
  icon?: EntityIconData | null;
  authorized?: boolean;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const pillClass =
  'inline-flex min-w-0 max-w-full cursor-pointer items-center rounded-md transition-opacity hover:opacity-80';

const EntityOverlayPill = ({
  sharedId,
  templateId,
  label,
  icon,
  authorized = true,
  onOpenEntity,
}: EntityOverlayPillProps) => {
  const settings = useAtomValue(settingsAtom);
  const inner: ReactNode = (
    <span className="inline-flex max-w-full items-center gap-1.5">
      {icon ? <EntityIcon data={icon} /> : null}
      <TemplatePill templateId={templateId} label={label} />
    </span>
  );

  if (authorized === false) {
    return inner;
  }

  if (onOpenEntity) {
    return (
      <button
        type="button"
        title={label}
        className={pillClass}
        onClick={event => {
          event.stopPropagation();
          onOpenEntity({ sharedId, title: label, templateId });
        }}
      >
        {inner}
      </button>
    );
  }

  const to =
    `${getEntityViewerV2BasePath(isEntityViewerV2Enabled(settings.features))}/${sharedId}`.replace(
      /^\//,
      ''
    );

  return (
    <I18NLinkV2
      className={pillClass}
      to={to}
      target="_blank"
      rel="noreferrer"
      localized={false}
      title={label}
    >
      {inner}
    </I18NLinkV2>
  );
};

export { EntityOverlayPill };
export type { EntityOverlayPillProps, OpenEntityTarget };
