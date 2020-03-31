/// <reference types="cypress" />

describe('Actions:', () => {
  var ses_cookie = { value: ''}
  var locale_cookie = { value: 'en'}
  var con_cookie = { value: ''}

  beforeEach(() => {
    cy.setCookie('io', ses_cookie.value, {'httpOnly': true, 'path': '/', 'secure': false})
    cy.setCookie('locale', locale_cookie.value, {'httpOnly': true, 'path': '/', 'secure': false})
    cy.setCookie('connect.sid', con_cookie.value, {'httpOnly': true, 'path': '/', 'secure': false})
  });

  it('Should login as admin', () => {
    cy.visit('http://localhost:3000');
    cy.contains('Sign in').click();
    cy.get('#username').type('admin');
    cy.get('#password').type('admin');
    cy.contains('Login').click();
    cy.contains('Account settings').should('be.visible');
    cy.getCookie('io').then((cookie) => { ses_cookie = cookie });
    cy.getCookie('connect.sid').then((cookie) => { con_cookie = cookie });
  });

  it('Should not redirect to login when reloading an authorized route', async () => {
    cy.visit('http://localhost:3000/settings/account');
    cy.contains('Account settings').should('be.visible');
  });
});
