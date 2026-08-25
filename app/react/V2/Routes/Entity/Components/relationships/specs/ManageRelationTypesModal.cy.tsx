/* eslint-disable react/no-multi-comp */
import React, { useEffect } from 'react';
import { mount } from 'cypress/react';
import { useAtomValue } from 'jotai';
import type { ClientUserSchema } from '#app/apiResponseTypes.js';
import { RelationshipsStoryShell } from '#app/stories/EntityViewer/relationshipsStoryShell.js';
import { templates } from '#app/stories/fixtures/referencesFixtures.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { requestStatusAtom } from '#V2/atoms/requestStatusAtom.js';
import { useRelationshipsActions } from '#V2/Routes/Entity/Components/context/index.js';
import {
  ManageRelationTypesModal,
  RelationshipsActionBar,
} from '#V2/Routes/Entity/Components/relationships/index.js';

const RELATED_TO_ID = '6a0c5d0784b3eaec97612923';
const MENTIONS_ID = '6a0c5d0084b3eaec97612911';

const adminUser: ClientUserSchema = {
  _id: '1',
  role: 'admin',
  username: 'admin',
  email: 'admin@example.com',
};

const editorUser: ClientUserSchema = {
  _id: '2',
  role: 'editor',
  username: 'editor',
  email: 'editor@example.com',
};

const templatesWithMentionsInUse: ClientTemplateSchema[] = templates.map(template =>
  template._id === 'template1'
    ? {
        ...template,
        properties: [
          {
            _id: 'property1',
            name: 'related',
            label: 'Related',
            type: 'relationship',
            relationType: MENTIONS_ID,
          },
        ],
      }
    : template
);

const OpenManageOnMount = () => {
  const { openManageRelationTypes } = useRelationshipsActions();
  useEffect(() => {
    openManageRelationTypes();
  }, [openManageRelationTypes]);
  return null;
};

const NotificationsProbe = () => {
  const { notifications } = useAtomValue(requestStatusAtom);
  return (
    <div data-testid="cy-notifications">
      {notifications.map(notification => (
        <div key={notification.id} data-testid={`notification-${notification.type}`}>
          {notification.title}
        </div>
      ))}
    </div>
  );
};

const interceptCounts = (counts: { [id: string]: number } = {}) => {
  cy.intercept('GET', '**/references/count_by_relationtype*', req => {
    const id = new URL(req.url).searchParams.get('relationtypeId') ?? '';
    const count = counts[id];
    if (count === undefined) {
      req.reply({ statusCode: 500, body: {} });
      return;
    }
    req.reply({ statusCode: 200, body: { value: count } });
  }).as('countRefs');
};

const interceptCreateType = () => {
  cy.intercept('POST', '**/relationtypes*', req => {
    let name = 'Custom';
    const { body } = req;
    if (typeof body === 'string') {
      const parsed: unknown = JSON.parse(body);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'name' in parsed &&
        typeof parsed.name === 'string'
      ) {
        name = parsed.name;
      }
    } else if (
      typeof body === 'object' &&
      body !== null &&
      'name' in body &&
      typeof body.name === 'string'
    ) {
      name = body.name;
    }
    req.reply({ statusCode: 200, body: { _id: `id-${name}`, name } });
  }).as('createType');
};

const mountManageModal = ({
  relationshipTypes,
  storyTemplates,
  user = adminUser,
  withActionBar = false,
}: {
  relationshipTypes?: { _id: string; name: string }[];
  storyTemplates?: ClientTemplateSchema[];
  user?: ClientUserSchema;
  withActionBar?: boolean;
} = {}) =>
  mount(
    <RelationshipsStoryShell
      locale="en"
      relationshipTypes={relationshipTypes}
      storyTemplates={storyTemplates}
      user={user}
    >
      <>
        {withActionBar ? <RelationshipsActionBar /> : <OpenManageOnMount />}
        <ManageRelationTypesModal />
        <NotificationsProbe />
      </>
    </RelationshipsStoryShell>
  );

