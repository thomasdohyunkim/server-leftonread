import * as vcard from 'vcard-json';
import shelljs from 'shelljs';
import DateText from '../models/date_text_model';
import Contacts from '../models/contactsModel';

export const populateContacts = (vcf, user) => {
  if (vcf == null) {
    return;
  }
  return new Promise((resolve, reject) => {
    Contacts.findOne({ user: user._id }, (err, doc) => {
      if (err) {
        console.log(err);
      }
      if (!doc) {
        doc = new Contacts({
          user: user._id,
        });
      }

      const vcfFilepath = `${__dirname}/../uploads/${vcf}`;
      vcard.parseVcardFile(vcfFilepath, (err, data) => {
        if (err) {
          console.log(err);
          reject();
        }

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
              doc.mapping.set(matchingPhone, name);
            }
          } catch (e) {
            console.log(e);
            reject();
          }
        }

        doc.save((err) => {
          if (err) console.log(err);
          shelljs.rm('-rf', `src/uploads/${vcf}`);
          resolve();
        });
      });
    });
  });
};


export const propagateContacts = (user) => {
  return new Promise((resolve, reject) => {
    Contacts.findOne({ user: user._id }, (err, doc) => {
      if (err) {
        console.log(err);
        resolve();
      }
      if (doc) {
        const mapSize = doc.mapping.size;
        let i = 1;
        doc.mapping.forEach((name, number) => {
          const query = { number, user: user._id };
          const itr = i;
          // console.log(`Updating ${number} to ${name}`);
          DateText.updateMany(query, { display: name }, (err, res) => {
            if (err) console.log(err);
            if (itr === mapSize) resolve();
          });
          i += 1;
        });
      }
    });
  });
};
