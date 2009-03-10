/**
 * Handle the PicInPic window
 * @class pipwin_t
*/
var pipwin_t = function (){
	var configOpt		= {};
	var htmlLoader		= null;
	var winAnimTimeoutID	= null;
	var filecookie		= new filecookie_t("filecookie_pipwin.store.json");
	var PrefsDefault	= {
		'always_in_front':	true,
		'park_corner_enabled':	true,
		'park_easin_enabled':	true,
		'park_easin_type_x':	guessOS() != 'linux' ? 'easeOutElastic' : 'easeOutBounce',
		'park_easin_duration_x':1000,
		'park_easin_type_y':	guessOS() != 'linux' ? 'easeOutElastic' : 'easeOutBounce',
		'park_easin_duration_y':1000,
		'park_south_macos':	'bottom_screen'	// [bottom_screen|top_dock]
	}
	// ensure all the preferences are set in filecookie
	for(var key in PrefsDefault){
		if( filecookie.has('pref_'+key))	continue;
		filecookie.set("pref_"+key, PrefsDefault[key]);
	}
	
	/********************************************************************************/
	/********************************************************************************/
	/*		ctor/dtor							*/
	/********************************************************************************/
	/********************************************************************************/

	/**
	 * create the window
	*/
	var createWin	= function(opt){
		// copy the user option if needed
		jQuery.extend(configOpt, opt);
		
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
		var win_coord	= null;
		if( filecookie.get('pref_park_corner_enabled') ){
			var win_pos	= filecookie.get('park_position', 'se');
			win_coord	= winCoordFromPosition(win_pos, win_size);
		}else{
			win_coord	= filecookie.get('nopark_position', {x:0, y:0});
		}

		// create a new root window
		var bounds	= new air.Rectangle(win_coord.x, win_coord.y, win_size.w, win_size.h);	
		htmlLoader	= air.HTMLLoader.createRootWindow(false, winopts, false, bounds);
		// set it always in front
		htmlLoader.stage.nativeWindow.alwaysInFront	= filecookie.get('pref_always_in_front');	
		htmlLoader.load( new air.URLRequest('app:/html/pipwin.html') );
		htmlLoader.addEventListener(air.Event.COMPLETE, loaderOnComplete, false);
		htmlLoader.stage.nativeWindow.addEventListener(air.Event.CLOSING, winOnClosing);
	}

	/**
	 * Destroy the window
	*/
	var destroyWin	= function(){
		// if it is already closed, return now
		if( !htmlLoader )	return;

		// remove the complete event if needed
		htmlLoader.removeEventListener(air.Event.COMPLETE, loaderOnComplete);
		htmlLoader.stage.nativeWindow.removeEventListener(air.Event.CLOSING, winOnClosing);

		// close the window
		htmlLoader.stage.nativeWindow.close();
		// mark it as closed
		htmlLoader	= null;
	}
	
	/**
	 * Handle air.Event.COMPLETE for htmlLoader
	*/
	var loaderOnComplete	= function(){
		// build the titlebar
		titlebarCtor($('.titlebar', htmlLoader.window.document));
		
		// TODO attempts to eat up the titlebar via scroll - FAILED
		//htmlLoader.window.scrollTo(0, 16);
		//htmlLoader.window.scrollY	= 16;
		
		// notify the caller of loaderOnComplete if needed
		if(configOpt.onComplete)	configOpt.onComplete();				
	}
	
	var winOnClosing	= function(){
		// notify the caller of loaderOnComplete if needed
		if(configOpt.onClosing)		configOpt.onClosing();						
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
		
		// TODO to remove this is an experiementation on detecting the missed mouse events
		// while moving the window
		$("#iconMoveWin", myDoc).hover(function(){
			air.trace('it is over the movewin');
		},function(){
			air.trace('it is no more over the movewin');
		});
	}
	
	var titlebarShow	= function(){
		htmlLoader.window.scrollTo(0, 0);
	}

	var titlebarHide	= function(){
		htmlLoader.window.scrollTo(0, 16);
	}
	var titlebarIsVisible	= function(){
		return htmlLoader.window.scrollY == 0		
	}
	
	/********************************************************************************/
	/********************************************************************************/
	/*	other stuff TODO to comment						*/
	/********************************************************************************/
	/********************************************************************************/
	
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

	/**
	 * Determine the screen capabilities
	 * @returns {object} properties max_x/max_y/min_x/min_y/w/h
	*/
	var getScreenCap	= function()
	{
		// compute the screenCap depending screenResolution and screenMargin
		var screenCap	= {
			min_x:	screen.availLeft,
			max_x:	screen.availLeft + screen.availWidth,
			min_y:	screen.availTop,
			max_y:	screen.availTop + screen.availHeight,
			w:	screen.availWidth,
			h:	screen.availHeight
		};
		// KLUDGE: is OS="macos" and pref_park_south_macos=='screen' park on
		// bottom on the screen and not on top of the dock
		if( guessOS() == "macos" && filecookie.get('pref_park_south_macos') == 'bottom_screen'){
			// macos kludge to be beside the dock and not on top
			screenCap.max_y	= air.Capabilities.screenResolutionY;
			screenCap.h	= screenCap.max_y - screenCap.min_y;
		}		
		// return the just-built result
		return screenCap;
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

		// compute the next position
		if( param.cur_time < param.easin_duration_x ){
			nativeWin.x	= jQuery.easing[param.easin_type_x](null, param.cur_time, param.src_x
						, (param.dst_x-param.src_x), param.easin_duration_x);
		}else{
			nativeWin.x	= param.dst_x;			
		}
		if( param.cur_time < param.easin_duration_y ){
			nativeWin.y	= jQuery.easing[param.easin_type_y](null, param.cur_time, param.src_y
						, (param.dst_y-param.src_y), param.easin_duration_y);
		}else{
			nativeWin.y	= param.dst_y;			
		}
		// if both animations are completed, return now
		if( param.cur_time >= param.easin_duration_x && param.cur_time >= param.easin_duration_y ){
			air.trace('animation ended');
			return;
		}

		// setup the timeout for the next
		winAnimTimeoutID	= setTimeout(function(){
						param.cur_time	+= param.refresh_msec;
						winAnimDoing(param);
					}, param.refresh_msec);
	}

	var winParkStart	= function(){
		var screenCap	= getScreenCap();
		var nativeWin	= htmlLoader.stage.nativeWindow;
		var cur_x	= (nativeWin.x + nativeWin.width	/2);
		var cur_y	= (nativeWin.y + nativeWin.height	/2);
		var position	= "";
		if( cur_y >= screenCap.min_y + screenCap.h/2 )	position += "s";
		else						position += "n";
		if( cur_x >= screenCap.min_x + screenCap.w/2 )	position += "e";
		else						position += "w";

		// save the position for next time
		filecookie.set('park_position', position);
		
		// cancel the previous animation if needed
		winAnimCancelIfNeeded();
		
		// compute the new park coordinate
		coord	= winCoordFromPosition(position);
		
		// if pref_park_easin_enabled == false, set it immediatly
		// - use nativeWindow.bounds to set x and y at the same time and avoid useless flashy effects
		if( filecookie.get('pref_park_easin_enabled') == false ){
			nativeWin.bounds = new air.Rectangle(coord.x, coord.y, nativeWin.width, nativeWin.height);
			return;	
		}
		// do the parking
		winAnimDoing({
			refresh_msec:		20,
			cur_time:		0,
			src_x:			nativeWin.x,
			src_y:			nativeWin.y,
			dst_x:			coord.x,
			dst_y:			coord.y,
			easin_duration_x:	filecookie.get('pref_park_easin_duration_x'),
			easin_type_x:		filecookie.get('pref_park_easin_type_x'),
			easin_duration_y:	filecookie.get('pref_park_easin_duration_y'),
			easin_type_y:		filecookie.get('pref_park_easin_type_y')
		});		
	}

	var winOnMoved	= function(event){
		var nativeWin	= htmlLoader.stage.nativeWindow;
		air.trace('win moved!');
		air.trace('x=' + nativeWin.x);
		air.trace('y=' + nativeWin.y);
		
		// if park_corner_enabled == false 
		if( filecookie.get('pref_park_corner_enabled') == false ){
			filecookie.set('nopark_position', {x: nativeWin.x, y: nativeWin.y});
			return;
		}
		// Start the window parking
		winParkStart();
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

		// hide/show titlebar depending on the titlebar_hidden property
		if( filecookie.get('titlebar_hidden', false) )	titlebarHide();
		else						titlebarShow();
	}

	/**
	 * hide the window
	*/
	var hideWin	= function(){
		// save the titlebar_hidden property
		filecookie.set('titlebar_hidden', !titlebarIsVisible());

		air.trace('scrollY='+htmlLoader.window.scrollY);
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
	/*		Handle preferences 						*/
	/********************************************************************************/
	/********************************************************************************/
	/**
	 * Get a preference current value
	*/
	var getPreference	= function(key){
		return filecookie.get('pref_'+key);
	}
	/**
	 * Get a preference default value
	*/
	var getPrefDefault	= function(key){
		return PrefsDefault[key];
	}
	/**
	 * Set a preference current value
	*/
	var setPreference	= function(key, val){
		var val_changed	= filecookie.get(key) != val;
		air.trace("setting key=" + key + " to value=" + val);
		// store the preference in filecookie
		filecookie.set("pref_"+key, val);
		
		// if the val_changed and this pref may affect the position of the window, trigger a onMoved
		if( val_changed && (key == 'park_south_macos' || key == 'park_corner_enabled')){
			winOnMoved(null);
		}
		
		// now make it effective
		if( key == "always_in_front" ){
			htmlLoader.stage.nativeWindow.alwaysInFront	= filecookie.get("pref_"+ key);
		}
	}
	/**
	 * Get a preference default value
	*/
	var prefHasKey	= function(key){
		return filecookie.has("pref_"+key);
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
		isVisible:	isVisibleWin,
		getPreference:	getPreference,
		getPrefDefault:	getPrefDefault,
		setPreference:	setPreference,
		prefHasKey:	prefHasKey
	}
}
