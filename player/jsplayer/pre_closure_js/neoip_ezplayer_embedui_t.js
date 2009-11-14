/*! \file
    \brief Definition of the ezplayer_embedui_t

\par Brief Description
handle all the embedui on top of neoip.ezplayer_t

- TODO make this its own object
  - required by regularity rules
  - have pointer on m_ezplayer in ctor
  - have a .is_supported public function
  - all public function must return immediatly if is_not_supported();

\par Possible UI improvement
- if the mouse does not more for a while, hide it
- if a ui element is visible but no action occurs on it for a while, hide it
- when in picinpic, click anywhere on the video would toogle fullscreen
- when not playing and a playlist is selected, go into playing

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
neoip.ezplayer_embedui_t	= function(p_ezplayer)
{
	// copy the parameter
	this.m_ezplayer	= p_ezplayer;
	
	// get directly the plugin
	var plugin	= this._get_plugin()
	

	// build the "embedui_id_root_stage"
	var embedui_opt	= {	"embedui_class"	: "root_stage",
				"embedui_id"	: "embedui_id_root_stage",
				"userptr": {
					"embedui_id"	: "embedui_id_root_stage"
					},
				"element_opt"	: {
					}
				};
	plugin.embedui_create(embedui_opt);	


	// init the plugin sound from the values saved in the cookie
	this._sound_init_from_cookie();
	// build the "embedui_id_volume"
	var embedui_opt	= {	"embedui_class"	: "button_volume",
				"embedui_id"	: "embedui_id_volume",
				"userptr": {
					"embedui_id"	: "embedui_id_volume"
					},
				"element_opt" : {
					"sound_vol"	: plugin.get_sound_vol(),
					"sound_mute"	: plugin.get_sound_mute()
					},	
			 	"base_sprite" : {
			 		"element_x"	: 0.0,
			 		"element_y"	: 0.0,
			 		"element_w"	: 0.1,
			 		"element_h"	: 0.0,
					"anchor_x"	: 0.5, 
					"anchor_y"	: 0.5,
					"display_type"	: "timeout",
					"timeout_delay"	: 999*1000					
					}
				};
	plugin.embedui_create(embedui_opt);
	
	// build the "embedui_id_winsizer"
	var embedui_opt	= {	"embedui_class"	: "button_bitmap",
				"embedui_id"	: "embedui_id_winsizer",
				"userptr": {
					"embedui_id"	: "embedui_id_winsizer"
					},
				"element_opt" : {
					"type"		: "vector",
					"location"	: plugin.get_fullscreen() 
								? "win_normalizer"
								: "win_maximizer"
					},
			 	"base_sprite" : {
			 		"element_x"	: 1.0,
			 		"element_y"	: 0.0,
			 		"element_w"	: 0.08,
			 		"element_h"	: 0.0,
					"anchor_x"	: 0.0, 
					"anchor_y"	: 0.0,
					"display_type"	: "timeout",
					"timeout_delay"	: 999*1000				
					}
				};
	plugin.embedui_create(embedui_opt);
	
	// build the "embedui_id_playlist_toggle"
	var embedui_opt	= {	"embedui_class"	: "button_bitmap",
				"embedui_id"	: "embedui_id_playlist_toggle",
				"userptr": {
					"embedui_id"	: "embedui_id_playlist_toggle"
					},
				"element_opt" : {
					"type"		: "vector",
					"location"	: "chansel"
					},
			 	"base_sprite" : {
			 		"element_x"	: 0.0,
			 		"element_y"	: 0.5,
			 		"element_w"	: 0.08,
			 		"element_h"	: 0.0,
					"display_type"	: "timeout",
					"timeout_delay"	: 999*1000				
					}
				};
	// create the embedui_id_playlist_toggle
	plugin.embedui_create(embedui_opt);


	// build the "embedui_id_record_toggle"
	var embedui_opt	= {	"embedui_class"	: "button_bitmap",
				"embedui_id"	: "embedui_id_record_toggle",
				"userptr": {
					"embedui_id"	: "embedui_id_record_toggle"
					},
				"element_opt" : {
					"type"		: "vector",
					"location"	: "record"
					},
			 	"base_sprite" : {
			 		"element_x"	: 1.0,
			 		"element_y"	: 0.5,
			 		"element_w"	: 0.08,
			 		"element_h"	: 0.0,
					"anchor_x"	: 0.5, 
					"anchor_y"	: 0.5,
					"display_type"	: "timeout",
					"timeout_delay"	: 999*1000			
					}
				};
	plugin.embedui_create(embedui_opt);	
	
	// create the "embedui_id_track_title"
	var embedui_opt	= {	"embedui_class"	: "text_caption",
				"embedui_id"	: "embedui_id_track_title",
				"userptr": {
					"embedui_id"	: "embedui_id_track_title"
					},
				"element_opt" : {
					"text"		: " ",
					"font_size"	: 100/1024
					},
			 	"base_sprite" : {
			 		"element_x"	: 0.5,
			 		"element_y"	: 0.8,
			 		"element_w"	: 1.0,
			 		"element_h"	: 0.0,
					"anchor_x"	: 0.5, 
					"anchor_y"	: 0.5,
					"display_type"	: "timeout",
					"timeout_delay"	: 4*1000,
					"mouse_action"	: false
					}
				};
	plugin.embedui_create(embedui_opt);
	
	// create the "embedui_id_status_line"
	var embedui_opt	= {	"embedui_class"	: "text_caption",
				"embedui_id"	: "embedui_id_status_line",
				"userptr": {
					"embedui_id"	: "embedui_id_status_line"
					},
				"element_opt" : {
					"text"		: " ",
					"font_size"	: 100/1024,
					"font_color"	: 0xFF0000
					},
			 	"base_sprite" : {
			 		"element_x"	: 0.5,
			 		"element_y"	: 0.2,
			 		"element_w"	: 1.0,
			 		"element_h"	: 0.0,
					"anchor_x"	: 0.5, 
					"anchor_y"	: 0.5,
					"display_type"	: "timeout",
					"timeout_delay"	: 4*1000,
					"mouse_action"	: false
					}
				};
	plugin.embedui_create(embedui_opt);

	// reinitialize play/stop buttons IIF ezplayer.m_play_post_playlist is false
	// - NOTE: this avoid to get the play button to appears and shortly after disapears
	//   when m_ezplayer is in autoplay
	if( this.m_ezplayer.m_play_post_playlist == false )	this._reinit_playstop_buttons();

	// if ezplayer.webpack_detect_running is false, notify a webpack_detect_completed_cb()
	if( this.m_ezplayer.webpack_detect_running()== false )	this.webpack_detect_completed_cb();
}

/** \brief Destructor
 */
