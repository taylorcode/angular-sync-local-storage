var angular = require('angular-node');
var SyncLocalStorageProviderFactory = require('../dist/browser/angular-sync-local-storage')//.AngularSyncLocalStorageProviderFactory;

describe('automatic localStorage synchronization', function () {

	it('should do something', function () {
		console.log(SyncLocalStorageProviderFactory);
		expect(1).toBe(1)
		// register the service with angular, execute the test

	});

});
