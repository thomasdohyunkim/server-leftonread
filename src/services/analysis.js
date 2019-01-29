import shelljs from 'shelljs';

import DateText from '../models/date_text_model';
import { happyWords, loveWords, angerWords, stressWords, socialWords, stopWords } from './words';

const DATA_FIELDS = [
  'sentWords',
  'sentFrequency',
  'recWords',
  'recFrequency',
  'avgLengthReceived',
  'receivedTexts',
  'avgLengthSent',
  'sentTexts',
  'sentSentimentLove',
  'recSentimentLove',
  'sentSentimentHappy',
  'recSentimentHappy',
  'sentSentimentAnger',
  'recSentimentAnger',
  'sentSentimentStress',
  'recSentimentStress',
  'sentSentimentSocial',
  'recSentimentSocial',
  'timeReceived',
  'timeSent',
];


function aggregateMaps(wordsMap, wordList) {
  const ht = wordsMap;
  for (let i = 0; i < wordList.length; i += 1) {
    const word = wordList[i];
    if (!(word === '' || stopWords.indexOf(word) > -1)) {
      if (ht[word] === undefined) {
        ht[word] = 0;
      }
      ht[word] += 1;
    }
  }
  return ht;
}

function sortByCount(wordsMap) {
  // sort by count in descending order
  let finalWordsArray = [];
  finalWordsArray = Object.keys(wordsMap).map((key) => {
    return {
      word: key,
      freq: wordsMap[key],
    };
  });

  finalWordsArray.sort((a, b) => {
    return b.freq - a.freq;
  });

  return finalWordsArray;
}

function initializeNewModelDefaults() {
  const newModel = {};

  // Arrays
  newModel.sentWords = [];
  newModel.sentFrequency = [];
  newModel.recWords = [];
  newModel.recFrequency = [];
  newModel.timeSent = Array(48).fill(0);
  newModel.timeReceived = Array(48).fill(0);

  // Constants
  newModel.receivedTexts = 0;
  newModel.sentTexts = 0;
  newModel.sentSentimentLove = 0;
  newModel.recSentimentLove = 0;
  newModel.sentSentimentHappy = 0;
  newModel.recSentimentHappy = 0;
  newModel.sentSentimentAnger = 0;
  newModel.recSentimentAnger = 0;
  newModel.sentSentimentStress = 0;
  newModel.recSentimentStress = 0;
  newModel.sentSentimentSocial = 0;
  newModel.recSentimentSocial = 0;

  return newModel;
}

