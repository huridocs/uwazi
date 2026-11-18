// Browser builds resolve `#api-client/server` here, so server code never reaches a client bundle.
throw new Error('#api-client/server is server-only');

export {};
