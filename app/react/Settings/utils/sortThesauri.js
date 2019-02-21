export default function sortThesauri(list) {
  list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  return list;
}
