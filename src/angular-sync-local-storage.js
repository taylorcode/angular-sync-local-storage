/**
 * @ngdoc provider
 * @name AngularSyncLocalStorageProviderFactory
 *
 * @description
 * Allows configuration of an instance of AngularSyncLocalStorage.
 * 
 */
export function AngularSyncLocalStorageProviderFactory () {
  return new AngularSyncLocalStorageProvider
}

/**
 * @ngdoc class
 * @name AngularSyncLocalStorageProvider
 *
 * @description
 * Class definition for the `AngularSyncLocalStorage` provider. 
 * 
 */
class AngularSyncLocalStorageProvider {
  constructor() {
    this.debounceSyncDelay = 300
  }
  $get($rootScope, $window, $timeout, uniqueWindowIdentifier) {
    return new AngularSyncLocalStorage($rootScope, $window, $timeout, uniqueWindowIdentifier, this) // pass in the provider instance
  }
}

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
class AngularSyncLocalStorage {

  constructor($rootScope, $window, $timeout, uniqueWindowIdentifier, providerInstance) {
    this.$rootScope = $rootScope
    this.$window = $window
    this.$timeout = $timeout
    this.localStorage = $window.localStorage
    this.providerInstance = providerInstance
    this.uniqueWindowIdentifier = uniqueWindowIdentifier
    this._masterKeyPostfix = '__master'
    this._versionKeyPostfix = '__version'
    this.syncMap = {}
    this.localMap = {}
  }

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
  _supportsLocalStorage() {
    var testKey = 'test',
        storage = this.$window.localStorage
    try {
      storage.setItem(testKey, '1')
      storage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    } 
  }

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
  _debounce(func, wait, immediate) {
    var timeout
    return function() {
      var context = this, args = arguments
      var later = function() {
        timeout = null
        if (!immediate) func.apply(context, args)
      }
      var callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(context, args)
    }
  }

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
  _updateLocalStorage(key, value) {
    this.localStorage[key] = angular.toJson(value)
  }

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
  _autoSyncExternalUpdates(syncLocal, persistKey) {
    // bind a new event listener for this local object and persist key
    this.$window.addEventListener('storage', () => {
      if(syncLocal()) {
        // NOTE timeout is needed because this has the potential to be broadcasted before the ready.
        // on updated occurs when localStorage is updated outside of the application
        // and you may have services that need to query the data (such as session information)
        this.$timeout(() => {
          this.$rootScope.$broadcast('sls:updated', {
            key: persistKey
          })
        })
        this.$rootScope.$digest()
      }
    })
  }

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
  _sync(storageService, key, localObject) {
    return () => {
      var fromStorageContainer
      // if there's no container (such as localStorage, then create it)
      if(!storageService[key]) {
        return false
      } else {
        fromStorageContainer = angular.fromJson(storageService[key])
        // if the storage containers stuff isn't the same as the local object
        if (!angular.equals(localObject, fromStorageContainer)) {
          // update the local object with the storage containers stuff
          taylorcode.updateModel(localObject, fromStorageContainer)
          return true
        }
        return false
      }
    }
  }

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
  _mirrorLocalStorage(persistKey, masterKey, trackMaster) {
    return (ls, oldLs) => {
      if(ls === oldLs) {
        // if it's the same object (nothing has changed), just return
        return
      }
      this._updateLocalStorage(persistKey, ls)
      if(trackMaster) {
        // update the master so it always has the most recent data
        this._updateLocalStorage(masterKey, ls)
      }
    }
  }

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
  syncLocalObj(localObject) {
    for(var key in this.localMap) {
      if(this.localMap[key] === localObject) {
        return this.syncMap[key](localObject)
      }
    }
  }

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
  synchronize(localObject, persistKey, ops) {

    let localObjStringType = Object.prototype.toString.call(localObject)
    // only handle synchronization of hashes or arrays
    if(localObjStringType !== '[object Object]' && localObjStringType !== '[object Array]') {
      throw new Error('AngularSyncLocalStorage: object to synchronize with must be an hash or an array.')
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
    synchronizeLocalStorage, trackMaster, masterKey, versionKey

    if(!this._supportsLocalStorage()) {
      // silently die if there is no localStorage support
      return
    }
    // merge options into default options
    angular.extend(options, ops)

    trackMaster = options.uniquePerWindow && options.restoreFromMaster && options.initialSync

    if(options.version) {
      versionKey = persistKey + this._versionKeyPostfix
      if(options.version !== this.localStorage[versionKey]) {
        // set that this is a new localStorage version
        isNewLsVersion = true
        // finally, update the version in localStorage
        this.localStorage[versionKey] = options.version
      }
      // they are equal, do nothing
    }

    if(options.uniquePerWindow) {
      // create or just make sure the window has it's unique identifier
      this.uniqueWindowIdentifier.ensure()
      // create a master key that will be used when creating new windows
      masterKey = persistKey + this._masterKeyPostfix
      // modify the key so that it uses a unique store for this window
      persistKey += '_' + this.uniqueWindowIdentifier.get()
    }

    // remove the containers if it's a new version
    if(isNewLsVersion) {
      delete localStorage[persistKey]
      if(masterKey) {
        delete localStorage[masterKey]
      }
    }

    // at this point, the persist key is what we're going to want to synchronize with
    syncLocal = this._sync(this.localStorage, persistKey, localObject)

    if (options.initialSync) {
      // if we want to track master, we don't already have a value for this key, and master has a value
      // then make the new container a copy of master
      if (trackMaster && !this.localStorage[persistKey] && this.localStorage[masterKey]) {
        // restore the master onto this local
        this.localStorage[persistKey] = this.localStorage[masterKey]
      }
      // finally take what's in localStorage at this key now, and sync it to the local object
      syncLocal()
    }
    // create a map of key --> sync functions
    this.syncMap[persistKey] = this._mirrorLocalStorage(persistKey, masterKey, trackMaster)
    // set up to update localStorage only every debounce time
    // only affects performance of the other windows receiving the update
    // initially update if we haven't already synchronized ls --> obj
    synchronizeLocalStorage = this._debounce(this.syncMap[persistKey], this.providerInstance.debounceSyncDelay, !options.initialSync)
    this.localMap[persistKey] = localObject
    // deep watch localObject for changes, update localStorage when whey occur
    this.$rootScope.$watch(() => {
      return localObject
    }, synchronizeLocalStorage, true)

    // auto synchronize the data from other windows if the container is not unique-per window
    if(!options.uniquePerWindow) {
      this._autoSyncExternalUpdates(syncLocal, persistKey)
    }
  }
}

//angular.module('angularSyncLocalStorage', ['angularUniqueWindow']).provider('synchronizedLocalStorage', AngularSyncLocalStorageProviderFactory)
