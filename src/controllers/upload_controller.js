import User from '../models/user_model';
import populateInstance from '../services/populateInstance_v2';

import { createNewInstance } from '../controllers/instance_controller';

export const linkInstance = (req, res) => {
  User.findOne({ email: req.user.email })
    .then((result) => {
      if (result) {
        result.instances.push(req.body.key);
        result.save();

        // Create new instance model to represent this upload
        createNewInstance(req.body.key, result);

        // Run the analysis
        populateInstance(req.body.key, req.body.vcf, result);
        res.json({ link: true });
      }
    });
};

export const uploadFile = (req, res) => {
  const chatdbFilename = req.files.chatdb[0].filename;
  const key = chatdbFilename.replace('.db', '');
  const vcf = Object.keys(req.files).length === 2 ? req.files.vcf[0].filename : null;

  res.json({ key, vcf });
};
