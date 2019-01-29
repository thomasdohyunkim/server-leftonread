import sqlite3 from 'sqlite3';
import { populateContacts, propagateContacts } from './parseContacts';
import calculate from './analysis';

const initializeAnalysis = (user, key) => {
  console.log(`Beginning analysis of key ${key}...`);

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(`${__dirname}/../uploads/${key}.db`, (error) => {
      if (error) {
        console.log(error);
      }

      calculate(db, user, key, resolve, reject);
    // addContacts(vcf, populateAllMetrics, db, key, req.body.password, config.model);
    });
  });
};

const populateInstance = async (key, vcf, user) => {
  // Initialize analysis and populate contacts async
  const analysisPromise = initializeAnalysis(user, key);
  const contactsPromise = populateContacts(vcf, user);

  // Await until both operations have finished
  await analysisPromise;
  await contactsPromise;

  // Populate contacts all the way through user data
  await propagateContacts(user);
  console.log(`Instance population complete for key: ${key}`);
};

export default populateInstance;
