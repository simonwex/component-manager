/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var kue = require('kue');

var queue = kue.createQueue();

module.exports = {
  post: function(req, resp){
    var url = "https://github.com/" + req.body.organization + "/" + req.body.repository + "/archive/master.zip";

    console.log(url);

    var job = queue.create('fetch-zip', {
      zip: url
    });

    //TODO: append to activity log/sockets
    job.on('complete', function(){
      console.log("Archive " + url + " deployed.");
    }).on('failed', function(){
      console.log("Archive " + url + " failed.");
    }).on('progress', function(progress){
      console.log(url + ": " + progress + '% complete');
    });

    job.save();

    resp.send('Queued. (Job: ' + JSON.stringify(job) + ")");
  }
};
