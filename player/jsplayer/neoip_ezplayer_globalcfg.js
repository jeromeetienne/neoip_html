// PHP Preprocessing initialisation
// example usage: php -f filename.js -- --ref --playerlist_live
//
// <?php $in_rel	= in_array("--rel", $argv); ?>
// <?php $in_dev	= in_array("--dev", $argv); ?>
// <?php $in_live	= in_array("--playlist_live", $argv); ?>
// <?php $in_play	= in_array("--playlist_play", $argv); ?>


neoip.globalCfg	= {}

/** ************************************************************************************************
 * neoip.globalCfg.dfl_plistarr_uid is the default plistarr_uid used when nothing is specified
*/
// <?php if($in_play):	?>	//
	neoip.globalCfg.dfl_plistarr_uid	= "plistarr_play";
// <?php elseif($in_live): ?>	//
	neoip.globalCfg.dfl_plistarr_uid	= "plistarr_live";
// <?php endif;		?> 	//

/** ************************************************************************************************
 * neoip.globalCfg.playlist_loader_xdomrpc_url is the xdomrpc_t url used by neoip.plistarr_loader_t
*/
// <?php if($in_rel):	?>	//
	neoip.globalCfg.plistarr_loader_xdomrpc_url	= "http://api.urfastr.net/CastMdataSrv2/XDOMRPC";
// <?php elseif($in_dev): ?>	//
	neoip.globalCfg.plistarr_loader_xdomrpc_url	= "../../cgi-bin/xdomrpc_dispatcher.php";
	neoip.globalCfg.plistarr_loader_xdomrpc_url	= "http://dedixl.jetienne.com/~jerome/neoip_html/cgi-bin/xdomrpc_dispatcher.php";
	neoip.globalCfg.plistarr_loader_xdomrpc_url	= "http://jmehost2.local/~jerome/webwork/api.urfastr.net/web/frontend_dev.php/CastMdataSrv2/XDOMRPC";
	neoip.globalCfg.plistarr_loader_xdomrpc_url	= "http://api.urfastr.net/frontend_dev.php/CastMdataSrv2/XDOMRPC";
	neoip.globalCfg.plistarr_loader_xdomrpc_url	= "http://api.urfastr.net/CastMdataSrv2/XDOMRPC";
// <?php endif;		?> 	//

/**
 * neoip.globalCfg.playlist_loader_xdomrpc_url is the xdomrpc_t url used by neoip.playlist_loader_t
*/
// <?php if($in_rel):	?>	//
	neoip.globalCfg.playlist_loader_xdomrpc_url	= "http://api.urfastr.net/CastMdataSrv2/XDOMRPC";
// <?php elseif($in_dev): ?>	//
	neoip.globalCfg.playlist_loader_xdomrpc_url	= "../../cgi-bin/xdomrpc_dispatcher.php";
	//neoip.globalCfg.playlist_loader_xdomrpc_url	= "http://dedixl.jetienne.com/~jerome/neoip_html/cgi-bin/xdomrpc_dispatcher.php";
	neoip.globalCfg.playlist_loader_xdomrpc_url	= "http://jmehost2.local/~jerome/webwork/api.urfastr.net/web/frontend_dev.php/CastMdataSrv2/XDOMRPC";
	//neoip.globalCfg.playlist_loader_xdomrpc_url	= "http://api.urfastr.net/frontend_dev.php/CastMdataSrv2/XDOMRPC";
	neoip.globalCfg.playlist_loader_xdomrpc_url	= "http://api.urfastr.net/CastMdataSrv2/XDOMRPC";
// <?php endif;		?> 	//

/**
 * neoip.globalCfg.recorder_mdata_srv_uri is the url used by neoip.recorder_t for cast_mdata_srv
*/
// <?php if($in_rel):	?>	//
	neoip.globalCfg.recorder_mdata_srv_uri		= "http://api.urfastr.net/CastMdataSrv2/RPC2";
// <?php elseif($in_dev): ?>	//
	//neoip.globalCfg.recorder_mdata_srv_uri	= "http://dedixl.jetienne.com/~jerome/neoip_html/cgi-bin/cast_mdata_echo_server.fcgi";
	neoip.globalCfg.recorder_mdata_srv_uri		= "http://jmehost2.local/~jerome/webwork/api.urfastr.net/web/frontend_dev.php/CastMdataSrv2/RPC2";
	//neoip.globalCfg.recorder_mdata_srv_uri	= "http://api.urfastr.net/frontend_dev.php/CastMdataSrv2/RPC2";
	neoip.globalCfg.recorder_mdata_srv_uri		= "http://api.urfastr.net/CastMdataSrv2/RPC2";
// <?php endif;		?> 	//

/**
 * neoip.globalCfg.subplayer_asplayer_swf_url is the url used 
*/
// <?php if($in_rel):	?>	//
	neoip.globalCfg.subplayer_asplayer_swf_url	= "neoip_asplayer.swf";
// <?php elseif($in_dev): ?>	//
	neoip.globalCfg.subplayer_asplayer_swf_url	= "neoip_asplayer.swf";
// <?php endif;		?> 	//

/**
 * neoip.globalCfg.webpack_detect_apps_params determines where/what neoip.webpack_detect_t will look for/in webpack
*/
// <?php if($in_rel):	?>	//
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
// <?php elseif($in_dev): ?>	//
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
							//"options"	: {'hostname': 'dedixl.jetienne.com'}
							"options"	: {'hostname': 'jmehost2.local'}
						}
				};
// <?php endif;		?> 	//
				
/**
 * neoip.globalCfgWebpack.clientLocation stores the player location (in a google format)
*/
neoip.globalCfg.playerLocation	= null;
neoip.geoLocalize(function(clientLocation){
	neoip.globalCfg.playerLocation	= clientLocation;
});
