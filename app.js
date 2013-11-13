#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var url = require('url');
var kue = require('kue');
var redis = require('kue/node_modules/redis')

kue.redis.createClient = require('./kue-config').createClient;

var routes = require('./routes');

var express = require('express');
var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.set('view engine', 'html');
app.set('layout', 'layout');
app.set('views', __dirname + '/views')

app.engine('html', require('hogan-express'));
if (!process.env.DISABLE_VIEW_CACHING){
  app.enable('view cache')
}

app.use('/', express.static(__dirname + '/public'));

app.use(express.bodyParser());

app.get('/', routes.index);

app.post('/fetch', routes.fetch.post);

app.use(kue.app);

var server = app.listen(process.env.PORT, function (err) {
  console.log('Running on', server.address());
});
