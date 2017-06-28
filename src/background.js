/*global chrome*/

var firebreath = {}; //global object
var ports = {};
var hostName = "ru.rutoken.firewyrmhost";
var mimeType = "application/x-rutoken-plugin";
var isIE = /*@cc_on!@*/false || !!document.documentMode;
var isEdge = !isIE && !!window.StyleMedia;
var _browser = (!!window.chrome && !!chrome.runtime) ? chrome : browser;

console.log("Starting background script");

/* Example of using Fire Wyrm in extension only */
//window.addEventListener("load", function() {
//  firebreath.wyrmhole.create(hostName, mimeType).then(function(wyrmhole) {
//      var wyrm = new FireWyrmJS(wyrmhole);
//      return wyrm.create(mimeType);
//  }).then(function(plugin) {
//      /* use plugin */
//  }, function() {
//      console.log('wyrmhole error');
//  });
//});

/* Example of using Fire Wyrm via webpage */
_browser.runtime.onConnect.addListener(function(scriptPort) {
    console.log("Connected!");
    var name = scriptPort.name;
    var hostPort = _browser.runtime.connectNative(hostName);
    var self = ports[name] = {
        script: scriptPort,
        host: hostPort
    };
    scriptPort.onMessage.addListener(function(msg) {
        // Message from the content script (from the page),
        // post it to the native message host
        hostPort.postMessage(msg);
    });
    hostPort.onMessage.addListener(function(msg) {
        // Message from the native message host,
        // post it to the content script (to the page)
        var obj = msg;
        if(isEdge) {
            // mandatory but useless response from uwp app
            if (msg === "edge_ack")
                return;
            try {
                // edge doesn't parse json
                obj = JSON.parse(msg);
            } catch (e) {
                obj = msg;
            }
        }
        scriptPort.postMessage(obj);
    });
    scriptPort.onDisconnect.addListener(function() {
        // The script disconnected, so disconnect the hostPort
        hostPort.disconnect();
    });
    hostPort.onDisconnect.addListener(function() {
        // The host (native message host) disconnected, so disconnect
        // the script port. If there is an error, report it first
        if (_browser.runtime.lastError) {
            scriptPort.postMessage({error: "Disconnected", message: _browser.runtime.lastError.message});
            console.warn("Disconnected:", _browser.runtime.lastError.message);
        } else {
            scriptPort.postMessage({error: "Disconnected"});
        }
        scriptPort.disconnect();
    });
});
