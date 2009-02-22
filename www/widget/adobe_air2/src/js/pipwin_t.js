/**
 * Handle the PicInPic window
 * @class pipwin_t
*/
var pipwin_t = function (){
	var htmlLoader	= null;
	
	/********************************************************************************/
	/********************************************************************************/
	/*		ctor/dtor							*/
	/********************************************************************************/
	/********************************************************************************/

	/**
	 * create the window
	*/
	var createWin	= function(opt){
		// get winopts for the window
		var winopts	= new air.NativeWindowInitOptions();
		winopts.systemChrome	= air.NativeWindowSystemChrome.NONE;
		air.trace('slota');
		// TODO should i make this transparent?
		// - level of transparency is done by opacity css
		// - air.NativeWindow.supportsTransparency
		winopts.transparent	= true;

		var win_size	= filecookie.get('pipwin_size'	, {w: 320*2/3, h: 240*2/3});
		var win_pos	= filecookie.get('pipwin_pos'	, 'se');
		var win_coord	= coordFromPosition(win_pos, win_size);

		// create a new root window
		var bounds	= new air.Rectangle(win_coord.x, win_coord.y, win_size.w, win_size.h);	
		htmlLoader	= air.HTMLLoader.createRootWindow(false, winopts, false, bounds);
		// set it always in front
		htmlLoader.stage.nativeWindow.alwaysInFront	= true;	
		htmlLoader.load( new air.URLRequest('app:/html/pipwin.html') );
		htmlLoader.addEventListener(air.Event.COMPLETE, function(){loaderOnComplete(opt.onComplete)});
	}
	/**
	 * Destroy the window
	*/
	var destroyWin	= function(){
		// if it is already closed, return now
		if( !htmlLoader )	return;

		// remove the complete event if needed
		// - TODO as the addEventListener is with a anonymous function this is hard to delete it
		//   - how to fix this ?
		//   - isnt there a true/false at the end of addEventListener for this ?
//		htmlLoader.removeEventListener(air.Event.COMPLETE, loaderOnComplete);

		// close the window
		htmlLoader.stage.nativeWindow.close();
		// mark it as closed
		htmlLoader	= null;
	}
	
	/**
	 * Handle air.Event.COMPLETE for htmlLoader
	*/
	var loaderOnComplete	= function(callback){
		// build the titlebar
		titlebarCtor($('.titlebar', htmlLoader.window.document));
		// notify the caller of loaderOnComplete if needed
		if(callback)	callback();				
	}
	

	/********************************************************************************/
	/********************************************************************************/
	/*		misc								*/
	/********************************************************************************/
	/********************************************************************************/

	var coordFromPosition	= function(win_pos, win_size){
		var screenCap	= getScreenCap();
		var coord	= {};
		if(win_pos == "cc"){
			coord.x	= screenCap.min_x + (screenCap.w - win_size.w)/2;
			coord.y	= screenCap.min_y + (screenCap.h - win_size.h)/2;
		}else if(win_pos == "nw"){
			coord.x	= screenCap.min_x;
			coord.y	= screenCap.min_y;
		}else if(win_pos == "ne"){
			coord.x	= screenCap.min_x + (screenCap.w - win_size.w);
			coord.y	= screenCap.min_y;		
		}else if(win_pos == "sw"){
			coord.x	= screenCap.min_x;
			coord.y	= screenCap.min_y + (screenCap.h - win_size.h);
		}else if(win_pos == "se"){
			coord.x	= screenCap.min_x + (screenCap.w - win_size.w);
			coord.y	= screenCap.min_y + (screenCap.h - win_size.h);		
		}
		// return the coord
		return coord;
	}
	
	/********************************************************************************/
	/********************************************************************************/
	/*		titlebar stuff							*/
	/********************************************************************************/
	/********************************************************************************/
	/**
	 * build the titlebar
	 * @param container {dom element} element which will contain the title bar
	 * @returns {jquery} a jquery object
	 */
	var titlebarCtor	= function(container){
		var html_str1	= "<a href='#'><img id='iconResizeWinW' src='../images/resize-nw.png' " +
					"style='position: absolute; left: 0; cursor: nw-resize;'/></a>";
		var html_str2	= "<a href='#' class='gripper' id='iconMoveWin' " +
					"style='position: absolute; left: 16; width: 100%; padding-right: -16px;'></a>";
		var html_str3	= "<a href='#'><img id='iconResizeWinE' src='../images/resize-ne.png' " +
					"style='position: absolute; right: 0; cursor: ne-resize;'/> </a>";
		$(container).empty()
			.append(html_str1)
			.append(html_str2)
			.append(html_str3);
		$(htmlLoader.window.document).ready(function(){titlebarOnReady()});
	}

	/**
	 * Destroy the titlebar
	 * @param container {dom element} element which will contain the title bar
	 * @returns {jquery} a jquery object
	 */
	var titlebarDtor	= function(container){
		var myDoc	= htmlLoader.window.document;
		// remove icon events
		// - TODO to port on jquery
		var iconMove	= myDoc.getElementById("iconMoveWin");
		iconMove.removeEventListener("mousedown"	, winOnMove);
		iconMove.removeEventListener("mouseup"		, winOnMoved);
		var iconResize	= myDoc.getElementById("iconResizeWinE");
		iconResize.removeEventListener("mousedown"	, winOnResize);
		iconResize.removeEventListener("mouseup"	, winOnResized);
		var iconResize	= myDoc.getElementById("iconResizeWinW");
		iconResize.removeEventListener("mousedown"	, winOnResize);
		iconResize.removeEventListener("mouseup"	, winOnResized);
		// empty the container 	
		return $(container).empty();		
	}
	
	var titlebarOnReady	= function(){
		var myDoc	= htmlLoader.window.document;
		// TODO to port on jquery
		var iconMove	= myDoc.getElementById("iconMoveWin");
		iconMove.addEventListener("mousedown"	, winOnMove	, true);
		iconMove.addEventListener("mouseup"	, winOnMoved	, true);
		var iconResize	= myDoc.getElementById("iconResizeWinE");
		iconResize.addEventListener("mousedown"	, winOnResize	, true);	
		iconResize.addEventListener("mouseup"	, winOnResized	, true);	
		var iconResize	= myDoc.getElementById("iconResizeWinW");
		iconResize.addEventListener("mousedown"	, winOnResize	, true);	
		iconResize.addEventListener("mouseup"	, winOnResized	, true);	
		
		air.trace('title bar ready for action YAHOOOOO');
	}
	
	
	var winOnMove	= function(event){
		var win	= htmlLoader.stage.nativeWindow;
		win.startMove();
	}
	
	var winPlayerCoordFromPosition	= function(position, win_size){
		if(!win_size){
			var win		= htmlLoader.stage.nativeWindow;
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
	
	var winPlayerGotoXY	= function(dst_x, dst_y, old_x, old_y){
		var win		= htmlLoader.stage.nativeWindow;
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

	var winOnMoved	= function(event){
		var win	= htmlLoader.stage.nativeWindow;
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
		filecookie.set('pipwin_pos', position);
		
		coord	= winPlayerCoordFromPosition(position);
		winPlayerGotoXY(coord.x, coord.y);
	}
	
	var winOnResize	= function(event){
		air.trace('win on resize');
		air.trace('id='+event.target.id);
		var win	= htmlLoader.stage.nativeWindow;
		if( event.target.id == "iconResizeWinE" )
			win.startResize(air.NativeWindowResize.TOP_RIGHT);
		else
			win.startResize(air.NativeWindowResize.TOP_LEFT);
	}
	var winOnResized	= function(event){
		// save the win_size for next time
		var win		= htmlLoader.stage.nativeWindow;
		win_size	= {w: win.width, h: win.height};
		filecookie.set('pipwin_size', win_size);
		
		winOnMoved(event);
	}

	
	var winOnClose	= function(event){
		// close this window - after a tiny delay of 1-ms
		// - NOTE: calling winPlayerClose() directly cause an exception to be thrown
		// - the reason is unknown. my opinion is a bug in air js/flash gateway
		setTimeout(winPlayerClose, 1);
	}
	

	/********************************************************************************/
	/********************************************************************************/
	/*		player stuff							*/
	/********************************************************************************/
	/********************************************************************************/
	/**
	 * Build the UrFastR player inside a container element
	 * - TODO likely better to use the jquery plugin
	 * - use style.opacity on iframe to get it transparent
	 * @param container {dom element} element which will contain the title bar
	 * @returns {jquery} a jquery object
	*/
	var playerCtor	= function(container){
		iframe	= document.createElement('iframe');
		iframe.setAttribute('src'		, 'http://player.urfastr.tv/live?neoip_var_widget_src=adobe_air2');
		iframe.setAttribute('width'		, '100%');
		iframe.setAttribute('height'		, '100%');
		iframe.setAttribute('frameborder'	, 'no');	
		return $(container).empty().append(iframe);
	}

	/**
	 * Destroy the UrFastR player 
	 * @param container {dom element} element which will contain the title bar
	 * @returns {jquery} a jquery object
	*/
	var playerDtor	= function(container){
		return $(container).empty();
	}

	/********************************************************************************/
	/********************************************************************************/
	/*		show/hide stuff							*/
	/********************************************************************************/
	/********************************************************************************/
	/**
	 * show the window
	*/
	var showWin	= function(){
		htmlLoader.stage.nativeWindow.activate();		
		htmlLoader.stage.nativeWindow.visible	= true;
		playerCtor($('.content', htmlLoader.window.document));
	}

	/**
	 * hide the window
	*/
	var hideWin	= function(){
		htmlLoader.stage.nativeWindow.visible	= false;
		playerDtor($('.content', htmlLoader.window.document));
	}

	/**
	 * @returns {boolean} true if the window is visible, false otherwiser
	*/
	var isVisibleWin	= function(){
		return htmlLoader.stage.nativeWindow.visible ? true : false;
	}
	

	/********************************************************************************/
	/********************************************************************************/
	/*		to comment							*/
	/********************************************************************************/
	/********************************************************************************/
	// return public functions and variables	
	return {
		create:		createWin,
		destroy:	destroyWin,
		show:		showWin,
		hide:		hideWin,
		isVisible:	isVisibleWin
	}
}
