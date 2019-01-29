/* File: date_text_controller.js
 *
 * Contains the mongo queries sent to the overview page
 *
 * Author: Left On Read, May 2018 */

import { emojiList, badEmojisList } from '../services/words';
// import { InstanceModel as Instance, DateTextModels } from '../models/model_config';
import DateText from '../models/date_text_model';

// FOR MULTIPLE DATABASES
// export const dbConfigMiddle = (req, res, next) => {
//   if (req.body.key) {
//     Instance.findOne({ key: req.body.key })
//       .then((instance) => {
//         const DateTextModel = DateTextModels.filter((config) => {
//           return config.name === instance.dbName;
//         })[0];
//         res.locals.DateTextModel = DateTextModel.model;
//         next();
//       })
//       .catch((err) => {
//         console.log(err);
//         next();
//       });
//   } else {
//     next();
//   }
// };

// query for time per day
export const timeOfDay = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
  };
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate([
    { $match: filter },
    { $unwind: { path: '$timeReceived', includeArrayIndex: 'arrayIndex' } },
    { $group: { _id: '$arrayIndex', sum: { $sum: '$timeReceived' } } },
    { $sort: { _id: 1 } },
    { $group: { _id: null, valSum: { $push: '$sum' } } },
  ], (err, trData) => {
    if (err) {
      res.status(500).json({ err });
      return;
    }
    if (trData === null) {
      res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
    }
    if (trData.length === 0) {
      res.status(500).json({ error: 'No Results Found' });
    } else {
      DateText.aggregate([
        { $match: filter },
        { $unwind: { path: '$timeSent', includeArrayIndex: 'arrayIndex' } },
        { $group: { _id: '$arrayIndex', sum: { $sum: '$timeSent' } } },
        { $sort: { _id: 1 } },
        { $group: { _id: null, valSum: { $push: '$sum' } } },
      ], (err, tsData) => {
        if (err) {
          res.status(500).json({ err });
          return;
        }
        if (tsData === null) {
          res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
        }
        if (tsData.length === 0) {
          res.status(500).json({ error: 'No Results Found' });
        } else {
          const labelList = [];
          let hour = 7;
          let half = false;
          let am = false;
          for (let i = 0; i < 48; i += 1) {
            const minuteLabel = half ? '30' : '00';
            const amLabel = am ? 'AM' : 'PM';
            const label = `${hour}:${minuteLabel}${amLabel}`;
            labelList.push(label);

            if (half) {
              hour += 1;
            }

            hour = hour === 13 ? 1 : hour;
            if (i === 8) {
              am = !am;
            }
            half = !half;
          }
          const payloadJson = {
            data: [trData[0].valSum, tsData[0].valSum],
            graphType: 'TIME_OF_DAY',
            title: 'Texts per Time of Day',
            labels: labelList,
            sideText: [''],
          };

          res.send(payloadJson);
        }
      });
    }
  });
};

// query which sorts filtering bar by top friends
export const getAllNumbers = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
  };
  // const DateText = res.locals.DateTextModel;
  DateText.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$display',
        numSent: {
          $sum: '$sentTexts',
        },
        numReceived: {
          $sum: '$receivedTexts',
        },
        totalMessages: {
          $sum: {
            $add: ['$sentTexts', '$receivedTexts'],
          },
        },
      },
    },
    {
      $sort: {
        totalMessages: -1,
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
  ], (err, data) => {
    if (err) {
      res.status(500).json({ err });
      return;
    }
    const filterList = [];
    for (let i = 0; i < data.length; i += 1) {
      filterList.push(data[i]._id);
    }
    res.send(filterList);
  });
};

