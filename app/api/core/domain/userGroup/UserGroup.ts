class UserGroup {
  readonly id: string;

  name: string;

  memberIds: string[];

  constructor(id: string, name: string, memberIds: string[] = []) {
    this.id = id;
    this.name = name;
    this.memberIds = memberIds;
  }
}

export { UserGroup };
