(function(){
	// define the urfastr_livatar_userscript_src
	window.urfastr_livatar_userscript_src	= "chrome-1.0.0";
	// load urfastr_livatar_core		
	var js_url	= "http://urfastr.net/static/player/widget/livatar_core/urfastr_livatar_core-rel-min.js";
	var element	= document.createElement("script");
	element.setAttribute("src", js_url);
	window.document.body.appendChild(element);
})();