export const getTotalTexts = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
  };
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }

  // const DateText = res.locals.DateTextModel;
  DateText.aggregate([
    { $match: filter },
    {
      $group: {
        _id: 'totalTexts',
        numSent: {
          $sum: '$sentTexts',
        },
        numReceived: {
          $sum: '$receivedTexts',
        },
      },
    }], (err, data) => {
    if (err) {
      res.status(500).json({ err });
      return;
    }
    if (data === null) {
      res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
    }
    if (data.length === 0) {
      res.status(500).json({ error: 'No Results Found' });
    } else {
      const payloadJson = {
        data: [data[0].numSent, data[0].numReceived],
        graphType: 'TOTAL_TEXTS',
        labels: ['Sent texts', 'Received texts'],
        title: 'Total number of texts',
        sideText: [data[0].numSent + data[0].numReceived],
      };
      res.send(payloadJson);
    }
  });
};

export const getRangeTexts = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
  };
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: '$date',
        numSent: {
          $sum: '$sentTexts',
        },
        numReceived: {
          $sum: '$receivedTexts',
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    }], (err, data) => {
    if (err) {
      res.status(500).json({ err });
      return;
    }
    if (data === null) {
      res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
    }
    if (data.length === 0) {
      res.status(500).json({ error: 'No Results Found' });
    } else {
      const labelList = [];
      const sentTextsList = [];
      const receivedTextsList = [];
      for (let i = 0; i < data.length; i += 1) {
        labelList.push(data[i]._id);
        sentTextsList.push(data[i].numSent);
        receivedTextsList.push(data[i].numReceived);
      }

      const payloadJson = {
        data: [receivedTextsList, sentTextsList],
        graphType: 'TEXTS_PER_DAY',
        labels: labelList,
        title: 'Number of Texts Per Day',
        sideText: [''],
      };
      res.send(payloadJson);
    }
  });
};


export const getTopFriends = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
  };
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: '$display',
        numSent: {
          $sum: '$sentTexts',
        },
        numReceived: {
          $sum: '$receivedTexts',
        },
        totalMessages: {
          $sum: {
            $add: ['$sentTexts', '$receivedTexts'],
          },
        },
      },
    },
    {
      $sort: {
        totalMessages: -1,
      },
    },
    {
      $limit: 30,
    },

  ], (err, data) => {
    if (err) {
      res.status(500).json({ err });
      return;
    }

    if (data === null) {
      res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
    }

    if (data.length === 0) {
      res.status(500).json({ error: 'No Results Found' });
    } else {
      const labelList = [];
      const sentTextsList = [];
      const receivedTextsList = [];
      const totalTextsList = [];
      for (let i = 0; i < data.length; i += 1) {
        labelList.push(data[i]._id);
        sentTextsList.push(data[i].numSent);
        receivedTextsList.push(data[i].numReceived);
        totalTextsList.push(data[i].totalMessages);
      }
      const payloadJson = {
        data: [receivedTextsList, sentTextsList, totalTextsList],
        graphType: 'TOP_FIVE_FRIENDS',
        labels: labelList,
        title: 'Top 5 Texted Friends',
      };
      res.send(payloadJson);
    }
  });
};

export const getTopWords = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
    sentWords: { $nin: badEmojisList },
  };
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate([{ $unwind: { path: '$sentWords', includeArrayIndex: 'arrayIndex' } },
    { $match: filter },
    {
      $group: {
        _id: '$sentWords',
        freq: {
          $sum: { $arrayElemAt: ['$sentFrequency', '$arrayIndex'] },
        },
      },
    },
    {
      $sort: {
        freq: -1,
      },
    },
    {
      $limit: 30,
    },
  ], (err, data) => {
    if (err) {
      res.status(500).json({ err });
      return;
    }

    if (data === null) {
      res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
    }
    if (data.length === 0) {
      res.status(500).json({ error: 'No Results Found' });
    } else {
      const wordsList = [];
      const wordsTextsFreqList = [];
      for (let i = 0; i < data.length; i += 1) {
        wordsList.push(data[i]._id);
        wordsTextsFreqList.push(data[i].freq);
      }
      const payloadJson = {
        data: [wordsTextsFreqList],
        graphType: 'TOP_5_TEXTED_WORDS',
        labels: wordsList,
        title: 'Top 5 Sent Words',
      };
      res.send(payloadJson);
    }
  });
};

