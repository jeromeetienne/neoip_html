/*! \file
    \brief Definition of the ezplayer_widget_t

\par Brief Description
an object to handle ezplayer itself and its relation with the iframe widget (e.g the
crossframe rpc api, relation with the URI variable)

*/


// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
neoip.ezplayer_widget_t	= function(p_cfgvar_arr, p_callback)
{
	var cast_name		= "";
	var cast_privhash	= "";
	var playlist_id		= "";
	// TODO this should be from the caller ?
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
	var cfgvar_arr	= this._parse_cfgvar_arr();
	console.dir(cfgvar_arr);
	
	// build the neoip.ezplayer_t
	this.m_ezplayer	= new neoip.ezplayer_t(cfgvar_arr, neoip.ezplayer_cb_t(this._neoip_ezplayer_cb, this));
	// set the server_date in ezplayer
	this.m_ezplayer.set_server_date( server_date*1000 );
	
	// if there is a playlist_uid , use it to load this playlist
	// - additionnaly dont put a playlist_arr, so impossible to change channel
	if( playlist_uid != "" ){
		this.m_ezplayer.change_playlist(playlist_uid);
	}else{
		var plistarr_uid	= neoip.globalCfg.dfl_plistarr_uid;
		this.m_ezplayer.load_plistarr(plistarr_uid);
	}
	// start the ezplayer_t
	this.m_ezplayer.start();
	
	// build the rpc_server
	this._rpc_server_ctor()
	// special case for addEventListener: possible to initialize it from the neoip_var_* in the url
	// - this allow to immediatly get info on the "boot" of the page
	if( cfgvar_arr.api_addEventListener ){
		// convert the cfgvar_arr.api_* argument
		// - NOTE: how come i need a unescape here ? do i escape too much before ?
		var rpc_client_args	= JSON.parse(unescape(cfgvar_arr.api_addEventListener));
		// build the rpc_client
		this._rpc_client_ctor(rpc_client_args)
	}
}

/** \brief Destructor
 */
neoip.ezplayer_widget_t.prototype.destructor	= function()
{
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			misc functions
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief extract all configuration options from the document URI
 * 
 * this is ok as it is suppposed to be used as iframe
*/
neoip.ezplayer_widget_t.prototype._parse_cfgvar_arr	= function()
{
	var urivar_arr	= neoip.core.doc_urivar_arr();
	var cfgvar_arr	= {
		//onload_start_play	: "enabled",
		fullpage_state		: 'maximized'
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

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			neoip_ezplayer_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief neoip.ezplayer_t callback
 */
neoip.ezplayer_widget_t.prototype._neoip_ezplayer_cb = function(notified_obj, userptr
							, event_type, event_args)
{
	// log to debug
	console.info("enter_type=" + event_type);	console.dir(event_args);

	
	// if there is no this.m_rpc_client, dont notify the caller
	if( !this.m_rpc_client )	return;
	// forward the event to the caller
	// - NOTE: no callback is provided so currently 2 ways communication is not possible
	this.m_rpc_client.call("event_notification", event_type, event_args);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			RPC client/server
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Initialize the rpc_client
*/
neoip.ezplayer_widget_t.prototype._rpc_client_ctor	= function(rpc_client_args)
{
	// sanity check - this.m_rpc_client MUST NOT be initialized 
	console.assert(!this.m_rpc_client);
	// initialize this.m_rpc_client
	this.m_rpc_client	= new crossframe.rpc_client_t(rpc_client_args);
	// TODO to remove - just debug
	//var rpc_client 	= this.m_rpc_client;
	//setTimeout(function(){
	//	rpc_client.call("event_notification", "playing_started", { cast_name: "super_cast", cast_privhash: 'super_hash'}, function(){
	//		alert('received answer to my event notification');
	//	});
	//}, 0);		
}
/**
 * Initialize the rpc_server
*/
neoip.ezplayer_widget_t.prototype._rpc_server_ctor	= function(){
	this.m_rpc_server	= new crossframe.rpc_server_t({
		listener_obj:	"crossframe_msg_rpc_server_page"
	});
var ezplayer= this.m_ezplayer;
	this.m_rpc_server.register("addEventListener", function(rpc_client_args){
		console.info("rpc_server addEventListener");
		// build the rpc_client
		this._rpc_client_ctor(rpc_client_args)
	});
	this.m_rpc_server.register("playing_start", function(){
		console.info("rpc_server playing start");
		ezplayer.playing_start();
	});
	this.m_rpc_server.register("playing_stop", function(){
		console.info("rpc_server playing stop");
		ezplayer.playing_stop();
	});
	this.m_rpc_server.register("playing_stop", function(){
		console.info("rpc_server playing stop");
		ezplayer.playing_stop();
	});
	this.m_rpc_server.register("is_playing", function(){
		console.info("rpc_server is_playing");
		return ezplayer.is_playing();
	});
	this.m_rpc_server.register("plistarr_get", function(){
		console.info("rpc_server plistarr_get");
		var plistarr	= ezplayer.plistarr_get();
		return plistarr.raw_data();
	});
	this.m_rpc_server.register("webpack_status", function(){
		console.info("rpc_server webpack_status");
		return ezplayer.webpack_detect_result();
	});
}
