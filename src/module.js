import AngularSyncLocalStorageProviderFactory from './angular-sync-local-storage'

angular.module('angularSyncLocalStorage', ['angularUniqueWindow'])

.provider('synchronizedLocalStorage', AngularSyncLocalStorageProviderFactory)
