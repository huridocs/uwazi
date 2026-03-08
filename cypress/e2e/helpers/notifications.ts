/**
 * Opens the status dot panel and clicks "Clear" to dismiss all notifications,
 * then closes the panel. Use this in place of the old `Dismiss` button pattern.
 */
const clearNotifications = () => {
  cy.get('[data-testid="status-dot"]').click();
  cy.get('[data-testid="notifications-panel"]').within(() => {
    cy.contains('button', 'Clear').click();
  });
  // Close the panel by clicking the X
  cy.get('[data-testid="close-sidepanel"]').click();
};

/**
 * Opens the status dot panel and asserts that it contains the given text.
 */
const expectNotification = (text: string) => {
  cy.get('[data-testid="status-dot"]').click();
  cy.get('[data-testid="notifications-panel"]').should('contain', text);
  cy.get('[data-testid="close-sidepanel"]').click();
};

export { clearNotifications, expectNotification };
