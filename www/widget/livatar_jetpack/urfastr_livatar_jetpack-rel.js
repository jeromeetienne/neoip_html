
jetpack.tabs.onReady(function(doc){
	// determine the list of allowed_hosts	
	var allowed_hosts	= [
		'twitter.com',
		'identi.ca',
		'urfastr.net',
		'www.facebook.com'
	];

	// determine if the current page is in allowed_hosts
	var i = 0;
	for(; i < allowed_hosts.length; i++){
		var allowed_host	= allowed_hosts[i];
		if( doc.location.host == allowed_host )	break;
	}
	if( i == allowed_hosts.length )	return;


	// log to debug 
	//jetpack.notifications.show("Running livatar corejs here on " + doc.location.href);

	// load livatar core
	var element	= doc.createElement("script");
			var src		= "http://urfastr.net/static/player/widget/livatar_core/urfastr_livatar_core-rel-min.js";
		element.setAttribute("src", src);
	doc.body.appendChild(element);
});
