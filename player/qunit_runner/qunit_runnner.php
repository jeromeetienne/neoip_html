<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<script src="../../lib/js/jquery/jquery-latest.js"></script>
	<link rel="stylesheet" href="../../lib/js/jquery/qunit/testsuite.css" type="text/css" media="screen" />
	<script type="text/javascript" src="../../lib/js/jquery/qunit/testrunner.js"></script>
	<script>
		// silly patch because i dont like this "stop/start" in my code
		QUnit.delayed_result	= stop;
		QUnit.result_given	= start;
	</script>

<script src="../../base/firebug/firebug.js"></script> 
<script src="../../base/javascript/json2.js"></script> 
<script src="../../base/javascript/neoip_core.js"></script>
<script src="../../base/javascript/neoip_objembed_initmon_t.js"></script>
<script src="../../base/javascript/neoip_base64_safe.js"></script>
<script src="../../base/javascript/neoip_nested_uri_builder_t.js"></script> 
<script src="../../base/javascript/neoip_nested_uri2_t.js"></script> 
<script src="../../base/javascript/swfobject.js"></script>
<script src="../../base/javascript/neoip_xdomrpc_t.js"></script>
<script src="../../base/javascript/neoip_apps_detect_t.js"></script> 
<script src="../../base/javascript/neoip_apps_detect_wikidbg_t.js"></script> 
<script src="../../base/javascript/neoip_webpack_detect_t.js"></script> 
<script src="../../base/javascript/neoip_wikidbg_t.js"></script>
<script src="../../player/jsplayer/neoip_playlist_t.js"></script>
<script src="../../player/jsplayer/neoip_playlist_track_t.js"></script>
<script src="../../player/jsplayer/neoip_playlist_loader_t.js"></script>
<script src="../../player/jsplayer/neoip_plistarr_t.js"></script>
<script src="../../player/jsplayer/neoip_plistarr_item_t.js"></script>
<script src="../../player/jsplayer/neoip_plistarr_loader_t.js"></script>
<script src="../../player/jsplayer/neoip_subplayer_cb_t.js"></script>
<script src="../../player/jsplayer/neoip_subplayer_vlc_t.js"></script>
<script src="../../player/jsplayer/neoip_subplayer_asplayer_t.js"></script>
<script src="../../player/jsplayer/neoip_player_t.js"></script>
<script src="../../player/jsplayer/neoip_player_wikidbg_t.js"></script>
<script src="../../player/jsplayer/neoip_prefetcher_t.js"></script>
<script src="../../player/jsplayer/neoip_ezplayer_t.js"></script>
<script src="../../player/jsplayer/neoip_ezplayer_embedui_t.js"></script>


<script src="../../base/javascript/neoip_geolocalize.js"></script>

</head>
<body>

<?php
/**
 * Get all the *_qunit.js in $dirname
 * @return array array of objects {fct_name: ..., file_name: ...}
*/
function getQunitJs($dirname){
	$result	= array();
	$dirh	= opendir($dirname);
	while( true ){
		$fname		= readdir($dirh);
		if( $fname === false )	break;
		if( !preg_match('/(.*_qunit)\.js$/', $fname, $matches) )
			continue;
		$result[]	= array(
					"fct_name" => $matches[1],
					"file_name"=> $dirname."/".$fname
				       );			
        }
	closedir($dirh);
	return $result;
}
$qunit_fnames	= array();
#$qunit_fnames	= array_merge( $qunit_fnames, getQunitJs("../../base/javascript")	);
#$qunit_fnames	= array_merge( $qunit_fnames, getQunitJs("../../player/jsplayer")	);
$qunit_fnames[]	= array(
	//'fct_name'	=> "neoip_nested_uri2_qunit",
	//'file_name'	=> "../../base/javascript/neoip_nested_uri2_qunit.js",
	'fct_name'	=> "neoip_webpack_detect_qunit",
	'file_name'	=> "../../base/javascript/neoip_webpack_detect_qunit.js"
);
?>
<?php
	// output the <script> to load all *_qunit.js
	foreach($qunit_fnames as $qunit_fname){
		echo "<script src='{$qunit_fname['file_name']}'></script>";
	}
?>
<script>
	// convert qunit_fnames to js
	var qunit_fnames	= <?php echo json_encode($qunit_fnames)	?>;
</script>

<script>
$(function(){
	// log to debug
	console.info('qunit fnames: %o', qunit_fnames);
	// go thru the whole qunit_fnames
	for(var i in qunit_fnames){
		var qunit_fname	= qunit_fnames[i];
		var fct_name	= qunit_fname.fct_name;
		// call the function itself
		window[fct_name]();
	}
});
</script>
  
<h1>QUnit Runner for Neoip HTML</h1>
<h2 id="banner"></h2>
<h2 id="userAgent"></h2>
<ol id="tests"></ol>
<div id="main"></div>
 
</body>
</html>
