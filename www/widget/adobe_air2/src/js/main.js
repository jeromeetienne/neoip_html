/********************************************************************************/
/********************************************************************************/
/*		TO COMMENT							*/
/********************************************************************************/
/********************************************************************************/

function myOnLoadCallback()
{
	nativeWindow.visible	= true;

//	AIRUpdater.init();return;



	var pipwin 	= new pipwin_t();
	pipwin.create({
		onComplete:	function(){ air.trace('pipwin created')}
	})

	var systray	= new systray_t();
	systray.start({
		onClick: function(){
				air.trace('clicked on systray');
				if(pipwin.isVisible())	pipwin.hide();
				else			pipwin.show();
			}
		});
	
//	setTimeout(pipwin.show, 2*1000);
//	setTimeout(pipwin.hide, 10*1000);
//	setTimeout(pipwin.show, 13*1000);
//	setTimeout(pipwin.show, 23*1000);

	//systrayInit();
	//air.trace("post systray init");
	
	// set the startAtLogin - it is known to fails thru adl
	try{
		air.NativeApplication.nativeApplication.startAtLogin = true;
	}catch(e){ /*air.trace(e); */	}

	// experimentation on the systray notification
	setTimeout(systray.notifyUser, 3*1000);

	// launch the app_updater_t
	// - works only when installed (aka not in adl)
	// - TODO find a way to determine if you run in ADL or not
	//   - same thing happen when you do startAtLogin
	//var app_updater	= new app_updater_t();
	//app_updater.checkUpdate("http://192.168.0.10/~jerome/adobe_air2/bin/update.xml");

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
	
	$(document).ready(function(){
		$("body").append("blbl");
	});

	// TODO how to determine the OS on which you are running
	
	// experiementation to determine what is the border of the screen (tacking taskbar into account)
	// - note: it display x=2880/y=2880 on linux... no clue where those numbers come from
	// - test on other plateforms
//	var maxsize	= nativeWindow.systemMaxSize;
//	air.trace(maxsize.x);
//	air.trace(maxsize.y);
}
window.onload	= myOnLoadCallback;
filecookie	= new filecookie_t();

