/**
 * Handle the Preferences window
 * @class postwin_t
*/
var postwin_t = function (ctorOpt){
	var configOpt	= {};
	var htmlLoader	= null;
	var filecookie	= new filecookie_t("filecookie_postwin.store.json");

	// copy the constructor option if needed
	jQuery.extend(configOpt, ctorOpt);
	
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
		
		var winopts	= new air.NativeWindowInitOptions();		
		// create a new root window
		var win_w	= 640;
		var win_h	= 480;
		var win_x	= (air.Capabilities.screenResolutionX - win_w)/2;
		var win_y	= (air.Capabilities.screenResolutionY - win_h)/2;
		var bounds	= new air.Rectangle(win_x, win_y, win_w, win_h);
		htmlLoader	= air.HTMLLoader.createRootWindow(true, winopts, true, bounds);
		// set it always in front
		htmlLoader.load( new air.URLRequest(configOpt.page_url) );
		htmlLoader.addEventListener(air.Event.COMPLETE, loaderOnComplete, false);
	}

	/**
	 * Destroy the window
	*/
	var destroyWin	= function(){
		// if it is already closed, return now
		if( !htmlLoader )	return;

		// remove the complete event if needed
		htmlLoader.removeEventListener(air.Event.COMPLETE, loaderOnComplete);

		// close the window
		htmlLoader.stage.nativeWindow.close();
		// mark it as closed
		htmlLoader	= null;
	}

	/**
	 * Handle air.Event.COMPLETE for htmlLoader
	*/
	var loaderOnComplete	= function(){
		air.trace('postwin loader oncomplete');
		// remove the complete event if needed
		htmlLoader.removeEventListener(air.Event.COMPLETE, loaderOnComplete);
		// build the titlebar
		pageInit($('body', htmlLoader.window.document));		
	}
	
	var pageInit		= function(container){
		air.trace('postwin page init oncomplete');
		var	mydoc	= htmlLoader.window.document;
		
	}
	
	var showWin	= function(){
		if( htmlLoader === null ){
			createWin();
			return;
		}
		var nativeWin	= htmlLoader.stage.nativeWindow;
		if( htmlLoader.stage.nativeWindow.closed ){
			createWin();
			return;
		}
	}
	
	var showIfNeeded	= function(){
		var page_url	= null;
		var old_version	= filecookie.get("app_version", null);
		var app_xml	= getAppXml();		
		var new_version	= app_xml.version;
		if( old_version === null ){
			page_url	= "app:/html/postinstall.html";
		}else if( old_version != new_version ){
			page_url	= "app:/html/postupdate.html";
		}
		
		// if no page is needed, return now
		if( page_url === null )	return;
		// update the version number
		filecookie.set("app_version", new_version);
		// create and show the window
		createWin({ page_url: page_url });
		showWin();
	}

	/********************************************************************************/
	/********************************************************************************/
	/*		to comment							*/
	/********************************************************************************/
	/********************************************************************************/
	// return public functions and variables	
	return {
		showIfNeeded:	showIfNeeded
	}	
}

