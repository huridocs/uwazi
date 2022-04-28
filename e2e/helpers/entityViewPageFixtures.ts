const textWithDynamicValues =
  // eslint-disable-next-line no-template-curly-in-string
  '<p className="dynamic-values">Entidad: ${entity.title} con template: ${template.name} tiene estado ${entityRaw.metadata.estado[0].label}</p>';

export const contents = `<h1>My entity view</h1>
<p className="custom-title"><Value path="entityRaw.title" /></p>

<h4>Detalle</h4>
${textWithDynamicValues}

<Repeat path="entityRaw.metadata.pa_s">
  <li className="custom-list">
    <Value path="label" />
  </li>
</Repeat>

<p id="entity-sharedId"></p>

<p className="raw-creation-date"><Value path="entityRaw.creationDate" /></p>;

<h4 className="envio-title"><Value path="template.properties.4.label" /></h4>
<p className="envio-content"><Value path="entity.metadata.env_o_a_la_corte.value.0.value" /></p>

<h4 className="descripcion-title"><Value path="entity.metadata.resumen.label" /></h4>
<p className="descripcion-content"><Value path="entity.metadata.resumen.value" /></p>;

<h4 className="descriptores-title"><Value path="entity.metadata.descriptores.label" /></h4>
<p className="descriptores-content"><Value path="entity.metadata.descriptores.value.0.value" /></p>

<h4 className="EntityData-label"><EntityData label-of="title" /></h4>
<p className="EntityData-title"><EntityData value-of="title" /></p>

<p id="entity-datasets-value"><p>`;

export const script = `var currentEntitySharedId = window.store.getState().page.datasets.getIn(['entity', 'sharedId']);
document.getElementById('entity-sharedId').innerHTML = currentEntitySharedId;
document.getElementById('entity-datasets-value').innerHTML = datasets.entity.documentType;`;
