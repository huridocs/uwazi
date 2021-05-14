export const contents = `<h1>My entity view</h1>
<p className="custom-title"><Value path="currentEntity.title" /></p>
<br />

<Repeat path="currentEntity.metadata.pa_s">
  <li className="custom-list">
    <Value path="label" />
  </li>
</Repeat>
<br />`;
