import mongoose, { Schema } from 'mongoose';

const ContactsSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mapping: {
    type: Map,
    of: String,
    default: {},
  },
}, {
  minimize: false,
});

const ContactsModel = mongoose.model('Contacts', ContactsSchema);

export default ContactsModel;
