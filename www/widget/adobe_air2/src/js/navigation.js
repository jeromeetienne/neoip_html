var guessOS	= function(){
	if(air.NativeApplication.supportsDockIcon)	return "macos";
	if(air.NativeWindow.supportsTransparency)	return "win32";
	return "linux";
}

var getScreenCap	= function()
{
	var screenMargin	= {
		n:	0,
		e:	0,
		s:	0,
		w:	0
	};
	// KLUDGE: use hardcoded margin depending on plateform not to be on top on taskbar
	var curOS	= guessOS();
	if( curOS == "win32" ){
		screenMargin.s	= 30;
	}else if( curOS == "macos" ){
		screenMargin.n	= 22;
	}
	
	var screenCap	= {
		min_x:	screenMargin.w,
		max_x:	air.Capabilities.screenResolutionX - screenMargin.e,
		min_y:	screenMargin.n,
		max_y:	air.Capabilities.screenResolutionY - screenMargin.s
	};
	// compute the width/height
	screenCap.w	= screenCap.max_x - screenCap.min_x;
	screenCap.h	= screenCap.max_y - screenCap.min_y;
	// return the result
	return screenCap;
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
	
	var screenCap	= getScreenCap();
	
	if(options.position == "center"){
		var win_x	= screenCap.min_x + (screenCap.w - win_w)/2;
		var win_y	= screenCap.min_y + (screenCap.h - win_h)/2;
	}else if(options.position == "topleft"){
		var win_x	= 0;
		var win_y	= 0;
	}else if(options.position == "topright"){
		var win_x	= screenCap.min_x + (screenCap.w - win_w);
		var win_y	= 0;		
	}else if(options.position == "bottomleft"){
		var win_x	= 0;
		var win_y	= screenCap.min_y + (screenCap.h - win_h);
	}else if(options.position == "bottomright"){
		var win_x	= screenCap.min_x + (screenCap.w - win_w);
		var win_y	= screenCap.min_y + (screenCap.h - win_h);		
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

	var screenCap	= getScreenCap();
	
	if(position == "center"){
		var win_x	= screenCap.min_x + (screenCap.w - win_w)/2;
		var win_y	= screenCap.min_y + (screenCap.h - win_h)/2;
	}else if(position == "topleft"){
		var win_x	= screenCap.min_x;
		var win_y	= screenCap.min_y;
	}else if(position == "topright"){
		var win_x	= screenCap.min_x + (screenCap.w - win_w);
		var win_y	= screenCap.min_y;		
	}else if(position == "bottomleft"){
		var win_x	= screenCap.min_x;
		var win_y	= screenCap.min_y + (screenCap.h - win_h);
	}else if(position == "bottomright"){
		var win_x	= screenCap.min_x + (screenCap.w - win_w);
		var win_y	= screenCap.min_y + (screenCap.h - win_h);		
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
	// close this window - after a tiny delay of 1-ms
	// - NOTE: calling winPlayerClose() directly cause an exception to be thrown
	// - the reason is unknown. my opinion is a bug in air js/flash gateway
	setTimeout(winPlayerClose, 1);
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

	setTimeout(systray.notifyUser, 3*1000);

	// launch the app_updater_t
	// - works only when installed (aka not in adl)
	// - TODO find a way to determine if you run in ADL or not
	//   - same thing happen when you do startAtLogin
	//var app_updater	= new app_updater_t();
	//app_updater.checkUpdate("http://192.168.0.10/~jerome/adobe_air2/bin/update.xml");

	// try to display random capability from the air plateform
	// - i failed check the API again
	air.trace('supportNotification '+(air.NativeWindow.supportsNotification ? 'is': 'is NOT')+' supported.');
	air.trace('supportsTransparency '+(air.NativeWindow.supportsTransparency ? 'is': 'is NOT')+' supported.');
	air.trace('supportsMenu '+(air.NativeWindow.supportsMenu ? 'is': 'is NOT')+' supported.');
	air.trace('supportsSystemTrayIcon='+air.NativeApplication.supportsSystemTrayIcon);
	air.trace('supportsDockIcon='+air.NativeApplication.supportsDockIcon);
	//setTimeout(appUpdaterCheckUpdate, 1000);
	
	
	var guessOS	= function(){
		if(air.NativeApplication.supportsDockIcon)	return "macos";
		if(air.NativeWindow.supportsTransparency)	return "win32";
		return "linux";
	}
	air.trace('guessOS=' + guessOS());
	
	
	// TODO how to determine the OS on which you are running
	
	// experiementation to determine what is the border of the screen (tacking taskbar into account)
	// - note: it display x=2880/y=2880 on linux... no clue where those numbers come from
	// - test on other plateforms
//	var maxsize	= nativeWindow.systemMaxSize;
//	air.trace(maxsize.x);
//	air.trace(maxsize.y);
}
window.onload	= myOnLoadCallback;



