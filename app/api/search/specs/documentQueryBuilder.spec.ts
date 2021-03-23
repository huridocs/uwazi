import { AccessLevels } from 'shared/types/permissionSchema';
import documentQueryBuilder from 'api/search/documentQueryBuilder';
import { UserRole } from 'shared/types/userSchema';
import { permissionsContext } from 'api/permissions/permissionsContext';

describe('documentQueryBuilder', () => {
  describe('filterByPermissions', () => {
    describe('when there is not a logged user', () => {
      it('should only return public entities', () => {
        jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue(undefined);
        const query = documentQueryBuilder()
          .filterByPermissions()
          .query();
        expect(query.query.bool.filter).toEqual([{ term: { published: true } }]);
      });
    });

    describe('when the user has editor permissions', () => {
      it('should return all matched entities without considering permissions filters', () => {
        jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue({
          _id: 'user1',
          role: UserRole.EDITOR,
          username: 'user1',
          email: '',
          groups: [],
        });
        const query = documentQueryBuilder()
          .filterByPermissions()
          .query();
        expect(query.query.bool.filter).toEqual([{ term: { published: true } }]);
      });
    });

    describe('when has user has a collaborator role', () => {
      describe('when user has permission on the entities', () => {
        it.each([AccessLevels.READ, AccessLevels.WRITE])(
          'should only return entities shared with her or her groups',
          () => {
            jest.spyOn(permissionsContext, 'getUserInContext').mockReturnValue({
              _id: 'user1',
              role: UserRole.COLLABORATOR,
              username: 'User 1',
              email: '',
              groups: [
                { _id: 'group1', name: 'Group 1' },
                { _id: 'group2', name: 'Group 2' },
              ],
            });
            const query = documentQueryBuilder()
              .filterByPermissions()
              .query();
            expect(query.query.bool.filter).toEqual([
              {
                term: { published: true },
              },
              {
                terms: { 'permissions.refId': ['group1', 'group2', 'user1'] },
              },
            ]);
          }
        );
      });
    });
  });
});
