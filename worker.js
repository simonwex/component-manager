#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var url = require('url');
var kue = require('kue');
var redis = require('kue/node_modules/redis')
var http = require('https');

var temp = require('temp');
var tar = require('tar');
var fs = require('fs');
var zlib = require('zlib');

kue.redis.createClient = require('./kue-config').createClient;

var queue = kue.createQueue();

// Automatically track and cleanup files at exit
temp.track();

function download(url, callback, errorCallback) {
  var req = http.get(url, function(resp){
    if (Math.floor(parseInt(resp.statusCode) / 100) === 3){
      console.log("following redirect: " + resp.headers.location);
      download(resp.headers.location, callback, errorCallback);
    }
    else{
      temp.mkdir('archive', function(err, tempDir) {
        console.log(tempDir);
        console.log(JSON.stringify(resp.headers));

        var stream = temp.createWriteStream({suffix: ".zip"});
        console.log(stream.path);
        resp.pipe(stream);

        /*
        resp.pipe(tar.Extract({path: tempDir})
          resp.pipe(tar.Extract({path: tempDir})
            .on('error', function(e){
              errorCallback(e);
            })
            .on('end', function(){
              console.log(tempDir);
              callback();
            })
        );
        */
      });
    }
  });
  req.on('error', function(e){
    errorCallback(e);
  });
}

queue.process('fetch-zip', function(job, done){
  download(
    job.data.zip,
    function(){
      done();
    },
    function(error){
      done(error);
    }
  );
});
