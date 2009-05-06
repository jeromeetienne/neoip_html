/** \file
 *
 * \brief Javascript to control neoip-casti from the webpage
 *
 * - TODO to document more
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
neoip.casti_ctrl_t = function(p_callback)
{
	// copy the parameter
	this.m_callback		= p_callback;

	// zero some fields
	this.m_webdetect_uri	= null;
	this.m_cast_name	= null;
	this.m_cast_privtext	= null;
	this.m_scasti_uri	= null;
	this.m_scasti_mod	= null;
	this.m_mdata_srv_uri	= null;
	this.m_http_peersrc_uri	= null;
	this.m_web2srv_obj	= {};
	
	this.m_swarm_state	= "stopped";

	this.m_refresh_xdomrpc	= null;
	this.m_refresh_delay	= 3;
	this.m_refresh_timeout	= null;	
}

/** \brief Destructor of player_t
 */
neoip.casti_ctrl_t.prototype.destructor = function()
{
	// log to debug
	console.info('casti_ctrl_t: destructor');
	// stop the refresh_xdomrpc if needed
	if( this.m_refresh_xdomrpc ){
		this.m_refresh_xdomrpc.destructor();
		this.m_refresh_xdomrpc	= null;
	}

	// stop the refresh_timeout if needed
	if( this.m_refresh_timeout ){
		clearTimeout( this.m_refresh_timeout );
		this.m_refresh_timeout	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

neoip.casti_ctrl_t.prototype.webdetect_uri 	= function(value) { this.m_webdetect_uri = value; return this;	}
neoip.casti_ctrl_t.prototype.cast_name		= function(value) { this.m_cast_name	= value; return this;	}
neoip.casti_ctrl_t.prototype.cast_privtext	= function(value) { this.m_cast_privtext= value; return this;	}
neoip.casti_ctrl_t.prototype.scasti_uri		= function(value) { this.m_scasti_uri	= value; return this;	}
neoip.casti_ctrl_t.prototype.scasti_mod		= function(value) { this.m_scasti_mod	= value; return this;	}
neoip.casti_ctrl_t.prototype.mdata_srv_uri	= function(value) { this.m_mdata_srv_uri= value; return this;	}
neoip.casti_ctrl_t.prototype.http_peersrc_uri	= function(value) { this.m_http_peersrc_uri = value; return this;}
neoip.casti_ctrl_t.prototype.refresh_period	= function(value) { this.m_refresh_delay= value; return this;	}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief Return true if casti-ctrl is currently recording, false otherwise
 */
neoip.casti_ctrl_t.prototype.is_recording = function()
{
	return this.m_refresh_timeout != null;
}

// declare all the methods to read the variables
neoip.casti_ctrl_t.prototype.swarm_state	= function(){ return this.m_swarm_state;	}
neoip.casti_ctrl_t.prototype.cast_privhash	= function(){ return this.m_cast_privhash;	}
/**
 * accessort on web2srv_obj
 * - web2srv_obj are converted to json and passed directly to the
 *   cast_mdata_srv
*/
neoip.casti_ctrl_t.prototype.web2srv_obj	= function(){ return this.m_web2srv_obj;	}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Action function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Ask to start recording
 */
neoip.casti_ctrl_t.prototype.start_recording = function()
{
	// if it already recording, do nothing
	if( this.is_recording() )	return;

	// launch the m_refresh_timeout now
	this.m_refresh_timeout	= setTimeout(neoip.basic_cb_t(this._refresh_timeout_cb, this)
									, 0 * 1000);
}

/** \brief Ask to stop recording
 */
neoip.casti_ctrl_t.prototype.stop_recording = function()
{
	// if already not recording, do nothing
	if( !this.is_recording() )	return;
	
	// set the m_swarm_state to "stopped"
	this.m_swarm_state	= "stopped";
	
	// stop the refresh_timeout if needed
	clearTimeout( this.m_refresh_timeout );
	this.m_refresh_timeout	= null;

	// launch the release_stream - with no callback
	var	rpc_uri	= this.m_webdetect_uri + "/neoip_casti_ctrl_wpage_jsrest.js";
	var	xdomrpc	= new neoip.xdomrpc_t(rpc_uri, null, "release_stream"
					, this.m_mdata_srv_uri	? this.m_mdata_srv_uri	: ''
					, this.m_cast_name 	? this.m_cast_name	: ''
					, this.m_cast_privtext 	? this.m_cast_privtext	: '');
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			m_refresh_timeout callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief callback for the m_refresh_timeout
 */
neoip.casti_ctrl_t.prototype._refresh_timeout_cb	= function()
{
	// sanity check - this.m_refresh_xdomrpc MUST be null at this point
	console.assert( this.m_refresh_xdomrpc == null );
	
	// launch the request_stream
	var	rpc_uri	= this.m_webdetect_uri + "/neoip_casti_ctrl_wpage_jsrest.js";
	this.m_refresh_xdomrpc	= new neoip.xdomrpc_t(rpc_uri
					, neoip.xdomrpc_cb_t(this._xdomrpc_cb, this)
					, "request_stream"
					, this.m_mdata_srv_uri	? this.m_mdata_srv_uri	: ''
					, this.m_cast_name 	? this.m_cast_name	: ''
					, this.m_cast_privtext 	? this.m_cast_privtext	: ''
					, this.m_scasti_uri	? this.m_scasti_uri	: ''
					, this.m_scasti_mod	? this.m_scasti_mod	: ''
					, this.m_http_peersrc_uri? this.m_http_peersrc_uri: ''
					, JSON.stringify(this.m_web2srv_obj)
					);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			xdomrpc_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief xdomrpc_t callback
 */
neoip.casti_ctrl_t.prototype._xdomrpc_cb = function(notifier_obj, userptr, fault, returned_val)
{
	// log to debug
	console.info("enter returned_val=" + returned_val);

	// delete the m_refresh_xdomrpc
	this.m_refresh_xdomrpc.destructor();
	this.m_refresh_xdomrpc	= null;

	// relaunch the m_refresh_timeout
	this.m_refresh_timeout	= setTimeout(neoip.basic_cb_t(this._refresh_timeout_cb, this)
						, this.m_refresh_delay * 1000);

	// backup the old this.m_swarm_state	
	var	old_state	= this.m_swarm_state;
	// set this.m_swarm_state according to the xdomrpc_t result
	if( fault ){
		this.m_swarm_state	= "error due to " + fault.string;
	}else if( returned_val == "" ){
		this.m_cast_privhash	= returned_val; 
		this.m_swarm_state	= "starting";
	}else{
		this.m_cast_privhash	= returned_val; 
		this.m_swarm_state	= "started";
	}
	
	
	// if the state has changed, notify the caller
	if( this.m_swarm_state != old_state ){
		console.info("old_state=" + old_state);
		console.info("new_state=" + this.m_swarm_state);
		if( this.m_callback ){
			var arg	= { old_state: old_state, new_state: this.m_swarm_state};
			this.m_callback("changed_state", arg);
		}
	}		
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			casti_ctrl_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a casti_ctrl_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.casti_ctrl_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(event_type, arg) {
			fct.call(scope, this, userptr, event_type, arg);
		};
}
