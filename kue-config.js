/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var url = require('url');
var kue = require('kue');
var redis = require('kue/node_modules/redis')

module.exports.createClient = function(){
  if (process.env.REDISTOGO_URL){
    var redisUrl = url.parse(process.env.REDISTOGO_URL)
    client = redis.createClient(redisUrl.port, redisUrl.hostname);

    if (redisUrl.auth) {
        client.auth(redisUrl.auth.split(":")[1]);
    }
    return client;
  }
  else{
    return redis.createClient();
  }
};
