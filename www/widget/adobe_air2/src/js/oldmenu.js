
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
	loader.load( new air.URLRequest("app:/images/thumbnail-48.png") );
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

