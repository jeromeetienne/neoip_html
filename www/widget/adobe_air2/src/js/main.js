/********************************************************************************/
/********************************************************************************/
/*		TO COMMENT							*/
/********************************************************************************/
/********************************************************************************/

function MainOnLoadCallback()
{
	nativeWindow.visible	= true;

if(true){
	// set the startAtLogin - it is known to fails thru adl
	try{
		air.NativeApplication.nativeApplication.startAtLogin = true;
	}catch(e){ /*air.trace(e); */	}
}

	// launch the autoupdater
	// - TODO calling this prevent the application to quit on macos (but work on linux/win32)
	// - is it in relation with the 'quit != with dock' on macos too
	var updateURL	= "http://urfastr.net/static/player/widget/adobe_air2/bin/update.xml";
	updateURL	= "http://192.168.0.13/~jerome/adobe_air2/bin/update.xml";
	//handle_autoupdate(updateURL);

	// create the pip_win_t
	var pipwin 	= new pipwin_t();
	pipwin.create({
		onComplete:	function(){ air.trace('pipwin created')}
	})

	// TODO make the custom menu configurable too
	var systray	= new systray_t();
	systray.start({
		onClick: function(){
				air.trace('clicked on systray');
				// toggle the visibility of pipwin
				if(pipwin.isVisible())	pipwin.hide();
				else			pipwin.show();
			},
		onQuit:	function(){
				// TODO sort this out, on mac, i have to kill the main nativewindow manually
				// nativeWindow.close(); doesnt seem to work
				// - seems in relation with the updater
				// - TODO you morron this function is not called on mac
				// - to close the native window by hand make it able to quit tho
				// - this is macos only, window is ok
				var myapp	= air.NativeApplication.nativeApplication;
				myapp.exit();
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
	//setTimeout(appUpdaterCheckUpdate, 1000);
	air.trace('availheigth='+screen.availHeight);
	air.trace('availTop='+screen.availTop);
}

window.onload	= MainOnLoadCallback;

