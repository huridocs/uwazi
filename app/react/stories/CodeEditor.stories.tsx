import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CodeEditor, CodeEditorProps, CodeEditorInstance } from 'V2/Components/CodeEditor';

const sampleJS = `const myButton = document.getElementById('myButton');
myButton.addEventListener('click', function () {
  myButton.textContent = 'Clicked!';
  const newParagraph = document.createElement('p');
  newParagraph.textContent = 'Hello, this is a new paragraph!';
  document.body.appendChild(newParagraph);
  document.body.style.backgroundColor = '#f0f0f0';
  const colors = ['#ff0000', '#00ff00', '#0000ff'];
  myButton.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  console.log('Button clicked!');
});

const numbers = [1, 2, 3, 4, 5];
const doubledNumbers = numbers.map(number => number * 2);
console.log('Doubled numbers:', doubledNumbers);

function addNumbers(a, b) {
  return a + b;
}
console.log('Sum of 3 and 7:', addNumbers(3, 7));

const person = { name: 'John Doe', age: 30, occupation: 'Developer' };
console.log('Person:', person);

const { name, age } = person;
console.log('Name:', name, 'Age:', age);`;

const sampleHTML = `<h1>Main Heading</h1>
<p>Subtitle or tagline goes here</p>

<nav>
  <ul>
    <li><a href="#section1">Section 1</a></li>
    <li><a href="#section2">Section 2</a></li>
    <li><a href="#section3">Section 3</a></li>
  </ul>
</nav>

<article id="section1">
  <h2>Section 1</h2>
  <p>This is the first article section.</p>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod
    consectetur metus, ac volutpat libero hendrerit ac.
  </p>
</article>

<article id="section2">
  <h2>Section 2</h2>
  <p>This is the second article section.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
</article>

<article id="section3">
  <h2>Section 3</h2>
  <p>This is the third article section.</p>
  <blockquote>
    <p>“The only way to do great work is to love what you do.” - Steve Jobs</p>
  </blockquote>
</article>

<footer>
  <p>&copy; 2024 Example Company. All rights reserved.</p>
</footer>`;

const meta: Meta<typeof CodeEditor> = {
  title: 'Components/CodeEditor',
  component: CodeEditor,
};

type Story = StoryObj<typeof CodeEditor>;

const Component = ({ language, code }: CodeEditorProps) => {
  const editorInstance = useRef<CodeEditorInstance>();
  const [updatedCode, setUpdatedCode] = useState<string>();

  const handleClick = () => {
    setUpdatedCode(editorInstance.current?.getValue());
  };

  return (
    <div className="tw-content">
      <div className="overflow-y-auto w-full h-96">
        <CodeEditor
          language={language}
          code={code}
          getEditor={editor => {
            editorInstance.current = editor;
          }}
        />
      </div>
      <div className="w-full">
        <button
          type="button"
          onClick={handleClick}
          className="p-2 text-white rounded border bg-primary-700"
        >
          Save
        </button>
      </div>
      <pre className="mt-2 w-full">{updatedCode}</pre>
    </div>
  );
};

const Primary: Story = {
  render: args => <Component language={args.language} code={args.code} />,
};

const JSEditor: Story = {
  ...Primary,
  args: {
    language: 'javascript',
    code: sampleJS,
  },
};

const HTMLEditor: Story = {
  ...Primary,
  args: {
    language: 'html',
    code: sampleHTML,
  },
};

export { JSEditor, HTMLEditor };
export default meta;
