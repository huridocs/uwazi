import React from 'react';
import { PageEmbedView } from '#app/Pages/PageEmbedView.js';

const PageEmbedRoute = () => <PageEmbedView />;

Object.assign(PageEmbedRoute, {
  requestState: PageEmbedView.requestState,
});

export { PageEmbedRoute };
