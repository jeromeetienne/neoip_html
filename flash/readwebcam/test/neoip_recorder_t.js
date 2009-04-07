//
// this script implement a neoip_recorder_t
//

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * the constructor
 */
neoip.recorder_t = function(p_callback, p_objembed_htmlid, p_flash_param, p_casti_param)
{
	// copy the parameter
	this.m_callback		= p_callback;
	this.m_objembed_htmlid	= p_objembed_htmlid;
	this.m_flash_param	= p_flash_param;
	this.m_casti_param	= p_casti_param;

	// init casti_ctrl_t
	var casti_ctrl_cb	= neoip.casti_ctrl_cb_t(this._casti_ctrl_cb, this);
	this.m_casti_ctrl	= new neoip.casti_ctrl_t(casti_ctrl_cb);
}

/**
 * destructor
 */
neoip.recorder_t.prototype.destructor	= function()
{
	// delete the casti_ctrl_t if needed
	if( this.m_casti_ctrl ){
		this.m_casti_ctrl.destructor();
		this.m_casti_ctrl	= null;
	}	
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//		start/stop
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * start the recording
 */
neoip.recorder_t.prototype.record_start	= function()
{
	// objembed start to record
	var objembed	= document.getElementById("objembed_htmlid");
	// build the parameters
	var record_arg	= {
		video_w:	this.m_flash_param['video_w'],
		video_h:	this.m_flash_param['video_h'],
		video_fps:	this.m_flash_param['video_fps'],
		video_bw:	this.m_flash_param['video_bw'],
		audio_bw:	this.m_flash_param['audio_bw'],
		audio_mute:	this.m_flash_param['audio_mute'],
		rtmp_uri:	this._get_scasti_uri()
	};
	console.assert( !objembed.record_inprogress() );
	console.info("pre  record_start");
	console.dir(record_arg);
	try{
		objembed.record_start(record_arg);	
	}catch(e){
		// extract a readable message from the exception
		var result	= /.*\".*: (.*)\".*/.exec(e);
		var except_str	= result[1];
		console.info("failed due to " + except_str);
		return;
	}
	console.info("post record_start");

	// start_recording with casti_ctrl_t
	this.m_casti_ctrl.webdetect_uri		( neoip.outter_uri('casti')		);
	this.m_casti_ctrl.cast_name		( this.m_casti_param['cast_name']	);
	this.m_casti_ctrl.cast_privtext		( this.m_casti_param['cast_privtext']	);
	this.m_casti_ctrl.mdata_srv_uri		( this.m_casti_param['mdata_srv_uri']	);
	this.m_casti_ctrl.scasti_uri		( this._get_scasti_uri()		);
	this.m_casti_ctrl.scasti_mod		( this.m_casti_param['scasti_mod']	);
	this.m_casti_ctrl.http_peersrc_uri	( this.m_casti_param['http_peersrc_uri']);
	this.m_casti_ctrl.start_recording();
}

/**
 * stop the recording
 */
neoip.recorder_t.prototype.record_stop	= function()
{
	// objembed stop to record
	var objembed	= document.getElementById("objembed_htmlid");
	if( objembed.record_inprogress() )	objembed.record_stop();

	// stop casti_ctrl_t if needed
	if( this.m_casti_ctrl.is_recording() )	this.m_casti_ctrl.stop_recording();
}

/**
 * return true if a record is in progress, false otherwise
*/
neoip.recorder_t.prototype.record_inprogress	= function()
{
	return this.m_casti_ctrl.is_recording();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			internal function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * get scasti_uri
 */
neoip.recorder_t.prototype._get_scasti_uri	= function()
{
	// get the host where neoip-casti is located
	var webdetect_uri	= neoip.outter_uri('casti');
	var re		= webdetect_uri.match(/http:\/\/(.+?)([:\/]|$)/);
	// sanity check - this regexp MUST find something
	console.assert(re);
	var casti_host	= re[1];
	// build scasti_uri
	// - NOTE: currently the port for rtmp is hardcoded as i dunno how
	//   casti can pass it to webdetect...
	//   - TODO fix this to make it more flexible
	var scasti_uri	= "rtmp://" + casti_host + ":1935"
			+ "/" + escape(this.m_casti_param['mdata_srv_uri'])
			+ "/" + escape(this.m_casti_param['cast_privtext'])
			+ "/" + escape(this.m_casti_param['cast_name']);
	// return the just-built scasti_uri
	return scasti_uri;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			neoip_casti_ctrl_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * casti_ctrl_t callback
 */
neoip.recorder_t.prototype._casti_ctrl_cb	= function(notifier_obj, userptr, event_type, arg)
{
	// log to debug
	console.info("enter");

	// if state is leaving (started|starting), stop the publishing
	if( event_type == "changed_state" && (arg.old_state == "starting" || arg.old_state == "started")
					&& !(arg.new_state == "starting" || arg.new_state == "started") ){
		var objembed	= document.getElementById(this.m_objembed_htmlid);
		objembed.record_unpublishing();
	}
	
	// NOTE start the publishing AFTER webpack acknowledged 'starting'
	// - it is needed because the neoip-casti start listen at 'starting' and
	//   the recording need it to listen before trying to connect.
	if( event_type == "changed_state" && arg.new_state == "starting" ){
		var objembed	= document.getElementById(this.m_objembed_htmlid);
		objembed.record_dopublishing();
		// sanity check - at this point, 
		console.assert( objembed.record_inprogress() );
	}
	
	// notify the caller
	if( event_type == "changed_state" && this.m_callback ){
		this.m_callback("changed_state", {
			old_state: arg.old_state,
			new_state: arg.new_state
		});
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Main callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * to notify the caller
 */
neoip.recorder_t.prototype._notify_callback	= function(event_type, arg)
{
	// log to debug
	//console.info("event_type=" + event_type + " arg=" + arg);
	
	// if no callback is defined, do nothing
	if( this.m_callback == null )	return;
	// forward the event to the callback
	this.m_callback(event_type, arg);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			playlist_loader_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * constructor for a recoder_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.recorder_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(event_type, arg) {
			fct.call(scope, this, userptr, event_type, arg);
		};
}


