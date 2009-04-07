// 
// this script implement a plistarr_t.item_t for the player_t
// 

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief the constructor
 */
neoip.recorder_t = function(p_callback)
{
	// copy the parameter
	this.m_callback		= p_callback;
	this.m_objembed_htmlid	= "recorderobj_htmlid";

	// init casti_ctrl
	var casti_ctrl_cb	= neoip.casti_ctrl_cb_t(this._casti_ctrl_cb, this);
	this.m_casti_ctrl	= new neoip.casti_ctrl_t(casti_ctrl_cb);
}

/** \brief destructor
 */
neoip.recorder_t.prototype.destructor	= function()
{
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//		start/stop
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief start the recording
 */
neoip.recorder_t.prototype.start	= function()
{
}

/** \brief stop the recording
 */
neoip.recorder_t.prototype.stop	= function()
{
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			internal function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief get scasti_uri
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
			+ "/" + escape(casti_param['mdata_srv_uri'])
			+ "/" + escape(casti_param['cast_privtext'])
			+ "/" + escape(casti_param['cast_name']);
	// return the just-built scasti_uri
	return scasti_uri;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			neoip_casti_ctrl_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief casti_ctrl_t callback
 */
neoip.recorder_t.prototype._casti_ctrl_cb	= function(notifier_obj, userptr, event_type, arg)
{
	// log to debug
	console.info("enter");

	// if state is leaving (started|starting), stop the publishing
	if( event_type == "changed_state" && (arg.old_state == "starting" || arg.old_state == "started")
					&& !(arg.new_state == "starting" || arg.new_state == "started") ){
		var recorderobj	= document.getElementById(this.m_objembed_htmlid);
		recorderobj.record_unpublishing();
	}
	
	// NOTE start the publishing AFTER webpack acknowledged 'starting'
	// - it is needed because the neoip-casti start listen at 'starting' and
	//   the recording need it to listen before trying to connect.
	if( event_type == "changed_state" && arg.new_state == "starting" ){
		var recorderobj	= document.getElementById(this.m_objembed_htmlid);
		recorderobj.record_dopublishing();
		// sanity check - at this point, 
		console.assert( recorderobj.record_inprogress() );
	}
	
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Main callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief to notify the caller
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

/** \brief constructor for a recoder_cb_t
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


