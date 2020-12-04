import entities from 'api/entities/entities';

export const entitiesPermissions = {
  setEntitiesPermissions: async (permissionsData: any) => {
    await entities.multipleUpdate(
      permissionsData.ids,
      {
        permissions: permissionsData.permissions,
      },
      { language: 'en' }
    );
  },
};
