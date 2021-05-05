export const contents = `<h1>My entity view</h1>
<p className="custom-title"><Value path="entityRaw.title" /></p>

<Repeat path="entityRaw.metadata.pa_s">
  <li className="custom-list">
    <Value path="label" />
  </li>
</Repeat>

<p id="entity-sharedId"></p>

<p className="raw-creation-date"><Value path="entityRaw.creationDate" /></p>;

<h4 className="envio-title"><Value path="template.properties.4.label" /></p></h4>
<p className="envio-content"><Value path="entity.metadata.env_o_a_la_corte.value.0.value" /></p>

<h4 className="descripcion-title"><Value path="entity.metadata.resumen.label" /></p></h4>
<p className="descripcion-content"><Value path="entity.metadata.resumen.value" /></p>;

<h4 className="descriptores-title"><Value path="entity.metadata.descriptores.label" /></p></h4>
<p className="descriptores-content"><Value path="entity.metadata.descriptores.value.0.value" /></p>

<p id="entity-datasets-value"><p>`;

export const script = `var currentEntitySharedId = window.store.getState().page.datasets.getIn(['entity', 'sharedId']);
document.getElementById('entity-sharedId').innerHTML = currentEntitySharedId;
document.getElementById('entity-datasets-value').innerHTML = datasets.entity.documentType;`;
