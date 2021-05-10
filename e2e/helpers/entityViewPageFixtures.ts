export const contents = `<h1>My entity view</h1>
<p><Value path="currentEntity.title" /></p>
<br />

<Repeat path="currentEntity.metadata.mecanismo">
  <li>
    <Value path="label" />
  </li>
</Repeat>
<br />`;
