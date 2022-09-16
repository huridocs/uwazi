export interface IdGenerator<TypeInApp, TypeInDb> {
  generate: () => TypeInApp;
  mapToDb: (id: TypeInApp) => TypeInDb;
  mapToApp: (id: TypeInDb) => TypeInApp;
}
