/* jshint node: true */
'use strict';
var fs = require('fs');
var logPath = __dirname + '/test.log';
var chai = require('chai');
var rewire = require('rewire');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var app = rewire('../main');
chai.should();
chai.use(sinonChai);
var triggerSpy, resetTrigger, cancelSpy, resetCancel, interval;

describe('Trigger alert', function () {

  before(function (done) {
    fs.open(logPath, 'a', done);
  });

  beforeEach(function () {
    triggerSpy = sinon.spy(app.__get__('trigger'));
    resetTrigger = app.__set__('trigger', triggerSpy);
    cancelSpy = sinon.spy(app.__get__('cancel'));
    resetCancel = app.__set__('cancel', cancelSpy);
  });

  afterEach(function () {
    resetCancel();
    resetTrigger();
  });

  it('should send an alert if more than 5  requests per second are sent in 2 minutes', function (done) {
    app.bootstrap(logPath);
    appendToLog()
    setTimeout(function () {
      clearInterval(interval);
      triggerSpy.should.have.been.called;
      app.unwatch();
      done();
    }, 5000);
  });

  it('should send a message when it recovers after requests cease', function (done) {
    app.bootstrap(logPath);
    appendToLog();
    setTimeout(function () {
      clearInterval(interval);
    }, 5000);
    setTimeout(function () {
      cancelSpy.should.have.been.called;
      app.unwatch();
      done();
    }, 7000);
  });

  after(function (done) {
    fs.unlink(logPath, done);
  });

});

function appendToLog() {
  interval = setInterval(function () {
    var date = new Date();
    fs.writeFile(logPath, '87.88.128.19 - Paul [' +
      date.toLocaleString('en-GB', {day: '2-digit'}) + '/' +
      date.toLocaleString('en-GB', {month: "short"}) + '/' +
      date.getFullYear() + ':' +
      date.toLocaleTimeString("en-US", {hour12: false}) + ' ' +
      /(\+\d{4})/.exec(date.toString())[1] + '] ' +
      '"GET /status.php HTTP/1.1" 200 976 "-" "Mozilla/5.0' +
      '(Macintosh) "\n', {flag: 'a'}, function (err) {
      if (err) {
        console.log('hey', err);
      }
    });
  }, 180);
}
