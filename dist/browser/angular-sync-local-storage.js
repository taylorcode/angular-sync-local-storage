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
      value: function $get($rootScope, $window, $timeout, uniqueWindowIdentifier) {
        return new AngularSyncLocalStorage($rootScope, $window, $timeout, uniqueWindowIdentifier, this) // pass in the provider instance
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
  function AngularSyncLocalStorage($rootScope, $window, $timeout, uniqueWindowIdentifier, providerInstance) {
    _classCallCheck(this, AngularSyncLocalStorage);

    this.$rootScope = $rootScope;
    this.$window = $window;
    this.$timeout = $timeout;
    this.localStorage = $window.localStorage;
    this.supportsLocalStorage = supportsLocalStorage;
    this.debounce = debounce;
    this.sync = sync;
    this.providerInstance = providerInstance;
    this.uniqueWindowIdentifier = uniqueWindowIdentifier;
    this._masterKeyPostfix = "__master";
    this.syncMap = {};
    this.localMap = {};
  }

  _createClass(AngularSyncLocalStorage, {
    _updateLocalStorage: {
      value: function _updateLocalStorage(key, value) {
        this.localStorage[key] = angular.toJson(value);
      }
    },
    syncLocalObj: {
      value: function syncLocalObj(localObject) {
        for (var key in this.localMap) {
          if (this.localMap[key] === localObject) {
            return this.syncMap[key](localObject);
          }
        }
      }
    },
    synchronize: {
      value: function synchronize(localObject, persistKey, ops) {
        var _this = this;

        var localObjStringType = Object.prototype.toString.call(localObject);

        if (localObjStringType !== "[object Object]" && localObjStringType !== "[object Array]") {
          throw new Error("AngularSyncLocalStorage: object to synchronize with must be an hash or an array.");
        }

        var options = {
          uniquePerWindow: false,
          restoreFromMaster: true,
          initialSync: true
        },
            syncLocal = null,
            synchronizeLocalStorage,
            originalPersistKey,
            trackMaster,
            masterKey;

        // merge options into default options
        angular.extend(options, ops);

        trackMaster = options.uniquePerWindow && options.restoreFromMaster && options.initialSync;

        if (!this.supportsLocalStorage()) {
          // silently die if there is no localStorage support
          return;
        }

        if (options.uniquePerWindow) {
          // create or just make sure the window has it's unique identifier
          this.uniqueWindowIdentifier.ensure();
          // modify the key so that it uses a unique store for this window
          originalPersistKey = persistKey;
          masterKey = originalPersistKey + this._masterKeyPostfix;
          persistKey += "_" + this.uniqueWindowIdentifier.get();
        }

        syncLocal = this.sync(this.localStorage, persistKey, localObject);

        if (options.initialSync) {
          // if we want to initially sync, it will override what's currently in the local object with what is in localStorage
          if (!this.localStorage[persistKey] && trackMaster && this.localStorage[masterKey]) {
            // restore the master onto this local
            this.localStorage[persistKey] = this.localStorage[masterKey];
          }
          syncLocal();
        }

        // create a map of key --> sync functions
        var thing1 = function (persistKey, masterKey, trackMaster) {
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
        };

        this.syncMap[persistKey] = thing1(persistKey, masterKey, trackMaster);

        // set up to update localStorage only every debounce time
        // only affects performance of the other windows receiving the update
        synchronizeLocalStorage = this.debounce(this.syncMap[persistKey], this.providerInstance.debounceSyncDelay, !options.initialSync); // initially update if we haven't already synchronized ls --> obj

        this.localMap[persistKey] = localObject;

        // deep watch localObject for changes, update localStorage when whey occur
        this.$rootScope.$watch(function () {
          return localObject;
        }, synchronizeLocalStorage, true);

        // listen for storage changes, notify
        var thing2 = function (syncLocal, originalPersistKey, persistKey) {
          _this.$window.addEventListener("storage", function () {
            if (syncLocal()) {
              // NOTE timeout is needed because this has the potential to be broadcasted before the ready
              // event is fired in jquery where this is being listened for
              // on updated occurs when localStorage is updated outside of the application
              // and you may have services that need to query the data (such as session information)
              _this.$timeout(function () {
                _this.$rootScope.$broadcast("sls:updated", {
                  key: originalPersistKey || persistKey
                });
              });
              _this.$rootScope.$digest();
            }
          });
        };

        thing2(syncLocal, originalPersistKey, persistKey);
      }
    }
  });

  return AngularSyncLocalStorage;
})();

angular.module("angularSyncLocalStorage", ["angularUniqueWindow"]).provider("synchronizedLocalStorage", AngularSyncLocalStorageProviderFactory);

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