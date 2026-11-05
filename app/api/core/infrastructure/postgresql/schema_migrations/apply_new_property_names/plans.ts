import { nextName, PropertyDoc } from './names.js';

type Pair = { from: string; to: string };

type TemplateDoc = {
  _id: string;
  properties?: PropertyDoc[];
  commonProperties?: PropertyDoc[];
};

type TemplatePlan = {
  template: TemplateDoc;
  pairs: Pair[];
};

const finalName = (property: PropertyDoc): string | undefined => {
  if (!property.name) return undefined;
  return nextName(property) ?? property.name;
};

const assertNoCollision = (template: TemplateDoc): void => {
  const seen = new Set(
    (template.commonProperties ?? []).map(property => property.name).filter(Boolean)
  );
  (template.properties ?? []).forEach(property => {
    const name = finalName(property);
    if (!name) return;
    if (seen.has(name)) {
      throw new Error(`colliding property name "${name}"`);
    }
    seen.add(name);
  });
};

const pairsOf = (template: TemplateDoc): Pair[] =>
  (template.properties ?? []).flatMap(property => {
    const to = nextName(property);
    if (!to || !property.name) return [];
    return [{ from: property.name, to }];
  });

const planTemplates = (templates: TemplateDoc[]): TemplatePlan[] =>
  templates.map(template => {
    assertNoCollision(template);
    return { template, pairs: pairsOf(template).sort((a, b) => a.from.localeCompare(b.from)) };
  });

const idOf = (id: unknown): string => String(id);

const finalForStoredName = (properties: PropertyDoc[], stored: string): string | undefined => {
  const property = properties.find(item => item.name === stored);
  if (!property?.name) return undefined;
  return nextName(property) ?? property.name;
};

const agreedName = (templates: TemplateDoc[], stored: string): string => {
  const finals = templates
    .map(template => finalForStoredName(template.properties ?? [], stored))
    .filter((name): name is string => name !== undefined);
  const unique = new Set(finals);
  if (unique.size > 1) {
    throw new Error(`extractor property "${stored}" renames differently across templates`);
  }
  return finals[0] ?? stored;
};

const templatesForExtractor = (plans: TemplatePlan[], templateIds: unknown[]): TemplateDoc[] => {
  const wanted = new Set(templateIds.map(idOf));
  return plans.map(plan => plan.template).filter(template => wanted.has(idOf(template._id)));
};

const textPairs = (plans: TemplatePlan[]): Pair[] => {
  const byFrom = new Map<string, Set<string>>();
  plans
    .flatMap(plan => plan.pairs)
    .forEach(pair => {
      const destinations = byFrom.get(pair.from) ?? new Set<string>();
      destinations.add(pair.to);
      byFrom.set(pair.from, destinations);
    });
  return [...byFrom.entries()].flatMap(([from, destinations]) => {
    const [to] = destinations;
    if (destinations.size !== 1 || !to) return [];
    return [{ from, to }];
  });
};

const renamedSomething = (plans: TemplatePlan[]): boolean =>
  plans.some(plan => plan.pairs.length > 0);

export type { Pair, TemplateDoc, TemplatePlan };
export { agreedName, planTemplates, renamedSomething, templatesForExtractor, textPairs };
