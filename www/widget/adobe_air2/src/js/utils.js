/**
 * Try to guess the operating system on which the application is running
 * - this is rather kludgy. guessing based on support features
 * - this is not reliable over time. but may be used as workaround
 * - there is a air.Capabilities.os which is a lot more reliable than that
 *   - http://livedocs.adobe.com/flex/3/langref/flash/system/Capabilities.html
 * @returns {string} macos|win32|linux
*/
var guessOS	= function(){
	if(air.NativeApplication.supportsDockIcon)	return "macos";
	if(air.NativeWindow.supportsTransparency)	return "win32";
	return "linux";
}

/**
 * @returns {boolean} true if the application is running thru ADL, false if installed
*/
var RunningThruAdl	= function(){
	var publisherId	= air.NativeApplication.nativeApplication.publisherID;
	if( publisherId == "" )	return true;
	return false;
}

/**
 * Parse the application.xml from AIR and convert it to json
 * - http://livedocs.adobe.com/flex/gumbo/langref/flash/desktop/NativeApplication.html
 * @returns {string} the version from the application.xml
*/
var getAppXml		= function(){
	var xmlString	= air.NativeApplication.nativeApplication.applicationDescriptor;
	var appXml	= new DOMParser();
	var xmlObject	= appXml.parseFromString(xmlString, "text/xml");
	var root	= xmlObject.getElementsByTagName('application')[0];
	// build the result
	var result	= {}
	jQuery.each(['id', 'version', 'name'], function(){
		result[this]	= root.getElementsByTagName(this)[0].firstChild.data;
	});
	// return the just-built result
        return result;
}

/**
 * @deprecated this is a old version before i knew about the screen dom object
 * Determine the screen capabilities
 * - this function is mainly due to an issue on macos/win32 with the
 *   nochrome window going over the task bar
 * - workaround: hardcoding the taskbar position and size
 *   - issue: if the position/size is not the one assumed, it become ugly
 *   - example: on win32, setup firefox in fullscreen, and the nochromewin
 *     is still in the air for no reason.
 * - possible solutions: TODO
 *   - to do a maximised window and look at its position/size
 *   - to investigate
 * @returns {object} properties max_x/max_y/min_x/min_y/w/h
*/
var getScreenCapOld	= function()
{
	// determine the default margins
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
	// compute the screenCap depending screenResolution and screenMargin
	var screenCap	= {
		min_x:	screenMargin.w,
		max_x:	air.Capabilities.screenResolutionX - screenMargin.e,
		min_y:	screenMargin.n,
		max_y:	air.Capabilities.screenResolutionY - screenMargin.s
	};
	// compute the width/height depending on max/min values
	screenCap.w	= screenCap.max_x - screenCap.min_x;
	screenCap.h	= screenCap.max_y - screenCap.min_y;
	// return the just-built result
	return screenCap;
}

/**
 * Determine the screen capabilities
 * - this function is mainly due to an issue on macos/win32 with the
 *   nochrome window going over the task bar
 * - NOTE: on macos, the max_y is above the dock while it could be nice to be
 *   on the side of the dock...
 *   - TODO sort this out... maybe on option
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
	// return the just-built result
	return screenCap;
}