export const getSentiments = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
  };
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: 'sentiments',
        sentiLove: {
          $sum: {
            $add: ['$sentSentimentLove', '$recSentimentLove'],
          },
        },
        sentiHappy: {
          $sum: {
            $add: ['$sentSentimentHappy', '$recSentimentHappy'],
          },
        },
        sentiAnger: {
          $sum: {
            $add: ['$sentSentimentAnger', '$recSentimentAnger'],
          },
        },
        sentiStress: {
          $sum: {
            $add: ['$sentSentimentStress', '$recSentimentStress'],
          },
        },
        sentiSocial: {
          $sum: {
            $add: ['$sentSentimentSocial', '$recSentimentSocial'],
          },
        },
        totalSenti: {
          $sum: {
          // TODO: how to sum from previous fields? ie from sentiLove, sentiHappy, etc
            $add: ['$sentSentimentHappy', '$recSentimentHappy', '$sentSentimentHappy',
              '$recSentimentHappy', '$sentSentimentAnger', '$recSentimentAnger', '$sentSentimentStress',
              '$recSentimentStress', '$sentSentimentSocial', '$recSentimentSocial'],
          },
        },
      },
    }], (err, data) => {
    if (err) {
      res.status(500).json({ err });
      return;
    }

    if (data === null) {
      res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
    }

    if (data.length === 0) {
      res.status(500).json({ error: 'No Results Found' });
    } else {
      const payloadJson = {
        data: {
          love: data[0].sentiLove,
          happy: data[0].sentiHappy,
          anger: data[0].sentiAnger,
          stress: data[0].sentiStress,
          social: data[0].sentiSocial,
          total: data[0].totalSenti,
        },

        graphType: 'SENTIMENTS',
        labels: ['Love', 'Happy', 'Anger', 'Stress', 'Social'],
        title: 'Sentiment Breakdown',
      };
      res.send(payloadJson);
    }
  });
};

export const wordFilter = (req, res) => {
  const filter = {};
  if (req.body.word !== '') {
    filter.sentWords = req.body.word;
  }
  filter.key = req.body.key;
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate([{ $unwind: { path: '$sentWords', includeArrayIndex: 'arrayIndex' } },
    {
      $match: filter,
    },
    {
      $group: {
        _id: '$sentWords',
        freq: {
          $sum: { $arrayElemAt: ['$sentFrequency', '$arrayIndex'] },
        },
      },
    },
    {
      $sort: {
        freq: -1,
      },
    },
  ], (err, data) => {
    if (err) {
      res.status(500).json({ err });
      return null;
    }

    if (data === null) {
      res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
    }

    if (data.length === 0) {
      res.status(500).json({ error: 'Could not find that word' });
      return null;
    }

    const wordsList = [];
    const wordsTextsFreqList = [];
    for (let i = 0; i < data.length; i += 1) {
      wordsList.push(data[i]._id);
      wordsTextsFreqList.push(data[i].freq);
    }

    const payloadJson = {
      data: [wordsTextsFreqList],
      graphType: 'TOP_5_TEXTED_WORDS',
      labels: wordsList,
      title: 'Top 5 Texted Words',
    };
    res.send(payloadJson);
    return null;
  });
};

export const getAvgLength = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
  };
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate([
    { $match: filter },
    {
      $group: {
        _id: 'avgLength',
        avgLengthSent: {
          $avg: '$avgLengthSent',
        },
        avgLengthReceived: {
          $avg: '$avgLengthReceived',
        },
      },
    }], (err, data) => {
    if (err) {
      res.status(500).json({ err });
    }
    if (data.length === 0) {
      res.status(500).json({ error: 'No Results Found' });
    } else {
      const payloadJson = {
        data: [data[0].avgLengthSent, data[0].avgLengthReceived],
        graphType: 'AVG_LENGTH',
        labels: ['Avg length of texts sent', 'Avg length of texts received'],
        title: 'Average length of texts',
      };
      res.send(payloadJson);
    }
  });
};

