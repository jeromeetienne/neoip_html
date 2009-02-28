/**
 * Handle the PicInPic window
 * @class pipwin_t
*/
var pipwin_t = function (){
	var htmlLoader	= null;
	var filecookie	= new filecookie_t("filecookie_pipwin.store.json");
	var winAnimTimeoutID	= null;
	
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
		var winopts		= new air.NativeWindowInitOptions();
		winopts.systemChrome	= air.NativeWindowSystemChrome.NONE;
		// TODO should i make this transparent?
		// - level of transparency is done by opacity css
		// - air.NativeWindow.supportsTransparency
		// - TODO if the window is transparent then the player doesnt appears on macos
		//   - likely the same reason for win32 not appearing
		//   - in relation with wmode="transparent" ?
		//winopts.transparent	= true;

		var win_size	= filecookie.get('pipwin_size'	, {w: 320*2/3, h: 240*2/3});
		var win_pos	= filecookie.get('pipwin_pos'	, 'se');
		var win_coord	= coordFromPosition(win_pos, win_size);

		// create a new root window
		var bounds	= new air.Rectangle(win_coord.x, win_coord.y, win_size.w, win_size.h);	
		htmlLoader	= air.HTMLLoader.createRootWindow(false, winopts, false, bounds);
		// set it always in front
		htmlLoader.stage.nativeWindow.alwaysInFront	= true;	
		htmlLoader.load( new air.URLRequest('app:/html/pipwin.html') );
		htmlLoader.addEventListener(air.Event.COMPLETE, function(){loaderOnComplete(opt.onComplete)}, false);
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
		htmlLoader.removeEventListener(air.Event.COMPLETE, arguments.callee, false);
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
		var html_str1	= "<a href='javascript:void(0)'><img id='iconResizeWinW' src='../images/resize-nw.png' " +
					"style='position: absolute; left: 0; cursor: nw-resize;'/></a>";
		var html_str2	= "<a href='javascript:void(0)' class='gripper' id='iconMoveWin' " +
					"style='position: absolute; left: 16; right: 16;'>" +
					"<center>" +
					"<font color='#cc1002'>Ur</font>" +
					"<font color='#3366bb'>Fast</font>" +
					"<font color='#cc1002'>R</font>" +
					" " +
					"<font color='#339966'>Live</font>" +
					"</center></a>";
		var html_str3	= "<a href='javascript:void(0)'><img id='iconResizeWinE' src='../images/resize-ne.png' " +
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
		// cancel the previous animation if needed
		if( winAnimTimeoutID ){
			clearTimeout(winAnimTimeoutID);
			winAnimTimeoutID	= null;
		}
		var nativeWin	= htmlLoader.stage.nativeWindow;
		nativeWin.startMove();
	}
	
	/**
	 * Stop the window animation if it is running
	 */
	var winAnimCancelIfNeeded	= function(){
		// if the timer is not running, return now
		if( !winAnimTimeoutID )	return;
		// cancel the timer
		clearTimeout(winAnimTimeoutID);
		// mark the timer as stopped
		winAnimTimeoutID	= null;
	}
	
	var winCoordFromPosition	= function(position, win_size){
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
	
	var winAnimDoing	= function(param){
		var nativeWin	= htmlLoader.stage.nativeWindow;
		// cancel the previous animation if needed
		winAnimCancelIfNeeded();
		// if the animation is over, return now
		if( param.cur_time >= param.tot_time ){
			air.trace('animation ended');
			nativeWin.x	= param.dst_x;
			nativeWin.y	= param.dst_y;
			return;
		}
		// compute the next position
		var easin	= jQuery.easing[param.easin];
		nativeWin.x	= easin(null, param.cur_time, param.src_x, (param.dst_x-param.src_x), param.tot_time);
		nativeWin.y	= easin(null, param.cur_time, param.src_y, (param.dst_y-param.src_y), param.tot_time);
		// setup the timeout for the next
		winAnimTimeoutID	= setTimeout(function(){
						param.cur_time	+= param.refresh_msec;
						winAnimDoing(param);
					}, param.refresh_msec);
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
		
		// cancel the previous animation if needed
		winAnimCancelIfNeeded();
		
		coord	= winCoordFromPosition(position);

		var param	= {
			refresh_msec:	20,
			cur_time:	0,
			src_x:		win.x,	//win.x,
			src_y:		win.y,	//win.y,
			dst_x:		coord.x,
			dst_y:		coord.y	//coord.y
		};
		if( guessOS() == "linux" ){			
			param.tot_time	= 300;
			param.easin	= 'easeOutQuad';
			param.tot_time	= 1000;
			param.easin	= 'easeOutBounce';
		}else{
			param.tot_time	= 1000;
			param.easin	= 'easeOutElastic';
		}
		winAnimDoing(param);
	}
	
	var winOnResize	= function(event){
		air.trace('win on resize');
		air.trace('id='+event.target.id);
		// cancel the previous animation if needed
		winAnimCancelIfNeeded();

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
		var src_url	= 'http://player.urfastr.tv/live?neoip_var_widget_src=adobe_air2';
		// TODO to remove, only to debug a flash init issue
		// - make the mac on casti flv dev, and a webpack on jmehost2
		// - all local easier to debug
		//src_url		= 'http://jmehost2.local/~jerome/neoip_html/bt_cast/casto/neoip_casto_rel.php';
		iframe	= document.createElement('iframe');
		iframe.setAttribute('src'		, src_url);
		iframe.setAttribute('width'		, '100%');
		iframe.setAttribute('height'		, '100%');
		iframe.setAttribute('frameborder'	, 'no');
		//if( air.NativeWindow.supportsTransparency )
		//	iframe.setAttribute('style'	, 'opacity: 0.8;');
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
