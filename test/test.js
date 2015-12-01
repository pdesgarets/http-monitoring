/* jshint node: true */
'use strict';
var app = require('../main');
var fs = require('fs');
var logPath = './test.log';
var chai = require('chai');
chai.should();

describe('Trigger alert', function () {

  before(function(done) {
    fs.open(logPath, 'a', done);
  });
  it('should send an alert if more than 50  requests are sent in 2 minutes', function(done) {
    app.bootstrap(logPath);
    var interval = setInterval(function () {
      fs.writeFile(logPath, '87.88.128.129 - Paul [01/Dec/2015:01:01:21 +0100] '+
                   '"GET /status.php HTTP/1.1" 200 976 "-" "Mozilla/5.0'+
                   '(Macintosh) "\n',{flag: 'a'}, function (err) {
                    if (err) {
                      console.log('hey',err);
                   }
                   });
    }, 180);
    setTimeout(function () {
      app.triggered().should.be.true;
      done();
    }, 5000);
  });

  after(function(done) {
      app.unwatch();
      fs.unlink(logPath,done);
  });

});
