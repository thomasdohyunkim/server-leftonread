import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// create a UserSchema with a title field
const UserSchema = new Schema(
  {
    firstName: { type: String, lowercase: true },
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, select: false },
    instances: [String],
  },
  {
    toJSON: {
      virtuals: true,
    },
  },
);

UserSchema.pre('save', function encrypt(next) {
  const user = this;

  if (!user.isModified('password')) return next();

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(user.password, salt);

  user.password = hash;
  return next();
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword, callback) {
  const user = this;
  bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
    if (err) {
      return callback(err);
    }
    return callback(null, isMatch);
  });

  // return callback(null, comparisonResult) for success
  // or callback(error) in the error case
};

// create model class
const UserModel = mongoose.model('User', UserSchema);

export default UserModel;
