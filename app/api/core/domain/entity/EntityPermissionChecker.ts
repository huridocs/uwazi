/* eslint-disable max-classes-per-file */
import { User } from 'api/users.v2/model/User';
import { ResultType } from 'api/core/libs/Result';
import { AccessLevel } from './AccessLevel';
import { PermissionType } from './PermissionType';
import { BaseFile } from '../files/BaseFile';

type SpecificationProps = {
  type: PermissionType;
  level: AccessLevel;
  actor: User;
};

class Specification {
  type: PermissionType;

  level: AccessLevel;

  actor: User;

  constructor(props: SpecificationProps) {
    this.type = props.type;
    this.level = props.level;
    this.actor = props.actor;
  }

  get isPrivileged() {
    return this.actor.isPrivileged();
  }

  get isWriteLevel() {
    return this.level === AccessLevel.Write;
  }

  isSatisfiedBy(level: AccessLevel) {
    return this.level === level;
  }

  static createDeleteSpecification(actor: User) {
    return new Specification({ type: PermissionType.User, level: AccessLevel.Write, actor });
  }
}

interface EntityPermissionChecker {
  filterEntities(
    sharedIds: string[],
    specification: Specification
  ): Promise<ResultType<string[], Error>>;
  checkReadPermission(sharedId: string, user?: User): Promise<ResultType<boolean, Error>>;
  checkWritePermission(file: BaseFile, user?: User): Promise<ResultType<boolean, Error>>;
}

export { Specification };
export type { EntityPermissionChecker };
