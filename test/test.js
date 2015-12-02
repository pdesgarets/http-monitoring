/* jshint node: true */
'use strict';
var app = require('../main');
var fs = require('fs');
var logPath = './test.log';
var chai = require('chai');
chai.should();
var stream;

describe('Trigger alert', function () {

  before(function(done) {
    fs.open(logPath, 'a', done);
  });

  it('should send an alert if more than 5  requests per second are sent in 2 minutes', function(done) {
    app.bootstrap(logPath);
    var interval = setInterval(function () {
      var date = new Date();
      fs.writeFile(logPath, '87.88.128.19 - Paul [' +
                   date.toLocaleString('en-GB', {day: '2-digit'}) + '/' +
                   date.toLocaleString('en-GB', {month: "short"}) + '/' +
                   date.getFullYear() + ':' +
                   date.toLocaleTimeString("en-GB") + ' ' +
                   /(\+\d{4})/.exec(date.toString())[1] + '] '+
                   '"GET /status.php HTTP/1.1" 200 976 "-" "Mozilla/5.0'+
                   '(Macintosh) "\n', {flag: 'a'}, function (err) {
                    if (err) {
                      console.log('hey',err);
                   }
                   });
    }, 195);
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
