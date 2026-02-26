const templateColors = [
  '#C03B22',
  '#628ccf',
  '#ff8282',
  '#ff8a4c',
  '#faca15',
  '#16bdca',
  '#31c48d',
  '#9eb0fd',
  '#f17eb8',
  '#ac94fa',
  '#9ca3af',
  '#2b8a3e',
  '#ffb86b',
  '#6a5acd',
  '#00b894',
];

const getRandomColor = (): string =>
  templateColors[Math.floor(Math.random() * templateColors.length)];

export { templateColors, getRandomColor };
