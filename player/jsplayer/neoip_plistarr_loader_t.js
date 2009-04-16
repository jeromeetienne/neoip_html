/*! \file
    \brief Definition of the neoip.plistarr_loader_t

\par Brief Description
This object implement the mechanism to periodically reload plistarr.

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			plistarr_loader_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor
 *
 * - opt.plistarr_id	: the id of the plistarr to load
 * - opt.callback	: callback function to be notified
 * - opt.xdomrpc_url	: url for the underlying xdomrpc_t
 */
neoip.plistarr_loader_t	= function(opt) 
{
	// sanity check - check that mandatory options are present
	console.assert( opt.plistarr_id	);
	console.assert( opt.callback	);
	console.assert( opt.xdomrpc_url	);
	// copy the parameter
	this.m_plistarr_id	= opt.plistarr_id;
	this.m_callback		= opt.callback;
	this.m_xdomrpc_url	= opt.xdomrpc_url;
	this.m_xdomrpc		= null;
	
	
	
	// start the initial m_reload_timeout
	this.m_reload_timeout	= setTimeout(neoip.basic_cb_t(this._reload_timeout_cb, this), 0);
}

/** \brief Destructor
 */
neoip.plistarr_loader_t.prototype.destructor	= function()
{
	// log to debug
	//console.info("enter plistarr_loader_t dtor");
	// delete the timeout if needed
	if( this.m_reload_timeout ){
		clearTimeout(this.m_reload_timeout);
		this.m_reload_timeout	= null;
	}
	// delete this.m_xdomrpc if neededc
	if( this.m_xdomrpc ){
		this.m_xdomrpc.destructor();
		this.m_xdomrpc	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			timeout callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The timeout callback
 */
neoip.plistarr_loader_t.prototype._reload_timeout_cb	= function()
{
	// delete the timeout if needed
	if( this.m_reload_timeout ){
		clearTimeout(this.m_reload_timeout);
		this.m_reload_timeout	= null;
	}
	// launch a xdomrpc_t
	this.m_xdomrpc	= new neoip.xdomrpc_t(this.m_xdomrpc_url
				, neoip.xdomrpc_cb_t(this._xdomrpc_cb, this)
				, "castGetPlistArr"
				, this.m_plistarr_id);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			xdomrpc_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * xdomrpc_t callback
 */
neoip.plistarr_loader_t.prototype._xdomrpc_cb = function(notifier_obj, userptr, fault, returned_val)
{
	// log to debug
	console.info("enter fault=" + fault + " returned_val=" + returned_val);

	// destructor for the m_probe_xdomrpc
	this.m_xdomrpc.destructor();
	this.m_xdomrpc	= null;

	// if there is a fault, handle it
	if( fault ){
		var retry_delay	= 10*1000;	// TODO make this tunable
		console.info("unable to load plistarr. will retry in " + retry_delay + "-sec");
		this.m_reload_timeout	= setTimeout(neoip.basic_cb_t(this._reload_timeout_cb, this), retry_delay);
		return;
	}
		

	// build the plistarr_t
	var plistarr_str	= returned_val;
	var plistarr		= new neoip.plistarr_t(plistarr_str);
	// init the reload timeout if needed
	if( plistarr.reload_delay() ){
		this.m_reload_timeout	= setTimeout(neoip.basic_cb_t(this._reload_timeout_cb, this)
						, plistarr.reload_delay());
	}
	// update the plistarr_t in the player 
	// - NOTE: this MUST be the last thing done in this function
	//   - it allows the callback to destroy this object
	this._notify_callback("new_plistarr", { "plistarr" : plistarr });			
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Main callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The flash plugin event callback
 */
neoip.plistarr_loader_t.prototype._notify_callback	= function(event_type, arg)
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
//			plistarr_loader_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a plistarr_loader_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.plistarr_loader_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(event_type, arg) {
			fct.call(scope, this, userptr, event_type, arg);
		};
}




