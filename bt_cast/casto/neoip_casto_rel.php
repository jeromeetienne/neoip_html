<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
	<title>UrFastR Live (beta)</title>
	<meta name="description" content="UrFastR video player for live and prerecorded video">
	<meta name="keywords" content="video, web2.0, p2p, stream, live, player">

<script src="../../jspackmin/data/neoip_jsplayer_packmin.js"></script>
<style type="text/css">	
	/* body style for the video fullpage mode - hardcoded for now */
	html, body {
		height	: 100%;
		width	: 100%;
		margin	: 0px;
		overflow: hidden;
		background-color: #000000;
	}
</style>
</head>

<body>
<div id="neoip_player_container_id">Place to put player container</div>
<script>
neoip.globalCfg	= {}
/**
 * neoip.globalCfg.dfl_plistarr_uid is the default plistarr_uid used when nothing is specified
*/
//neoip.globalCfg.dfl_plistarr_uid	= "plistarr_play";
neoip.globalCfg.dfl_plistarr_uid	= "plistarr_live";

/**
 * neoip.globalCfg.playlist_loader_xdomrpc_url is the xdomrpc_t url used by neoip.plistarr_loader_t
*/
neoip.globalCfg.plistarr_loader_xdomrpc_url	= "../../cgi-bin/xdomrpc_dispatcher.php";
neoip.globalCfg.plistarr_loader_xdomrpc_url	= "http://dedixl.jetienne.com/~jerome/neoip_html/cgi-bin/xdomrpc_dispatcher.php";
//neoip.globalCfg.plistarr_loader_xdomrpc_url	= "http://jmehost2.local/~jerome/webwork/casti_mdata_srv/web/frontend_dev.php/castiRecordWebSrv/xdomrpcDispatcher";
//neoip.globalCfg.plistarr_loader_xdomrpc_url	= "http://casti_mdata_srv.urfastr.net/castiRecordWebSrv/xdomrpcDispatcher";

/**
 * neoip.globalCfg.playlist_loader_xdomrpc_url is the xdomrpc_t url used by neoip.playlist_loader_t
*/
neoip.globalCfg.playlist_loader_xdomrpc_url	= "../../cgi-bin/xdomrpc_dispatcher.php";
neoip.globalCfg.playlist_loader_xdomrpc_url	= "http://dedixl.jetienne.com/~jerome/neoip_html/cgi-bin/xdomrpc_dispatcher.php";
//neoip.globalCfg.playlist_loader_xdomrpc_url	= "http://jmehost2.local/~jerome/webwork/casti_mdata_srv/web/frontend_dev.php/castiRecordWebSrv/xdomrpcDispatcher";
//neoip.globalCfg.playlist_loader_xdomrpc_url	= "http://casti_mdata_srv.urfastr.net/castiRecordWebSrv/xdomrpcDispatcher";

/**
 * neoip.globalCfg.recorder_mdata_srv_uri is the url used by neoip.recorder_t for cast_mdata_srv
*/
neoip.globalCfg.recorder_mdata_srv_uri		= "http://dedixl.jetienne.com/~jerome/neoip_html/cgi-bin/cast_mdata_echo_server.fcgi";
//neoip.globalCfg.recorder_mdata_srv_uri		= "http://api.urfastr.net/castiRecordWebSrv/RPC2";

/**
 * neoip.globalCfg.subplayer_asplayer_swf_url is the url used 
*/
neoip.globalCfg.subplayer_asplayer_swf_url	= "neoip_asplayer.swf";

