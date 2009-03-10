/**
 * Launch the auto update for the application
 * 
 * - http://help.adobe.com/en_US/AIR/1.5/jslr/air/update/ApplicationUpdater.html
 *   a lot of doc i missed at first
 * - http://help.adobe.com/en_US/AIR/1.5/jslr/air/update/ApplicationUpdaterUI.html
 * - NOTE: if the updateURL point on a unreachable host, it will freeze when the
 *   application quits
 */
function handle_autoupdate(updateURL)
{
	// instantiate an updater object
	var appUpdater = new runtime.air.update.ApplicationUpdaterUI();

    
	function onUpdate(event){
		//starts the update process
		appUpdater.checkNow();
	}
 
	function onError(event) {
		alert(event);
	}

	// we set the URL for the update.xml file
	appUpdater.updateURL = updateURL;
	// we set the event handlers for INITIALIZED nad ERROR
	appUpdater.addEventListener(runtime.air.update.events.UpdateEvent.INITIALIZED, onUpdate);
	appUpdater.addEventListener(runtime.flash.events.ErrorEvent.ERROR, onError);
	// we can hide the dialog asking for permission for checking for a new update;
	// if you want to see it just leave the default value (or set true).
	appUpdater.isCheckForUpdateVisible	= false;
	// if isFileUpdateVisible is set to true, File Update, File No Update, 
	// and File Error dialog boxes will be displayed
	appUpdater.isFileUpdateVisible		= true;
	// if isInstallUpdateVisible is set to true, the dialog box for installing the update is visible
	appUpdater.isInstallUpdateVisible	= true;
	// we initialize the updater
	appUpdater.initialize();
}