const calculate = (db, user, key, resolve, reject) => {
  // new query which excludes all messages sent/recieved in group chats.
  // leaves everything in same format as before.
  const query = `
  SELECT
    CASE WHEN a.date > 10000000000
      THEN substr(datetime((a.date/1000000000) + strftime('%s','2001-01-01 01:01:01'), 'unixepoch'), 0, 20)
    ELSE substr(datetime(a.date + strftime('%s','2001-01-01 01:01:01'), 'unixepoch'), 0, 20)
    END AS date,
    b.id,
    lower(a.text) AS text,
    a.is_from_me AS sent,
    a.cache_roomnames AS group_chat
    FROM message a
        JOIN handle b ON b.ROWID = a.handle_id
    WHERE a.text IS NOT NULL
      AND length(b.id) > 7
      AND group_chat is NULL
    ORDER BY b.id, date;
    )`;

  db.all(query, [], (err, rows) => {
    if (err) {
      reject();
      throw err;
    }
    // Complete iteration data
    const allData = [];
    let currentModel = null;
    let currentIdDateKey = null;

    // Aggregated metrics
    let lengths = [0, 0];
    let currWordsMapRec = {};
    let currWordsMapSent = {};
    // Iterate in order of ID & Date
    // Keep a running counter of metrics, and end when identifiers change
    rows.forEach((row) => {
      // Gather identifying information
      const dateVals = row.date.split(' ');
      const day = dateVals[0];
      const { id, sent } = row;

      const dataKey = `${day}${id}`;

      // Onto next DTM entry
      if (currentModel === null) {
        currentIdDateKey = dataKey;
        currentModel = initializeNewModelDefaults();
        currentModel.user = user._id;
        currentModel.number = id;
        currentModel.display = id;
        currentModel.date = new Date(day);
        currentModel.key = key;
      } else if (currentIdDateKey !== null && dataKey !== currentIdDateKey) {
        currentIdDateKey = dataKey;

        // Populate avg length
        currentModel.avgLengthReceived = currentModel.receivedTexts === 0
          ? 0
          : (lengths[0] / currentModel.receivedTexts);
        currentModel.avgLengthSent = currentModel.sentTexts === 0
          ? 0
          : (lengths[1] / currentModel.sentTexts);
        lengths = [0, 0];

        // Populate words
        const sortedWordsSent = sortByCount(currWordsMapSent);
        const finalWordsSent = [];
        const finalFreqsSent = [];
        for (let i = 0; i < sortedWordsSent.length; i += 1) {
          finalWordsSent.push(sortedWordsSent[i].word);
          finalFreqsSent.push(sortedWordsSent[i].freq);
        }
        currentModel.sentWords = finalWordsSent;
        currentModel.sentFrequency = finalFreqsSent;
        currWordsMapSent = {};

        const sortedWordsRec = sortByCount(currWordsMapRec);
        const finalWordsRec = [];
        const finalFreqsRec = [];
        for (let i = 0; i < sortedWordsRec.length; i += 1) {
          finalWordsRec.push(sortedWordsRec[i].word);
          finalFreqsRec.push(sortedWordsRec[i].freq);
        }
        currentModel.recWords = finalWordsRec;
        currentModel.recFrequency = finalFreqsRec;
        currWordsMapRec = {};
        // console.log(currentModel.user);
        allData.push(currentModel);
        currentModel = initializeNewModelDefaults();
        currentModel.user = user._id;
        currentModel.number = id;
        currentModel.display = id;
        currentModel.date = new Date(day);
        currentModel.key = key;
      }

      // General analysis
      if (sent === 1) {
        currentModel.sentTexts += 1;
      } else {
        currentModel.receivedTexts += 1;
      }
      // Count length
      lengths[sent] += row.text.length;

      // Time of day Analysis
      const time = dateVals[1].split(':');
      const timeIndex = (time[0] * 2) + (time[1] >= 30 ? 1 : 0);
      if (sent === 1) {
        currentModel.timeSent[timeIndex] += 1;
      } else {
        currentModel.timeReceived[timeIndex] += 1;
      }

      // Text Analysis
      // Sanitize the data
      let text = row.text.replace(/[!?”“".,/#!$%^&*;{}=\\-_~()]/g, '');
      text = text.replace(/constructor/g, '');

      const words = text.split(/\s+/);
      if (sent === 1) {
        currWordsMapSent = aggregateMaps(currWordsMapSent, words);
      } else {
        currWordsMapRec = aggregateMaps(currWordsMapRec, words);
      }

      // Sentiment Analysis
      let sentimentLove = 0;
      let sentimentHappy = 0;
      let sentimentAnger = 0;
      let sentimentStress = 0;
      let sentimentSocial = 0;

      for (let i = 0; i < words.length; i += 1) {
        if (!(words[i] === '' || stopWords.indexOf(words[i]) > -1)) {
          if (loveWords.indexOf(words[i]) > -1) {
            sentimentLove += 1;
          }
          if (happyWords.indexOf(words[i]) > -1) {
            sentimentHappy += 1;
          }
          if (angerWords.indexOf(words[i]) > -1) {
            sentimentAnger += 1;
          }
          if (stressWords.indexOf(words[i]) > -1) {
            sentimentStress += 1;
          }
          if (socialWords.indexOf(words[i]) > -1) {
            sentimentSocial += 1;
          }
        }
      }

      if (sent === 1) {
        currentModel.sentSentimentLove += sentimentLove;
        currentModel.sentSentimentHappy += sentimentHappy;
        currentModel.sentSentimentAnger += sentimentAnger;
        currentModel.sentSentimentStress += sentimentStress;
        currentModel.sentSentimentSocial += sentimentSocial;
      } else {
        currentModel.recSentimentLove += sentimentLove;
        currentModel.recSentimentHappy += sentimentHappy;
        currentModel.recSentimentAnger += sentimentAnger;
        currentModel.recSentimentStress += sentimentStress;
        currentModel.recSentimentSocial += sentimentSocial;
      }
    });
    for (let i = 0; i < allData.length; i += 1) {
      const model = allData[i];

      // const phone = model.number;
      // model.display = phone in contacts ? contacts[phone] : phone;

      const matchQuery = { user: model.user, date: model.date };
      const setCurrIndex = i;
      DateText.findOne(matchQuery, (err, doc) => {
        if (err) {
          console.log(err);
          return;
        }
        if (!doc) {
          doc = new DateText();
          doc.key = model.key;
          doc.user = model.user;
          doc.date = model.date;
          doc.number = model.number;
          doc.display = model.display;
        }

        DATA_FIELDS.forEach((field) => {
          doc[field] = model[field];
        });
        doc.save((err) => {
          if (err) console.log(err);
          if (setCurrIndex === allData.length - 1) {
            console.log(`Analysis complete of key: ${key}`);
            shelljs.rm('-rf', `src/uploads/${key}.db`);
            db.close();
            resolve();
          }
        });
      });
    }
  });
};

export default calculate;
