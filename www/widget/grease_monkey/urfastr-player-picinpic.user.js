// ==UserScript==
// @name           UrFastR player PicInPic
// @namespace      www.urfastr.net/greasemonkey
// @description    PicInPic UrFastR video player to Watch TV while browsing the web
// @include        http://*.google.*/*
// @include        https://*.google.*/*
// @exclude        http://player.urfastr.tv/*
// ==/UserScript==

// TODO the video should be movable, minimizable, growable
// - aka it should be a real window

// TODO dont run this in a iframe already
// - so detect this case
// - there is already issue with the igoogle/gmail doing a lot of iframe
// - to be refined...
// - so something like "goto the top frame/body, and install there if not already done" ?
// - or wait a bit... i dunno

// TODO DONE put that in the experimental widgets for the website

(function(){
	// return immediatly if running inside a iframe
	// - TODO not enougth refine this
	if( parent.frames.length > 0 )	return;
	// create the iframe
	var iframe_elem	= document.createElement('iframe');
	iframe_elem.setAttribute('src'		, "http://player.urfastr.tv/live?neoip_var_widget_src=grease_monkey");
	iframe_elem.setAttribute('width'	, 160);
	iframe_elem.setAttribute('height'	, 120);
	iframe_elem.setAttribute('frameborder'	, 0);
	iframe_elem.setAttribute('style'	, "position:fixed; right:0px; bottom:0px; z-index:1");
	// append the iframe element at the end of the body
	var body_elem	= document.getElementsByTagName('body')[0];
	body_elem.appendChild(iframe_elem);
})();

