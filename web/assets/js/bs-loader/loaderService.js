angular.module('bsLoader').service('Loader', ['Notification', function (Notification) {

    var LOADER_CHANNEL = 'loader';

    var loadStates = {};

    function firstLoadingTaskText() {
        var text = '';

        Object.keys(loadStates).some(function (t) {
            if (loadStates[t].loading) {
                text = loadStates[t].text;
                return true;
            }
        });

        return text;
    }

    return {
        register: function (cb) {
            cb(this.isLoading(), firstLoadingTaskText());
            Notification.register(LOADER_CHANNEL, cb);
        },

        unregister: function (cb) {
            Notification.unregister(LOADER_CHANNEL, cb);
        },

        start: function (task, text) {
            loadStates[task] = {text: text, loading: true};
            Notification.notify(LOADER_CHANNEL, this.isLoading(), text);
        },

        stop: function (task) {
            loadStates[task].loading = false;
            Notification.notify(LOADER_CHANNEL, this.isLoading(), firstLoadingTaskText());
        },

        isLoading: function () {
            return Object.keys(loadStates).some(function (task) {
                return loadStates[task].loading;
            });
        }
    };

}]);
