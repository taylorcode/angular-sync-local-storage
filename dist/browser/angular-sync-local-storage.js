"use strict";

if (!window.taylorcode) window.taylorcode = {};

taylorcode.updateModel = updateModel;

function updateModel(oldObj, newObj) {

   if (oldObj.constructor !== newObj.constructor) {
      throw new Error("updateModel: both arguments passed must be of the same type.");
   }
   if (!oldObj instanceof Object) {
      throw new Error("updateModel: arguments passed cannot be primitive.");
   }

   function compareElementsAtKey(key) {
      // property simply doesn't exist in the new object
      if (!oldObj[key]) {
         oldObj[key] = newObj[key];
      } else
         // they are both either arrays or hashes, and are not of primitive types
         if (oldObj[key].constructor === newObj[key].constructor && oldObj[key] instanceof Object) {
            updateModel(oldObj[key], newObj[key]);
         } else if (oldObj[key] !== newObj[key]) {
            // all this compares is if primitives are equal, don't reassign
            oldObj[key] = newObj[key];
         }
   }

   if (oldObj instanceof Array) {
      // we can assume at this point that they are both arrays
      if (oldObj.length > newObj.length) {
         oldObj.length = newObj.length // actually mutate the length of the old object -- remove the items that are not in it
         ;
      }
      // the lengths are the same - one to one with new and old object
      for (var i = 0; i < newObj.length; i++) {
         compareElementsAtKey(i);
      }
   } else {
      // we can assume that they are both objects
      // if the old object has any properties that are not in the new object, remove them
      for (var oldProp in oldObj) {
         if (!newObj.hasOwnProperty(oldProp)) {
            delete oldObj[oldProp];
         }
      }
      // now the properties are the same between new and old object
      for (var prop in newObj) {
         compareElementsAtKey(prop);
      }
   }
}
//# sourceMappingURL=update-model.js.map
"use strict";

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var key in props) {
      var prop = props[key];prop.configurable = true;if (prop.value) prop.writable = true;
    }Object.defineProperties(target, props);
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

var _classCallCheck = function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var UniqueWindowIdentifier = (function () {
  function UniqueWindowIdentifier($window) {
    _classCallCheck(this, UniqueWindowIdentifier);

    this.$window = $window;
    this.currentWindow = this.$window.self;
    this.nameKey = "__uniqueWindowIdentifier";
  }

  _createClass(UniqueWindowIdentifier, {
    _generateUniqueId: {
      value: function _generateUniqueId() {
        return Math.random().toString(36).slice(2);
      }
    },
    _setIdentifier: {
      value: function _setIdentifier(nameObj) {
        var windowNameObj = nameObj || {};
        windowNameObj[this.nameKey] = this._generateUniqueId();
        this.currentWindow.name = JSON.stringify(windowNameObj);
      }
    },
    ensure: {
      value: function ensure() {
        var windowNameObj;
        // if windowProps.name is set and it's not a stringified object, convert it to it
        if (this.currentWindow.name) {
          try {
            windowNameObj = JSON.parse(this.currentWindow.name);
          } catch (e) {
            // the name is not a stringified object
            console.warn("UniqueWindowIdentifier: the windows name is already set, overriding with an stringified object");
            this._setIdentifier();
            return;
          }
          // what's saved is a stringifed object already
          if (!windowNameObj[this.nameKey]) {
            this._setIdentifier(windowNameObj);
          }
        } else {
          this._setIdentifier();
        }
      }
    },
    reset: {
      value: function reset() {
        this._setIdentifier();
      }
    },
    get: {
      value: function get() {
        // return the identifier or undefined
        var identifier;
        try {
          identifier = JSON.parse(this.currentWindow.name)[this.nameKey];
        } catch (e) {
          return;
        }
        return identifier;
      }
    }
  });

  return UniqueWindowIdentifier;
})();

