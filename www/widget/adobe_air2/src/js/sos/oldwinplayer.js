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
// - issue with detecting move and resize event
//   - there is a event MOVE for native window which is trigger while moving
//   - so the issue is detecting the mouse up on the resize gripper is not reliable
//     - if the mouse is too fast then the mouse up will happen outsite the gripper
//     - and so the gripper will never receive a mouse up
//   - possible workaround:
//     - onMouseMove event, start a timer
//       - if it expire, considere the window as Moved
//     - onMouseUp: considere the window as Moved
//     - onMouseMoved: stop the timer
//   - the good part is that fast moving mouse are moving fast :)
//     - so the timer's delay may be short and so the workaround less noticable

var winPlayerLoader	= null;
/**
 * Open a win player
*/
function winPlayerOpen(options)
{
	// if it is already open, return now
	if( winPlayerLoader )	return;
	// handle the default options
	options		= options || {	'chrome': 	false,
					'position':	'se',
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
		var win_size	= {	w:	320*2/3,
					h:	240*2/3
		};
	}else if(options.size	== "medium"){
		var win_size	= {	w:	320*2,
					h:	240*2
		};
	}
	if( filecookie.has('nochromewin_size') )
		var win_size	= filecookie.get('nochromewin_size');

	if( filecookie.has('nochromewin_pos') )
		options.position	= filecookie.get('nochromewin_pos');
	var coord	= winPlayerCoordFromPosition(options.position, win_size);
	var win_x	= coord.x;
	var win_y	= coord.y;

	// create a new window
	var bounds	= new air.Rectangle(win_x, win_y,win_size.w, win_size.h);	
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
	var iconResize	= myDoc.getElementById("iconResizeWinE");
	iconResize.removeEventListener("mousedown"	, winPlayerOnResize);
	iconResize.removeEventListener("mouseup"	, winPlayerOnResized);
	var iconResize	= myDoc.getElementById("iconResizeWinW");
	iconResize.removeEventListener("mousedown"	, winPlayerOnResize);
	iconResize.removeEventListener("mouseup"	, winPlayerOnResized);

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
	var iconResize	= myDoc.getElementById("iconResizeWinE");
	iconResize.addEventListener("mousedown"	, winPlayerOnResize	, true);	
	iconResize.addEventListener("mouseup"	, winPlayerOnResized	, true);	
	var iconResize	= myDoc.getElementById("iconResizeWinW");
	iconResize.addEventListener("mousedown"	, winPlayerOnResize	, true);	
	iconResize.addEventListener("mouseup"	, winPlayerOnResized	, true);	
}

function winPlayerOnMove(event)
{
	var win	= winPlayerLoader.stage.nativeWindow;
	win.startMove();
}
function winPlayerCoordFromPosition(position, win_size)
{
	if(!win_size){
		var win		= winPlayerLoader.stage.nativeWindow;
		win_size	= {w: win.width, h: win.height};
	}
	var win_w	= win_size.w;
	var win_h	= win_size.h;
	var screenCap	= getScreenCap();
	air.trace('coordfrom pos for '+position);
	air.trace('w='+win_w);
	air.trace('h='+win_h);
	
	if(position == "cc"){
		var win_x	= screenCap.min_x + (screenCap.w - win_w)/2;
		var win_y	= screenCap.min_y + (screenCap.h - win_h)/2;
	}else if(position == "nw"){
		var win_x	= screenCap.min_x;
		var win_y	= screenCap.min_y;
	}else if(position == "ne"){
		var win_x	= screenCap.min_x + (screenCap.w - win_w);
		var win_y	= screenCap.min_y;		
	}else if(position == "sw"){
		var win_x	= screenCap.min_x;
		var win_y	= screenCap.min_y + (screenCap.h - win_h);
	}else if(position == "se"){
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
	if( cur_y >= air.Capabilities.screenResolutionY/2 )	position += "s";
	else							position += "n";
	if( cur_x >= air.Capabilities.screenResolutionX/2 )	position += "e";
	else							position += "w";
	
	// save the position for next time
	filecookie.set('nochromewin_pos', position);
	
	coord	= winPlayerCoordFromPosition(position);
	winPlayerGotoXY(coord.x, coord.y);
}

function winPlayerOnResize(event)
{
	air.trace('win on resize');
	air.trace('id='+event.target.id);
	var win	= winPlayerLoader.stage.nativeWindow;
	if( event.target.id == "iconResizeWinE" )
		win.startResize(air.NativeWindowResize.TOP_RIGHT);
	else
		win.startResize(air.NativeWindowResize.TOP_LEFT);
}
function winPlayerOnResized(event)
{
	// save the win_size for next time
	var win		= winPlayerLoader.stage.nativeWindow;
	win_size	= {w: win.width, h: win.height};
	filecookie.set('nochromewin_size', win_size);
	
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