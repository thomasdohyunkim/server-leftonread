import jwt from 'jwt-simple';
import dotenv from 'dotenv';

import User from '../models/user_model';

dotenv.config({ silent: true });

export const signIn = (req, res, next) => {
  User.findOne({ email: req.user.email })
    .then((result) => {
      if (result) {
        const userData = {
          email: result.email,
          firstName: result.firstName,
        };
        res.send({ token: tokenForUser(req.user), user: userData });
      }
    });
};

export const signUp = (req, res, next) => {
  const { firstName, email, password } = req.body;
  if (!firstName || !email || !password) {
    return res.status(422).json({ error: 'You must provide name, email, and password' });
  }

  User.findOne({ email })
    .then((result) => {
      if (result) {
        if (result.email === email) {
          res.status(422).json({ error: 'An account with this email already exists' });
        } else {
          res.status(422).json({ error: 'An account with this information already exists' });
        }
      } else {
        const user = new User();
        user.firstName = firstName;
        user.email = email;
        user.password = password;
        const userData = {
          firstName,
          email,
        };
        user.save()
          .then((response) => {
            res.send({ token: tokenForUser(user), user: userData });
          });
      }
    });
};

export const validateNewField = (req, res, next) => {
  const { field, value } = req.query;
  const query = {};
  query[field] = value;
  User.findOne(query)
    .then((result) => {
      if (result) {
        res.json({ valid: false });
      } else {
        res.json({ valid: true });
      }
    });
};

export const validateNewUsername = (req, res, next) => {
  const { username } = req.body;
  User.findOne({ username })
    .then((result) => {
      if (result) {
        res.json({ exists: true });
      }
      res.json({ exists: true });
    });
};

// encodes a new token for a user object
function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, 'hello');
}
