/* File: add_contacts.js
 *
 * If there's a contacts file, creates contacts map
 * Otherwise, returns an empty map
 *
 * Author: Left On Read, May 2018 */

import * as vcard from 'vcard-json';
import shelljs from 'shelljs';
import * as InstanceController from '../controllers/instance_controller';

export const addContacts = (vcf, populateAllMetrics, db, key, password) => {
  if (vcf !== null) {
    vcard.parseVcardFile(vcf, (err, data) => {
      if (err) {
        console.log(err);
        // InstanceController.updateInstanceStatus(key, 'failed to parse contacts file');
        // InstanceController.updateInstanceLog(key, `Error with contacts file: ${err}`);
      } else {
        const vcfPath = vcf.split('/');
        const vcfFile = vcfPath[vcfPath.length - 1];
        const contacts = {}; // key is phone number, value is name
        const bigJSON = data;
        const USPhoneLength = 10;

        for (let i = 0; i < bigJSON.length; i += 1) {
          try {
            const contact = bigJSON[i];
            const name = contact.fullname;
            const phoneList = contact.phone;
            const phone = phoneList[0].value;
            const noPunc = phone.replace(/[.,#!$%^&*;:{}=\-_`~()]/g, '');
            const finalPhone = noPunc.replace(/\s/g, '');

            let matchingPhone = '';

            // STANDARDIZE PHONE NUMBERS
            if (finalPhone.substring(0, 1) === '1' && finalPhone.length > USPhoneLength) {
              matchingPhone = `+${finalPhone}`;
            } else if (finalPhone.substring(0, 2) !== '+1' && finalPhone.length === USPhoneLength) {
              matchingPhone = `+1${finalPhone}`;
              // else it's some other type
            } else {
              matchingPhone = finalPhone;
            }
            // only bother putting in contacts if it's not empty
            if (name !== 'empty' && name !== 'First Name Last Name') {
              contacts[matchingPhone] = name;
            }
          } catch (e) {
            console.log();
          }
        }
        InstanceController.updateInstanceLog(key, 'Matching contacts');
        populateAllMetrics(db, key, password, contacts);
        shelljs.rm('-rf', `src/uploads/${vcfFile}`);
      }
    });
  } else {
    const contacts = {};
    // InstanceController.updateInstanceLog(key, 'No contact file uploaded.');
    populateAllMetrics(db, key, password, contacts);
  }
};

export async function addContactsAsync(key) {
  return 'test';
}
