<?php $in_rel	= in_array("--rel", $argv);	?>
<?php $in_dev	= in_array("--dev", $argv);	?>

jetpack.tabs.onReady(function(doc){
	// define the urfastr_livatar_userscript_src
	// TODO to enable - how to set a global variable in the doc
	//doc.urfastr_livatar_userscript_src	= "chrome-1.0.0";
	
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
	<?php if($in_dev):	?>
		var src		= "http://urfastr.net/static/player/widget/livatar_core/urfastr_livatar_core-dev.js";
	<?php else:		?>
		var src		= "http://urfastr.net/static/player/widget/livatar_core/urfastr_livatar_core-rel-min.js";
	<?php endif;		?>
	element.setAttribute("src", src);
	doc.body.appendChild(element);
});
