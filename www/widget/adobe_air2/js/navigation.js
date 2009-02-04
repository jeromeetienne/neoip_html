/********************************************************************************/
/********************************************************************************/
/*		experimentation							*/
/********************************************************************************/
/********************************************************************************/
function gotoBottomRight()
{
	nativeWindow.x	= ( air.Capabilities.screenResolutionX - nativeWindow.width );
	nativeWindow.y	= ( air.Capabilities.screenResolutionY - nativeWindow.height );
}

function toSize(size_str)
{
	if( size_str == "small" ){
		nativeWindow.height	= 160;
		nativeWindow.width	= 120;
	}else{
		nativeWindow.height	= 320;
		nativeWindow.width	= 240;
	}
}

function alwaysOnTop()
{
	nativeWindow.alwaysInFront	= true;
}

function gotoPicInPic()
{
	// set it always in front
	nativeWindow.alwaysInFront	= true;

	// set window position	                
	var win_w	= 320*2/3;
	var win_h	= 240*2/3;
	var bounds	= new air.Rectangle(air.Capabilities.screenResolutionX - win_w,
					    air.Capabilities.screenResolutionY - win_h,
					    win_w, win_h);
	nativeWindow.bounds	= bounds;	
}

/********************************************************************************/
/********************************************************************************/
/*		appUpdater Stuff							*/
/********************************************************************************/
/********************************************************************************/

function appUpdaterCheckUpdate() {
	air.trace("air updater checkupdate");	
	var updater	= new runtime.air.update.ApplicationUpdaterUI();
	// we set the URL for the update.xml file
	updater.updateURL = "http://urfastr.net/static/player/widget/adobe_air2/update.xml";
	// we set the event handlers for INITIALIZED nad ERROR
	updater.addEventListener(runtime.air.update.events.UpdateEvent.INITIALIZED	, appUpdaterOnUpdate);
	updater.addEventListener(runtime.flash.events.ErrorEvent.ERROR			, appUpdaterOnError);
	// we can hide the dialog asking for permission for checking for a new update;
	// if you want to see it just leave the default value (or set true).
	updater.isCheckForUpdateVisible	= false;
	// if isFileUpdateVisible is set to true, File Update, File No Update, 
	// and File Error dialog boxes will be displayed
	updater.isFileUpdateVisible	= false;
	// if isInstallUpdateVisible is set to true, the dialog box for installing the update is visible
	updater.isInstallUpdateVisible	= false;
	// we initialize the updater
	updater.initialize();
}
			
function appUpdaterOnUpdate(event) {
	var updater	= new runtime.air.update.ApplicationUpdaterUI();
	//starts the update process
	updater.checkNow();
}

function appUpdaterOnError(event) {
	alert(event);
}

/********************************************************************************/
/********************************************************************************/
/*		winPlayer Stuff							*/
/********************************************************************************/
/********************************************************************************/

var winPlayerLoader	= null;
function winPlayerOpen(options)
{
	// if it is already open, return now
	if( winPlayerLoader )	return;
	// handle the default options
	options		= options || {	'chrome': 	false,
					'position':	'bottomright',
					'size':		'small',
					'stayInFront':	true
					};
	// get winopts for the window
	var winopts		= new air.NativeWindowInitOptions();

	if(options.chrome == false){
		winopts.systemChrome	= air.NativeWindowSystemChrome.NONE;
		winopts.transparent	= true;
	}
	if(options.size	== "small"){
		var win_w	= 320*2/3;
		var win_h	= 240*2/3;
	}else if(options.size	== "medium"){
		var win_w	= 320*2;
		var win_h	= 240*2;
	}
	if(options.position == "center"){
		var win_x	= (air.Capabilities.screenResolutionX - win_w)/2;
		var win_y	= (air.Capabilities.screenResolutionY - win_h)/2;
	}else if(options.position == "bottomright"){
		var win_x	= air.Capabilities.screenResolutionX - win_w;
		var win_y	= air.Capabilities.screenResolutionY - win_h;		
	}

	// create a new window
	var bounds	= new air.Rectangle(win_x, win_y,win_w, win_h);	
	loader		= air.HTMLLoader.createRootWindow( true, winopts, true, bounds );
	// set it always in front
	if(options.stayInFront)	loader.stage.nativeWindow.alwaysInFront	= true;	
        loader.load( new air.URLRequest('html/player_window.html') );
	loader.stage.nativeWindow.activate();
	
	winPlayerLoader	= loader;
}
function winPlayerClose()
{
	// if it is already closed, return now
	if( !winPlayerLoader )	return;

	winPlayerLoader.stage.nativeWindow.close();
	winPlayerLoader	= null;
}
function winPlayerIsOpened()
{
	if( winPlayerLoader )	return true;
	return false;
}


