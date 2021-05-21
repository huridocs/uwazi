export const contents = `<h1>My entity view</h1>
<p className="custom-title"><Value path="entityRaw.title" /></p>
<br />

<Repeat path="entityRaw.metadata.pa_s">
  <li className="custom-list">
    <Value path="label" />
  </li>
</Repeat>
<br />`;
