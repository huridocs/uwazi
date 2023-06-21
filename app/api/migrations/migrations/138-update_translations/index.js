const newKeys = [
  { key: 'Users & Groups' },
  { key: 'Nothing selected' },
  { key: 'Edit group' },
  { key: 'Group Options' },
  { key: 'Password + 2fa' },
  { key: 'Edit user' },
  { key: 'General Information' },
  { key: 'User Role' },
  { key: 'Security' },
  { key: 'Unlock account' },
  { key: 'Instruction to reset password sent to user' },
  { key: 'Group saved' },
  { key: 'User Action' },
  { key: 'New user' },
  { key: 'Usernames cannot have spaces' },
  { key: 'Account locked' },
];

const deletedKeys = [
  { key: 'Invalid email' },
  { key: 'Name of the group' },
  { key: 'Add users' },
  { key: 'Created successfully.' },
  { key: 'Group deleted' },
  { key: 'Group created' },
  { key: 'Permissions by role' },
];
const updateTranslation = (currentTranslation, keysToUpdate, loc) => {
  const translation = { ...currentTranslation };
  const newTranslation = keysToUpdate.find(row => row.key === currentTranslation.key);
  if (newTranslation) {
    translation.key = newTranslation.newKey;
    if (loc === 'en' || currentTranslation.value === newTranslation.oldValue) {
      translation.value = newTranslation.newValue;
    }
  }
  return translation;
};

export default {
  delta: 138,

  reindex: false,

  name: 'update_translations',

  description: 'Updates some translations for new User/Groups UI in settings',

  async up(db) {
    const keysToInsert = newKeys;
    const keysToDelete = deletedKeys;
    const translations = await db.collection('translations').find().toArray();
    const locToSystemContext = {};
    translations.forEach(tr => {
      locToSystemContext[tr.locale] = tr.contexts.find(c => c.id === 'System');
    });

    const alreadyInDB = [];
    Object.entries(locToSystemContext).forEach(([loc, context]) => {
      const contextValues = context.values.reduce((newValues, currentTranslation) => {
        const deleted = keysToDelete.find(
          deletedTranslation => deletedTranslation.key === currentTranslation.key
        );
        if (!deleted) {
          const translation = updateTranslation(currentTranslation, [], loc);
          newValues.push(translation);
        }
        keysToInsert.forEach(newEntry => {
          if (newEntry.key === currentTranslation.key) {
            alreadyInDB.push(currentTranslation.key);
          }
        });
        return newValues;
      }, []);
      keysToInsert
        .filter(k => !alreadyInDB.includes(k.key))
        .forEach(newEntry => {
          contextValues.push({ key: newEntry.key, value: newEntry.key });
        });
      context.values = contextValues;
    });

    await Promise.all(
      translations.map(tr => db.collection('translations').replaceOne({ _id: tr._id }, tr))
    );

    process.stdout.write(`${this.name}...\r\n`);
  },
};
