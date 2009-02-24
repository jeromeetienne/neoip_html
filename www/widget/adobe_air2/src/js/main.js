/********************************************************************************/
/********************************************************************************/
/*		TO COMMENT							*/
/********************************************************************************/
/********************************************************************************/

function myOnLoadCallback()
{
	nativeWindow.visible	= true;

//	AIRUpdater.init();return;


if(true){
	var pipwin 	= new pipwin_t();
	pipwin.create({
		onComplete:	function(){ air.trace('pipwin created')}
	})
}	
	
	// TODO make the custom menu configurable too
	var systray	= new systray_t();
	systray.start({
		onClick: function(){
				air.trace('clicked on systray');
				if(pipwin.isVisible())	pipwin.hide();
				else			pipwin.show();
			}
		});
if(true){	
	// set the startAtLogin - it is known to fails thru adl
	try{
		air.NativeApplication.nativeApplication.startAtLogin = true;
	}catch(e){ /*air.trace(e); */	}
}
	// experimentation on the systray notification
	setTimeout(systray.notifyUser, 3*1000);

if(false){	// TODO disabled as it cause impossible to exit on macos (and win32 i think)
		// - reason: unknown
	// launch the app_updater_t
	// - works only when installed (aka not in adl)
	// - TODO find a way to determine if you run in ADL or not
	//   - same thing happen when you do startAtLogin
	var app_updater	= new app_updater_t();
	app_updater.start("http://jmehost2.local/~jerome/adobe_air2/bin/update.xml");
}
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

window.onload	= myOnLoadCallback;
filecookie	= new filecookie_t();

