

/********************************************************************************/
/********************************************************************************/
/*		appUpdater Stuff	- based on flash version		*/
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
// - TODO put all this in a js object
//   - no need to drag all those functions
//   - even more as some are private
//   - need to get the pos/size memorized from one spawn to another
//   - split the chromedPlayer to the nochrome one
//     - find good names

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
		// TODO should i make this transparent? level of transparency
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
	}else if(options.position == "topleft"){
		var win_x	= 0;
		var win_y	= 0;
	}else if(options.position == "topright"){
		var win_x	= air.Capabilities.screenResolutionX - win_w;
		var win_y	= 0;		
	}else if(options.position == "bottomleft"){
		var win_x	= 0;
		var win_y	= air.Capabilities.screenResolutionY - win_h;		
	}else if(options.position == "bottomright"){
		var win_x	= air.Capabilities.screenResolutionX - win_w;
		var win_y	= air.Capabilities.screenResolutionY - win_h;		
	}

	// create a new window
	var bounds	= new air.Rectangle(win_x, win_y,win_w, win_h);	
	loader		= air.HTMLLoader.createRootWindow( true, winopts, true, bounds );
	// set it always in front
	if(options.stayInFront)	loader.stage.nativeWindow.alwaysInFront	= true;	
        loader.load( new air.URLRequest('app:/html/player_window.html') );
	loader.addEventListener(air.Event.COMPLETE, winPlayerOnComplete);
	loader.stage.nativeWindow.activate();
	
	winPlayerLoader	= loader;
}
function winPlayerClose()
{
	// if it is already closed, return now
	if( !winPlayerLoader )	return;

	// remove the complete event if needed
	winPlayerLoader.removeEventListener(air.Event.COMPLETE, winPlayerOnComplete);

	// remove icon events
	var myDoc	= winPlayerLoader.window.document;
	var iconMove	= myDoc.getElementById("iconMoveWin");
	iconMove.removeEventListener("mousedown"	, winPlayerOnMove);
	iconMove.removeEventListener("mouseup"		, winPlayerOnMoved);
	var iconResize	= myDoc.getElementById("iconResizeWin");
	iconResize.removeEventListener("mousedown"	, winPlayerOnResize);
	iconResize.removeEventListener("mouseup"	, winPlayerOnResized);
	var iconClose	= myDoc.getElementById("iconCloseWin");
	iconClose.removeEventListener("mousedown"	, winPlayerOnClose);

	// close the window
	winPlayerLoader.stage.nativeWindow.close();
	// mark it as closed
	winPlayerLoader	= null;
}
function winPlayerIsOpened()
{
	if( winPlayerLoader )	return true;
	return false;
}
function winPlayerOnComplete()
{
	var myDoc	= winPlayerLoader.window.document;
	var iconMove	= myDoc.getElementById("iconMoveWin");
	iconMove.addEventListener("mousedown"	, winPlayerOnMove	, true);
	iconMove.addEventListener("mouseup"	, winPlayerOnMoved	, true);
	var iconResize	= myDoc.getElementById("iconResizeWin");
	iconResize.addEventListener("mousedown"	, winPlayerOnResize	, true);	
	iconResize.addEventListener("mouseup"	, winPlayerOnResized	, true);	
	var iconClose	= myDoc.getElementById("iconCloseWin");
	iconClose.addEventListener("mousedown"	, winPlayerOnClose	, true);
}

function winPlayerOnMove(event)
{
	var win	= winPlayerLoader.stage.nativeWindow;
	win.startMove();
}
function winPlayerCoordFromPosition(position)
{
	var win		= winPlayerLoader.stage.nativeWindow;
	var win_w	= win.width;
	var win_h	= win.height;
	
	if(position == "center"){
		var win_x	= (air.Capabilities.screenResolutionX - win_w)/2;
		var win_y	= (air.Capabilities.screenResolutionY - win_h)/2;
	}else if(position == "topleft"){
		var win_x	= 0;
		var win_y	= 0;
	}else if(position == "topright"){
		var win_x	= air.Capabilities.screenResolutionX - win_w;
		var win_y	= 0;		
	}else if(position == "bottomleft"){
		var win_x	= 0;
		var win_y	= air.Capabilities.screenResolutionY - win_h;		
	}else if(position == "bottomright"){
		var win_x	= air.Capabilities.screenResolutionX - win_w;
		var win_y	= air.Capabilities.screenResolutionY - win_h;		
	}
	return {x: win_x, y: win_y};
}

