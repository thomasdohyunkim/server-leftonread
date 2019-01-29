import * as DTC from './date_text_controller';

export const getMetrics = (req, res) => {
  switch (req.body.metric) {
    case 'TOTAL_TEXTS':
      DTC.getTotalTexts(req, res);
      break;
    case 'TEXTS_PER_DAY':
      DTC.getRangeTexts(req, res);
      break;
    case 'TOP_FIVE_FRIENDS':
      DTC.getTopFriends(req, res);
      break;
    case 'TOP_FIVE_WORDS':
      DTC.getTopWords(req, res);
      break;
    case 'SENTIMENTS':
      DTC.getSentiments(req, res);
      break;
    case 'RECONNECT':
      DTC.reconnectWithFriends(req, res);
      break;
    case 'SENTIMENT_TIME':
      DTC.sentimentOverTime(req, res);
      break;
    case 'AVG_LENGTH':
      DTC.getAvgLength(req, res);
      break;
    case 'TOP_FIVE_EMOJIS':
      DTC.getTopEmojis(req, res);
      break;
    case 'TIME_OF_DAY':
      DTC.timeOfDay(req, res);
      break;
    default:
      res.json({ error: 'Invalid metric type' });
  }
};

export const temp = (req, res) => {};
