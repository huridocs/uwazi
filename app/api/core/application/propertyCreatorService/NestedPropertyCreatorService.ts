import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource'; // Todo
import { Context, Property } from '../../domain/template/Property';
import { NestedPropertyNotAvailableError } from '../../domain/template/errors';
import { NestedPropertyProps, NestedProperty } from '../../domain/template/NestedProperty';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService';

type Deps = {
  settingsDS: SettingsDataSource;
};

type Props = NestedPropertyProps;

class NestedPropertyCreatorService extends AbstractPropertyCreatorService<Deps> {
  protected async createProperty(props: Props, context: Context): Promise<Property> {
    const settings = await this.deps.settingsDS.get();

    if (settings.project !== 'cejil') {
      throw new NestedPropertyNotAvailableError(props);
    }

    const property = new NestedProperty(props, context);

    return property;
  }
}

export { NestedPropertyCreatorService };