neoip.ezplayer_embedui_t.prototype.destructor	= function()
{
	// get directly the plugin
	var plugin	= this._get_plugin()

	// delete all the elemui from the plugin
	plugin.embedui_delete("embedui_id_root_stage");
	plugin.embedui_delete("embedui_id_volume");
	plugin.embedui_delete("embedui_id_winsizer");
	plugin.embedui_delete("embedui_id_playlist_toggle");
	plugin.embedui_delete("embedui_id_record_toggle");
	plugin.embedui_delete("embedui_id_track_title");
	plugin.embedui_delete("embedui_id_status_line");
	// delete all the 'moving' embedui element
	this._embedui_delete_recorder_pip();
	this._embedui_delete_playlist_select();
	this._embedui_delete_nopack_button();
	this._embedui_delete_play();
	this._embedui_delete_stop();
	this._embedui_delete_busy();	
}


/** \brief init plugin sound according to the values saved in the cookie
 */
neoip.ezplayer_embedui_t.prototype._sound_init_from_cookie	= function()
{
	// get directly the plugin
	var plugin	= this._get_plugin()

	// if ezplayer.cfgvar_arr.onload_force_mute is true, set the plugin to mute now
	// else try to get the default volume from the cookie
	var cfgvar_arr	= this.m_ezplayer.cfgvar_arr();
	if( cfgvar_arr.onload_force_mute == "1"){
		plugin.set_sound_mute(true);
	}else{
		// set the current plugin.set_sound_mute according to the value saved in cookie
		var ezplayer_sound_mute	= neoip.core.cookie_read("ezplayer_sound_mute");
		if( ezplayer_sound_mute )	plugin.set_sound_mute(Number(ezplayer_sound_mute));
	}
	// set the current plugin.set_sound_vol according to the value saved in cookie
	var ezplayer_sound_vol	= neoip.core.cookie_read("ezplayer_sound_vol");
	if( ezplayer_sound_vol )	plugin.set_sound_vol(ezplayer_sound_vol);
}
	
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the plugin element
 */
