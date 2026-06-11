const log = (step: string, details?: Record<string, unknown>) => {
  if (details) {
    // eslint-disable-next-line no-console
    console.log('[aiAssistant]', step, details);
    return;
  }
  // eslint-disable-next-line no-console
  console.log('[aiAssistant]', step);
};

export { log as aiAssistantLog };
