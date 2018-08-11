'use strict';

const express = require('express');
const Twitter = require('twitter');

const firebase = require('./src/firebase');

const app = express();

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

app.get('/lists/list', (req, res, next) => {
  const params = {
    screen_name: 'amotarao'
  };

  client.get('lists/list', params, (error, data, response) => {
    if (error) return res.status(500);
    res.json(data);
  });
});

app.get('/search', (req, res, next) => {
  if (!req.query.users) res.status(400).json({status: 400, error: 'usersクエリーがありません'});
  if (!req.query.since_date) res.status(400).json({status: 400, error: 'since_dateクエリーがありません'});

  const users = decodeURIComponent(req.query.users);
  const since_date = decodeURIComponent(req.query.since_date);

  const query = 'from:' + users.replace(' ', '').split(',').filter(v => v).join(' OR from:') + ' since:' + since_date;

  const params = {
    q: query,
    result_type: 'recent',
    count: 50
  };

  client.get('search/tweets', params, (error, data, response) => {
    if (error) return res.status(500);
    firebase.setTweets(data.statuses);
    res.json(data);
  });
});

const server = app.listen(8080, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`Example app listening at http://${host}:${port}`);
});
