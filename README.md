# angularSyncLocalStorage

Angular automatic data persistance using Local Storage. Automatically synchronizes data models across windows. Also allows creation of unique, persisted localStorage containers per browser window.

### Basic Setup

First, add this module to your application:

	angular.module('myApp', ['angularSyncLocalStorage'])

### Methods

#### synchronizedLocalStorage.synchronize(localContainer, localStorageKey, options)

	let myContainer = {}

	synchronizedLocalStorage.synchronize(myContainer, 'my-key')

In this example, `myContainer` will automatically be synchronized with the `my-key` property in localStorage. This synchronization occurs across browser windows, so the `myContainer` objects in all windows will be identical.


##### Options (defaults specified)

	{
		uniquePerWindow: false,
		restoreFromMaster: true,
		initialSync: true,
		version: 0
	}

`Options` is an optional parameter.

If `uniquePerWindow` is `true`, the localStorage container will persist in each browser window, but not between windows.


If `uniquePerWindow` and `restoreFromMaster` and `initialSync` are all `true`, when a new window is created, its unique `localStorage` container will be initialized with the most recently synchronized values to any of the unique window containers for the `localStorageKey`.

If `initialSync` is `true`, the container will be synchronized with localStorage when it is initialized. Otherwise, the reverse will happen; localStorage will be synchronized with the object.

If `version` is not 0, and the version is updated, the container and the master (if `uniquePerWindow` is `true`) will be cleared. This helps to prevent synchronization issues that occur with old data models.

### Configuration

By default, `angularSyncLocalStorage` is configured to synchronize localStorage with your object in `300ms`. You can configure this value on the provider with:

	synchronizedLocalStorageProvider.debounceSyncDelay = 300

### Improvements

- I'm considering adding the ability to synchronize using a deep `extend` functionality when `uniquePerWindow` is `false`. This will allow a cumulative effect of data synchronization, instead of the last-updated windows value always persisting.