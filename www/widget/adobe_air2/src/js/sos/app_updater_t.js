/**
 * - i did a schedule algo but i make this function failed badly
 *   - im guessing this is due to the multiple init of the misterious swf
 *   - because checking it only once is working
 *   - TODO sort this out
 * - http://help.adobe.com/en_US/AIR/1.5/jslr/air/update/ApplicationUpdater.html
 *   a lot of doc i missed at first
 * - http://help.adobe.com/en_US/AIR/1.5/jslr/air/update/ApplicationUpdaterUI.html
 *
 * - TODO to test this function a lot more
 * - TODO some clean up may be apreciated too :)
 * - updater probe: the fact of contacting the release server to determine the
 *   most uptodate version.
 * - When to trigger the autoupdate probe ?
 *   - put some random in it to avoid useless peack
 *   - handle max/min delay between probes
 * - handle multiple probes if the application run longer than expected
 * - find a proper algorithm and code it once and for all
*/
var app_updater_t = function(){
	// instantiate an updater object
	var appUpdater	= new runtime.air.update.ApplicationUpdaterUI();

	/**
	 * Start the operation
	 * - options.updateUrl: the url where to fetch the update xml file
	 * - options.mindelay_success: how many ms between 2 successfull update check
	*/
	var start	= function(updateURL){
		checkUpdate(updateURL);
	}

	/**
	 * - TODO find a better name for this function
	*/
	var checkUpdate	= function(updateURL) {
		// log to debug
		air.trace('checkupdate now');
		// we set the URL for the update.xml file
		appUpdater.updateURL	= updateURL;
		//we set the event handlers for INITIALIZED nad ERROR
		appUpdater.addEventListener(runtime.air.update.events.UpdateEvent.INITIALIZED, onUpdate);
		appUpdater.addEventListener(runtime.flash.events.ErrorEvent.ERROR, onError);
		// we can hide the dialog asking for permission for checking for a new update;
		// if you want to see it just leave the default value (or set true).
		appUpdater.isCheckForUpdateVisible	= true;
		// if isFileUpdateVisible is set to true, File Update, File No Update, 
		// and File Error dialog boxes will be displayed
		appUpdater.isFileUpdateVisible		= true;
		// if isInstallUpdateVisible is set to true, the dialog box for installing the update is visible
		appUpdater.isInstallUpdateVisible	= true;
		 // we initialize the updater
		appUpdater.initialize();
	}
	/**
	 * TODO to comment
	 * - it is unclear when this function is called
	 * - apparently this is called, even when no update is available
	 * - so even more is an update is avialable but rejected by the user...
	 * - AKA beuark function
	*/	
	var onUpdate	= function(event){
		appUpdater.cancelUpdate();
		appUpdater.removeEventListener(runtime.air.update.events.UpdateEvent.INITIALIZED, onUpdate);
		appUpdater.removeEventListener(runtime.flash.events.ErrorEvent.ERROR, onError);
		appUpdater	= null;
		return;
		// log to debug
		air.trace('onUpdate is called');
		air.trace(event);
		//starts the update process
		appUpdater.checkNow();
	}
	/**
	 * TODO to comment
	 * - it is unclear when this function is called
	*/	
	var onError	= function(event) {
		// log to debug
		air.trace('onError is called');
		air.trace(event);
	}
	
	// return public functions and variables
	return {
		start:	start
	};	
}