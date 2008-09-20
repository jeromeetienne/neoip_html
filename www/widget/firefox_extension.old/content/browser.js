/* TODO
  - have a popup menu to tune the size of the picinpic small/normal/large fullpage
  - listen to some window resize to reset the player position in order to fix bugs
    - [08:11] <mzz> http://developer.mozilla.org/en/docs/DOM:window says there's an event called 'resize'
    - [08:11] <mzz> so just addEventListener-ing that should do the trick
    - LATER: i tried without much success
  - when the picinpic is hidden, close the browser (leave an option/preference not to do it)
    - [08:10] <mzz> well, I'd expect removing the browser from the dom to do the trick, but that may be overkill.
      Or you could point it at about:blank. I'm not sure what the best approach is.
      
      
  - this long standing player reveal the issue of not reloading channel list
  - use this to distribute webpack ? like ability to download and install from the extension
*/

function urfastr_statusbar_click(aEvent)
{
	// If it is a middle click, if not a left click, return now
	if( aEvent.button == 1 ){
		var uri	= "http://player.urfastr.tv/live"
		// add a tab and then make it active
		gBrowser.selectedTab = gBrowser.addTab(uri);
		// Change the uri of the current browser tab
		//gBrowser.loadURI(uri);
		return;
	}
	if( aEvent.button == 2 ){
		var menu_elem 	= document.getElementById("urfastr_menupopup");
		menu_elem.openPopup(null, "", aEvent.clientX, aEvent.clientY, false, false);
		return;
	}
	
	// if not a left click, return now
	if( aEvent.button != 0)	return;

	// toggle the player popup
	var panel_elem 	= document.getElementById("thepanel");
	if( panel_elem.state == "closed" ){
		var iframe_elem	= document.getElementById("urfastr_iframe");
		iframe_elem.setAttribute("src", "http://player.urfastr.tv/live");
		
		var status_elem	= document.getElementById("status-bar");
		panel_elem.openPopup(status_elem, "before_end", 0, 0, false, false);
		status-bar
	}else{
		var iframe_elem	= document.getElementById("urfastr_iframe");
		iframe_elem.setAttribute("src", "about:blank");
		panel_elem.hidePopup();		
	}
}


function urfastr_doCMD(elem)
{
	alert(elem.label + " got clicked");
	
	if( elem.label == "Cut" ){
		var iframe_elem	= document.getElementById("urfastr_iframe");
		iframe_elem.parent.removeChild(iframe_elem);
		return;
	}
	
	if( elem.value == "large" ){
		var iframe_elem	= document.getElementById("urfastr_iframe");
		iframe_elem.setAttribute("width"	, "320");
		iframe_elem.setAttribute("height"	, "240");
		return;
	}
	if( elem.value == "normal" ){
		var iframe_elem	= document.getElementById("urfastr_iframe");
		iframe_elem.setAttribute("width"	, "240");
		iframe_elem.setAttribute("height"	, "180");
		return;
	}
	if( elem.value == "small" ){
		var iframe_elem	= document.getElementById("urfastr_iframe");
		iframe_elem.setAttribute("width"	, "160");
		iframe_elem.setAttribute("height"	, "120");
		return;
	}
}