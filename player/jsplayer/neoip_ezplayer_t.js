/*! \file
    \brief Definition of the ezplayer_t

\par Brief Description
A bunch of function on top of neoip.player_t to really simplify the usage of it

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 *
 * - valid cfgvar_arr keys
 *   - onload_force_mute boolean: if true, set mute onload no matter previous preferences
 *     - default to false
 *   - widget_src string: internal hint on the source of the player
 *     - default to 'direct access'
 *   - onload_start_play string: if == 'enabled', start playing immediatly after load, otherwise dont start
 *     - default to 'enabled'
 *   - fullpage_state string: determine the full_page_state (maximized|normal)
 *     - default to 'maximized'
 *
 * @param p_cfgvar_arr	array of all the configuration variable for this ezplayer_t
 * @param p_callback	callback to notify events from ezplayer_t objects
 */
neoip.ezplayer_t	= function(p_cfgvar_arr, p_callback)
{
	// copy the parameters
	this.m_cfgvar_arr		= p_cfgvar_arr;
	this.m_callback			= p_callback;
	// determine the html_id where to put the subplayer
	this.m_subplayer_html_id	= "subplayer_plugin_html_id";
	// determine the type of subplayer to init. "vlc"|"asplayer" are the valid one
	this.m_subplayer_type		= "asplayer";
	// state variable to know the fullpage_state "normal"|"maximized"
	this.m_fullpage_state		= "normal";
	// set the default 'play_post_playlist' value
	this.m_play_post_playlist	= false;
	// set the default 'autobuffer' value
	// - aka start buffering as soon as created
	this.m_autobuffer		= false;
	// set the default clisrv_diffdate - aka the difference between client and server date
	this.m_clisrv_diffdate		= 0;

	// initilize the playlist_uid
	this.m_playlist_uid	= "plistarr_play/sample_static.playlist.jspf";
//	this.m_playlist_uid	= "plistarr_play/sample_stream.playlist.jspf";
//	this.m_playlist_uid	= "plistarr_play/sample_stream_static.playlist.jspf";
//	this.m_playlist_uid	= "plistarr_play/ntv002.playlist.jspf";
//	this.m_playlist_uid	= "plistarr_play/auto_bliptv.playlist.jspf";
//	this.m_playlist_uid	= "plistarr_play/bliptv_at_random.playlist.jspf";
//	this.m_playlist_uid	= "plistarr_play/youtube_featured_at_random.playlist.jspf";
//	this.m_playlist_uid	= "plistarr_play/youtube_tag_at_random.playlist.jspf";
//	this.m_playlist_uid	= "plistarr_play/youporn_at_random.playlist.jspf";

	// create a fake dummy 'unload' event_listener
	// - this is needed to get 'forward/backward' button in firefox 
	// - as explained in http://developer.mozilla.org/en/docs/Using_Firefox_1.5_caching
	//   firefox got a special cache for forward/backward which play funky with .js
	// - as a consequence the initialization of ezplayer doesnt work
	// - BUT if 'unload' event is listened on, it is not cached by the
	//   'forward/backward' firefox cache
	// - NOTE: doesnt seem to work anymore - tested on ff3.0 and ff3.5
	//   - may be ff iframe issues
	neoip.core.dom_event_listener(window,"unload", function(){});

	// act on this.m_cfgvar_arr values
	if( this.cfgvar_has('fullpage_state') )
		this.fullpage_state(this.cfgvar_get('fullpage_state'));
	if( this.cfgvar_has('onload_start_play') && this.cfgvar_get('onload_start_play') == "enabled" )
		this.play_post_playlist(true);
}

/** \brief Destructor
 */
