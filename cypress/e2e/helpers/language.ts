const changeLanguage = (selectedLanguage: string) => {
  cy.get('.menuNav-language > .dropdown').click();
  cy.contains('.dropdown-menu > li.menuNav-item > a', selectedLanguage).click();
};

export { changeLanguage };
