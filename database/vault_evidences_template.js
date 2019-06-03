import connect, { disconnect } from 'api/utils/connect_to_mongo';
import templates, { templateUtils } from 'api/templates';
import { templateTypes } from 'shared/templateTypes';

connect()
.then(() => templates.save({
  name: 'Vault Evidence',
  properties: [
    {
      type: templateTypes.link,
      label: 'original url',
      name: templateUtils.safeName('original url'),
    },
    {
      type: templateTypes.media,
      label: 'video',
      name: templateUtils.safeName('video'),
    },
    {
      type: templateTypes.image,
      label: 'screenshot',
      name: templateUtils.safeName('screenshot'),
    },
    {
      type: templateTypes.date,
      label: 'time of request',
      name: templateUtils.safeName('time of request'),
    },
    {
      type: templateTypes.markdown,
      label: 'data',
      name: templateUtils.safeName('data'),
    },
  ]
}))
.then((template) => {
  process.stdout.write('\n\n');
  process.stdout.write(`template created with ID -> ${template._id}`);
  process.stdout.write('\n\n');
  return disconnect();
})
.catch((e) => {
  process.stdout.write('\n\n');
  process.stdout.write(e.message);
  process.stdout.write(e.stack);
  return disconnect();
});
