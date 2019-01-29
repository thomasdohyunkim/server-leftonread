import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import fs from 'fs';
import dotenv from 'dotenv';

import apiRouter from './router';
// import { dbConfigMiddle } from './controllers/date_text_controller';

dotenv.config({ silent: true });

// initialize
const app = express();

// enable/disable cross origin resource sharing if necessary
app.use(cors());


// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
// this should go AFTER body parser
// app.use(dbConfigMiddle);
app.use('/api', apiRouter);

// set mongoose promises to es6 default
mongoose.Promise = global.Promise;

app.use('/api', apiRouter);

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/lortexts';
mongoose.connect(mongoURI)
  .then(() => {
    console.log(`Connected to ${mongoURI}`);
  });

const uploadPath = `${__dirname}/uploads`;
fs.mkdir(uploadPath, (err) => {
  if (err && err.code !== 'EEXIST') {
    console.log(err);
  }
});
// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);

console.log(`listening on: ${port}`);
