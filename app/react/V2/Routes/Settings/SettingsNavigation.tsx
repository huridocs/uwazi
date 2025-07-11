import React from 'react';
import { I18NLinkV2 as I18NLink, Translate } from 'app/I18N';
import { NeedAuthorization } from 'V2/Components/UI/NeedAuthorization';
import { Icon } from 'app/UI';
import { PreserveIcon } from 'app/Layout/PreserveIcon';
import { FeatureToggle } from 'V2/Components/UI/FeatureToggle';
import { useAtomValue } from 'jotai';
import { settingsAtom } from 'V2/atoms/settingsAtom';

const SettingsNavigation = () => {
  const settings = useAtomValue(settingsAtom);
  const { allowcustomJS } = settings;

  const renderLink = (to: string, children: React.ReactNode) => (
    <I18NLink
      to={to}
      activeClassname="bg-primary-100 text-primary-800 focus:bg-primary-100"
      className="block p-2 rounded hover:bg-gray-100 focus:bg-gray-100 font-medium text-sm"
    >
      <span className="whitespace-nowrap flex items-center gap-1">{children}</span>
    </I18NLink>
  );

  return (
    <nav
      aria-label="Settings navigation"
      className="h-full flex flex-col gap-6 text-sm overflow-y-auto"
    >
      <section className="p-4">
        <h2 className="font-bold text-sm text-gray-500 mb-4 tracking-wider">
          <Translate>Settings</Translate>
        </h2>
        <ul className="flex flex-col gap-4">
          <li>{renderLink('settings/account', <Translate>Account</Translate>)}</li>
          <NeedAuthorization roles={['admin']}>
            <>
              <li>{renderLink('settings/dashboard', <Translate>Dashboard</Translate>)}</li>
              <li>{renderLink('settings/users', <Translate>Users & Groups</Translate>)}</li>
              <li>{renderLink('settings/collection', <Translate>Collection</Translate>)}</li>
              <li>{renderLink('settings/navlinks', <Translate>Menu</Translate>)}</li>
              <li>{renderLink('settings/pages', <Translate>Pages</Translate>)}</li>
              <li>{renderLink('settings/languages', <Translate>Languages</Translate>)}</li>
              <li>{renderLink('settings/translations', <Translate>Translations</Translate>)}</li>
              <li>{renderLink('settings/filters', <Translate>Filters</Translate>)}</li>
            </>
          </NeedAuthorization>
        </ul>
      </section>
      <section className="p-4 border-t border-gray-200">
        <NeedAuthorization roles={['admin', 'editor']}>
          <h2 className="font-bold text-sm text-gray-500 mb-2 tracking-wider">
            <Translate>Metadata</Translate>
          </h2>
        </NeedAuthorization>
        <ul className="flex flex-col gap-4">
          <NeedAuthorization roles={['admin']}>
            <>
              <li>{renderLink('settings/templates', <Translate>Templates</Translate>)}</li>
              <li>{renderLink('settings/thesauri', <Translate>Thesauri</Translate>)}</li>
              <li>
                {renderLink(
                  'settings/relationship-types',
                  <Translate>Relationship types</Translate>
                )}
              </li>
            </>
          </NeedAuthorization>
          <NeedAuthorization roles={['admin', 'editor']}>
            <FeatureToggle feature="metadata-extraction">
              <li>
                {renderLink(
                  'settings/metadata_extraction',
                  <Translate>Metadata Extraction</Translate>
                )}
              </li>
            </FeatureToggle>
            <FeatureToggle feature="paragraphExtraction">
              <li>
                {renderLink(
                  'settings/paragraph-extraction',
                  <Translate>Paragraph Extraction</Translate>
                )}
              </li>
            </FeatureToggle>
          </NeedAuthorization>
        </ul>
      </section>
      <section className="p-4 border-t border-gray-200">
        <h2 className="font-bold text-sm text-gray-500 mb-4 tracking-wider">
          <Translate>Tools</Translate>
        </h2>
        <ul className="flex flex-col gap-4">
          <NeedAuthorization roles={['admin']}>
            <>
              <FeatureToggle feature="preserve.host">
                <li>
                  {renderLink(
                    '/settings/preserve',
                    <>
                      <Translate>Preserve</Translate> <PreserveIcon />
                    </>
                  )}
                </li>
              </FeatureToggle>
              <FeatureToggle feature="newRelationships">
                <li>
                  {renderLink(
                    '/settings/newrelmigration',
                    <Translate>New Relationships Migration</Translate>
                  )}
                </li>
              </FeatureToggle>
              <li>{renderLink('settings/activitylog', <Translate>Activity log</Translate>)}</li>
              <li>
                {renderLink(
                  'settings/customisation',
                  allowcustomJS ? (
                    <Translate>Global CSS & JS</Translate>
                  ) : (
                    <Translate>Global CSS</Translate>
                  )
                )}
              </li>
              <li>{renderLink('settings/custom-uploads', <Translate>Uploads</Translate>)}</li>
            </>
          </NeedAuthorization>
          <li>
            <a
              href="https://uwazi.io/page/9852italrtk/support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 p-2 rounded hover:bg-gray-100 focus:bg-gray-100 font-medium text-sm whitespace-nowrap"
            >
              <Translate>Documentation</Translate> <Icon icon="external-link-alt" />
            </a>
          </li>
        </ul>
      </section>
    </nav>
  );
};

export { SettingsNavigation };
