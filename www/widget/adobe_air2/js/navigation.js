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
/*		winPlayer Stuff							*/
/********************************************************************************/
/********************************************************************************/

var winPlayerLoader	= null;
function winPlayerOpen()
{
	// if it is already open, return now
	if( winPlayerLoader )	return;
	// get options for the 
	var options		= new air.NativeWindowInitOptions();
	options.systemChrome	= air.NativeWindowSystemChrome.NONE;
	//options.transparent	= true;

	var win_w	= 320*2/3;
	var win_h	= 240*2/3;
	var bounds	= new air.Rectangle(air.Capabilities.screenResolutionX - win_w,
					    air.Capabilities.screenResolutionY - win_h,
					    win_w, win_h);

	// create a new window
	loader = air.HTMLLoader.createRootWindow( true, options, true, bounds );
	// set it always in front
	loader.stage.nativeWindow.alwaysInFront	= true;	
        loader.load( new air.URLRequest('player_window.html') );
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




function myOnLoadCallback()
{
	systrayInit();
}
window.onload	= myOnLoadCallback;



function systrayInit()
{
	// Loader to load the icon image
	// Use Loader not HTML image to get at bitmap data (pixels)
	var loader = new air.Loader();
	
	// Handle when the icon image is loaded
	// Load the icon image (in this case local)
	loader.contentLoaderInfo.addEventListener(air.Event.COMPLETE, doLoaderComplete );
	loader.load( new air.URLRequest("images/thumbnail-48.png") );
}

// Called when the dock menu item to close is selected
// Calls a shared function to close the window
function doExitSelect( evt )
{
	closeApplication();		
}


// Called when the icon image is loaded
// Setup systray/dock actions depending on operating system
function doLoaderComplete( evt )
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
	var	myMenu	= createMenu( isMac );
	air.NativeApplication.nativeApplication.icon.menu = myMenu;
}


// Called when the docked icon is clicked (Windows only)
// Calls a shared function to restore the window
function systrayOnClick( evt )
{
	if( winPlayerIsOpened() )	winPlayerClose();
	else				winPlayerOpen();
}

// Called to close the window
// Shared by multiple event handlers
function closeApplication()
{
	winPlayerClose();
	nativeWindow.close();	
}

// Called with the dock item to open the window is selected
// Calls a shared function to open (restore) the window
function doAboutSelect( evt )
{
	winPlayerOpen();
}

// Called to create a menu on the systray/dock icon
// Takes operating system into consideration
function createMenu( isMac )
{
	var menu	= new air.NativeMenu();
	
	// Both operating systems have an option to open the window
	var openItem	= new air.NativeMenuItem("About" );
	openItem.addEventListener(air.Event.SELECT, doAboutSelect );	
	menu.addItem( openItem );
	
	if( !isMac ){
		var exitItem	= null;
		// Mac provides built-in "Quit" item
		// Create an "Exit" item for Windows
		var menuItem	= new air.NativeMenuItem("Quit");
		menuItem.addEventListener(air.Event.SELECT, closeApplication );	
		menu.addItem( menuItem );
	}

	return menu;	
}

