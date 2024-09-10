import { ATConfigDataSource } from './contracts/ATConfigDataSource';
import { ATConfigValidator } from './contracts/ATConfigValidator';
import { InvalidInputDataFormat } from './errors/generateATErrors';
import { TranslationResult } from './types/TranslationResult';

export class SaveEntityTranslations {
  private atuomaticTranslationConfigDS: ATConfigDataSource;

  private validator: ATConfigValidator;

  constructor(atuomaticTranslationConfigDS: ATConfigDataSource, validator: ATConfigValidator) {
    this.atuomaticTranslationConfigDS = atuomaticTranslationConfigDS;
    this.validator = validator;
  }

  async execute(translationResult: TranslationResult | unknown) {
    if (!this.validator.validate(translationResult)) {
      throw new InvalidInputDataFormat(this.validator.getErrors()[0]);
    }

    // entities.save() esto que vaya en un wrapper (interfaz)
    // Parsear el result [key] para saber tenant/entity/property
    // para cada idioma modificar el texto con un prepend [AI Translated]
    // Guardar este texto en la entidad correspondiente
  }
}