neoip.ezplayer_t.prototype.destructor	= function()
{
	// delete the objembed_initmon_t if needed
	if( this.m_objembed_initmon ){
		this.m_objembed_initmon.destructor();
		this.m_objembed_initmon	= null;
	}
	// delete the webpack_detect_t
	if( this.m_webpack_detect ){
		this.m_webpack_detect.destructor();
		this.m_webpack_detect	= null;
	}
	// delete the neoip.player_t if needed
	if( this.m_player ){
		this.m_player.destructor();
		this.m_player		= null;
	}
	// delete the neoip.sub_player_*_t if needed
	if( this.m_subplayer ){
		this.m_subplayer.destructor();
		this.m_subplayer	= null;
	}
	// delete the neoip.player_t if needed
	if( this.m_embedui ){
		this.m_embedui.destructor();
		this.m_embedui		= null;
	}
	// delete the neoip.playlist_loader_t if needed
	this._playlist_loader_dtor();
	// delete the neoip.plistarr_loader_t if needed
	this._plistarr_loader_dtor();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Allow to set the 'play_post_playlist' feature 
 * 
 * - MUST be done before start()
 */
neoip.ezplayer_t.prototype.play_post_playlist = function(value)
{
	// sanity check - the value MUST be a valid one
	console.assert( value == true || value == false );
	// update the local value
	this.m_play_post_playlist	= value;
	// sanity check - the autobuffer and play_post_playlist feature are mutually exclusive
	console.assert( this.m_autobuffer == false || this.m_play_post_playlist == false ); 
}

/** \brief Allow to set the 'autobuffer' feature 
 * 
 * - MUST be done before start()
 */
neoip.ezplayer_t.prototype.autobuffer = function(value)
{
	// sanity check - the value MUST be a valid one
	console.assert( value == true || value == false );
	// update the local value
	this.m_autobuffer	= value;
	// sanity check - the autobuffer and play_post_playlist feature are mutually exclusive
	console.assert( this.m_autobuffer == false || this.m_play_post_playlist == false ); 
}

/** \brief Allow to set the 'fullpage_state' 
 * 
 * - MUST be done before start() ?
 */
neoip.ezplayer_t.prototype.fullpage_state = function(value)
{
	// sanity check - the value MUST be a valid one
	console.assert( value == "normal" || value == "maximized" );
	// update the local value
	this.m_fullpage_state	= value;
}

/** \brief Allow to set the 'plistarr' - used to build the playlist in ezplayer_embedui_t
 *
 * - if prev_playlist_uid function param is specified, use this one.else use the cookie
 * - TODO make this plistarr read asynchronous
 *   - this plistarr is read in sync, which increase the latency of the start
 */
neoip.ezplayer_t.prototype.load_plistarr = function(plistarr_uid)
{
	// log to debug
	console.info("enter uri=" + plistarr_uid);

	// delete previous _loader if needed
	this._plistarr_loader_dtor();
	// start the new one
	this._plistarr_loader_ctor(plistarr_uid);
}


/** \brief Load the server_date from an uri
 *
 * - if this function is not called, the server date is assumed to have the 
 *   same as the client.
 */
neoip.ezplayer_t.prototype.set_server_date = function(server_date_epochms)
{
	// log to debug
	//console.info("enter");

	// determine the client date
	var client_date	= new Date();

	// store the difference between the client and server date
	this.m_clisrv_diffdate	= client_date.getTime() - server_date_epochms;

	// log to debug
	//console.info("server_date=" + server_date_epochms + "-ms client_date=" + client_date + " diff=" + this.m_clisrv_diffdate +"-ms");
}

/** \brief start the operation
 */
neoip.ezplayer_t.prototype.start = function()
{
	// log to debug
	//console.info("enter");
	// register the event_listener to be warned on load
	var cb_fct	= neoip.basic_cb_t(this._window_onload_cb, this)
	neoip.core.dom_event_listener(window,"load", cb_fct);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			window_onload_cb
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback called when the window is fully loaded
 */
neoip.ezplayer_t.prototype._window_onload_cb	= function()
{
	// log to debug
	//console.info("enter");
	// build the neoip.subplayer_t  - has it been tested
	if( this.m_subplayer_type == "vlc" ){
		var subplayer_fcts	= "playlist.isPlaying";
		this.m_subplayer	= new neoip.subplayer_vlc_t(this.m_subplayer_html_id, this.m_clisrv_diffdate);
	}else if( this.m_subplayer_type == "asplayer" ){
		var subplayer_fcts	= ["track_count", "embedui_delete"];
		// TODO this array is the list of all the flash external interface. generated by hand
		// - make it automatically generated and reverse the order for efficency
		// - TODO this doesnt work tho :) this modification has been made to fix poor detection
		//   of the flash
		subplayer_fcts	= [	"embedui_exist",
					"embedui_create",
					"embedui_delete",
					"embedui_update",
					"current_time",
					"current_state",
					"playing_start",
					"playing_stop",
					"set_sound_vol",
					"get_sound_vol",
					"set_sound_pan",
					"get_sound_pan",
					"set_sound_mute",
					"get_sound_mute",
					"flv_kframe_find",
					"playlist_loop",
					"set_smoothing",
					"get_smoothing",
					"set_deblocking",
					"get_deblocking",
					"set_fullscreen",
					"get_fullscreen",
					"may_fullscreen",
					"track_add",
					"track_del",
					"track_get",
					"track_count"
				];
		this.m_subplayer	= new neoip.subplayer_asplayer_t(this.m_subplayer_html_id, this.m_clisrv_diffdate);
	}else{	console.assert(false);	}

	// determine the objembed size depending on this.m_fullpage_state
	// - TODO how does this fit in the embedui stuff?
	if( this.m_fullpage_state == "normal" ){
		var objembed_w	= "320";	// TODO hardcode value- bad
		var objembed_h	= "240";
	}else if( this.m_fullpage_state == "maximized" ){
		var objembed_w	= "100%";
		var objembed_h	= "100%";
	}else{	console.assert(false);	}	
	// build the objembed for this.m_subplayer
	this.m_subplayer.build_objembed('neoip_player_container_id', objembed_w, objembed_h);

	// start waiting for the browser to initialize the plugin
	this.m_objembed_initmon	= new neoip.objembed_initmon_t()
	this.m_objembed_initmon.start(this.m_subplayer_html_id, subplayer_fcts
			, neoip.objembed_initmon_cb_t(this._objembed_initmon_cb, this));

	// start detecting the neoip-apps
	this._webpack_detect_start();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			objembed_initmon_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief callback called by objembed_initmon when the subplayer is loaded
 */
neoip.ezplayer_t.prototype._objembed_initmon_cb	= function(notifier_obj, userptr)
{
	// log to debug
	console.info("enter objembed notified");
	// delete the objembed_initmon_t if needed
	this.m_objembed_initmon.destructor();
	this.m_objembed_initmon	= null;

	// setup the player
	this.m_player	= new neoip.player_t(this.m_subplayer, this.m_clisrv_diffdate
				, neoip.player_cb_t(this._neoip_player_cb, this));
	
	// build the playlist_loader_t
	this._playlist_loader_ctor();

	// call _player_post_init now
	this._player_post_init();

	// get the player plugin
	var plugin	= document.getElementById(this.m_subplayer_html_id)

	// if plugin support embedui, create this.m_embedui
	var plugin	= document.getElementById(this.m_subplayer_html_id)
	if( typeof(plugin.embedui_create) == "function" )
		this.m_embedui	= new neoip.ezplayer_embedui_t(this);
}

neoip.ezplayer_t.prototype._player_post_init	= function()
{
	// if this.m_player is not yet initialized return now
	if( !this.m_player )	return;
	
	// initialize the player outter_uri if some neoip-apps have already been detected
	for(var apps_suffix in {"oload": null, "casto": null}){
		var outter_uri	= null;
		// if this neoip-apps is present, get its outter_uri
		if( neoip.apps_present(apps_suffix) )	outter_uri = neoip.outter_uri(apps_suffix);
		// update this.m_player with this outter_uri for this apps_suffix
		this.m_player.set_outter_uri(apps_suffix, outter_uri);
	}

	// sanity check - the autobuffer and play_post_playlist feature are mutually exclusive
	console.assert( this.m_autobuffer == false || this.m_play_post_playlist == false ); 

	// if this.m_autobuffer is enabled, notify this.m_player
	// - TODO neoip.player_t._prefetch_initial is a VERY bad name for it. change it	
	if( this.m_autobuffer )			this.m_player._prefetch_initial();
	
	// if there is still a webpack_detect_t running, return now
	if( this.webpack_detect_running() )	return;
	
	// notify the caller
	if( this.m_callback )			this.m_callback("player_initialized");

	// if there is no playlist, return now
	if( this.m_player.playlist() == null )	return;
	
	// if this.m_play_post_playlist is disabled, return now
	if( this.m_play_post_playlist == false)	return;
	
	// set this.m_play_post_playlist to false
	this.m_play_post_playlist	= false;

	// update the cookie 'ezplayer_playlist_uid'
	neoip.core.cookie_write("ezplayer_playlist_uid", this.m_playlist_uid, 30);
	
	// NOTE: here m_play_post_playlist is enabled and this.m_player is ready to start_playing

	// start playing
	this.playing_start();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			neoip.plistarr_loader_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// query function
neoip.ezplayer_t.prototype.plistarr_get	= function()	{ return this.m_plistarr;	}

/** \brief Construct neoip.plistarr_loader_t
 */
neoip.ezplayer_t.prototype._plistarr_loader_ctor = function(plistarr_uid)
{
	// log to debug
	console.info("ENTER plistarr_loader_ctor");
	// destruct the existing neoip.plistarr_loader_t if needed
	this._plistarr_loader_dtor();	
	// init the plistarr_loader
	this.m_plistarr_loader = new neoip.plistarr_loader_t({
		callback:	neoip.plistarr_loader_cb_t(this._neoip_plistarr_loader_cb, this),
		xdomrpc_url:	neoip.globalCfg.plistarr_loader_xdomrpc_url,
		plistarr_uid:	plistarr_uid
	});
}

/** \brief destruct neoip.plistarr_loader_t
 */
neoip.ezplayer_t.prototype._plistarr_loader_dtor = function()
{
	// if no neoip.plistarr_loader_t is running, return now 
	if( this._plistarr_loader_running() == false )	return;
	// log to debug
	console.info("ENTER plistarr_loader_dtor");
	// delete the neoip.plistarr_loader_t
	this.m_plistarr_loader.destructor();
	this.m_plistarr_loader= null;
}

/** \brief return true if neoip.plistarr_loader_t is running, false otherwise
 */
neoip.ezplayer_t.prototype._plistarr_loader_running = function()
{
	// if no neoip.plistarr_loader_t is running, return false 
	if( !this.m_plistarr_loader )	return false;
	// else return true
	return true;
}

/** \brief neoip.plistarr_loader_t callback
 */
neoip.ezplayer_t.prototype._neoip_plistarr_loader_cb = function(notified_obj, userptr
							, event_type, arg)
{
	// TODO this is super unclear what to do
	// - it should do the usual post plistarr stuff
	// - and what do to if it changed
	//   - on the UI
	//   - on the player
	// - what if the player is currently playing something

	// sanity check -
	console.assert(event_type == 'new_plistarr');

	// log to debug
	console.info("enter event_type=" + event_type);
	console.dir(arg);

	// copy plistarr_t 
	this.m_plistarr		= arg.plistarr;

	// if this.m_player.is_playing(), do nothing
	if( this.m_player && this.m_player.is_playing() )	return;

	// change the playlist
	// - if there is a "ezplayer_playlist_uid" cookie, use this one
	// - else pick the first of the this.m_plistarr
	var prev_playlist_uid	= neoip.core.cookie_read("ezplayer_playlist_uid");
	// if prev_playlist_uid != null and is not in this.m_plistarr, act if it was null
	if( prev_playlist_uid && !this.m_plistarr.has_playlist_uid(prev_playlist_uid) )
		prev_playlist_uid = null;
	// TODO what if there is no item in this.m_plistarr... there is a bug ?
	if( prev_playlist_uid )	this.change_playlist(prev_playlist_uid);
	else			this.change_playlist(this.m_plistarr.item_arr()[0].playlist_uid());
	
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			neoip.playlist_loader_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Construct neoip.playlist_loader_t
 */
neoip.ezplayer_t.prototype._playlist_loader_ctor = function()
{
	// log to debug
	console.info("ENTER playlist_loader_ctor");
	// destruct the existing neoip.playlist_loader_t if needed
	this._playlist_loader_dtor();	
	// init the playlist_loader for this playlist_uid
	this.m_playlist_loader = new neoip.playlist_loader_t({
		callback:	neoip.playlist_loader_cb_t(this._neoip_playlist_loader_cb, this),
		xdomrpc_url:	neoip.globalCfg.playlist_loader_xdomrpc_url,
		playlist_uid:	this.m_playlist_uid
	});	
}

/** \brief destruct neoip.playlist_loader_t
 */
neoip.ezplayer_t.prototype._playlist_loader_dtor = function()
{
	// if no neoip.playlist_loader_t is running, return now 
	if( this._playlist_loader_running() == false )	return;
	// log to debug
	console.info("ENTER playlist_loader_dtor");
	// delete the neoip.playlist_loader_t
	this.m_playlist_loader.destructor();
	this.m_playlist_loader= null;
}

/** \brief return true if neoip.playlist_loader_t is running, false otherwise
 */
neoip.ezplayer_t.prototype._playlist_loader_running = function()
{
	// if no neoip.playlist_loader_t is running, return false 
	if( !this.m_playlist_loader )	return false;
	// else return true
	return true;
}

/** \brief neoip.playlist_loader_t callback
 */
neoip.ezplayer_t.prototype._neoip_playlist_loader_cb = function(notified_obj, userptr
							, event_type, arg)
{
	// log to debug
	console.info("enter event_type=" + event_type);
	//console.dir(arg);
	
	// if this.m_player is not yet set, do nothing
	if( !this.m_player )	return;
		
	// sanity check - arg['playlist'] MUST exist
	console.assert( arg['playlist'] );
	// set the playlist in this.m_player
	this.m_player.playlist( arg['playlist'] );
	
	// if this.m_play_post_playlist is enable, see if it is possible to run it now
	// - NOTE: calling _player_post_init() seems strange here. and was causing trouble
	//   with the 
	//if( this.m_play_post_playlist )	this._player_post_init();
	if( this.m_play_post_playlist )	this.playing_start();
	
	// if _embedui_supported, fwd neoip.playlist_loader_t event, update embedui accordingly
	if( this.m_embedui )		this.m_embedui.playlist_loader_cb(event_type, arg);
	
	// if neoip.player_t is_not_playing, stop the neoip.playlist_loader_t 
	if( this.m_player.is_not_playing() )	this._playlist_loader_dtor();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			neoip_player_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief neoip.player_t callback
 */
neoip.ezplayer_t.prototype._neoip_player_cb = function(notified_obj, userptr
							, event_type, arg)
{
	// log to debug
	//console.info("enter_type=" + event_type);	console.dir(arg);
	
	// handle the context menu selection from asplayer
	// - TODO put this elsewhere. to refactor. this is crap
	// - the modification of context-menu is hardcoded in asplayer
	//   - it SHOULD be a tunable one. typically thru embedui
	// - it is coded dirty in asplayer itself
	if( event_type == "asmenu_item_select" ){
		var	home_uri	= "http://urfastr.net/video";
		window.top.location.href= home_uri;
		return;
	}
	
	// forward the event_type to the proper handler
	if( event_type == "changed_state" || event_type == "new_time" ){
		//neoip.player_wikidbg.main_cb(this.m_player, "admin", 'player_info_container_id');
		
		// if _embedui_supported, fwd neoip.player_t event, update embedui accordingly
		if( this.m_embedui )	this.m_embedui.neoip_player_cb(event_type, arg);
	}else if( event_type == "error" ){
		if( this.m_player.is_playing() )	this.playing_stop();
		// if _embedui_supported, fwd neoip.player_t event, update embedui accordingly
		if( this.m_embedui )	this.m_embedui.neoip_player_cb(event_type, arg);
	}else if( event_type == "embedui_event" ){
		this.m_embedui.embedui_event_cb(arg['event_type'], arg['arg']);
	}
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			webpack_detect_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start the webpack_detect_t object
 */
neoip.ezplayer_t.prototype._webpack_detect_start	= function()
{
	// start probing neoip-apps
	var cb_fct		= neoip.webpack_detect_cb_t(this._webpack_detect_cb, this);
	this.m_webpack_detect	= new neoip.webpack_detect_t(cb_fct, neoip.globalCfg.webpack_detect_apps_params);
}

/** \brief Callback for all the neoip.webpack_detect_t of this page
 */
neoip.ezplayer_t.prototype._webpack_detect_cb	= function(webpack_detect, userptr, result_str)
{
	// detroy m_webpack_detect
	this.m_webpack_detect.destructor();
	this.m_webpack_detect	= null;
	
	// store the result
	this.m_webpack_detect_result	= result_str;

	// log the result
	console.info("webpack_state=" + result_str);
		
	// NOTE: at this point webpack_detect is considered completed
	console.assert( !this.webpack_detect_running() );
	
	// notify the embedui if supported
	if( this.m_embedui )	this.m_embedui.webpack_detect_completed_cb();
	// call _player_post_init now
	this._player_post_init()
}

/** \brief Return true if webpack_detect probing is running, false otherwise
 */
neoip.ezplayer_t.prototype.webpack_detect_running	= function()
{
	if( this.m_webpack_detect )	return true;
	// return false if all previous tests passed
	return false;
}

/** \brief Return the webpack_detect probing result
 */
neoip.ezplayer_t.prototype.webpack_detect_result	= function()
{
	// if the result is not yet known, return "inprobing"
	if( !this.m_webpack_detect_result )	return "inprobing";
	// return the actual result
	return this.m_webpack_detect_result;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

neoip.ezplayer_t.prototype.cfgvar_arr	= function()		{ return this.m_cfgvar_arr;			}
neoip.ezplayer_t.prototype.cfgvar_has	= function(key)		{ return this.m_cfgvar_arr[key] != undefined;	}
neoip.ezplayer_t.prototype.cfgvar_get	= function(key)		{ return this.m_cfgvar_arr[key];		}
neoip.ezplayer_t.prototype.cfgvar_set	= function(key, val)	{ this.m_cfgvar_arr[key]	= val;		}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			public function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief To change the playlist
 */
neoip.ezplayer_t.prototype.change_playlist	= function(p_playlist_uid)
{
	// delete the current playlist_loader if needed
	this._playlist_loader_dtor();
	// update the local playlist_uid
	this.m_playlist_uid	= p_playlist_uid;
	// EXPERIMENTAL track the playlist_uid change with googe analytic
	// TODO to test... not sure it works, or that it is symply at the proper place
	if( typeof(pageTracker) != "undefined" )	pageTracker._trackPageview('/' + this.m_playlist_uid);
	// if this.m_player is not yet initialized, return now
	if( !this.m_player )	return; 
	// init the playlist_loader for this playlist_uid
	this._playlist_loader_ctor();
}

/** \brief To start playing
 */
neoip.ezplayer_t.prototype.playing_start	= function()
{
	// ask the player_t to start playing
	this.m_player.playing_start();
	// if the playlist_loader is not running, start it now 
	if( !this._playlist_loader_running() )	this._playlist_loader_ctor();
	// notify the embedui if supported
	if( this.m_embedui )			this.m_embedui.playing_start();
	// notify the caller
	if( this.m_callback )			this.m_callback("play_starting", { playlist_uid: this.m_playlist_uid });
}

/** \brief To stop playing
 */
neoip.ezplayer_t.prototype.playing_stop	= function()
{
	// ask the player_t to stop playing
	this.m_player.playing_stop();
	// if a playlist available, and playlist_loader is running, stop it
	if( this._playlist_loader_running() && this.m_player.playlist() )
		this._playlist_loader_dtor();
	// notify the embedui if supported
	if( this.m_embedui )	this.m_embedui.playing_stop();
	// notify the caller
	if( this.m_callback )	this.m_callback("play_stopping", { playlist_uid: this.m_playlist_uid });
}

/** \brief Return true if the player is currently playing, false otherwise
 */
neoip.ezplayer_t.prototype.is_playing	= function()
{
	// ask the player_t
	return this.m_player.is_playing();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ezplayer_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a ezplayer_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.ezplayer_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(event_type, arg) {
			fct.call(scope, this, userptr, event_type, arg);
		};
}

