import mongoose from 'mongoose';

import dbConfig from '../db_config';
import DateTextSchema from '../schemas/date_text_schema';
import InstanceSchema from '../schemas/instance_schema';
import ShareUrlSchema from '../schemas/share_url_schema';

const DateTextModels = [];
dbConfig.configs.forEach((config) => {
  const db = mongoose.createConnection(config.uri);
  console.log(`Establishing models for ${config.uri}`);
  const model = db.model('DateText', DateTextSchema);
  DateTextModels.push({ name: config.name, model });
});

const masterDb = mongoose.createConnection(dbConfig.masterURI);
const InstanceModel = masterDb.model('Instance', InstanceSchema);
console.log(`Connected to Master DB at: ${dbConfig.masterURI}`);

const shareUrlDb = mongoose.createConnection(dbConfig.shareUrlURI);
const ShareUrlModel = shareUrlDb.model('ShareURL', ShareUrlSchema);
console.log(`Connected to Share DB at: ${dbConfig.shareUrlURI}`);

export { InstanceModel, ShareUrlModel, DateTextModels };
