// import { InstanceModel as Instance } from '../models/model_config';
import Instance from '../models/instance_model';

/* eslint no-bitwise: ["error", { "allow": ["<<"] }] */

// ROUTE FUNCTIONS
export const getInstance = (req, res) => {
  Instance.findOne({ key: req.query.key })
    .then((instance) => {
      if (instance) {
        res.json({ instance });
        return;
      }
      res.status(404).send('No instance found');
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
};

export const validateInstance = (req, res) => {
  const { key, password } = req.body;
  Instance.findOne({ key })
    .then((instance) => {
      if (!instance) {
        res.status(404).send('Error: Instance not found');
        return;
      }
      instance.comparePassword(password, (err, isMatch) => {
        if (err) {
          res.status(422).send(`Error: ${err}`);
        } else if (!isMatch) {
          res.status(422).send('Error: Password is incorrect');
        } else if (isMatch) {
          res.json({ key: instance.key, status: instance.status });
        }
      });
    });
};

// HELPER FUNCTIONS
export const createNewInstance_DEPRECATED = (key) => {
  const instance = new Instance();
  instance.key = key;
  // instance.dbName = dbName;
  instance.status = 'populating';
  instance.log = ['File(s) received and uploaded...'];
  return instance.save();
};

export const updateInstanceStatus = (key, status) => {
  Instance.findOneAndUpdate({ key }, { $set: { status } }, { new: true })
    .catch((error) => {
      console.log(error);
    });
};

export const updateInstanceLog = (key, logItem) => {
  // Instance.findOneAndUpdate({ key }, { $push: { log: logItem } }, { new: true });
  Instance.findOne({ key })
    .then((instance) => {
      instance.log.push(logItem);
      instance.save();
    });
};

export const createNewInstance = (key, user) => {
  const instance = new Instance();
  instance.key = key;
  instance.owner = user._id;
  instance.save();
};

// Generate a random unique key recursively
export const generateUniqueKey = () => {
  const getRandomKey = () => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const keyLength = Math.floor(Math.random() * 22) + 15;
    for (let i = 0; i < keyLength; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  };

  const tryKey = getRandomKey();
  return Instance
    .findOne({ tryKey })
    .then((instance) => {
      if (instance) {
        return generateUniqueKey();
      }
      return tryKey;
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
};