neoip.ezplayer_embedui_t.prototype._get_plugin	= function()
{
	return document.getElementById(this.m_ezplayer.m_subplayer_html_id);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			embedui service callbacks
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for any embedui event (forwarded from the neoip.ezplayer_t)
 */
neoip.ezplayer_embedui_t.prototype.embedui_event_cb	= function(event_type, arg)
{
	var userptr	= arg['userptr'];
	var embedui_id	= userptr['embedui_id'];
	// log to debug
	//console.info("embedui_id=" + embedui_id);	console.dir(arg);
	
	// forward to the proper callback depending on embedui_id
	if( embedui_id == "embedui_id_root_stage" ){
		return this._embedui_root_stage_cb		(event_type, arg);
	}else if( embedui_id == "embedui_id_volume" ){
		return this._embedui_button_vol_cb		(event_type, arg);
	}else if( embedui_id == "embedui_id_winsizer" ){
		return this._embedui_button_winsizer_cb		(event_type, arg);
	}else if( embedui_id == "embedui_id_play" && event_type == "click" ){
		return this.m_ezplayer.playing_start();
	}else if( embedui_id == "embedui_id_stop" && event_type == "click" ){
		return this.m_ezplayer.playing_stop();
	}else if( embedui_id == "embedui_id_playlist_toggle" ){
		return this._embedui_playlist_toggle_cb		(event_type, arg);
	}else if( embedui_id == "embedui_id_record_toggle" ){
		return this._embedui_record_toggle_cb		(event_type, arg);
	}else if( embedui_id == "embedui_id_playlist_select" ){
		return this._embedui_playlist_select_cb		(event_type, arg);
	}else if( embedui_id == "embedui_id_nopack_button" ){
		return this._embedui_nopack_button_cb		(event_type, arg);
	}
	// just to avoid a js warning
	return -1;
}

/** \brief Callback for any embedui event from the "button_vol_id"
 */
neoip.ezplayer_embedui_t.prototype._embedui_button_vol_cb	= function(event_type, arg)
{
	var embedui_id	= "embedui_id_volume";
	var plugin	= this._get_plugin();

	// if event_type == "click", toggle the mute status
	if( event_type == "click" ){
		// toggle the mute in the plugin
		plugin.set_sound_mute( !plugin.get_sound_mute() );
		
		// update the cookie 'ezplayer_sound_mute'
		neoip.core.cookie_write("ezplayer_sound_mute", Number(plugin.get_sound_mute()), 30);
		// change the ui_element
		plugin.embedui_update(embedui_id, { "action": "element_update_opt",
					"arg":	{ "sound_mute"	: plugin.get_sound_mute() } });
	}
	// if event_type == "mouseWheel", inc/dec the sound_vol
	if( event_type == "mouseWheel" ){
		var delta	= arg['wheel_delta'] * 0.1;
		var new_vol	= plugin.get_sound_vol() + delta;
		// clamp new_vol between 0 and 1
		new_vol		= Math.max(new_vol, 0);
		new_vol		= Math.min(new_vol, 1);
		// set the new_vol in the plugin
		plugin.set_sound_vol( new_vol );
		// update the cookie 'ezplayer_sound_vol'
		neoip.core.cookie_write("ezplayer_sound_vol", plugin.get_sound_vol(), 30);
		// change the ui_element
		plugin.embedui_update(embedui_id, { "action": "element_update_opt",
					"arg":	{ "sound_vol"	: plugin.get_sound_vol() } });			
	}
}

/** \brief Callback for any embedui event from the "embedui_id_winsizer"
 */
neoip.ezplayer_embedui_t.prototype._embedui_button_winsizer_cb	= function(event_type, arg)
{
	var embedui_id		= "embedui_id_winsizer";
	var plugin		= this._get_plugin()
	var may_fullscreen	= plugin.may_fullscreen();


	if( event_type == "click" && may_fullscreen ){
		// toggle the hw-fullscreen in the plugin
		plugin.set_fullscreen( !plugin.get_fullscreen() );
	}
	// obsolete thing - mouse wheel on winsizer... keeping source.. not sure why
	if(false){
		if( event_type == "mouseWheel" || event_type == "click" ){
			if( plugin.getAttribute("width") == "100%" ){
				plugin.setAttribute("width", "320");
				plugin.setAttribute("height", "240");
			}else{
				plugin.setAttribute("width", "100%");
				plugin.setAttribute("height", "100%");
			}
		}
	}

if(false){
	// make the embedui invisible
	plugin.embedui_update(embedui_id, { "action": "base_reset_state",
				"arg":	{ "new_state": "invisible" } });
}

	// determine the image to display
	var is_fullscreen	= plugin.get_fullscreen();
	var is_maximized	= plugin.getAttribute("width") == "100%";
	var button_normalizer	= may_fullscreen ? is_fullscreen : is_maximized;
	// update the ui
	plugin.embedui_update(embedui_id, { "action": "element_update_opt",
				"arg":	{ "location" : button_normalizer 
						? "win_normalizer"
						: "win_maximizer"} });
}


/** \brief Callback for any embedui event from the "embedui_id_root_stage"
 */
neoip.ezplayer_embedui_t.prototype._embedui_root_stage_cb	= function(event_type, arg)
{
	var embedui_id	= "embedui_id_root_stage";
	var plugin	= this._get_plugin()

	// log to debug
	//console.info("enter");	console.dir(arg);

	// if "doubleClick" and plugin.may_fullscreen(), toggle fullscreen
	if( event_type == "doubleClick" && plugin.may_fullscreen() ){
		// toggle the hw-fullscreen in the plugin
		plugin.set_fullscreen( !plugin.get_fullscreen() );
		// update the "embedui_id_winsizer"
		plugin.embedui_update("embedui_id_winsizer", { "action": "element_update_opt",
				"arg":	{ "location" : plugin.get_fullscreen() 
						? "win_normalizer"
						: "win_maximizer"} });
	}

	// hide/show the mouse on changed_state
	if( event_type == "changed_state" ){
		var new_state	= arg['new_state'];
		var embedui_new_state	= null;
		if( new_state == "idle_detect" ){
			plugin.embedui_update(embedui_id, { "action": "element_update_opt",
					"arg":	{ "mouse_visibility" : "show"	}});
			embedui_new_state	= "appearing";
		}else{
			plugin.embedui_update(embedui_id, { "action": "element_update_opt",
					"arg":	{ "mouse_visibility" : "hide"	}});
			embedui_new_state	= "disappearing";
		}
		// change the state of some embedui to make them visible on "idle_detect"
		var embedui_id_arr	= [	"embedui_id_volume",
						"embedui_id_winsizer",
						"embedui_id_playlist_toggle",
						"embedui_id_record_toggle"
					];
		// if this embedui_id_stop exists, add it to the list
		if( plugin.embedui_exist(embedui_id) == true )
			embedui_id_arr.push('embedui_id_stop');
		for(var i = 0; i < embedui_id_arr.length; i++){
			var embedui_id	= embedui_id_arr[i];
			plugin.embedui_update(embedui_id, {
						"action": 	"base_reset_state",
						"arg":		{ "new_state": embedui_new_state }
					});
		}
	}
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			playlist handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for any embedui event from the "embedui_id_playlist_toggle"
 */
neoip.ezplayer_embedui_t.prototype._embedui_playlist_toggle_cb	= function(event_type, arg)
{
	var embedui_id	= "embedui_id_playlist_select";
	var plugin	= this._get_plugin()
	// log to debug
	//console.info("enter");

	// if the event_type is not "click", do nothing
	if( event_type != "click" )		return;

	// if there is no this.m_ezplayer.m_plistarr return now 
	if( !this.m_ezplayer.m_plistarr )	return;

	// toggle the playlist_select element
	if( !plugin.embedui_exist(embedui_id) )	this._embedui_create_playlist_select();
	else					this._embedui_delete_playlist_select();
	// reinitialize play/stop buttons 
	this._reinit_playstop_buttons();
}

/** \brief Callback for any embedui event from the "embedui_id_playlist_select"
 */
neoip.ezplayer_embedui_t.prototype._embedui_playlist_select_cb	= function(event_type, arg)
{
	var selected_idx	= arg['selected_idx'];
	var item_userptr	= arg['item_userptr'];
	// log to debug
	console.info("enter selected_idx=" + selected_idx);
	console.dir(arg);
	
	// delete the playlist_select
	this._embedui_delete_playlist_select();
	// reinitialize play/stop buttons according to this.m_ezplayer.m_player.is_playing() 
	this._reinit_playstop_buttons();
	
	// if the selected_idx is not playable, display the error in status_line
	var plistarr_item	= this.m_ezplayer.m_plistarr.item_arr()[selected_idx];
	if( plistarr_item.is_not_playable() ){
		this._set_status_line("WebPack Required for " + plistarr_item.playlist_title() );
		return;
	}


	// change the playlist
	this.m_ezplayer.play_post_playlist(true);
	this.m_ezplayer.change_playlist(item_userptr['playlist_uid']);
	// TODO if not playing, it should start playing
	// - but to start playing now, would not play the new playlist
	// - but the current one
}

/** \brief create the embedui_id_play button
 */
neoip.ezplayer_embedui_t.prototype._embedui_create_playlist_select	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_playlist_select";
	// if this embedui_id alreadt exist, return now
	if( plugin.embedui_exist(embedui_id) == true )	return;
	// if there is no this.m_ezplayer.m_plist_arr, return now
	if( this.m_ezplayer.m_plistarr == null )	return;
	
	// determine embedui_opt for this element
	var embedui_opt	= {	"embedui_class"	: "select_list",
				"embedui_id"	: "embedui_id_playlist_select",
				"userptr": {
					"embedui_id"	: "embedui_id_playlist_select"
					},
				"element_opt"	: {
					"selected_idx"	: 0,
					"item_w"	: 500	/1024,
					"item_h"	: 70	/ 768,
					"box_t"		: 7	/1024,
					"margin_w"	: 10	/1024,
					"margin_h"	: 0	/ 768,
					"font_size"	: 60	/1024,
					"item_arr"	: [ "FILLED DYNAMICALLY JUST AFTER" ]
					}
				};
				
	// build the item_arr containing the whole this.m_ezplayer.m_plistarr
	var item_arr	= []
	for(var i = 0; i < this.m_ezplayer.m_plistarr.item_arr().length; i++){
		var plistarr_item	= this.m_ezplayer.m_plistarr.item_arr()[i];
		// put this item into the embedui
		item_arr.push({	"display_text" 	: plistarr_item.playlist_title(),
				"color"		: plistarr_item.is_playable() ? 0xFFFFFF: 0x808080,
				"item_userptr"	: {
					"playlist_uid"	: plistarr_item.playlist_uid()
				}
			});
	}
	// update the item_arr into embedui_opt['element_opt']
	embedui_opt['element_opt']['item_arr']	= item_arr;
	
	// update the selected_idx into embedui_opt['element_opt']
	for(var i = 0; i < this.m_ezplayer.m_plistarr.item_arr().length; i++){
		var plistarr_item	= this.m_ezplayer.m_plistarr.item_arr()[i];
		// if this plistarr_item.is_not_playable(), goto the next 
		if( plistarr_item.is_not_playable() )	continue;
		// if this plistarr_item.playlist_uid() matches current playlist_uid, select it 
		if( plistarr_item.playlist_uid() == this.m_ezplayer.m_playlist_uid ){
			embedui_opt['element_opt']['selected_idx']	= i;
			break;
		}
	}
		
	// actually ask the plugin to create the element
	plugin.embedui_create(embedui_opt);
}

/** \brief delete the embedui_id_play button
 */
neoip.ezplayer_embedui_t.prototype._embedui_delete_playlist_select	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_playlist_select";
	// if this embedui_id doesnt exist, return now
	if( plugin.embedui_exist(embedui_id) == false )	return;
	// delete the embedui
	plugin.embedui_delete(embedui_id);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			record handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief Callback for any embedui event from the "embedui_id_record_toggle"
 */
neoip.ezplayer_embedui_t.prototype._embedui_record_toggle_cb	= function(event_type, arg)
{
	var plugin	= this._get_plugin()
	// log to debug
	console.info("enter");

	// if the event_type is not "click", do nothing
	if( event_type != "click" )	return;

	if( plugin.embedui_exist('embedui_id_recorder_pip') == true ){
		console.info('stop recording');
		// delete embedui_id_recoder_pip
		this._embedui_delete_recorder_pip();
		// destruct neoip_recorder_t
		this._neoip_recorder_dtor();
	}else{
		console.info('start recording');
		// create embedui_id_recoder_pip
		this._embedui_create_recorder_pip();
		// construct neoip_recorder_t
		var error_str	= this._neoip_recorder_ctor();
		// set the status_line if there is an error
		if( error_str ){
			this._set_status_line("Broadcasting failed:\n"+error_str);
			// delete embedui_id_recoder_pip
			this._embedui_delete_recorder_pip();
			// destruct neoip_recorder_t
			this._neoip_recorder_dtor();
		}
	}
}

/**
 * construct neoip_recorder_t
 */
neoip.ezplayer_embedui_t.prototype._neoip_recorder_ctor	= function()
{
	// determine cast_name/cast_privtext for neoip_recorder_t
	// - if there is cookie 'cast_default' (from www.urfastr.net), it is
	//   a registered user, use those values
	// - else generate one on the fly
	var cast_name		= null;
	var cast_privtext	= null;
	var cookie_cast_default	= neoip.core.cookie_read("cast_default");
	if( cookie_cast_default ){
		// parse the content of 'cast_default' which is a escaped(json)
		var json_str	= unescape(cookie_cast_default);
		var json_data	= JSON.parse(json_str);
		// copy the data
		cast_name	= json_data['cast_name'];
		cast_privtext	= json_data['cast_privtext'];
	}else{
		cast_name	= " Webcam " + neoip.core.build_nonce_str(3);
		cast_privtext	= neoip.core.build_nonce_str(8);
	}
	// determine the casti_param for neoip_recorder_t
	var casti_param	= {
		cast_name:	cast_name,
		cast_privtext:	cast_privtext,
		scasti_mod:	"flv",
		mdata_srv_uri:	neoip.globalCfg.recorder_mdata_srv_uri
	};

	// determine the flash_param for neoip_recorder_t
	var flash_param	= {
		audio_mute:	true,
		video_bw:	48*1024,
		audio_bw:	16*1024,
		video_w:	320,
		video_h:	240,
		video_fps:	10
	};
	// start neoip_recorder
	var callback		= new neoip.recorder_cb_t(this._neoip_recorder_cb, this);
	var plugin_htmlid	= this.m_ezplayer.m_subplayer_html_id;
	this.m_recorder		= new neoip.recorder_t(callback, plugin_htmlid, flash_param, casti_param);
	// neoip_recorder_t record start
	var error_str		= this.m_recorder.record_start();
	// return the error if any
	return error_str;
}

/**
 * destruct neoip_recorder_t
 */
neoip.ezplayer_embedui_t.prototype._neoip_recorder_dtor	= function()
{
	// if this.m_recorder is null, return now
	if( this.m_recorder == null )	return;
	// set the status_line if a record_inprogress
	// NOTE: this function may be called if this._neoip_recorder_ctor
	//       failed (e.g. no camera) so it is possible to have
	//       no record_inprogress
	if( this.m_recorder.record_inprogress() ){
		var cast_name	= this.m_recorder.casti_param()['cast_name'];
		this._set_status_line(cast_name+"\nBroadcasting stopped");
		// neoip_recorder_t record stop
		this.m_recorder.record_stop();
	}
	// destroy neoip_recorder_t
	this.m_recorder.destructor();
	this.m_recorder	= null;	
}
/**
 * neoip_recorder_t callback
 */
neoip.ezplayer_embedui_t.prototype._neoip_recorder_cb	= function(notifier_obj, userptr, event_type, arg)
{
	// log to debug
	console.info("enter event_type="+event_type);
	console.dir(arg);

	// set the status_line
	if( event_type == "changed_state" ){
		var cast_name	= this.m_recorder.casti_param()['cast_name'];
		var status_line	= cast_name + "\nBroadcasting " + arg.new_state;
		this._set_status_line(status_line);
	}
}

/** \brief create the embedui_id_play button
 */
neoip.ezplayer_embedui_t.prototype._embedui_create_recorder_pip	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_recorder_pip";
	// if this embedui_id alreadt exist, return now
	if( plugin.embedui_exist(embedui_id) == true )	return;

	// build the "embedui_id_recorder_pip"
	var embedui_opt	= {	"embedui_class"	: "recorder_pip",
				"embedui_id"	: "embedui_id_recorder_pip",
				"userptr": {
					"embedui_id"	: "embedui_id_recorder_pip"
					},
				"element_opt" : {
					'force_aspect_ratio'	: 4/3
					},
			 	"base_sprite" : {
			 		"element_x"	: 0,
			 		"element_y"	: 1.0,
			 		"element_w"	: 0.33,
			 		"element_h"	: 0.33,
					"anchor_x"	: 0.0, 
					"anchor_y"	: 0.0
					}
				};
	// actually ask the plugin to create the element
	plugin.embedui_create(embedui_opt);
}