/********************************************************************************/
/********************************************************************************/
/*		TO COMMENT							*/
/********************************************************************************/
/********************************************************************************/

function myOnLoadCallback()
{
	//nativeWindow.visible	= true;

	systrayInit();
	air.trace("post systray init");
	
	// set the startAtLogin
	// - it is known to fails thru adl
	try{
		air.NativeApplication.nativeApplication.startAtLogin = true;
	}catch(e){air.trace(e);	}

	
	//setTimeout(appUpdaterCheckUpdate, 1000);
	
	//air.navigateToURL(new air.URLRequest('http://google.com'));
}
window.onload	= myOnLoadCallback;



/********************************************************************************/
/********************************************************************************/
/*		systray stuff							*/
/********************************************************************************/
/********************************************************************************/
function systrayInit()
{
	// Loader to load the icon image
	// Use Loader not HTML image to get at bitmap data (pixels)
	var loader = new air.Loader();
	
	// Handle when the icon image is loaded
	// Load the icon image (in this case local)
	loader.contentLoaderInfo.addEventListener(air.Event.COMPLETE, systrayLoaderOnComplete );
	loader.load( new air.URLRequest("images/thumbnail-48.png") );
}


// Called when the icon image is loaded
// Setup systray/dock actions depending on operating system
function systrayLoaderOnComplete( evt )
{
	var isMac = null;
	
	// Get the bitmap data (pixels) of the icon for the system
	// The system will size and convert to the appropriate format
	var 	imgDock	= evt.target.content.bitmapData;
	air.NativeApplication.nativeApplication.icon.bitmaps = [imgDock];
	
	if( air.NativeApplication.supportsSystemTrayIcon ){
		// Setup Windows specific system tray functionality
		var tooltip_str	= "UrFastR Player, your TV just a click away!"
		air.NativeApplication.nativeApplication.icon.tooltip = tooltip_str;
		air.NativeApplication.nativeApplication.icon.addEventListener(air.MouseEvent.CLICK, systrayOnClick );		
		
		isMac = false;
	}else{
		isMac = true;
	}

	// Setup a menu on the docked icon to restore or close
	var	myMenu	= NativeMenuCreate( isMac );
	air.NativeApplication.nativeApplication.icon.menu = myMenu;
}


// Called when the docked icon is clicked (Windows only)
// Calls a shared function to restore the window
function systrayOnClick( evt )
{
	if( winPlayerIsOpened() )	winPlayerClose();
	else				winPlayerOpen();
}


// Called with the dock item to open the window is selected
// Calls a shared function to open (restore) the window
function NativeMenuOnSelect( evt )
{
	// log to debug
	air.trace("Selected command: PRE"); 
	air.trace("Selected command: " + evt.target.label); 
	air.trace("Selected command: POST"); 

	if( evt.target.label == "Open" ){
		winPlayerClose();
		winPlayerOpen({	'chrome': 	true,
				'position':	'center',
				'size':		'medium',
				'stayInFront':	false
				})
	}else if( evt.target.label == "About" ){
		var url	= 'http://urfastr.net';
		air.navigateToURL(new air.URLRequest(url));
	}else if( evt.target.label == "Quit" ){
		winPlayerClose();
		nativeWindow.close();	
	}
}

// Called to create a menu on the systray/dock icon
// Takes operating system into consideration
function NativeMenuCreate( isMac )
{
	var menu	= new air.NativeMenu();
	var menuItem	= null;

	// install the menuitem 'open'
	menuItem	= new air.NativeMenuItem("Open" );
	menuItem.addEventListener(air.Event.SELECT, NativeMenuOnSelect );	
	menu.addItem( menuItem );
	// install the menuitem 'about'
	menuItem	= new air.NativeMenuItem("About" );
	menuItem.addEventListener(air.Event.SELECT, NativeMenuOnSelect );	
	menu.addItem( menuItem );
	
	if( !isMac ){
		// Mac provides built-in "Quit" item
		// Create an "Exit" item for Windows
		// install the menuitem 'quit'
		menuItem	= new air.NativeMenuItem("Quit");
		menuItem.addEventListener(air.Event.SELECT, NativeMenuOnSelect );	
		menu.addItem( menuItem );
	}
	// return the menu itself
	return menu;	
}

