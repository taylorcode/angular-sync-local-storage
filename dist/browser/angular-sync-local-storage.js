"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
  * @ngdoc overview
  * @name angularSyncLocalStorage
  * @description
  * Allows you to automatically synchronize an object with localStorage across browser windows using angular's digest cycle.
 */

var AngularSyncLocalStorageProvider = (function () {
  function AngularSyncLocalStorageProvider() {
    _classCallCheck(this, AngularSyncLocalStorageProvider);

    this.debounceSyncDelay = 300;
  }

  _createClass(AngularSyncLocalStorageProvider, {
    $get: {
      value: function $get($rootScope, $window, $timeout) {
        return new AngularSyncLocalStorage($rootScope, $window, $timeout, this) // pass in the provider instance
        ;
      }
    }
  });

  return AngularSyncLocalStorageProvider;
})();

function AngularSyncLocalStorageProviderFactory() {
  return new AngularSyncLocalStorageProvider();
}

var AngularSyncLocalStorage = (function () {
  function AngularSyncLocalStorage($rootScope, $window, $timeout, providerInstance) {
    _classCallCheck(this, AngularSyncLocalStorage);

    this.$rootScope = $rootScope;
    this.$window = $window;
    this.$timeout = $timeout;
    this.localStorage = $window.localStorage;
    this.supportsLocalStorage = supportsLocalStorage;
    this.debounce = debounce;
    this.sync = sync;
    this.providerInstance = providerInstance;
    this.syncLocal = angular.noop;
  }

  _createClass(AngularSyncLocalStorage, {
    _queryUpdateStorage: {
      value: function _queryUpdateStorage() {
        var _this = this;

        if (this.syncLocal()) {
          // NOTE timeout is needed because this has the potential to be broadcasted before the ready
          // event is fired in jquery where this is being listened for
          // on updated occurs when localStorage is updated outside of the application
          // and you may have services that need to query the data (such as session information)
          this.$timeout(function () {
            _this.$rootScope.$broadcast("sls:updated");
          });
          this.$rootScope.$digest();
        }
      }
    },
    _updateLocalStorage: {
      value: function _updateLocalStorage(key, value) {
        this.localStorage[key] = angular.toJson(value);
      }
    },
    synchronize: {
      value: function synchronize(localObject, persistKey) {
        var _this = this;

        var initialSync = arguments[2] === undefined ? true : arguments[2];

        var localObjStringType = Object.prototype.toString.call(localObject);

        if (localObjStringType === "[object Object]" || localObjStringType === "[object Array]") {
          throw new Error("AngularSyncLocalStorage: object to synchronize with must be an hash or an array.");
        }

        if (!this.supportsLocalStorage()) {
          // silently die if there is no localStorage support
          return;
        }
        var synchronizeLocalStorage;

        this.syncLocal = this.sync(this.localStorage, persistKey, localObject);

        if (initialSync) {
          // if we want to initially sync, it will override what's currently in the local object with what is in localStorage
          this.syncLocal();
        }
        // set up to update localStorage only every debounce time
        // only affects performance of the other windows receiving the update
        synchronizeLocalStorage = this.debounce(function (ls) {
          _this._updateLocalStorage(persistKey, ls);
        }, this.providerInstance.debounceSyncDelay);

        // deep watch localObject for changes, update localStorage when whey occur
        this.$rootScope.$watch(function () {
          return localObject;
        }, synchronizeLocalStorage, true);

        // listen for storage changes, notify
        this.$window.addEventListener("storage", this._queryUpdateStorage.bind(this));
      }
    }
  });

  return AngularSyncLocalStorage;
})();

angular.module("angularSyncLocalStorage", []).provider("synchronizedLocalStorage", AngularSyncLocalStorageProviderFactory);

// helper functions - move to better place
function supportsLocalStorage() {
  var testKey = "test",
      storage = window.localStorage;
  try {
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}
// remove dependency of underscore
function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
        args = arguments;
    var later = function later() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function sync(storageService, key, localObject) {
  return function () {
    var fromStorageContainer;
    // if there's no container (such as localStorage, then create it)
    if (!storageService[key]) {
      return false;
    } else {
      fromStorageContainer = angular.fromJson(storageService[key]);
      // if the storage containers stuff isn't the same as the local object
      if (!angular.equals(localObject, fromStorageContainer)) {
        // update the local object with the storage containers stuff
        taylorcode.updateModel(localObject, fromStorageContainer);
        return true;
      }
      return false;
    }
  };
}
//# sourceMappingURL=angular-sync-local-storage.js.map