import dotenv from 'dotenv';

dotenv.config({ silent: true });

const databases = [
  'lor_master',
  'lor_shareurl',
  'blue_penguin',
  'green_elephant',
  'white_tiger',
];
const configs = [];

let masterURI = '';
let shareUrlURI = '';
if (process.env.ENV === 'PROD') {
  databases.forEach((db) => {
    if (process.env[db]) {
      const uri = process.env[db]
        .replace('<dbuser>', process.env.DBUSER)
        .replace('<dbpassword>', process.env.DBPASSWORD);
      if (db === 'lor_master') {
        masterURI = uri;
      } else if (db === 'lor_shareurl') {
        shareUrlURI = uri;
      } else {
        configs.push({ name: db, uri });
      }
    }
  });
} else {
  masterURI = 'mongodb://localhost/lortexts';
  configs.push({ name: 'lor_master', uri: masterURI });
}

export default {
  masterURI, shareUrlURI, databases, configs,
};
