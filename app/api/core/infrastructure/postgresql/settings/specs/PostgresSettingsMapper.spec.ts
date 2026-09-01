import { ObjectId } from 'mongodb';
import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { ThemeVars } from '#shared/types/themeVars.js';
import { PostgresSettingsMapper } from '../PostgresSettingsMapper.js';

const sampleId = () => new ObjectId().toHexString();

const sampleSettings = (id: string): SettingsType =>
  ({
    _id: id,
    __v: 3,
    site_name: 'Uwazi',
    customCSS: 'body {}',
    customJS: 'console.log(1)',
    private: true,
    newNameGeneration: true,
    openPublicEndpoint: false,
    ocrServiceEnabled: true,
    filterUnauthorizedRelated: false,
    project: 'huridocs',
    custom: { extra: true },
    languages: [{ key: 'en', label: 'English', default: true }],
    links: [{ title: 'Home', type: 'link', url: '/' }],
    filters: [{ id: 'f1', name: 'Cases' }],
    features: { favorites: true },
    themeVars: { '--color': '#000' } as ThemeVars,
    themeAssets: { preset: 'default' },
    sync: [{ url: 'http://peer', username: 'u', password: 'p', name: 'peer', config: {} }],
    allowedPublicTemplates: ['t1'],
    publicFormDestination: 'http://form',
    mailerConfig: 'smtp://x',
    contactEmail: 'a@b.c',
    senderEmail: 'n@b.c',
    analyticsTrackingId: 'G-1',
    matomoConfig: 'm',
    mapApiKey: 'k',
    mapLayers: ['osm'],
    mapStartingPoint: [{ lon: 1, lat: 2 }],
    tilesProvider: 'mapbox',
    site_logo: 'logo.png',
    favicon: 'icon.png',
    home_page: '/',
    defaultLibraryView: 'cards',
    allowcustomJS: true,
    cookiepolicy: false,
    dateFormat: 'YYYY',
    evidencesVault: { token: 'secret' },
  }) as SettingsType;

describe('PostgresSettingsMapper', () => {
  it('should map known columns', () => {
    const id = sampleId();
    const row = PostgresSettingsMapper.toRow(sampleSettings(id));

    expect(row._id).toBe(id);
    expect(row.site_name).toBe('Uwazi');
    expect(row.custom_css).toBe('body {}');
    expect(row.custom_js).toBe('console.log(1)');
    expect(row.private).toBe(true);
    expect(row.new_name_generation).toBe(true);
    expect(row.custom).toEqual({ extra: true });
  });

  it('should map JSONB groups', () => {
    const row = PostgresSettingsMapper.toRow(sampleSettings(sampleId()));

    expect(row.mail).toEqual({
      mailerConfig: 'smtp://x',
      contactEmail: 'a@b.c',
      senderEmail: 'n@b.c',
    });
    expect(row.analytics).toEqual({ analyticsTrackingId: 'G-1', matomoConfig: 'm' });
    expect(row.map).toEqual({
      mapApiKey: 'k',
      mapLayers: ['osm'],
      mapStartingPoint: [{ lon: 1, lat: 2 }],
      tilesProvider: 'mapbox',
    });
    expect(row.branding).toEqual({ site_logo: 'logo.png', favicon: 'icon.png' });
    expect(row.site_preferences).toEqual({
      home_page: '/',
      defaultLibraryView: 'cards',
      allowcustomJS: true,
      cookiepolicy: false,
    });
  });

  it('should drop __v and put unknown keys in extras', () => {
    const row = PostgresSettingsMapper.toRow(sampleSettings(sampleId()));

    expect(row).not.toHaveProperty('__v');
    expect(row).not.toHaveProperty('tenant_id');
    expect(row.extras).toEqual({ dateFormat: 'YYYY', evidencesVault: { token: 'secret' } });
  });

  it('should round-trip a mapped row back to settings without __v', () => {
    const id = sampleId();
    const settings = {
      _id: id,
      site_name: 'Round trip',
      mailerConfig: 'smtp://x',
      dateFormat: 'DD/MM',
      languages: [{ key: 'es', label: 'Spanish', default: true }],
    } as SettingsType;

    expect(PostgresSettingsMapper.toSettings(PostgresSettingsMapper.toRow(settings))).toEqual(
      settings
    );
  });

  it('should lift leftover menu _id onto id when mapping a row', () => {
    const row = PostgresSettingsMapper.toRow({
      _id: sampleId(),
      links: [
        {
          _id: 'menu1',
          title: 'Home',
          type: 'link',
          url: '/',
        },
        {
          _id: 'group1',
          title: 'Group',
          type: 'group',
          sublinks: [{ _id: 'sub1', title: 'Child', type: 'link', url: '/child' }],
        },
      ],
    });

    expect(row.links).toEqual([
      { id: 'menu1', title: 'Home', type: 'link', url: '/' },
      {
        id: 'group1',
        title: 'Group',
        type: 'group',
        sublinks: [{ id: 'sub1', title: 'Child', type: 'link', url: '/child' }],
      },
    ]);
  });

  it('should stringify ObjectId _id and omit empty groups', () => {
    const objectId = new ObjectId();
    const row = PostgresSettingsMapper.toRow({
      _id: objectId,
      site_name: 'Ids',
    });

    expect(row._id).toBe(objectId.toHexString());
    expect(row.mail).toBeUndefined();
    expect(row.extras).toEqual({});
  });
});
