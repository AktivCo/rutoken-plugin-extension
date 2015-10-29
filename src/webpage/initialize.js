function defineInterface (extension, wyrmhole) {
    var pluginMimeType = "application/x-rutoken-plugin";
    var nextId = 0;
    var promises = {};
    var wyrm = new trash.FireWyrmJS(wyrmhole);

    function isPluginInstalled () {
        return wyrmhole.listPlugins().then(function (plugins) {
            return plugins.find(function (plugin) {
                return plugin.mimetypes.find(function (mimeType) {
                    return mimeType === pluginMimeType;
                });
            });
        }).then(function (plugin) {
            return !!plugin;
        });
    }

    function loadPlugin () {
        return wyrm.create(pluginMimeType);
    }

    function initialize () {
        return Promise.resolve();
    }

    window.addEventListener("message", function (event) {
        if (event.source != window || typeof event.data === "undefined" || typeof event.data.rutoken === "undefined") {
            return;
        }

        var data = event.data.rutoken;
        if (typeof data.promiseId === "undefined") {
            return;
        }

        var promise = promises[data.promiseId];
        if (typeof promise === "undefined") {
            return;
        } else {
            delete promises[data.promiseId];
        }

        if (typeof data.source === "undefined" || data.source !== "extension") {
            promise.reject("Wrong message from extension: " + data);
        } else {
            promise.resolve(data.result);
        }
    });

    extension.isPluginInstalled = isPluginInstalled;
    extension.loadPlugin = loadPlugin;
    delete extension.initialize;
};

function defineInterfaceWithoutNativeMessaging (extension) {
    function isPluginInstalled () {
        return Promise.resolve(false);
    }

    extension.isPluginInstalled = isPluginInstalled;
    delete extension.initialize;
}

trash.firebreath.wyrmhole.create(extId, "application/x-rutoken-plugin").then(function (wyrmhole) {
    defineInterface(extension, wyrmhole);
}).then(undefined, function (reason) {
    defineInterfaceWithoutNativeMessaging(extension);
    console.warn("Couldn't connect to Rutoken native messaging host: " + reason);
}).then(function () {
    extension.initializePromise.resolve();
    delete extension.initializePromise;
});
