'use strict';
var Tail = require('tail').Tail;
var events = require('events');
var emitter = new events.EventEmitter();
var tail = new Tail('/tmp/test.log');
var topRanks = {};
var sections = [];
var nbReq = 0;
var triggered = false;
var threshold = 50;

tail.on('line', function (data) {
        var matched = /"\w+\s\/([\w$_.-]*).*"/.exec(data);
        if (matched == null) {
                // For instance : OPTIONS * will not match.
                return;
        }
        section = matched[1];
        if (!section) {
                // We replace root with a forbidden character in URL
                section = "^";
        }
        if (Object.keys(topRanks).indexOf(section) > -1) {
                topRanks[section] = topRanks[section] +1;
        } else {
                topRanks[section] = 1;
        }
        if (sections.indexOf(section) === -1) {
                sections.push(section);
        }
        nbReq = nbReq + 1;
        emitter.emit('nbReqUpdated');
        setTimeout(function() {
                emitter.emit('nbReqUpdated');
                nbReq = nbReq -1;
        }, 120000);
});

setInterval(function () {
    console.log(new Date(), sections.sort(function(a,b) {
            return topRanks[b] - topRanks[a];
    }));
}, 10000);

emitter.on('nbReqUpdated', function() {
        if (nbReq > threshold && !triggered) {
                triggered = true;
                console.log('oups ! it triggered with ', nbReq, ' at ', new Date());
        } else if (nbReq < threshold) {
                if (triggered) {
                        triggered = false;
                        console.log('Yeah ! it recovered with ', nbReq, ' at ', new Date());
                }
        }
});