/** \brief delete the embedui_id_play button
 */
neoip.ezplayer_embedui_t.prototype._embedui_delete_recorder_pip	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_recorder_pip";
	// if this embedui_id doesnt exist, return now
	if( plugin.embedui_exist(embedui_id) == false )	return;
	// delete the embedui
	plugin.embedui_delete(embedui_id);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			nopack_button handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for called when ezplayer_t has completed the webpack_detect_t
 */
neoip.ezplayer_embedui_t.prototype.webpack_detect_completed_cb	= function()
{
	// sanity check - at this point, this.m_ezplayer.webpack_detect MUST be completed
	console.assert( this.m_ezplayer.webpack_detect_running()== false);
	// if "oload" AND "casto" are present, do nothing
	if( this.m_ezplayer.webpack_detect_result() == "installed" )	return;
	
	// display a message
	this._set_status_line("Limited version");
	this._set_track_title("Install WebPack\nfor full version");
	// create nopack_button
	this._embedui_create_nopack_button();
}

/** \brief Callback for any embedui event from the "embedui_id_nopack_button"
 */
neoip.ezplayer_embedui_t.prototype._embedui_nopack_button_cb	= function(event_type, arg)
{
	var	install_uri	= "http://urfastr.net/webpack/download";

	// if the event_type is not "click", do nothing
	if( event_type != "click" )	return;
	
	// replace the current page with the one at install_uri 
	window.top.location.href	= install_uri;
	// another way to handle the install_uri by opening another window
	//window.open(install_uri);	
}