angular.module("angularUniqueWindow", []).service("uniqueWindowIdentifier", UniqueWindowIdentifier);
//# sourceMappingURL=unique-window-identifier.js.map
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
 * @ngdoc provider
 * @name AngularSyncLocalStorageProviderFactory
 *
 * @description
 * Allows configuration of an instance of AngularSyncLocalStorage.
 * 
 */
exports.AngularSyncLocalStorageProviderFactory = AngularSyncLocalStorageProviderFactory;
Object.defineProperty(exports, "__esModule", {
  value: true
});

function AngularSyncLocalStorageProviderFactory() {
  return new AngularSyncLocalStorageProvider();
}

/**
 * @ngdoc class
 * @name AngularSyncLocalStorageProvider
 *
 * @description
 * Class definition for the `AngularSyncLocalStorage` provider. 
 * 
 */

var AngularSyncLocalStorageProvider = (function () {
  function AngularSyncLocalStorageProvider() {
    _classCallCheck(this, AngularSyncLocalStorageProvider);

    this.debounceSyncDelay = 300;
  }

  _createClass(AngularSyncLocalStorageProvider, {
    $get: {
      value: function $get($rootScope, $window, $timeout, uniqueWindowIdentifier) {
        return new AngularSyncLocalStorage($rootScope, $window, $timeout, uniqueWindowIdentifier, this) // pass in the provider instance
        ;
      }
    }
  });

  return AngularSyncLocalStorageProvider;
})();

/**
 * @ngdoc service
 * @name AngularSyncLocalStorage
 *
 * @description
 * Service that enables automatic synchronization of a local object with `localStorage`. Also supports
 * synchronization across browser windows, the creation of unique `localStorage` containers per window,
 * and new containers to be created from a master.
 * 
 */