describe('Manage relationship types dialog', () => {
  beforeEach(() => {
    interceptCounts({ [RELATED_TO_ID]: 0, [MENTIONS_ID]: 0 });
    interceptCreateType();
    cy.intercept('DELETE', '**/relationtypes*', { statusCode: 200, body: {} }).as('deleteType');
  });

  it('opens from the action bar', () => {
    mountManageModal({ withActionBar: true });
    cy.contains('button', 'Edit').click();
    cy.contains('button', 'Manage types').click();
    cy.get('[role="dialog"][aria-label="Manage relationship types"]').should('be.visible');
  });

  it('hides manage types from editors', () => {
    mountManageModal({ withActionBar: true, user: editorUser });
    cy.contains('button', 'Edit').click();
    cy.contains('button', 'Manage types').should('not.exist');
    cy.contains('a', 'Manage types').should('not.exist');
  });

  it('lists types, shows In use, and disables delete when a template uses the type', () => {
    interceptCounts({ [RELATED_TO_ID]: 0, [MENTIONS_ID]: 0 });
    mountManageModal({ storyTemplates: templatesWithMentionsInUse });

    cy.contains('related to').should('be.visible');
    cy.contains('mentions').should('be.visible');
    cy.contains('In use').should('be.visible');
    cy.get('[aria-label="Delete mentions"]').should('be.disabled');
    cy.get('[aria-label="Delete related to"]').should('not.be.disabled');
    cy.contains('0 refs').should('be.visible');
  });

  it('shows N refs and disables delete when the type is used in references', () => {
    interceptCounts({ [RELATED_TO_ID]: 3, [MENTIONS_ID]: 0 });
    mountManageModal();

    cy.contains('3 refs').should('be.visible');
    cy.get('[aria-label="Delete related to"]').should('be.disabled');
    cy.get('[aria-label="Delete mentions"]').should('not.be.disabled');
    cy.contains('In use').should('not.exist');
  });

  it('omits ref count and keeps trash enabled when the count request fails', () => {
    interceptCounts({});
    mountManageModal({
      relationshipTypes: [{ _id: RELATED_TO_ID, name: 'related to' }],
    });

    cy.contains('related to').should('be.visible');
    cy.contains(/\d+\s+refs?/).should('not.exist');
    cy.get('[aria-label="Delete related to"]').should('not.be.disabled');
  });

  it('shows empty copy and adds a type', () => {
    mountManageModal({ relationshipTypes: [] });

    cy.contains('No relationship types').should('be.visible');
    cy.contains('Add a type below.').should('be.visible');
    cy.contains('button', 'Add').should('be.disabled');

    cy.get('input[placeholder="New relation type label…"]').type('Custom');
    cy.contains('button', 'Add').click();
    cy.wait('@createType');
    cy.contains('Custom').should('be.visible');
    cy.get('[data-testid="notification-success"]').should(
      'contain',
      'Added relation type "Custom"'
    );
    cy.get('input[placeholder="New relation type label…"]').should('have.value', '');
  });

  it('adds a type from the Enter key and shows duplicate copy', () => {
    mountManageModal({
      relationshipTypes: [{ _id: RELATED_TO_ID, name: 'related to' }],
    });

    cy.get('input[placeholder="New relation type label…"]').type('related to');
    cy.contains('button', 'Add').click();
    cy.contains('Already exists').should('be.visible');

    cy.get('input[placeholder="New relation type label…"]').clear();
    cy.get('input[placeholder="New relation type label…"]').type('Cited{enter}');
    cy.wait('@createType');
    cy.contains('Cited').should('be.visible');
  });

  it('confirms delete inline and can cancel', () => {
    mountManageModal({
      relationshipTypes: [{ _id: RELATED_TO_ID, name: 'related to' }],
    });

    cy.get('[aria-label="Delete related to"]').click();
    cy.get('[aria-label="Cancel deleting related to"]').should('be.visible');
    cy.get('[aria-label="Cancel deleting related to"]').click();
    cy.get('[aria-label="Cancel deleting related to"]').should('not.exist');

    cy.get('[aria-label="Delete related to"]').click();
    cy.get('[aria-label="Delete related to"]').click();
    cy.wait('@deleteType');
    cy.get('[aria-label="Delete related to"]').should('not.exist');
  });

  it('does not open confirm when delete is disabled', () => {
    mountManageModal({ storyTemplates: templatesWithMentionsInUse });

    cy.get('[aria-label="Delete mentions"]').click({ force: true });
    cy.get('[aria-label="Cancel deleting mentions"]').should('not.exist');
  });

  it('keeps the type when delete is rejected', () => {
    cy.intercept('DELETE', '**/relationtypes*', {
      statusCode: 400,
      body: { message: 'Cannot delete type used in relationships' },
    }).as('deleteType');
    mountManageModal({
      relationshipTypes: [{ _id: RELATED_TO_ID, name: 'related to' }],
    });

    cy.get('[aria-label="Delete related to"]').click();
    cy.get('[aria-label="Delete related to"]').click();
    cy.wait('@deleteType');
    cy.get('[data-testid="notification-error"]').should(
      'contain',
      'Cannot delete type used in relationships'
    );
    cy.contains('related to').should('be.visible');
  });

  it('closes from the dialog header', () => {
    mountManageModal();
    cy.get('[aria-label="Close modal"]').click();
    cy.get('[role="dialog"][aria-label="Manage relationship types"]').should('not.exist');
  });
});
