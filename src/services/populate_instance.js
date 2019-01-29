/* File: date_text_controller.js
 *
 * Contains the mongo queries sent to the overview page
 *
 * Author: Left On Read, May 2018 */
import shelljs from 'shelljs';
import * as InstanceController from '../controllers/instance_controller';
import { happyWords, loveWords, angerWords, stressWords, socialWords, stopWords } from './words';
import DateText from '../models/date_text_model';
/* eslint guard-for-in: 0 */
/* eslint no-restricted-syntax: 0 */
/* eslint no-control-regex: 0 */
/* eslint no-bitwise: ["error", { "allow": ["<<"] }] */

/* helper functions for querying */

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

export const calculate = (db, key, contacts) => {
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
    InstanceController.updateInstanceLog(key, 'Parsing query');

    if (err) {
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
        currentModel = new DateText();
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

        allData.push(currentModel);
        currentModel = new DateText();
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
    InstanceController.updateInstanceLog(key, 'Saving metrics to database');
    for (let i = 0; i < allData.length; i += 1) {
      const model = allData[i];

      const phone = model.display;
      if (phone in contacts) {
        model.display = contacts[phone];
      }
      model.save();
    }
    InstanceController.updateInstanceLog(key, 'Saved all metrics!');
    InstanceController.updateInstanceStatus(key, 'complete');

    shelljs.rm('-rf', `src/uploads/${key}.db`);
    db.close();
  });
};

export const populateAllMetrics = (db, key, password, contacts, model) => {
  InstanceController.updateInstanceLog(key, 'Querying database... this may take a few seconds.');
  calculate(db, key, contacts, model);
};