var AngularSyncLocalStorage = (function () {
  function AngularSyncLocalStorage($rootScope, $window, $timeout, uniqueWindowIdentifier, providerInstance) {
    _classCallCheck(this, AngularSyncLocalStorage);

    this.$rootScope = $rootScope;
    this.$window = $window;
    this.$timeout = $timeout;
    this.localStorage = $window.localStorage;
    this.providerInstance = providerInstance;
    this.uniqueWindowIdentifier = uniqueWindowIdentifier;
    this._masterKeyPostfix = "__master";
    this._versionKeyPostfix = "__version";
    this.syncMap = {};
    this.localMap = {};
  }

  _createClass(AngularSyncLocalStorage, {
    _supportsLocalStorage: {

      /**
       * @ngdoc method
       * @private
       * @name AngularSyncLocalStorage#_supportsLocalStorage
       *
       * @description
       * Determines if the device supports localStorage.
       * 
       * @returns {Bool} true if the device supports localStorage
       */

      value: function _supportsLocalStorage() {
        var testKey = "test",
            storage = this.$window.localStorage;
        try {
          storage.setItem(testKey, "1");
          storage.removeItem(testKey);
          return true;
        } catch (error) {
          return false;
        }
      }
    },
    _debounce: {

      /**
       * @ngdoc method
       * @private
       * @name AngularSyncLocalStorage#_debounce
       *
       * @description
       * Creates and returns a new debounced version of the passed function which 
       * will postpone its execution until after wait milliseconds have elapsed 
       * since the last time it was invoked.
       *
       * @param {Function} func The function that will be wrapped and be postponed
       * @param {Number} wait The minimum time in MS that the function will be called
       * @param {Bool} immediate If true the first time the returned function is called `func` will be invoked
       * @returns {Function} A function that when called, will postpone execution of `func` as described
       */

      value: function _debounce(func, wait, immediate) {
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
    },
    _updateLocalStorage: {

      /**
       * @ngdoc method
       * @private
       * @name AngularSyncLocalStorage#_updateLocalStorage
       *
       * @description
       * Updates `localStorage` with an objects value
       *
       * @param {String} key The key to update in localStorage with the stringified `value`
       * @param {Object} value The value that will be stringified.
       */

      value: function _updateLocalStorage(key, value) {
        this.localStorage[key] = angular.toJson(value);
      }
    },
    _autoSyncExternalUpdates: {

      /**
       * @ngdoc method
       * @private
       * @name AngularSyncLocalStorage#_autoSyncExternalUpdates
       *
       * @description
       * Creates an event listener for external changes to `localStorage`. Synchronizes
       * the value from `localStorage` into a local object. Broadcasts an `sls:updated` event
       * with the key that is updated.
       *
       * @param {Function} syncLocal Pre-bound function that when called, performs the synchronization
       * @param {String} persistKey The name of the `localStorage` property that will be notified as updated
       */

      value: function _autoSyncExternalUpdates(syncLocal, persistKey) {
        var _this = this;

        // bind a new event listener for this local object and persist key
        this.$window.addEventListener("storage", function () {
          if (syncLocal()) {
            // NOTE timeout is needed because this has the potential to be broadcasted before the ready.
            // on updated occurs when localStorage is updated outside of the application
            // and you may have services that need to query the data (such as session information)
            _this.$timeout(function () {
              _this.$rootScope.$broadcast("sls:updated", {
                key: persistKey
              });
            });
            _this.$rootScope.$digest();
          }
        });
      }
    },
    _sync: {

      /**
       * @ngdoc method
       * @private
       * @name AngularSyncLocalStorage#_sync
       *
       * @description
       * Creates a function that when called, updates values from a deserialized `localStorage` 
       * key (object) with an object, without destroying any references.
       *
       * @param {Object} storageService The storage mechanism, `localStorage` is used
       * @param {String} key The name of the property in the `storageService`
       * @param {Object} localObject The object that will be updated
       * @returns {Function} The function that performs the updates
       */

      value: function _sync(storageService, key, localObject) {
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
    },
    _mirrorLocalStorage: {

      /**
       * @ngdoc method
       * @private
       * @name AngularSyncLocalStorage#_mirrorLocalStorage
       *
       * @description
       * Creates a function that when called, updates the key in `localStorage` with an
       * object, if the object was updated. Also updates a key that serves the purpose of
       * as master container that will contain the most recently updated copy of the
       * containers. Used when windows have unique `localStorage` containers all of the
       * same group of data, but upon creation of a new window, you want the most recently
       * updated version of the data group to populate the new windows `localStorage` container
       *
       * @param {String} persistKey The storage mecha
       * @param {String} masterKey They key in `localStorage` that stores the master copy
       * @param {Bool} trackMaster Indicates if the master for this `localStorage` container should update
       */

      value: function _mirrorLocalStorage(persistKey, masterKey, trackMaster) {
        var _this = this;

        return function (ls, oldLs) {
          if (ls === oldLs) {
            // if it's the same object (nothing has changed), just return
            return;
          }
          _this._updateLocalStorage(persistKey, ls);
          if (trackMaster) {
            // update the master so it always has the most recent data
            _this._updateLocalStorage(masterKey, ls);
          }
        };
      }
    },
    syncLocalObj: {

      /**
       * @ngdoc method
       * @name AngularSyncLocalStorage#syncLocalObj
       *
       * @description
       * Updates a `localStorage` container with the values from an object if the container is
       * mapped to the object.
       * 
       * @param {Object} localObject The object that is mapped to a `localStorage` container
       * @param {String} masterKey They key in `localStorage` that stores the master copy
       * @returns {Object|undefined} The mapped object if it is found in localStorage, or undefined if not found
       */

      value: function syncLocalObj(localObject) {
        for (var key in this.localMap) {
          if (this.localMap[key] === localObject) {
            return this.syncMap[key](localObject);
          }
        }
      }
    },
    synchronize: {

      /**
       * @ngdoc method
       * @name AngularSyncLocalStorage#synchronize
       *
       * @description
       * Configures automatic synchronization between an object and a `localStorage` container
       * 
       * @param {Object} localObject The object that is synchronized the `localStorage` container
       * @param {String} persistKey They key for this container or group of containers
       * @param {Object} ops A map of options for configuring the behaviour of the synchronization
       * @param {Bool} ops.uniquePerWindow If true, the localStorage container will persist in each browser window, 
       *   but not between windows.
       * @param {Bool} ops.restoreFromMaster If `uniquePerWindow` and `restoreFromMaster` and `initialSync` are all 
       *   true, when a new window is created, its unique `localStorage` container will be initialized with the most 
       *   recently synchronized values to any of the unique window containers for the `localStorageKey`.
       * @param {Bool} ops.initialSync If true, the container will be synchronized with localStorage when it is 
       *   initialized. Otherwise, the reverse will happen; localStorage will be synchronized with the object.
       */

      value: function synchronize(localObject, persistKey, ops) {

        var localObjStringType = Object.prototype.toString.call(localObject);
        // only handle synchronization of hashes or arrays
        if (localObjStringType !== "[object Object]" && localObjStringType !== "[object Array]") {
          throw new Error("AngularSyncLocalStorage: object to synchronize with must be an hash or an array.");
        }
        // default options
        var options = {
          uniquePerWindow: false,
          restoreFromMaster: true,
          initialSync: true,
          version: 0
        },
            syncLocal = null,
            isNewLsVersion = false,
            synchronizeLocalStorage,
            trackMaster,
            masterKey,
            versionKey;

        if (!this._supportsLocalStorage()) {
          // silently die if there is no localStorage support
          return;
        }
        // merge options into default options
        angular.extend(options, ops);

        trackMaster = options.uniquePerWindow && options.restoreFromMaster && options.initialSync;

        if (options.version) {
          versionKey = persistKey + this._versionKeyPostfix;
          if (options.version !== this.localStorage[versionKey]) {
            // set that this is a new localStorage version
            isNewLsVersion = true;
            // finally, update the version in localStorage
            this.localStorage[versionKey] = options.version;
          }
          // they are equal, do nothing
        }

        if (options.uniquePerWindow) {
          // create or just make sure the window has it's unique identifier
          this.uniqueWindowIdentifier.ensure();
          // create a master key that will be used when creating new windows
          masterKey = persistKey + this._masterKeyPostfix;
          // modify the key so that it uses a unique store for this window
          persistKey += "_" + this.uniqueWindowIdentifier.get();
        }

        // remove the containers if it's a new version
        if (isNewLsVersion) {
          delete localStorage[persistKey];
          if (masterKey) {
            delete localStorage[masterKey];
          }
        }

        // at this point, the persist key is what we're going to want to synchronize with
        syncLocal = this._sync(this.localStorage, persistKey, localObject);

        if (options.initialSync) {
          // if we want to track master, we don't already have a value for this key, and master has a value
          // then make the new container a copy of master
          if (trackMaster && !this.localStorage[persistKey] && this.localStorage[masterKey]) {
            // restore the master onto this local
            this.localStorage[persistKey] = this.localStorage[masterKey];
          }
          // finally take what's in localStorage at this key now, and sync it to the local object
          syncLocal();
        }
        // create a map of key --> sync functions
        this.syncMap[persistKey] = this._mirrorLocalStorage(persistKey, masterKey, trackMaster);
        // set up to update localStorage only every debounce time
        // only affects performance of the other windows receiving the update
        // initially update if we haven't already synchronized ls --> obj
        synchronizeLocalStorage = this._debounce(this.syncMap[persistKey], this.providerInstance.debounceSyncDelay, !options.initialSync);
        this.localMap[persistKey] = localObject;
        // deep watch localObject for changes, update localStorage when whey occur
        this.$rootScope.$watch(function () {
          return localObject;
        }, synchronizeLocalStorage, true);

        // auto synchronize the data from other windows if the container is not unique-per window
        if (!options.uniquePerWindow) {
          this._autoSyncExternalUpdates(syncLocal, persistKey);
        }
      }
    }
  });

  return AngularSyncLocalStorage;
})();

//angular.module('angularSyncLocalStorage', ['angularUniqueWindow']).provider('synchronizedLocalStorage', AngularSyncLocalStorageProviderFactory)
//# sourceMappingURL=angular-sync-local-storage.js.map