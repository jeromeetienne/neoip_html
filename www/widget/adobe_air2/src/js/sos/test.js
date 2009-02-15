/********************************************************************************/
/********************************************************************************/
/*		experimentation	- just a little experimentation			*/
/********************************************************************************/
/********************************************************************************/
function gotoBottomRight()
{
	nativeWindow.x	= ( air.Capabilities.screenResolutionX - nativeWindow.width );
	nativeWindow.y	= ( air.Capabilities.screenResolutionY - nativeWindow.height );
}

function toSize(size_str)
{
	if( size_str == "small" ){
		nativeWindow.height	= 160;
		nativeWindow.width	= 120;
	}else{
		nativeWindow.height	= 320;
		nativeWindow.width	= 240;
	}
}

function alwaysOnTop()
{
	nativeWindow.alwaysInFront	= true;
}

function gotoPicInPic()
{
	// set it always in front
	nativeWindow.alwaysInFront	= true;

	// set window position	                
	var win_w	= 320*2/3;
	var win_h	= 240*2/3;
	var bounds	= new air.Rectangle(air.Capabilities.screenResolutionX - win_w,
					    air.Capabilities.screenResolutionY - win_h,
					    win_w, win_h);
	nativeWindow.bounds	= bounds;	
}