/** \brief create the embedui_id_nopack_button
 */
neoip.ezplayer_embedui_t.prototype._embedui_create_nopack_button	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_nopack_button";
	// if this embedui_id alreadt exist, return now
	if( plugin.embedui_exist(embedui_id) == true )	return;
	
	// determine the text in the button depending on this.m_ezplayer.webpack_detect_result()
	if( this.m_ezplayer.webpack_detect_result() == "toinstall" ){
		var button_text	= "Install\nWebPack";
	}else if( this.m_ezplayer.webpack_detect_result() == "toupgrade" ){
		var button_text	= "Update\nWebPack";
	}else{
		console.assert(false);
	}

	// build the "embedui_id_nopack_button"
	// - TODO put another image for this icon.. one pointed by an uri
	var embedui_opt	= {	"embedui_class"	: "button_bitmap",
				"embedui_id"	: embedui_id,
				"userptr": {
					"embedui_id"	: embedui_id
					},
				"element_opt" : {
					"type"		: "vector",
					"location"	: "webpack_install",
					"text"		: button_text
					},
			 	"base_sprite" : {
			 		"element_x"	: 1.0,
			 		"element_y"	: 1.0,
			 		"element_w"	: 0.2,
			 		"element_h"	: 0.0,
					"display_type"	: "always"
					}
				};
	// actually ask the plugin to create the element
	plugin.embedui_create(embedui_opt);
}

