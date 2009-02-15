var guessOS	= function(){
	if(air.NativeApplication.supportsDockIcon)	return "macos";
	if(air.NativeWindow.supportsTransparency)	return "win32";
	return "linux";
}

var getScreenCap	= function()
{
	var screenMargin	= {
		n:	0,
		e:	0,
		s:	0,
		w:	0
	};
	// KLUDGE: use hardcoded margin depending on plateform not to be on top on taskbar
	var curOS	= guessOS();
	if( curOS == "win32" ){
		screenMargin.s	= 30;
	}else if( curOS == "macos" ){
		screenMargin.n	= 22;
	}
	
	var screenCap	= {
		min_x:	screenMargin.w,
		max_x:	air.Capabilities.screenResolutionX - screenMargin.e,
		min_y:	screenMargin.n,
		max_y:	air.Capabilities.screenResolutionY - screenMargin.s
	};
	// compute the width/height
	screenCap.w	= screenCap.max_x - screenCap.min_x;
	screenCap.h	= screenCap.max_y - screenCap.min_y;
	// return the result
	return screenCap;
}
