/********************************************************************************/
/********************************************************************************/
/*		TO COMMENT							*/
/********************************************************************************/
/********************************************************************************/

function MainOnLoadCallback()
{
	// only for debug stuff
	if( RunningThruAdl() ){
		nativeWindow.visible	= true;
		window.nativeWindow.addEventListener(air.Event.CLOSING, function(){
			air.trace("main native window clossing");
		});
	}
	//var htmlLoader	= air.HTMLLoader.createRootWindow(true);
	//htmlLoader.load( new air.URLRequest('http://localhost/~jerome/webwork/expsite/web/index.php/testjqueryui/cluetip') );
	//return;


	// set the startAtLogin - it is known to fails thru adl
	// - TODO bug bug bug. why would i set it to true by default ?
	if( !RunningThruAdl() )
		air.NativeApplication.nativeApplication.startAtLogin = true;

	// launch the autoupdater
	// - TODO calling this prevent the application to quit on macos (but work on linux/win32)
	// - is it in relation with the 'quit != with dock' on macos too
	var updateURL	= "http://urfastr.net/static/player/widget/adobe_air_pbeta/bin/update.xml";
	//updateURL	= "http://192.168.0.13/~jerome/adobe_air2/bin/update_4adl.xml";
	if( !RunningThruAdl() )	handle_autoupdate(updateURL);

	/**
	 * functino which quit the application
	 * - NOTE: on macos, doing the predefined quit menu on the dockicon doesnt
	 *   quit the application. it seems to close the most recently opened
	 *   native window. aka not the application itself.
	 *   - this is why the CLOSING event of the pipwin_t is trapped and call here
	*/
	var appQuit	= function(){
				// close the original nativeWindow
				// - needed on macos when quitting from dockicon
				window.nativeWindow.close();
				// exit the application
				var myapp	= air.NativeApplication.nativeApplication;
				myapp.exit();
		}

	// create the pip_win_t
	var pipwin 	= new pipwin_t();
	pipwin.create({
		onComplete:	function(){ air.trace('pipwin created')	},
		onClosing:	function(){ appQuit();			}
	});
	
	var mainPref	= {
		hasKey:	function(key){
				air.trace("haskey for key="+key);
				if( key == "start_at_login" )	return true;
				return false;
			},
		set:	function(key, val){
				air.trace("set for key="+key+" val="+val);
				if( key == "start_at_login" ){
					// set the startAtLogin - it is known to fails thru adl
					if( RunningThruAdl() )	return;
					air.NativeApplication.nativeApplication.startAtLogin = val;
					return;
				}
			},
		get:	function(key){
				air.trace("get for key="+key);
				if(key == "start_at_login"){
					if( RunningThruAdl() )	return true;
					return air.NativeApplication.nativeApplication.startAtLogin;
				}
				return null;
			},
		getDfl:	function(key){
				if(key == 'start_at_login')	return true;
				return null;
			}
	};

	var prefwin	= new prefwin_t({
		getValueDefault: function(key){
				if( mainPref.hasKey(key) )	return mainPref.getDfl(key);
				if( pipwin.prefHasKey(key) )	return pipwin.getPrefDefault(key)
				return null;
			},
		getValue: function(key){
				air.trace('try to get key='+key);
				if( mainPref.hasKey(key) )	return mainPref.get(key);
				if( pipwin.prefHasKey(key) )	return pipwin.getPreference(key);
				return null;
			},
		setValue: function(key, val){
				air.trace('try to get key='+key+" to value="+val);
				if( mainPref.hasKey(key) )	return mainPref.set(key, val);
				if( pipwin.prefHasKey(key) )	return pipwin.setPreference(key, val);
				return null;				
			}
	});

	// TODO make the custom menu configurable too
	var systray	= new systray_t();
	systray.start({
		onClick: function(){
				air.trace('clicked on systray');
				// toggle the visibility of pipwin
				if(pipwin.isVisible())	pipwin.hide();
				else				pipwin.show();
			},
		onQuit:	function(){ setTimeout(appQuit, 1);	},
		onMenuSelect:	function(event){
				switch(event.target.label){
				case "About":		var url	= 'http://urfastr.net';
							air.navigateToURL(new air.URLRequest(url));
							break;
				case "Preferences":	prefwin.show();
							break;
				}
			}
	});

	// experimentation on the systray notification
//	setTimeout(systray.notifyUser, 3*1000);

	// try to display random capability from the air plateform
	// - i failed check the API again
	air.trace('supportNotification '+(air.NativeWindow.supportsNotification ? 'is': 'is NOT')+' supported.');
	air.trace('supportsTransparency '+(air.NativeWindow.supportsTransparency ? 'is': 'is NOT')+' supported.');
	air.trace('supportsMenu '+(air.NativeWindow.supportsMenu ? 'is': 'is NOT')+' supported.');
	air.trace('supportsSystemTrayIcon='+air.NativeApplication.supportsSystemTrayIcon);
	air.trace('supportsDockIcon='+air.NativeApplication.supportsDockIcon);
	air.trace('os='+air.Capabilities.os);
	air.trace('version='+air.Capabilities.version);
	//setTimeout(appUpdaterCheckUpdate, 1000);
	air.trace('availheigth='+screen.availHeight);
	air.trace('availTop='+screen.availTop);
}

window.onload	= MainOnLoadCallback;

