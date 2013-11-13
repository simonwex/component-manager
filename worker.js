#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var url = require('url');
var kue = require('kue');
var redis = require('kue/node_modules/redis')
var http = require('https');

var temp = require('temp');
var fs = require('fs');

var util  = require('util');
var exec = require('child_process').exec;
var walk = require('walk');

var s3 = require('knox');
var getMimeType = require("./lib/filetypes").getContentTypeFromExtension;

kue.redis.createClient = require('./kue-config').createClient;

var queue = kue.createQueue();

var knox = require('knox');

var s3 = knox.createClient({
    key: process.env.S3_KEY,
    secret: process.env.S3_SECRET,
    bucket: process.env.S3_COMPONENT_BUCKET
});


// Automatically track and cleanup files at exit
temp.track();

function download(url, org, repo, done, errorCallback) {

  console.log(url);

  var req = http.get(url, function(resp){
    if (Math.floor(parseInt(resp.statusCode) / 100) === 3){
      console.log("following redirect: " + resp.headers.location);
      download(resp.headers.location, org, repo, done, errorCallback);
    }
    else{
      temp.mkdir('archive', function(err, tempDir) {
        console.log(tempDir);

        var file = fs.createWriteStream(tempDir + "/archive.zip");

        // This is really gross, but here's the deal:
        //   - the archive format github uses, cant' be extracted with zlib or tar
        //   - pkunzip isn't on heroku dynos
        //   - jar is, but you can't specify the directory it ends up in
        resp.pipe(file).on('finish', function(){
          exec("cd '" + tempDir + "'; jar xf archive.zip", function(err, stout, sterr){
            var walker  = walk.walk(tempDir, { followLinks: false });
            walker.on('file', function(root, stat, next){


              var path = org + '/' + repo + "/" + (root + '/' + stat.name).substr(tempDir.length + 1);

              console.log("Uploading " + path);

              var put = s3.put(path, {
                'Content-Length': stat.size,
                'Content-Type': getMimeType(stat.name)
              });

              fs.createReadStream(root + "/" + stat.name).pipe(put);

              put.on('response', function(s3resp){
                console.log(s3resp.data);
              });


              next();
            });
            walker.on('end', function() {
              done();
            });
          });
        });
      });
    }
  });
  req.on('error', function(e){
    errorCallback(e);
  });
}

queue.process('fetch-zip', function(job, done){
  download(
    "https://github.com/" + job.data.org + "/" + job.data.repo + "/archive/master.zip",
    job.data.org,
    job.data.repo,
    function(){
      done();
    },
    function(error){
      done(error);
    }
  );
});
