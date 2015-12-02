/*jslint node: true */
'use strict';
var Tail = require('tail').Tail;
var tail;
var topRanks = {};
var sections = [];
var reqs = [];
var triggered = false;
var threshold = 5; // Requests per second
var launchTime;
var beginning = true;
var interval;

if (process.env.NODE_ENV != 'test' && !process.env.HTTP_LOG_FILE) {
  bootstrap('/tmp/test.log');
} else if (process.env.HTTP_LOG_FILE) {
  bootstrap(process.env.HTTP_LOG_FILE);
}

function bootstrap(file) {
  launchTime = Date.now();
  tail = new Tail(file);
  tail.on('line', function (data) {
    var matched = /"\w+\s(\/[\w$_.-]*).*"/.exec(data);
    if (matched === null) {
      // For instance : OPTIONS * will not match.
      return;
    }
    var section = matched[1];
    if (Object.keys(topRanks).indexOf(section) > -1) {
      topRanks[section] = topRanks[section] +1;
    } else {
      topRanks[section] = 1;
    }
    if (sections.indexOf(section) === -1) {
      sections.push(section);
    }
    var dateMatched = /\[(.*):(\d+:\d+:\d+\s+\+\d+)\]/.exec(data);
    reqs.push(Date.parse(dateMatched[1] + ' ' + dateMatched[2]));
    check();
  });

  setInterval(function () {
    console.log(new Date(), sections.sort(function(a,b) {
      return topRanks[b] - topRanks[a];
    }));
  }, 10000);

  setInterval(removeOutdated, 1000);
}

function removeOutdated(cb) {
  console.log(reqs.length);
  var i = 0;
  var now = Date.now();
  while (now - 120000 > reqs[i] && i < reqs.length -1) {
    reqs.shift();
    i++
  }
}

function check() {
  var RPS;
  var nbReq = reqs.length;
  if ( beginning && Date.now() - launchTime< 120000) {
    RPS = 1000*nbReq/(Date.now() - launchTime);
  } else {
    beginning = false;
    RPS = nbReq / 120;
  }
  console.log(RPS);
  if (RPS > threshold && !triggered) {
    trigger(RPS);
  } else if (RPS < threshold) {
    if (triggered) {
      cancel(RPS);
    }
  }
}

function trigger (RPS) {
  triggered = true;
  console.log('oups ! it triggered with ', RPS, ' at ', new Date());
  interval = setInterval (function () {
    removeOutdated();
    check();
  }, 1000);
}

function cancel (RPS) {
  triggered = false;
  console.log('Yeah ! it recovered with ', RPS, ' at ', new Date());
  clearInterval(interval);
}

module.exports = {
  bootstrap: bootstrap,
  triggered: function() {
    return triggered;
  },
  unwatch: function () {
    tail.unwatch();
  }
};
