/*
 * This is the bookmarklet of UrFastR Livatar
 * - to be used only for debugging
 */
(function(){
	var js_url	= "http://urfastr.net/static/player/widget/livatar_corejs/urfastr_livatar_core-rel-min.js";
	var element	= document.createElement("script");
	element.setAttribute("src", js_url);
	window.document.body.appendChild(element);
})();