export const sentimentOverTime = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
  };
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: '$date',
        sentiLove: {
          $sum: {
            $add: ['$sentSentimentLove', '$recSentimentLove'],
          },
        },
        sentiHappy: {
          $sum: {
            $add: ['$sentSentimentHappy', '$recSentimentHappy'],
          },
        },
        sentiAnger: {
          $sum: {
            $add: ['$sentSentimentAnger', '$recSentimentAnger'],
          },
        },
        sentiStress: {
          $sum: {
            $add: ['$sentSentimentStress', '$recSentimentStress'],
          },
        },
        sentiSocial: {
          $sum: {
            $add: ['$sentSentimentSocial', '$recSentimentSocial'],
          },
        },
        totalSenti: {
          $sum:
            { $add: ['$sentSentimentStress', '$recSentimentStress', '$sentSentimentHappy', '$recSentimentHappy', '$sentSentimentSocial', '$recSentimentSocial', '$sentSentimentAnger', '$recSentimentAnger', '$sentSentimentLove', '$recSentimentLove'] },
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    }], (err, data) => {
    if (err) res.status(500).json({ err });
    if (data.length === 0) {
      res.status(500).json({ error: 'No Results Found' });
    } else {
      const labelList = [];
      const loveList = [];
      const happyList = [];
      const angerList = [];
      const stressList = [];
      const socialList = [];
      for (let i = 0; i < data.length; i += 1) {
        const {
          sentiLove, sentiHappy, sentiAnger, sentiStress, sentiSocial, totalSenti,
        } = data[i];
        // added this if statement because otherwise you may divide by zero
        if (totalSenti !== 0) {
          labelList.push(data[i]._id);
          loveList.push(sentiLove / totalSenti);
          happyList.push(sentiHappy / totalSenti);
          angerList.push(sentiAnger / totalSenti);
          stressList.push(sentiStress / totalSenti);
          socialList.push(sentiSocial / totalSenti);
        }
      }

      const payloadJson = {
        data: [loveList, happyList, angerList, stressList, socialList],
        graphType: 'SENTIMENT_TIME',
        labels: labelList,
        title: 'Sentiment Over Time',
        sideText: [''],
      };
      res.send(payloadJson);
    }
  });
};


/* Query returns data in sample format:
 * {
 *  “_id” : “First Name Last”,
 *    “totalLove” : 49,
 *    “totalAnger” : 7,
 *    “totalSenti” : 265,
 *    “lastTextDate” : ISODate(“2018-05-10T00:00:00.000Z”)
 *
 */
