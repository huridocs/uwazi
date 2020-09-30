export const methods = {
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE',
  migrate: 'MIGRATE',
  post: 'CREATE',
};

class ActivityLogEntry {
  constructor(builder) {
    this.description = builder.description;
    if (builder.name) this.name = builder.name;
    if (builder.extra) this.extra = builder.extra;
    this.action = builder.action || methods.update;
    this.beautified = builder.beautified;
  }
}

export class ActivityLogBuilder {
  constructor(data, entryValue) {
    this.description = entryValue.desc;
    this.data = data;
    this.action = entryValue.method ? entryValue.method : methods.update;
    this.beautified = true;
    this.entryValue = entryValue;
  }

  async loadRelated() {
    if (this.entryValue.related) {
      this.data = await this.entryValue.related(this.data);
    }
  }

  makeExtra() {
    if (this.entryValue.extra) {
      this.extra = this.entryValue.extra(this.data);
    }
  }

  makeName() {
    if (this.entryValue.nameFunc) {
      this.name = this.entryValue.nameFunc(this.data);
    } else if (this.entryValue.id) {
      this.name = this.getNameWithId();
    } else if (this.entryValue.nameField) {
      this.name = this.data[this.entryValue.nameField] || this.data.name;
    }
  }

  getNameWithId() {
    const nameField = this.entryValue.nameField || 'name';
    const name = this.data[nameField];
    return name ? `${name} (${this.entryValue.id})` : `${this.entryValue.id}`;
  }

  build() {
    return new ActivityLogEntry(this);
  }
}

const changeToUpdate = entryValue => {
  const updatedEntry = { ...entryValue, method: methods.update };
  updatedEntry.desc = updatedEntry.desc.replace('Created', 'Updated');
  return updatedEntry;
};

function checkForUpdate(body, entryValue) {
  const content = JSON.parse(body);
  const id = entryValue.idField ? content[entryValue.idField] : null;
  let activityInput = { ...entryValue };
  if (id && entryValue.method !== methods.delete) {
    activityInput = changeToUpdate(entryValue);
    activityInput.id = id;
  }
  return activityInput;
}

const getActivityInput = (entryValue, body) => {
  const idPost = entryValue.idField && body;
  return idPost ? checkForUpdate(body, entryValue) : entryValue;
};

export const buildActivityEntry = async (entryValue, data) => {
  const body = data.body || data.query;
  const activityInput = getActivityInput(entryValue, body);
  const activityEntryBuilder = new ActivityLogBuilder(JSON.parse(body), activityInput);
  await activityEntryBuilder.loadRelated();
  activityEntryBuilder.makeName();
  activityEntryBuilder.makeExtra();
  return activityEntryBuilder.build();
};
