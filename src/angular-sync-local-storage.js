'use strict';

/**
  * @ngdoc overview
  * @name angularSyncLocalStorage
  * @description
  * Allows you to automatically synchronize an object with localStorage across browser windows using angular's digest cycle.
 */

class AngularSyncLocalStorageProvider {
  constructor() {
    this.debounceSyncDelay = 300
  }
  $get($rootScope, $window, $timeout, uniqueWindowIdentifier) {
    return new AngularSyncLocalStorage($rootScope, $window, $timeout, uniqueWindowIdentifier, this) // pass in the provider instance
  }
}

function AngularSyncLocalStorageProviderFactory () {
  return new AngularSyncLocalStorageProvider
}

class AngularSyncLocalStorage {

  constructor($rootScope, $window, $timeout, uniqueWindowIdentifier, providerInstance) {
    this.$rootScope = $rootScope
    this.$window = $window
    this.$timeout = $timeout
    this.localStorage = $window.localStorage
    this.supportsLocalStorage = supportsLocalStorage
    this.debounce = debounce
    this.sync = sync
    this.providerInstance = providerInstance
    this.uniqueWindowIdentifier = uniqueWindowIdentifier
    this._masterKeyPostfix = '__master'
  }

  _updateLocalStorage(key, value) {
    this.localStorage[key] = angular.toJson(value)
  }

  synchronize(localObject, persistKey, ops) {

    let localObjStringType = Object.prototype.toString.call(localObject)

    if(localObjStringType !== '[object Object]' && localObjStringType !== '[object Array]') {
      throw new Error('AngularSyncLocalStorage: object to synchronize with must be an hash or an array.')
    }

    var options = {
      uniquePerWindow: false,
      restoreFromMaster: true,
      initialSync: true
    },
    syncLocal = null,
    synchronizeLocalStorage, originalPersistKey, trackMaster, masterKey

    // merge options into default options
    angular.extend(options, ops)

    trackMaster = options.uniquePerWindow && options.restoreFromMaster && options.initialSync

    if(!this.supportsLocalStorage()) {
      // silently die if there is no localStorage support
      return
    }

    if(options.uniquePerWindow) {
      // create or just make sure the window has it's unique identifier
      this.uniqueWindowIdentifier.ensure()
      // modify the key so that it uses a unique store for this window
      originalPersistKey = persistKey
      masterKey = originalPersistKey + this._masterKeyPostfix
      persistKey += '_' + this.uniqueWindowIdentifier.get()
    }

    syncLocal = this.sync(this.localStorage, persistKey, localObject)

    if (options.initialSync) {
      // if we want to initially sync, it will override what's currently in the local object with what is in localStorage
      if(this.localStorage[persistKey]) {
        // restore either from single place or unique window (ex on a refresh)
        syncLocal()
      } else if(trackMaster) {
        // restore from master (this is a unique window that is being opened for the first time)
        this.sync(this.localStorage, masterKey, localObject)()
      }

    }
    // set up to update localStorage only every debounce time
    // only affects performance of the other windows receiving the update
    synchronizeLocalStorage = this.debounce((ls, oldLs) => {
      if(ls === oldLs) {
        // if it's the same object (nothing has changed), just return
        return
      }
      this._updateLocalStorage(persistKey, ls)
      if(trackMaster) {
        // update the master so it always has the most recent data
        this._updateLocalStorage(masterKey, ls)
      }
    }, this.providerInstance.debounceSyncDelay, !options.initialSync) // initially update if we haven't already synchronized ls --> obj

    // deep watch localObject for changes, update localStorage when whey occur
    this.$rootScope.$watch(() => {
      return localObject
    }, synchronizeLocalStorage, true)

    // listen for storage changes, notify
    this.$window.addEventListener('storage', () => {
      if(syncLocal()) {
        // NOTE timeout is needed because this has the potential to be broadcasted before the ready 
        // event is fired in jquery where this is being listened for
        // on updated occurs when localStorage is updated outside of the application
        // and you may have services that need to query the data (such as session information)
        this.$timeout(() => {
          this.$rootScope.$broadcast('sls:updated', {
            key: originalPersistKey || persistKey
          })
        })
        this.$rootScope.$digest()
      }
    })
  }
}

angular.module('angularSyncLocalStorage', ['angularUniqueWindow']).provider('synchronizedLocalStorage', AngularSyncLocalStorageProviderFactory)

// helper functions - move to better place
function supportsLocalStorage() {
  var testKey = 'test',
      storage = window.localStorage
  try {
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}
// remove dependency of underscore
function debounce(func, wait, immediate) {
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

function sync(storageService, key, localObject) {
  return function () {
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