/** \brief delete the embedui_id_nopack button
 */
neoip.ezplayer_embedui_t.prototype._embedui_delete_nopack_button	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_nopack_button";
	// if this embedui_id doesnt exist, return now
	if( plugin.embedui_exist(embedui_id) == false )	return;
	// delete the embedui
	plugin.embedui_delete(embedui_id);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			handle event from neoip.player_cb_t 
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for any neoip.player_cb_t event - forwarded to update the embedui
 */
neoip.ezplayer_embedui_t.prototype.neoip_player_cb	= function(event_type, arg)
{
	// get directly the plugin
	var plugin		= this._get_plugin();
	// log to debug
	//console.info("event_type=" + event_type);console.dir(arg);

	// when entering in connection, display the track_title
	// - TODO display it "always" when "connecting" or "kframefinding" 
	//   and "timeout"+"disapearing" when playing
	if( event_type == "changed_state" && arg['new_state'] == "playing" ){
		var trackidx		= this.m_ezplayer.m_player.practical_trackidx();	
		var playlist_track	= this.m_ezplayer.m_player.playlist().track_at(trackidx);
		var track_title		= playlist_track.title();
		this._set_track_title(track_title);
	}else if( event_type == "error" ){
		if( arg['reason'] == "NetStream.Play.StreamNotFound" ){
			var text	= "Not broadcasting now.\nretry later";
		}else{
			var text	= arg['reason'].replace(".", " ", "g");
		}
		// set the status_line
		this._set_status_line(text);
	}
	// reinit_playstop_buttons if event_type is "changed_state"
	if( event_type == "changed_state" )	this._reinit_playstop_buttons();
}