/**
 * neoip.globalCfg.webpack_detect_apps_params determines where/what neoip.webpack_detect_t will look for/in webpack
*/
neoip.globalCfg.webpack_detect_apps_params	= {
					"oload"	: {	"first_port"	: 4550,
							"last_port"	: 4553,
							"min_version"	: "0.0.1",
							"options"	: null
						},
					"casto"	: {	"first_port"	: 4560,
							"last_port"	: 4563,
							"min_version"	: "0.0.1",
							"options"	: null
						},
					"casti"	: {	"first_port"	: 4570,
							"last_port"	: 4573,
							"min_version"	: "0.0.1",
							// NOTE: trick to get casti on dedixl.jetienne.com and not in localhost
							// - thus this is always available even if webpack installed version is no good
							//   or if not installed at all
							"options"	: {'hostname': 'dedixl.jetienne.com'}
						}
				};
</script>
<script>
	var 	cast_name	= "<?php echo $_GET['cast_name']; ?>";
	var 	cast_privhash	= "<?php echo $_GET['cast_privhash']; ?>";

	// extract all configuration options from the document URI
	// - this is ok as it is suppposed to be used as iframe
	var urivar_arr	= neoip.core.doc_urivar_arr();
	var cfgvar_arr	= {
		'onload_start_play'	: "enabled",
		'fullpage_state'	: 'maximized'
	};
	for(var key in urivar_arr){
		// goto the next if not prefixed by "neoip_var_"
		if( /^neoip_var_/.test(key) == false )	continue;
		// remove the prefix from the key
		stripped_key	= /^neoip_var_(.*)/.exec(key)[1]
		// copy the value in cfgvar_arr
		cfgvar_arr[stripped_key]	= urivar_arr[key];
	}
	
	// build the neoip.ezplayer_t
	var ezplayer	= new neoip.ezplayer_t(cfgvar_arr);
	// commented out - been replace by a more generic cfgvar_arr, settable from url var
	//	ezplayer.play_post_playlist(true);
	//	ezplayer.fullpage_state("maximized");

	// set the server_date in ezplayer
	// - use php to get the server date now
	<?php	// version using microtime to be precise to the millisecond
		list($usec, $sec) = explode(' ', microtime());
		$usec_str	= substr( $usec, 1 );
		echo "var server_date=".$sec.$usec_str.";";			?>
	ezplayer.set_server_date( server_date*1000 );
	
	// if the uri contains a cast_name and cast_privhash variable, use it to load this playlist
	// - additionnaly dont put a playlist_arr, so impossible to change channel
	if( cast_name != "" && cast_privhash != "" ){
		var playlist_uid	= "plistarr_live/"+cast_name +"_"+cast_privhash+".playlist_jspf";		
		ezplayer.change_playlist(playlist_uid);
	}else{
		var plistarr_uid	= "plistarr_live";
		ezplayer.load_plistarr(plistarr_uid);
	}
	
	// start the ezplayer_t
	ezplayer.start();
</script>

<!-- BEGIN google analytic script -->
<script type="text/javascript">
	var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
	document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
</script>
<script type="text/javascript">
	var pageTracker = _gat._getTracker("UA-4037844-6");
	pageTracker._initData();
	pageTracker._trackPageview();

	// jme- Set a user-defined value as a segmentation to collect data on the widget_src
	// - if no variable 'neoip_widget_src' is found in the URI, assume "direct_access" else copy the value.
	// - currently "mozilla_prism" and "igoogle_gadget" are defined
	var widget_src	= "<?php echo $_GET['neoip_var_widget_src'] ? $_GET['neoip_var_widget_src'] : "direct_access" ?>";
	pageTracker._setVar(widget_src);
</script>
<!-- END   google analytic script -->

<!-- ************************************************************ -->
<!-- ************************************************************ -->
<!-- *		handle a API with crossframe library 		* -->
<!-- ************************************************************ -->
<!-- ************************************************************ -->
<!--
-->
<script>
var rpc_server	= crossframe.rpc_server_t({
	listener_obj:	"crossframe_msg"
});
rpc_server.register("playing_start", function(){
	console.info("rpc_server playing start");
	ezplayer.playing_start();
});
rpc_server.register("playing_stop", function(){
	console.info("rpc_server playing stop");
	ezplayer.playing_stop();
});
</script>


</body>
</html>
