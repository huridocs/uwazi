export default async (app, server) => {
  // Load TypeScript modules dynamically
  const [
    { default: activitylogMiddleware },
    { default: CSRFMiddleware },
    { default: languageMiddleware },
  ] = await Promise.all([
    import('./activitylog/activitylogMiddleware.js'),
    import('./auth/CSRFMiddleware.js'),
    import('./utils/languageMiddleware.js'),
  ]);

  //common middlewares
  app.use(CSRFMiddleware);
  app.use(languageMiddleware);
  app.use(activitylogMiddleware);

  const { setupApiSockets } = await import('./socketio/setupSockets.js');
  setupApiSockets(server, app);

  (await import('./auth2fa/routes.js')).default(app);
  (await import('./relationships/routes.js')).default(app);
  (await import('./activitylog/routes.js')).default(app);
  (await import('./users/routes.js')).default(app);
  (await import('./core/infrastructure/express/users/routes.js')).userRoutes(app);
  (await import('./core/infrastructure/express/template/routes.js')).default(app);
  (await import('./dataviz.v2/infrastructure/http/routes.js')).default(app);
  (await import('./search/deprecatedRoutes.js')).default(app);
  (await import('./search/routes.js')).default(app);
  (await import('./search.v2/routes.js')).searchRoutes(app);
  (await import('./thesauri/routes.js')).default(app);
  (await import('./relationtypes/routes.js')).default(app);
  (await import('./documents/deprecatedRoutes.js')).default(app);
  (await import('./documents/routes.js')).documentRoutes(app);
  (await import('./contact/routes.js')).default(app);
  (await import('./entities/routes.js')).default(app);
  (await import('./entities.v2/routes/index.js')).entitiesRoutes(app);
  (await import('./pages/routes.js')).default(app);
  (await import('./pages.v2/infrastructure/http/routes.js')).pagesV2Routes(app);
  (await import('./files/jsRoutes.js')).default(app);
  (await import('./files/routes.js')).default(app);
  (await import('./segmentation.v2/infrastructure/http/routes.js')).segmentationV2Routes(app);
  (await import('./files/exportRoutes.js')).default(app);
  (await import('./files/ocrRoutes.js')).ocrRoutes(app);
  (await import('./settings/routes.js')).default(app);
  (await import('./i18n/routes.js')).default(app);
  (await import('./i18n.v2/routes/index.js')).translationsRoutes(app);
  (await import('./sync/routes.js')).default(app);
  (await import('./tasks/routes.js')).default(app);
  (await import('./usergroups/routes.js')).default(app);
  (await import('./permissions/routes.js')).permissionRoutes(app);
  (await import('./suggestions/routes.js')).suggestionsRoutes(app);
  (await import('./suggestions/extractorsRoutes.js')).extractorsRoutes(app);
  (await import('./preserve/routes.js')).PreserveRoutes(app);
  (await import('./relationships.v2/routes/routes.js')).default(app);
  (await import('./stats/routes.js')).default(app);
  (await import('./testing_errors/routes.js')).default(app);
  (await import('./paragraphExtraction/adapters/PXRoutes.js')).paragraphExtractionRoutes(app);
  (await import('./csv.v2/infrastructure/http/routes.js')).csvImportRoutes(app);
  (await import('./customUploads/infrastructure/http/routes.js')).customUploadsRoutes(app);
  (await import('./aiAssistant/infrastructure/express/AIAssistantRoutes.js')).aiAssistantRoutes(
    app
  );
};
