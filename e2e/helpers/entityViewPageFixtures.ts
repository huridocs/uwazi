export const contents = `<h1>My entity view</h1>
<p className="custom-title"><Value path="entityRaw.title" /></p>

<Repeat path="entityRaw.metadata.pa_s">
  <li className="custom-list">
    <Value path="label" />
  </li>
</Repeat>

<p className="raw-creation-date"><Value path="entityRaw.creationDate" /></p>;

<h4 className="envio-title"><Value path="template.properties.4.label" /></p></h4>
<p className="envio-content"><Value path="entity.metadata.4.value.0.value" /></p>

<h4 className="descripcion-title"><Value path="template.properties.0.label" /></p></h4>
<p className="descripcion-content"><Value path="entity.metadata.0.value" /></p>`;