/** \brief Set the text in embedui_id_track_title
 */
neoip.ezplayer_embedui_t.prototype._set_track_title	= function(text)
{
	var plugin	= this._get_plugin();
	var embedui_id	= "embedui_id_track_title";
	// make the embedui invisible
	plugin.embedui_update(embedui_id, { "action": "base_reset_state",
					"arg":	{ "new_state": "invisible" } });
	// change the text
	plugin.embedui_update(embedui_id, { "action": "element_update_opt",
					"arg":	{ "text": text } });
	// make the embedui appearing
	plugin.embedui_update(embedui_id, { "action": "base_reset_state",
					"arg":	{ "new_state": "appearing" } });
}

/** \brief Set the status line text in embedui_id_status_line
 */
neoip.ezplayer_embedui_t.prototype._set_status_line	= function(text)
{
	var plugin	= this._get_plugin();
	var embedui_id	= "embedui_id_status_line";
	// make the embedui invisible
	plugin.embedui_update(embedui_id, { "action": "base_reset_state",
					"arg":	{ "new_state": "invisible" } });
	// change the text
	plugin.embedui_update(embedui_id, { "action": "element_update_opt",
					"arg":	{ "text": text } });
	// make the embedui appearing
	plugin.embedui_update(embedui_id, { "action": "base_reset_state",
					"arg":	{ "new_state": "appearing" } });
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			handle event from neoip.playlist_loader_cb_t 
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for any neoip.playlist_loader_cb_t event (forwarded from neoip.ezplayer_t)
 */
neoip.ezplayer_embedui_t.prototype.playlist_loader_cb	= function(event_type, arg)
{
	// log to debug
	//console.info("enter event_type=" + event_type);
	//console.dir(arg);
	
	// reinit_playstop_buttons
	this._reinit_playstop_buttons();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			embedui service play/stop stuff
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Handle a playing_start() (forwarded from neoip.ezplayer_t)
 */
neoip.ezplayer_embedui_t.prototype.playing_start	= function()
{
	// reinitialize play/stop buttons according to this.m_ezplayer.m_player.is_playing() 
	this._reinit_playstop_buttons();
}

/** \brief Handle a playing_stop()  (forwarded from neoip.ezplayer_t)
 */
neoip.ezplayer_embedui_t.prototype.playing_stop	= function()
{
	// reinitialize play/stop buttons according to this.m_ezplayer.m_player.is_playing() 
	this._reinit_playstop_buttons();

	// make the embedui_id_track_title invisible - just in case it is still visible
	var plugin	= this._get_plugin()
	plugin.embedui_update("embedui_id_track_title", { "action": "base_reset_state",
						"arg":	{ "new_state": "invisible" } });
}

/** \brief reinitialize play/stop buttons according to this.m_ezplayer.m_player.is_playing();
 */
neoip.ezplayer_embedui_t.prototype._reinit_playstop_buttons	= function()
{
	var plugin	= this._get_plugin()

	// if "embedui_id_playlist_select" exists, hide play/stop/busy as they are all in middle
	if( plugin.embedui_exist("embedui_id_playlist_select") ){
		this._embedui_delete_play();
		this._embedui_delete_stop();
		this._embedui_delete_busy();
		return;
	}

	// handle the busy button
	var track_state	= this.m_ezplayer.m_player.practical_state();
	if( track_state == "kframefinding" || track_state == "connecting" ){
		this._embedui_create_busy();
	}else{
		this._embedui_delete_busy();
	}

	// display "play" or "stop" depending on this.m_ezplayer.m_player.is_playing()
	if( this.m_ezplayer.m_player.is_playing() ){
		// if m_player.is_playing, display "stop" and not "play"
		this._embedui_delete_play();
		this._embedui_create_stop();
	}else{
		// if m_player.is_playing, display "play" and not "stop"
		this._embedui_delete_stop();
		this._embedui_create_play();
	}
}

/** \brief create the embedui_id_play button
 */
neoip.ezplayer_embedui_t.prototype._embedui_create_play	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_play";
	// if this embedui_id alreadt exist, return now
	if( plugin.embedui_exist(embedui_id) == true )	return;
	
	// determine embedui_opt for this element
	var embedui_opt	= {	"embedui_class"	: "button_bitmap",
				"embedui_id"	: embedui_id,
				"userptr": {
					"embedui_id"	: embedui_id
					},
				"element_opt" : {
					"type"		: "vector",
					"location"	: "play"
					},
			 	"base_sprite" : {
			 		"element_x"	: 0.5,
			 		"element_y"	: 0.5,
			 		"element_w"	: 0.1,
			 		"element_h"	: 0.0,
					"anchor_x"	: 0.5, 
					"anchor_y"	: 0.5,
					"display_type"	: "always"
					}
				};
	// actually ask the plugin to create the element
	plugin.embedui_create(embedui_opt);
}

/** \brief delete the embedui_id_play button
 */
neoip.ezplayer_embedui_t.prototype._embedui_delete_play	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_play";
	// if this embedui_id doesnt exist, return now
	if( plugin.embedui_exist(embedui_id) == false )	return;
	// delete the embedui
	plugin.embedui_delete(embedui_id);
}

