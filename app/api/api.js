export default async (app, server) => {
  const [
    { default: activitylogMiddleware },
    { default: CSRFMiddleware },
    { default: languageMiddleware },
  ] = await Promise.all([
    import('./activitylog/activitylogMiddleware.ts'),
    import('./auth/CSRFMiddleware.ts'),
    import('./utils/languageMiddleware.ts'),
  ]);

  app.use(CSRFMiddleware);
  app.use(languageMiddleware);
  app.use(activitylogMiddleware);

  const { setupApiSockets } = await import('./socketio/setupSockets');
  setupApiSockets(server, app);

  const auth2faRoutes = await import('./auth2fa/routes');
  auth2faRoutes.default(app);

  const relationshipsRoutes = await import('./relationships/routes');
  relationshipsRoutes.default(app);

  const activitylogRoutes = await import('./activitylog/routes');
  activitylogRoutes.default(app);

  const usersRoutes = await import('./users/routes');
  usersRoutes.default(app);

  const templateRoutes = await import('./core/infrastructure/express/template/routes');
  templateRoutes.default(app);

  const searchDeprecatedRoutes = await import('./search/deprecatedRoutes');
  searchDeprecatedRoutes.default(app);

  const searchRoutes = await import('./search/routes');
  searchRoutes.default(app);

  const searchV2Routes = await import('./search.v2/routes');
  searchV2Routes.searchRoutes(app);

  const thesauriRoutes = await import('./thesauri/routes');
  thesauriRoutes.default(app);

  const relationtypesRoutes = await import('./relationtypes/routes');
  relationtypesRoutes.default(app);

  const documentsDeprecatedRoutes = await import('./documents/deprecatedRoutes');
  documentsDeprecatedRoutes.default(app);

  const documentsRoutes = await import('./documents/routes');
  documentsRoutes.documentRoutes(app);

  const contactRoutes = await import('./contact/routes');
  contactRoutes.default(app);

  const entitiesRoutes = await import('./entities/routes');
  entitiesRoutes.default(app);

  const entitiesV2Routes = await import('./entities.v2/routes');
  entitiesV2Routes.entitiesRoutes(app);

  const pagesRoutes = await import('./pages/routes');
  pagesRoutes.default(app);

  const filesJsRoutes = await import('./files/jsRoutes.js');
  filesJsRoutes.default(app);

  const filesRoutes = await import('./files/routes');
  filesRoutes.default(app);

  const filesExportRoutes = await import('./files/exportRoutes');
  filesExportRoutes.default(app);

  const filesOcrRoutes = await import('./files/ocrRoutes');
  filesOcrRoutes.ocrRoutes(app);

  const settingsRoutes = await import('./settings/routes');
  settingsRoutes.default(app);

  const i18nRoutes = await import('./i18n/routes');
  i18nRoutes.default(app);

  const i18nV2Routes = await import('./i18n.v2/routes');
  i18nV2Routes.translationsRoutes(app);

  const syncRoutes = await import('./sync/routes');
  syncRoutes.default(app);

  const tasksRoutes = await import('./tasks/routes');
  tasksRoutes.default(app);

  const usergroupsRoutes = await import('./usergroups/routes');
  usergroupsRoutes.default(app);

  const permissionsRoutes = await import('./permissions/routes');
  permissionsRoutes.permissionRoutes(app);

  const suggestionsRoutes = await import('./suggestions/routes');
  suggestionsRoutes.suggestionsRoutes(app);

  const suggestionsExtractorsRoutes = await import('./suggestions/extractorsRoutes');
  suggestionsExtractorsRoutes.extractorsRoutes(app);

  const preserveRoutes = await import('./preserve/routes');
  preserveRoutes.PreserveRoutes(app);

  const relationshipsV2Routes = await import('./relationships.v2/routes/routes');
  relationshipsV2Routes.default(app);

  const statsRoutes = await import('./stats/routes');
  statsRoutes.default(app);

  const testingErrorsRoutes = await import('./testing_errors/routes');
  testingErrorsRoutes.default(app);

  const paragraphExtractionRoutes = await import('./paragraphExtraction/adapters/PXRoutes');
  paragraphExtractionRoutes.paragraphExtractionRoutes(app);

  const csvV2Routes = await import('./csv.v2/infrastructure/http/routes');
  csvV2Routes.csvImportRoutes(app);
};
