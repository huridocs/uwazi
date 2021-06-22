// import templates from './templates';

export async function checkIfReindex(updatedTemplate) {
  if (updatedTemplate._id) {
    // const _originalTemplate = await templates.get({ _id: updatedTemplate._id });
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
}
