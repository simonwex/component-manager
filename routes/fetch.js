/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var kue = require('kue');

var queue = kue.createQueue();

module.exports = {
  post: function(req, resp){
    var job = queue.create('fetch-zip', {
      org: req.body.organization,
      repo: req.body.repository
    });

    var project = req.body.organization + "/" + req.body.repository;
    //TODO: append to activity log/sockets
    job.on('complete', function(){
      console.log("Archive " + project + " deployed.");
    }).on('failed', function(){
      console.log("Archive " + project + " failed.");
    }).on('progress', function(progress){
      console.log(project + ": " + progress + '% complete');
    });

    job.save();

    resp.send('Queued. (Job: ' + JSON.stringify(job) + ")");
  }
};
