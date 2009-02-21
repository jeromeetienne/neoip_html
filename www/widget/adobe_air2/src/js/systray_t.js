/**
 * Handle systray
 * @class systray_t
*/
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
					'position':	'cc',
					'size':		'medium',
					'stayInFront':	false
					});
			winPlayerOpen();
		}else if( evt.target.label == "About" ){
			var url	= 'http://urfastr.net';
			air.navigateToURL(new air.URLRequest(url));
		}else if( evt.target.label == "Quit" ){
			var myapp	= air.NativeApplication.nativeApplication;
			myapp.exit();
		}
	}
	
	// Called to create a menu on the systray/dock icon
	// Takes operating system into consideration
	function menuBuild( isMac )
	{
		var menu	= new air.NativeMenu();
		var menuItem	= null;
	
		// add the menuitem 'open'
		menuItem	= new air.NativeMenuItem("Open" );
		menuItem.addEventListener(air.Event.SELECT, NativeMenuOnSelect );	
		menu.addItem( menuItem );
		// add the menuitem 'about'
		menuItem	= new air.NativeMenuItem("About" );
		menuItem.addEventListener(air.Event.SELECT, NativeMenuOnSelect );	
		menu.addItem( menuItem );
		// add a separator
		menu.addItem(new air.NativeMenuItem('', true));
		// add a menuItem 'quit'
		// - IIF supportsSystemTrayIcon as mac (with only DockIcon) already got its own quit
		if( air.NativeApplication.supportsSystemTrayIcon ){
			menuItem	= new air.NativeMenuItem("Quit");
			menuItem.addEventListener(air.Event.SELECT, NativeMenuOnSelect );	
			menu.addItem( menuItem );
		}
		// return the just-built menu
		return menu;	
	}

	// Called when the icon image is loaded
	// Setup systray/dock actions depending on operating system
	var loaderOnComplete	= function(event){
		var myapp	= air.NativeApplication.nativeApplication;
		var myIcon	= myapp.icon;
		
		// Get the bitmap data (pixels) of the icon for the system
		// The system will size and convert to the appropriate format
		var imgDock	= event.target.content.bitmapData;
		myIcon.bitmaps	= [imgDock];

		if( air.NativeApplication.supportsSystemTrayIcon ){
			// Setup Windows specific system tray functionality
			myIcon.tooltip	= "UrFastR Player, your TV just a click away!";
			myIcon.addEventListener(air.MouseEvent.CLICK, systrayOnClick );
		}else{
			// NOTE: assume air.NativeApplication.supportsDockIcon
			// trick to detect click on the dock icon
			myapp.addEventListener(air.InvokeEvent.INVOKE, systrayOnClick);
		}

		// to init the context menu on the systray
		myapp.icon.menu	= menuBuild();
	}

	// Called when the docked icon is clicked (Windows only)
	// Calls a shared function to restore the window
	var systrayOnClick	= function(event){
		if( winPlayerIsOpened() )	winPlayerClose();
		else				winPlayerOpen();
	}

	/**
	 * Start the systray
	*/
	var start	= function(){
		air.trace('systay loaded');
		// Loader to load the icon image
		// - Use Loader not HTML image to get at bitmap data (pixels)
		var loader = new air.Loader();
		// Handle when the icon image is loaded
		// Load the icon image (in this case local)
		loader.contentLoaderInfo.addEventListener(air.Event.COMPLETE, loaderOnComplete );
		loader.load( new air.URLRequest("app:/images/thumbnail-48.png") );
	}

	/**
	 * notify the user that some activity is happening
	 * - doesnt seems to work. written to keep those functions 
	 * - tested on linux and failed
	 *   - this work if i launch the nochrome window before notifying... no clue why
	 * - TODO test more on other plateform
	*/
	var notifyUser	= function(){
		air.trace('notifying user');
		if( air.NativeApplication.supportsSystemTrayIcon ){
			nativeWindow.notifyUser(air.NotificationType.CRITICAL);
		}else{
			// bounce the icon
			var myapp	= air.NativeApplication.nativeApplication;
			myapp.icon.bounce();
		}
	}

	// return public functions and variables
	return {
		start:		start,
		notifyUser:	notifyUser
	};
}
var systray	= new systray_t();