/** \brief create the embedui_id_stop button
 */
neoip.ezplayer_embedui_t.prototype._embedui_create_stop	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_stop";
	// if this embedui_id alreadt exist, return now
	if( plugin.embedui_exist(embedui_id) == true )	return;

	// determine embedui_opt for this element
	var embedui_opt	= {	"embedui_class"	: "button_bitmap",
				"embedui_id"	: embedui_id,
				"userptr": {
					"embedui_id"	: embedui_id
					},
				"element_opt" : {
					"type"		: "vector",
					"location"	: "stop"
					},
			 	"base_sprite" : {
			 		"element_x"	: 0.5,
			 		"element_y"	: 0.5,
			 		"element_w"	: 0.1,
			 		"element_h"	: 0.0,
					"anchor_x"	: 0.5, 
					"anchor_y"	: 0.5,
					"display_type"	: "timeout",
					"timeout_delay"	: 999*1000				
					}
				};
	// actually ask the plugin to create the element
	plugin.embedui_create(embedui_opt);
}

/** \brief delete the embedui_id_stop button
 */
neoip.ezplayer_embedui_t.prototype._embedui_delete_stop	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_stop";
	// if this embedui_id doesnt exist, return now
	if( plugin.embedui_exist(embedui_id) == false )	return;
	// delete the embedui
	plugin.embedui_delete(embedui_id);
}


/** \brief create the embedui_id_busy button
 */
neoip.ezplayer_embedui_t.prototype._embedui_create_busy	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_busy";
	// if this embedui_id alreadt exist, return now
	if( plugin.embedui_exist(embedui_id) == true )	return;
	
	// determine embedui_opt for this element
	var embedui_opt	= {	"embedui_class"	: "button_busy",
				"embedui_id"	: embedui_id,
				"userptr": {
					"embedui_id"	: embedui_id
					},
			 	"base_sprite" : {
			 		"element_x"	: 0.5,
			 		"element_y"	: 0.5,
			 		"element_w"	: 0.1,
			 		"element_h"	: 0.0,
					"anchor_x"	: 0.5, 
					"anchor_y"	: 0.5,
					"display_type"	: "always"
					}
				};
	// actually ask the plugin to create the element
	plugin.embedui_create(embedui_opt);
}

/** \brief delete the embedui_id_busy button
 */
neoip.ezplayer_embedui_t.prototype._embedui_delete_busy	= function()
{
	var plugin	= this._get_plugin()
	var embedui_id	= "embedui_id_busy";
	// if this embedui_id doesnt exist, return now
	if( plugin.embedui_exist(embedui_id) == false )	return;
	// delete the embedui
	plugin.embedui_delete(embedui_id);
}
