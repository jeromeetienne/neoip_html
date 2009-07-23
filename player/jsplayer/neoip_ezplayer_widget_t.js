/**
 * ezplayer_widget_t is the class to handle the widget using ezplayer
*/
var ezplayer_widget_t = function(){
	var rpc_server	= null;	// used to received API calls
	var rpc_client	= null;	// used to notify event to the caller
	var ezplayer	= null;


	/************************************************************************/
	/************************************************************************/
	/*		misc function						*/
	/************************************************************************/
	/************************************************************************/	

	/**
	 * Constructor
	*/
	var ctor	= function(){
		var cast_name		= "";
		var cast_privhash	= "";
		var playlist_id		= "";
		var server_date		= neoip.core.download_file_insync("../../cgi-bin/server_date.php", true);
		
		// just to debug
		if( false ){
			cast_name		= "LCP an"
			cast_privhash		= "e334e91c";
			playlist_id		= "001.ruby_conf";
		}
		
			//var cast_name		= "<?php echo $_GET['cast_name'];	?>";
		//var cast_privhash	= "<?php echo $_GET['cast_privhash'];	?>";
		//var playlist_id	= "<?php echo $_GET['playlist_id'];	?>";
		//var server_date	=  <?php printf("%f",microtime(true) );	?>
	
		// determine the playlist_uid (if any)
		var playlist_uid	= "";
		// if the uri contains cast_name/cast_privhash variable and dfl_plistarr_uid == live, use it to load this playlist
		if( neoip.globalCfg.dfl_plistarr_uid == "plistarr_live" && cast_name != "" && cast_privhash != "" ){
			playlist_uid	= neoip.globalCfg.dfl_plistarr_uid+"/"+cast_name +"_"+cast_privhash+".playlist_jspf";
		// if the uri contains playlist_id and dfl_plistarr_uid == play, use it to load this playlist
		}else if( neoip.globalCfg.dfl_plistarr_uid == "plistarr_play" && playlist_id != "" ){
			playlist_uid	= neoip.globalCfg.dfl_plistarr_uid+"/"+playlist_id+".playlist.jspf";		
		}
		
		// parse cfgvar_arr from uri neoip_var_* variable
		var cfgvar_arr	= _parse_cfgvar_arr();
		console.dir(cfgvar_arr);
		
		// build the neoip.ezplayer_t
		ezplayer	= new neoip.ezplayer_t(cfgvar_arr);
		// set the server_date in ezplayer
		ezplayer.set_server_date( server_date*1000 );
		
		// if there is a playlist_uid , use it to load this playlist
		// - additionnaly dont put a playlist_arr, so impossible to change channel
		if( playlist_uid != "" ){
			ezplayer.change_playlist(playlist_uid);
		}else{
			var plistarr_uid	= neoip.globalCfg.dfl_plistarr_uid;
			ezplayer.load_plistarr(plistarr_uid);
		}
		// start the ezplayer_t
		ezplayer.start();
		
		// build the rpc_server
		_rpc_server_ctor()
		// special case for addEventListener: possible to initialize it from the neoip_var_* in the url
		// - this allow to immediatly get info on the "boot" of the page
		if( cfgvar_arr.api_addEventListener ){
			// convert the cfgvar_arr.api_* argument
			// - NOTE: how come i need a unescape here ? do i escape too much before ?
			rpc_client_args	= JSON.parse(unescape(cfgvar_arr.api_addEventListener));
			// build the rpc_client
			_rpc_client_ctor(rpc_client_args)
		}
	}

	/************************************************************************/
	/************************************************************************/
	/*		misc function						*/
	/************************************************************************/
	/************************************************************************/	
	/**
	 * extract all configuration options from the document URI
	 * - this is ok as it is suppposed to be used as iframe
	*/
	var _parse_cfgvar_arr	= function(){
		var urivar_arr	= neoip.core.doc_urivar_arr();
		var cfgvar_arr	= {
			//'onload_start_play'	: "enabled",
			fullpage_state	: 'maximized'
		};
		for(var key in urivar_arr){
			// goto the next if not prefixed by "neoip_var_"
			if( /^neoip_var_/.test(key) == false )	continue;
			// remove the prefix from the key
			stripped_key	= /^neoip_var_(.*)/.exec(key)[1]
			// copy the value in cfgvar_arr
			cfgvar_arr[stripped_key]	= urivar_arr[key];
		}
		// return the justbuilt cfgvar_arr
		return cfgvar_arr;
	}
	
	/************************************************************************/
	/************************************************************************/
	/*		RPC client/server					*/
	/************************************************************************/
	/************************************************************************/	
	/**
	 * Initialize the rpc_client
	*/
	var _rpc_client_ctor	= function(rpc_client_args){
		rpc_client	= new crossframe.rpc_client_t(rpc_client_args);		
		setTimeout(function(){
			rpc_client.call("event_notification", "playing_started", { cast_name: "super_cast", cast_privhash: 'super_hash'}, function(){
				alert('received answer to my event notification');
			});
		}, 0);		
	}
	/**
	 * Initialize the rpc_server
	*/
	var _rpc_server_ctor	= function(){
		rpc_server	= new crossframe.rpc_server_t({
			listener_obj:	"crossframe_msg_rpc_server_page"
		});
		rpc_server.register("playing_start", function(){
			console.info("rpc_server playing start");
			ezplayer.playing_start();
		});
		rpc_server.register("playing_stop", function(){
			console.info("rpc_server playing stop");
			ezplayer.playing_stop();
		});
		rpc_server.register("playing_stop", function(){
			console.info("rpc_server playing stop");
			ezplayer.playing_stop();
		});
		rpc_server.register("addEventListener", function(rpc_client_args){
			console.info("rpc_server addEventListener");
			// build the rpc_client
			_rpc_client_ctor(rpc_client_args)
		});
	}

	// launch the constructor
	ctor();
	// return public functions and variables
	return {
	};
};