function winPlayerGotoXY(dst_x, dst_y, old_x, old_y)
{
	var win		= winPlayerLoader.stage.nativeWindow;
	var delta_x	= dst_x - win.x;
	var delta_y	= dst_y - win.y;
	

	var old2_x	= win.x;
	var old2_y	= win.y;

	if( old_x == old2_x && old_y == old2_y ){
		air.trace('animation ended');
		win.x	= dst_x;
		win.y	= dst_y;
		return;
	}

	win.x	+= Math.ceil(delta_x*0.3);
	win.y	+= Math.ceil(delta_y*0.3);
	
	setTimeout(function(){ winPlayerGotoXY(dst_x, dst_y, old2_x, old2_y); }, 20);
}

function winPlayerOnMoved(event)
{
	var win	= winPlayerLoader.stage.nativeWindow;
	air.trace('win moved!');
	air.trace('x=' + win.x);
	air.trace('y=' + win.y);
	
	var cur_x	= (win.x + win.width	/2);
	var cur_y	= (win.y + win.height	/2);
	var position	= "";
	if( cur_y >= air.Capabilities.screenResolutionY/2 )	position += "bottom";
	else							position += "top";
	if( cur_x >= air.Capabilities.screenResolutionX/2 )	position += "right";
	else							position += "left";

	coord	= winPlayerCoordFromPosition(position);
	
//	win.x	= coord.x;
//	win.y	= coord.y;
	winPlayerGotoXY(coord.x, coord.y);
//	winPlayerGotoXY(500, 500);
}

function winPlayerOnResize(event)
{
	var win	= winPlayerLoader.stage.nativeWindow;
	win.startResize(air.NativeWindowResize.TOP_LEFT);
}
function winPlayerOnResized(event)
{
	air.trace('win resized!');
	winPlayerOnMoved(event);
}

function winPlayerOnClose(event)
{
	winPlayerClose();
}


/********************************************************************************/
/********************************************************************************/
/*		TO COMMENT							*/
/********************************************************************************/
/********************************************************************************/

function myOnLoadCallback()
{
	nativeWindow.visible	= true;

//	AIRUpdater.init();return;

	var systray	= new systray_t();
	systray.start();

	//systrayInit();
	//air.trace("post systray init");
	
	// set the startAtLogin - it is known to fails thru adl
	try{
		air.NativeApplication.nativeApplication.startAtLogin = true;
	}catch(e){ /*air.trace(e); */	}

	
	//setTimeout(appUpdaterCheckUpdate, 1000);
	
	//air.navigateToURL(new air.URLRequest('http://google.com'));
}
window.onload	= myOnLoadCallback;



var systray_t = function(){
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
	function menuBuild( isMac )
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

	// Called when the icon image is loaded
	// Setup systray/dock actions depending on operating system
	var loaderOnComplete	= function(event){
		var myapp	= air.NativeApplication.nativeApplication;
		var isMac	= null;
		
		// Get the bitmap data (pixels) of the icon for the system
		// The system will size and convert to the appropriate format
		var imgDock	= event.target.content.bitmapData;
		myapp.icon.bitmaps = [imgDock];
		
		if( air.NativeApplication.supportsSystemTrayIcon ){
			// Setup Windows specific system tray functionality
			myapp.icon.tooltip	= "UrFastR Player, your TV just a click away!";
			myapp.icon.addEventListener(air.MouseEvent.CLICK, systrayOnClick );		
			
			isMac	= false;
		}else{
			isMac	= true;
		}

		// Setup a menu on the docked icon to restore or close
		var myMenu	= menuBuild( isMac );
		myapp.icon.menu	= myMenu;
	}

	// Called when the docked icon is clicked (Windows only)
	// Calls a shared function to restore the window
	var systrayOnClick	= function(event){
		if( winPlayerIsOpened() )	winPlayerClose();
		else				winPlayerOpen();
	}

	var start	= function(){
		air.trace('systay loaded');
		// Loader to load the icon image
		// - Use Loader not HTML image to get at bitmap data (pixels)
		var loader = new air.Loader();
		// Handle when the icon image is loaded
		// Load the icon image (in this case local)
		loader.contentLoaderInfo.addEventListener(air.Event.COMPLETE, loaderOnComplete );
		loader.load( new air.URLRequest("app:/images/thumbnail-48.png") );
	};
	
	// return public functions and variables
	return {
		start: start
	};
}
