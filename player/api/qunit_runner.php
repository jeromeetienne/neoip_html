<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<script src="../qunit_runner/jquery/jquery-latest.js"></script>
	<link 	href="../qunit_runner/jquery/qunit/testsuite.css" rel="stylesheet" type="text/css" media="screen" />
	<script src="../qunit_runner/jquery/qunit/testrunner.js" type="text/javascript"></script>
	<script>
		// silly patch because i dont like this "stop/start" in my code
		QUnit.delayed_result	= stop;
		QUnit.result_given	= start;
	</script>
</head>
<body>

<script src="../../lib/crossframe/crossframe_rpc_client.standalone-min.js" type="text/javascript"></script>
<script src="urfastr_live.js" type="text/javascript"></script>
<script>
$(function(){
	// define the name of the module
	module("tests for urfastr_live_t classes");

	// init the global object first
	var dirname	= location.href.replace(/[^/]*$/, '');
	var opt		= {
		container_id:		"container_urfastr",
		crossframe_proxyUrl:	dirname + "../../lib/crossframe/crossframe_proxy.html",
	}
	var urfastr	= new urfastr_live(opt);

	// call the build() function
	test("build()", function(){
		// do the call
		urfastr.build();
		
		// delay qunit until result is known
		QUnit.delayed_result();
		// wait for test completion
		setTimeout(function(){
			QUnit.ok(true, "5sec expired");
			QUnit.result_given();			
		}, 5*1000);
	});	

	// call the playing_start() function
	test("playing_start()", function(){
		// do the call
		urfastr.playing_start();
		
		// delay qunit until result is known
		QUnit.delayed_result();
		// wait for test completion
		setTimeout(function(){
			QUnit.ok(true, "20sec expired");
			QUnit.result_given();			
		}, 20*1000);
	});	

	// call the playing_stop() function
	test("playing_stop()", function(){
		// do the call
		urfastr.playing_stop();
		
		// delay qunit until result is known
		QUnit.delayed_result();
		// wait for test completion
		setTimeout(function(){
			QUnit.ok(true, "1sec expired");
			QUnit.result_given();			
		}, 1*1000);
	});	
});
</script>
 

<h1>QUnit Runner for UrFastR Player API</h1>
<h2 id="banner"></h2>
<h2 id="userAgent"></h2>
<div id="container_urfastr" width="240px" height="320px" style="float: right"></div>
<ol id="tests"></ol>
<div id="main"></div>

</body>
</html>
