/*
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
	var appUpdater = new runtime.air.update.ApplicationUpdaterUI();
	function checkUpdate(updateURL) {
		// we set the URL for the update.xml file
		appUpdater.updateURL	= updateURL;
		//we set the event handlers for INITIALIZED nad ERROR
		appUpdater.addEventListener(runtime.air.update.events.UpdateEvent.INITIALIZED, onUpdate);
		appUpdater.addEventListener(runtime.flash.events.ErrorEvent.ERROR, onError);
		//we can hide the dialog asking for permission for checking for a new update;
		//if you want to see it just leave the default value (or set true).
		appUpdater.isCheckForUpdateVisible	= true;
		//if isFileUpdateVisible is set to true, File Update, File No Update, 
		//and File Error dialog boxes will be displayed
		appUpdater.isFileUpdateVisible		= true;
		//if isInstallUpdateVisible is set to true, the dialog box for installing the update is visible
		appUpdater.isInstallUpdateVisible	= true;
		 //we initialize the updater
		appUpdater.initialize();
	}
	function onUpdate(event) {
		//starts the update process
		appUpdater.checkNow();
	}
	function onError(event) {
		alert(event);
	}	
	
	// return public functions and variables
	return {
		checkUpdate:	checkUpdate
	};	
}