// TODO: need to tune this algorithm to account for total # of texts
export const reconnectWithFriends = (req, res) => {
  const twoWeeksAgo = 1210000000;
  let filter = {};
  filter = {
    key: req.body.key,
  };
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate(
    [
      {
        $match: filter,
      },
      {
        $sort:
        {
          date: 1,
        },
      },
      {
        $group:
        {
          _id: '$display',
          totalLove:
            {
              $sum:
              { $add: ['$sentSentimentLove', '$recSentimentLove'] },
            },
          totalAnger:
            {
              $sum:
                { $add: ['$sentSentimentAnger', '$recSentimentAnger'] },
            },
          totalSentiment:
            {
              $sum:
                { $add: ['$sentSentimentStress', '$recSentimentStress', '$sentSentimentHappy', '$recSentimentHappy', '$sentSentimentSocial', '$recSentimentSocial', '$sentSentimentAnger', '$recSentimentAnger', '$sentSentimentLove', '$recSentimentLove'] },
            },
          lastTextDate:
            {
              $last: '$date',
            },
          total_texts:
            {
              $sum:
                { $add: ['$receivedTexts', '$sentTexts'] },
            },
        },
      },
      {
        $sort:
          { total_texts: -1 },
      }]
    , (err, data) => {
      if (err) {
        res.status(500).json({ err });
        return null;
      }

      if (data === null) {
        res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
      }

      if (data.length === 0) {
        res.status(500).json({ error: 'Could not find that word' });
        return null;
      }

      const rightNow = Date.now();

      const reconnectList = [];
      const reconnectDataList = [];
      const avoidList = [];
      const avoidDataList = [];

      for (let i = 0; i < data.length; i += 1) {
        if (rightNow - data[i].lastTextDate >= twoWeeksAgo) {
          const loveRatio = Number.isNaN(data[i].totalLove / data[i].totalSentiment) ?
            0
            :
            (data[i].totalLove / data[i].totalSentiment);
          const angerRatio = Number.isNaN(data[i].totalAnger / data[i].totalSentiment) ?
            0
            : (data[i].totalAnger / data[i].totalSentiment);
          const totalTexts = data[i].total_texts;
          reconnectDataList.push([loveRatio * totalTexts, data[i]._id]);
          avoidDataList.push([angerRatio * totalTexts, data[i]._id]);
        }
      }

      reconnectDataList.sort((a, b) => { return a[0] > b[0]; }).reverse();
      avoidDataList.sort((a, b) => { return a[0] > b[0]; }).reverse();

      const finalReconnectData = [];
      const finalAvoidData = [];

      for (let i = 0; i < reconnectDataList.length; i += 1) {
        reconnectList.push(reconnectDataList[i][1]);
        finalReconnectData.push(reconnectDataList[i][0]);
        avoidList.push(avoidDataList[i][1]);
        finalAvoidData.push(avoidDataList[i][0]);
      }

      const payloadJson = {
        data: [finalReconnectData, finalAvoidData],
        labels: [reconnectList, avoidList],
        graphType: 'RECONNECT',
        // TODO: change this title to something like "People you used to text
        // and should reconnect with" once we have redesign
        title: ['People to reconnect with'],
      };
      res.send(payloadJson);
      return null;
    },
  );
};


export const getTopEmojis = (req, res) => {
  let filter = {};
  filter = {
    key: req.body.key,
    sentWords: {
      $in: emojiList,
    },
  };
  if (req.body.filters) {
    if (req.body.filters.display) {
      filter.display = req.body.filters.display;
    }
    if (req.body.filters.startDate && req.body.filters.endDate) {
      filter.date = {
        $gte: new Date(req.body.filters.startDate),
        $lte: new Date(req.body.filters.endDate),
      };
    } else if (req.body.filters.startDate || req.body.filters.endDate) {
      if (req.body.filters.startDate) {
        filter.date = {
          $gte: new Date(req.body.filters.startDate),
        };
      } else if (req.body.filters.endDate) {
        filter.date = {
          $lte: new Date(req.body.filters.endDate),
        };
      }
    }
  }
  // const DateText = res.locals.DateTextModel;

  DateText.aggregate([{ $unwind: { path: '$sentWords', includeArrayIndex: 'arrayIndex' } },
    { $match: filter },
    {
      $group: {
        _id: '$sentWords',
        freq: {
          $sum: { $arrayElemAt: ['$sentFrequency', '$arrayIndex'] },
        },
      },
    },
    {
      $sort: {
        freq: -1,
      },
    },
  ], (err, data) => {
    if (err) {
      res.status(500).json({ err });
      return;
    }
    if (data === null) {
      res.status(500).json({ error: 'The server took a little long to respond. Please try again.' });
    }
    if (data.length === 0) {
      res.status(500).json({ error: 'No Results Found' });
    } else {
      const topEmojiList = [];
      const emojiFreqList = [];
      for (let i = 0; i < data.length; i += 1) {
        topEmojiList.push(data[i]._id);
        emojiFreqList.push(data[i].freq);
      }

      // if you didn't use more than 5 emojiis with this person
      if (topEmojiList.length < 5) {
        for (let i = topEmojiList.length; i < 5; i += 1) {
          topEmojiList.push('N/A');
          emojiFreqList.push(0);
        }
      }

      const payloadJson = {
        data: [emojiFreqList],
        graphType: 'TOP_FIVE_EMOJIS',
        labels: topEmojiList,
        title: 'Top 5 Sent Emojis',
      };
      res.send(payloadJson);
    }
  });
};
