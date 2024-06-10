enum Methods {
  Create = 'CREATE',
  Update = 'UPDATE',
  Delete = 'DELETE',
  Migrate = 'MIGRATE',
}

const buildActivityLogEntry = (builder: ActivityLogBuilder) => ({
  description: builder.description,
  action: builder.action || Methods.Update,
  ...(builder.name && { name: builder.name }),
  ...(builder.extra && { extra: builder.extra }),
});

interface EntryValue {
  idField?: string;
  nameField?: string;
  id?: any;
  nameFunc?: (data: LogActivity) => string;
  extra?: (data: any) => any;
  related?: (data: LogActivity) => LogActivity;
  method?: Methods;
  desc: string;
}

interface LogActivity {
  name?: string;
  [k: string]: any | undefined;
}

class ActivityLogBuilder {
  description: string;

  action: Methods;

  extra?: {};

  name?: string;

  private data: LogActivity;

  private entryValue: EntryValue;

  constructor(data: LogActivity, entryValue: EntryValue) {
    this.description = entryValue.desc;
    this.data = data;
    this.action = entryValue.method ? entryValue.method : Methods.Update;
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
    return buildActivityLogEntry(this);
  }
}

const changeToUpdate = (entryValue: EntryValue): EntryValue => {
  const updatedEntry = { ...entryValue, method: Methods.Update };
  updatedEntry.desc = updatedEntry.desc.replace('Created', 'Updated');
  return updatedEntry;
};

function checkForUpdate(body: any, entryValue: EntryValue) {
  const content = JSON.parse(body);
  const json = content.entity ? JSON.parse(content.entity) : content;
  const id = entryValue.idField ? json[entryValue.idField] : null;
  let activityInput = { ...entryValue };
  if (id && entryValue.method !== Methods.Delete) {
    activityInput = changeToUpdate(entryValue);
    activityInput.id = id;
  }
  return activityInput;
}

const getActivityInput = (entryValue: EntryValue, body: any) => {
  const idPost = entryValue.idField && body;
  return idPost ? checkForUpdate(body, entryValue) : entryValue;
};

const buildActivityEntry = async (entryValue: EntryValue, data: any) => {
  const body = data.body && data.body !== '{}' ? data.body : data.query || '{}';
  const activityInput = getActivityInput(entryValue, body);
  const activityEntryBuilder = new ActivityLogBuilder(JSON.parse(body), activityInput);
  await activityEntryBuilder.loadRelated();
  activityEntryBuilder.makeName();
  activityEntryBuilder.makeExtra();
  return activityEntryBuilder.build();
};

export type { ActivityLogBuilder, EntryValue, LogActivity };
export { Methods, buildActivityEntry };
