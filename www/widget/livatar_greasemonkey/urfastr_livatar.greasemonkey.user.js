// ==UserScript==
// @name           UrFastR Livatar
// @namespace      urfastr.net/livatar
// @description    UrFastR Live Avatar for major social networks
// @include        http://*urfastr.net/*
// @include        http://*twitter.com/*
// @include        http://*facebook.com/*
// @include        http://*identi.ca/*
// ==/UserScript==

(function(){
	var js_url	= "http://urfastr.net/static/player/widget/livatar_corejs/urfastr_livatar_core-rel-min.js";
	var element	= document.createElement("script");
	element.setAttribute("src", js_url);
	window.document.body.appendChild(element);
})();