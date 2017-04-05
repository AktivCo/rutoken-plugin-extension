(function(fb) {
    var connectList = [];
    var ports = {};
    var qEvents = []; // map by ports for queues of events
    var Deferred = trash.FireBreathPromise;

    function connectWyrmhole(extId, dfd, evt) {
        var port = {port: evt.port, extId: extId};
        var sink = function(sink) {
            ports[evt.port] = function (data) {
                if (data.event === "disconnected") {
                    sink({disconnect: true});
                } else if (data.event === "message") {
                    sink(data.message);
                } else {
                    console.warn("Unkown event: " + data.event);
                }
            };
        };
        dfd.resolve({port: port, sink: sink});
    }

    function onMessage(event) {
        // We only accept messages from ourselves
        if (event.source != window || typeof event.data === "undefined") { return; }

        if (typeof event.data.rutoken === "undefined") { return; }

        if (event.data.rutoken.source == "content" && typeof event.data.rutoken.event !== "undefined") {
            if (event.data.rutoken.event == "created") {
                while (connectList.length) {
                    var cur = connectList.pop();
                    connectWyrmhole(cur.extId, cur.dfd, event.data.rutoken);
                }
            } else {
                if (!qEvents[event.data.rutoken.port]) {
                    qEvents[event.data.rutoken.port] = [];
                }
                qEvents[event.data.rutoken.port].push(event);
            }
        }

        var portName = event.data.rutoken.port;
        if (portCreated[portName] && typeof qEvents[portName] != 'undefined') {
            while (qEvents[portName].length) {
                var e = qEvents[portName].shift();
                if (!ports[portName]) {
                    console.error("Invalid port!");
                } else {
                    ports[portName](e.data.rutoken);
                }
            }
        }
    }
    function destroyHelper() {
        Object.keys(ports).forEach(function(port) {
            ports[port]({data: {message: "Disconnected"}});
        });
        window.removeEventListener("message", onMessage);
    }
    window.addEventListener("message", onMessage, false);

    // ext is optional -- will default to the current extension
    fb.wyrmhole.connect = function (ext) {
        var dfd = Deferred();
        var extId = ext || fb.extId;
        connectList.push({extId: extId, dfd: dfd});
        window.postMessage({ rutoken: {
            ext: extId,
            source: "webpage",
            action: "createWyrmhole"
        } }, "*");
        return dfd.promise;
    };
    fb.wyrmhole.message = function (msg) {
        window.postMessage({ rutoken: {
            source: "webpage",
            ext: this.extId,
            action: "sendToPort",
            port: this.port,
            message: msg
        } }, "*");
    };
    fb.wyrmhole.destroy = destroyHelper;
})(trash.firebreath);
