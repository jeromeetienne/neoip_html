/**
 * Handle the PicInPic window
 * @class pipwin_t
*/
var pipwin_t = function (){
	var htmlLoader	= null;

	/**
	 * create the window
	*/
	var createWin	= function(){
		air.trace('slota');
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
		var htmlLoader	= air.HTMLLoader.createRootWindow(false, winopts, false, bounds);
		// set it always in front
		htmlLoader.stage.nativeWindow.alwaysInFront	= true;	
		htmlLoader.load( new air.URLRequest('app:/html/pipwin.html') );
		// return the just-created rootwin
		return htmlLoader;
	}
	
	function coordFromPosition(win_pos, win_size)
	{
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
	
	/**
	 * build the titlebar
	 * @param element {dom element} element which will contain the title bar
	 */
	var buildTitleBar	= function(element){
		var html_str1	= "<a href='#'><img id='iconResizeWinW' src='../images/resize-nw.png' " +
					"style='position: absolute; left: 0; cursor: nw-resize;'/></a>";
		var html_str2	= "<a href='#' class='gripper' id='iconMoveWin' " +
					"style='position: absolute; left: 16; width: 100%; padding-right: -16px;'></a>";
		var html_str3	= "<a href='#'><img id='iconResizeWinE' src='../images/resize-ne.png' " +
					"style='position: absolute; right: 0; cursor: ne-resize;'/> </a>";
		$(element).empty()
			.append(html_str1)
			.append(html_str2)
			.append(html_str3);
	}
	
	/**
	 * show the window
	*/
	var showWin	= function(){
		htmlLoader.stage.nativeWindow.activate();		
		htmlLoader.stage.nativeWindow.visible	= true;
	}
	/**
	 * hide the window
	*/
	var hideWin	= function(){
		htmlLoader.stage.nativeWindow.visible	= false;
	}
	/**
	 * @returns {boolean} true if the window is visible, false otherwiser
	*/
	var isVisibleWin	= function(){
		return htmlLoader.stage.nativeWindow.visible ? true : false;
	}

	air.trace('bla');
	var htmlLoader	= createWin();
	air.trace('opened pipwin');
	// return public functions and variables	
	return {
		show:		showWin,
		hide:		hideWin,
		isVisible:	isVisible
	}
}
