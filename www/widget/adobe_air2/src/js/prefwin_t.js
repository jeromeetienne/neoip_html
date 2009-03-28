/**
 * Handle the Preferences window
 * @class prefwin_t
*/
var prefwin_t = function (ctorOpt){
	var configOpt	= {};
	var htmlLoader	= null;

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
		
		var winopts		= new air.NativeWindowInitOptions();		
		// create a new root window
		var win_w	= 600;
		var win_h	= 400;
		var win_x	= (air.Capabilities.screenResolutionX - win_w)/2;
		var win_y	= (air.Capabilities.screenResolutionY - win_h)/2;
		var bounds	= new air.Rectangle(win_x, win_y, win_w, win_h);
		htmlLoader	= air.HTMLLoader.createRootWindow(true, winopts, false, bounds);
		// set it always in front
		htmlLoader.load( new air.URLRequest('app:/html/prefwin.html') );
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
		air.trace('prefwin loader oncomplete');
		// remove the complete event if needed
		htmlLoader.removeEventListener(air.Event.COMPLETE, loaderOnComplete);
		// build the titlebar
		pageInit($('body', htmlLoader.window.document));		
	}
	
	var pageInit		= function(container){
		air.trace('prefwin page init oncomplete');
		var	mydoc	= htmlLoader.window.document;
		
		// init all the input type=checkbox
		var pref_ids	= [	'start_at_login',
					'always_in_front',
					'titlebar_autohide_enabled',
					'titlebar_autohide_duration',
					'park_corner_enabled',
					'park_easin_enabled',
					'park_easin_type_x',
					'park_easin_duration_x',
					'park_easin_type_y',
					'park_easin_duration_y',
					'park_south_macos'
				];
		for(var i = 0; i < pref_ids.length; i++){
			var id	= pref_ids[i];
			$('#'+id, mydoc).each(function(){
				air.trace("type of this input="+this.type);
				if( this.type == "checkbox"){
					this.checked	= configOpt.getValue(this.id);
				}else{
					this.value	= configOpt.getValue(this.id);
				}
			});
			$('#'+id, mydoc).change(function(){
				air.trace(this.id + ' changed. now it is ' + this.checked);
				if( this.type == "checkbox"){
					configOpt.setValue(this.id, this.checked);
				}else{
					configOpt.setValue(this.id, this.value);
				}
			});
		}



		
		// if the operating system is not 'macos', disable 'park_south_macos' preference
		if( guessOS() != "macos" )
			$('#park_south_macos_row', mydoc).css('display', 'none');
		
		// TODO to comment
		var mySetValue	= function(key, val){
				$('#'+key, mydoc).each(function(){
					// TODO refactor with above
					if( this.type == "checkbox"){
						this.checked	= val;
						configOpt.setValue(this.id, this.checked);
					}else{
						this.value	= val;
						configOpt.setValue(this.id, this.value);
					}
					$(this).change();
				});
		}
		$('#reset_to_default', mydoc).click(function(){
			jQuery.each(pref_ids, function(){
				mySetValue(this, configOpt.getValueDefault(this));
			});
		});
		$('#but_easin_none', mydoc).click(function(){
			mySetValue('park_easin_enabled', false);
		});
		$('#but_easin_gravity', mydoc).click(function(){
			mySetValue('park_easin_enabled'	, true);
			mySetValue('park_easin_type_x'	, 'easeOutQuad');
			mySetValue('park_easin_duration_x', 600);
			mySetValue('park_easin_type_y'	, 'easeOutBounce');
			mySetValue('park_easin_duration_y', 600);
		});
		$('#but_easin_fancy', mydoc).click(function(){
			mySetValue('park_easin_enabled'	, true);
			if(guessOS() != "linux")	mySetValue('park_easin_type_x'	, 'easeOutElastic');
			else				mySetValue('park_easin_type_x'	, 'easeOutBounce');
			mySetValue('park_easin_duration_x', 1000);
			if(guessOS() != "linux")	mySetValue('park_easin_type_y'	, 'easeOutElastic');
			else				mySetValue('park_easin_type_y'	, 'easeOutBounce');
			mySetValue('park_easin_duration_y', 1000);
		});
		$('#but_easin_simple', mydoc).click(function(){
			mySetValue('park_easin_enabled'		, true);
			mySetValue('park_easin_type_x'		, 'easeOutQuad');
			mySetValue('park_easin_duration_x'	, 300);
			mySetValue('park_easin_type_y'		, 'easeOutQuad');
			mySetValue('park_easin_duration_y'	, 300);
		});
		$('#park_easin_enabled', mydoc).change(function(){
			var myDoc	= this.ownerDocument;
			var myVal	= !this.checked || this.disabled;
			jQuery.each([
				'park_easin_duration_x',
				'park_easin_type_x',
				'park_easin_duration_y',
				'park_easin_type_y',
			], function(){
				$('#'+this, myDoc).attr('disabled', myVal)
			});
		});
		$('#park_corner_enabled', mydoc).change(function(){
			var myDoc	= this.ownerDocument;
			var myVal	= !this.checked;
			jQuery.each([
				'park_easin_enabled',
				'but_easin_gravity',
				'but_easin_fancy',
				'but_easin_simple',
				'but_easin_none',
			], function(){
				$('#'+this, myDoc).attr('disabled', myVal)
			});
			$('#park_easin_enabled', myDoc).change();
		});	
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
		air.trace("blbl");
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
		show:		showWin
	}	
}
