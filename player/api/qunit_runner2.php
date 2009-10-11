<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<script src="../../lib/js/jquery/jquery-latest.js"></script>
	<link  href="../../lib/js/jquery/qunit/testsuite.css" rel="stylesheet" type="text/css" media="screen" />
	<script src="../../lib/js/jquery/qunit/testrunner.js" type="text/javascript"></script>
	<script>
		// silly patch because i dont like this "stop/start" in my code
		QUnit.delayed_result	= stop;
		QUnit.result_given	= start;
	</script>
</head>
<body>

<!-- to be able to run event without firebug -->
<script src="../../base/firebug/firebugx.js"></script>


<script src="../../lib/crossframe/crossframe_rpc_clientserver.standalone-min.js"></script>
<script src="urfastr_live.js" type="text/javascript"></script>
<script>
$(function(){
	// define the name of the module
	module("jsplayer API");

	// init the global object first
	var dirname	= location.href.replace(/[^/]*$/, '');
	var opt		= {
		container_id		: "container_urfastr",
		crossframe_proxyUrl	: dirname + "../../lib/crossframe/crossframe_proxy.html",
		player_url		: "http://localhost/~jerome/neoip_html/player/jsplayer/slota_rel_live.html",		
		event_cb		: function(event_type, event_args){
			console.info("******************************");
			console.info("******************************");
			console.info("event notified event_type="+event_type);
			console.dir(event_args);
			console.info("================");
			console.info("******************************");
			console.info("******************************");
			console.info("******************************");
			console.info("******************************");
		},
		neoip_var_arr	:{
				onload_start_play:	'disabled'
			}
	}
	console.dir(opt);

	// call the build() function
	test("player_initialized event after .build()", function(){
		// build the object
		var urfastr	= new urfastr_live(opt);
		// build the player
		urfastr.build();

		// delay qunit until result is known
		QUnit.delayed_result();

		// set the event_cb
		// TODO bug here, if event_cb_set is before build(), it fails
		urfastr.event_cb_set(function(event_type, event_args){
			if( event_type != "player_initialized" )	return;
			
			// destroy this test
			urfastr.destroy();
			QUnit.ok(true, "event "+event_type+" notified as expected");
			QUnit.result_given();
		});
		
		// timeout after 5-sec
		setTimeout(function(){
			// destroy this test
			urfastr.destroy();
			QUnit.ok(false, "event player_notified not notified until 5sec expired");
			QUnit.result_given();			
		}, 5*1000);
	});	
});
</script>
 

<h1>QUnit Runner for UrFastR Player API</h1>
<h2 id="banner"></h2>
<h2 id="userAgent"></h2>
<div id="container_urfastr" width="320px" height="240px" style="float: right"></div>
<ol id="tests"></ol>
<div id="main"></div>

</body>
</html>
