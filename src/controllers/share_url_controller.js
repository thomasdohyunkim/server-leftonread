/* File: share_url_controller.js
 *
 * Contains the mongo queries to retrieve shareable URLs
 *
 * Author: Left On Read, May 2018 */

// import { ShareUrlModel as ShareUrl } from '../models/model_config';
import ShareUrl from '../models/share_url_model';

// Generate a random unique key recursively
// Same as one found in instance_controller.js
const generateUniqueKey = () => {
  const getRandomKey = () => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const keyLength = Math.floor(Math.random() * 5) + 7;
    for (let i = 0; i < keyLength; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  };

  const tryKey = getRandomKey();
  return ShareUrl
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

export const saveGraph = (req, res) => {
  const { graphType, graphData, instanceKey } = req.body;
  generateUniqueKey()
    .then((key) => {
      const shareUrl = new ShareUrl();
      shareUrl.key = key;
      shareUrl.graphType = graphType;
      shareUrl.graphData = graphData;
      shareUrl.instanceKey = instanceKey;
      shareUrl.save();
      res.json({ key });
    })
    .catch((error) => {
      console.log(error);
    });
};

export const getGraph = (req, res) => {
  ShareUrl.findOne({ key: req.query.graphUrl })
    .then((graph) => {
      if (graph) {
        res.json({ graph });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
};
