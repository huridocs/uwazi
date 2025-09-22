import { Db } from 'mongodb';

export default {
  delta: 175,
  name: 'update_entity_title_indexes',
  description: 'Adds hashed index on entity title and removes unused text index (search handled by Elasticsearch)',
  reindex: false,
  
  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    const collection = db.collection('entities');
    
    // 1. Add hashed index for exact matching
    process.stdout.write('Adding hashed index on title...\r\n');
    await collection.createIndex({ title: 'hashed' }, { background: true });
    
    // 2. Remove unused text index
    process.stdout.write('Removing unused text index on title...\r\n');
    const indexes = await collection.indexes();
    const textIndex = indexes.find(idx => 
      idx.key && idx.key.title === 'text'
    );
    
    if (textIndex) {
      await collection.dropIndex({ title: 'text' });
      process.stdout.write('Text index removed.\r\n');
    } else {
      process.stdout.write('Text index not found, skipping removal.\r\n');
    }
  },
};
