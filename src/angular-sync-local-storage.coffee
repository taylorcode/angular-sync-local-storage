'use strict'

###*
 # @ngdoc overview
 # @name angularSyncLocalStorage
 # @description
 # Allows you to automatically synchronize an object with localStorage across browser windows using angular's digest cycle.
###

angular.module('angularSyncLocalStorage', [])

.provider 'synchronizedLocalStorage', ->

	DEBOUNCE_SYNC = 500 # default debounce delay for synchronization
	
	# removes all values from properties of an object while keeping
	# its hash structure
	cleanObj = (obj, deep) ->
	  _.each obj, (v, prop) ->
	    if not deep
	    	delete obj[prop]
	    	return
	    # delete if it's primitive
	    if _.isString(v) or _.isNumber(v)
	      delete obj[prop]
	      return
	    # iterate and recurse if it's an array
	    if _.isArray(v)
	      _.each v, (item) ->
	        cleanObj item, deep
	      return
	    # it's a normal object, recurse
	    cleanObj v, deep
	  obj

	# reliable test for local storage browser support
	supportsLocalStorage = ->
        testKey = 'test'
        storage = window.localStorage
        try
            storage.setItem testKey, '1'
            storage.removeItem testKey
            return true
        catch error
            return false
	   
	setup: (config) ->

		DEBOUNCE_SYNC = config.delay

	$get: ($rootScope, $window, $timeout) ->

		localStorage = $window.localStorage

		synchronize: (sessionContainer, localKey, initialSync = true) ->

			return if not supportsLocalStorage()

			# sync localStorage and scope
			syncLocal = ->
				localObj = angular.fromJson(localStorage[localKey]) or {}
				if not sessionContainer
					sessionContainer = localObj
					return true
				if not angular.equals sessionContainer, localObj
					# extend with jQuery because it's deep
					$.extend true, cleanObj(sessionContainer, true), localObj
					return true
				false

			# merge/replace properties
			syncLocal() if initialSync # don't do it intially, because this will replace the current storage with the storage from another window
			
			# if localStorage is supported, synchonize the $localStorage data modal with localStorage			
			synchronizeLocalStorage = _.debounce (ls) =>
				localStorage[localKey] = angular.toJson ls
			, DEBOUNCE_SYNC
			
			# NOTE this fires initially, even though it (logically) shouldnt because its already synchronized
			# watch for changes to the session container and synchronize localStorage
			$rootScope.$watch ->
				sessionContainer
			, synchronizeLocalStorage, true
			#scope.$watch scopeKey, synchronizeLocalStorage, true
			
			# when storage is updated (perhaps in another window) re-synchronize localStorage --> scope
			$window.addEventListener 'storage', (event) ->
				if syncLocal()
					# NOTE timeout is needed because this has the potential to be broadcasted before the ready 
					# event is fired in jquery where this is being listened for
					# on updated occurs when localStorage is updated outside of the application
					# and you may have services that need to query the data (such as session information)
					$timeout -> $rootScope.$broadcast 'sls:updated'
				$rootScope.$digest()
