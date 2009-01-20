/*! \file
    \brief Definition of the neoip.apps_detect_t

\par Brief Description
This object implement a autodetection for the neoip-apps.
- it does the xdomrpc_t in series, aka if the second is done IFF the first failed
- it support a expire_timeout, aka if the whole detection takes more than a given
  delay, give up and notify faillure.

\par Implementation notes
- the callback provide a simple information string on the result of the detection
  - "found" if the neoip-apps has been found
  - "absent" if the neoip-apps has not been found after probing all ports
  - "expired" if the neoip-apps has not been found after the expiration delay
- The results are stored in neoip_apps_detect_arr and MUST be accessed by
  - neoip.apps_present("oload") return true if the apps has been previously 
    found, false otherwise
  - neoip.outter_uri("oload") return the webdetect_uri of this neoip-apps
    - assumes it is present
  - neoip.apps_version("oload") return a string containing the version of this neoip-apps
    - assumes it is present

\par Possible improvement
- probe less port:
  - possibility 1: have a smaller range of port to test
    - it will be less flexible. but is having a default port-range of 10 port
      that usefull ? 
    - the question is : when is there a conflict
  - possibility 2: have a single port range for neoip-webpack
    - neoip-webpack is the most important case by far.
- probe several ports at the same time:
  - currently the typical apps_detect_t is done 

*/


// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
///////////////////////	this.m_last_port	= p_last_port;
/////////////////////////////////////////////////////////

/** \brief Constructor
 * 
 * - option['hostname'] : to have the hostname to probe (default to 127.0.0.1)
 * - option['max_concurrent'] : set max_concurrent xdomrpc_t (default to 1)
 */
neoip.apps_detect_t = function(p_suffix_name, p_first_port, p_last_port, p_callback, p_options)
{
	// copy the parameter
	this.m_callback		= p_callback;
	this.m_suffix_name	= p_suffix_name;
	this.m_first_port	= p_first_port;
	this.m_last_port	= p_last_port;
	this.m_options		= p_options != null ? neoip.core.object_clone(p_options) : {};
	// set the hostname to probe
	this.m_hostname		= "127.0.0.1";
	if( this.m_options.hostname != undefined )	this.m_hostname	= this.m_options.hostname;

	// set max_concurrent xdomrpc_t - may be usefull to speed up the detection
	// - unclear how to use it for now. so default to 1
	this.m_max_concurrent	= 1;
	if( this.m_options.max_concurrent != undefined )
		this.m_max_concurrent	= this.m_options.max_concurrent;
	 
	// launch the m_expire_timeout	
	this.m_expire_delay	= 10.0*1000;		// TODO make this tunable
	this.m_expire_timeout	= setTimeout(neoip.basic_cb_t(this._expire_timeout_cb, this)
							, this.m_expire_delay);

	// init the m_xdomrpc_arr
	this.m_xdomrpc_arr	= []
	for(var port = this.m_first_port; port <= this.m_last_port; port++)	
		this.m_xdomrpc_arr[port] = "todo";
		
	// launch the next probe if needed
	this._launch_next_probe();
}

/** \brief Destructor of player_t
 */
neoip.apps_detect_t.prototype.destructor = function()
{
	// log to debug
	//console.info("enter");
	
	// delete all the xdomrpc_t in this.m_xdomrpc_arr
	for(var port in this.m_xdomrpc_arr){
		// if this item is not an object, goto the next
		if( typeof(this.m_xdomrpc_arr[port]) != "object" )	continue;
		// destruct this item
		this.m_xdomrpc_arr[port].destructor();
		this.m_xdomrpc_arr[port]	= null;
	}
	// stop the expire_timeout if needed
	if( this.m_expire_timeout ){
		clearTimeout( this.m_expire_timeout );
		this.m_expire_timeout	= null;
	}
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// declare all the methods to read the variables
neoip.apps_detect_t.prototype.suffix_name	= function(){ return this.m_suffix_name;}
neoip.apps_detect_t.prototype.first_port	= function(){ return this.m_first_port;	}
neoip.apps_detect_t.prototype.last_port		= function(){ return this.m_last_port;	}
neoip.apps_detect_t.prototype.hostname		= function(){ return this.m_hostname;	}
neoip.apps_detect_t.prototype.options		= function(){ return this.m_options;	}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			internal function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Launch the next probes if needed
 */
neoip.apps_detect_t.prototype._launch_next_probe	= function()
{
	// log to debug
	//console.info("enter");
	
	// count the number of currently active probe
	var nb_active	= 0;
	var nb_done	= 0;
	for(var port in this.m_xdomrpc_arr){
		if( this.m_xdomrpc_arr[port] == "done" )		nb_done++;
		if( typeof(this.m_xdomrpc_arr[port]) == "object" )	nb_active++;
	}
	
	// log to debug
	//console.info("nb_active=" + nb_active + " nb_done=" + nb_done);
	//console.info("arr len=" + this.m_xdomrpc_arr.length);
	//console.info("nb_port=" + (this.m_last_port - this.m_first_port + 1));
	
	// sanity check - nb_active MUST be <= to this.m_max_concurrent
	console.assert( nb_active <= this.m_max_concurrent ); 

	// if ALL port has been tested, notify the caller that the apps is absent
	if( nb_done == (this.m_last_port - this.m_first_port + 1) ){
		// mark this apps as undetected
		var	obj	= { "present"	: false };
		neoip_apps_detect_arr[this.m_suffix_name]	= obj;
		// notify the caller of the completion
		if( this.m_callback )	this.m_callback("absent");
		return;
	}

	// sanity check - nb_active MUST be <= than this.m_max_concurrent at all time
	console.assert( nb_active <= this.m_max_concurrent );

	// launch new xdomrpc_t if needed
	for(var port in this.m_xdomrpc_arr){
		// if this port is not "todo", goto the next
		if( this.m_xdomrpc_arr[port] != "todo" )	continue;
		// leave the loop if nb_active is now >= than this.m_max_concurrent
		if( nb_active >= this.m_max_concurrent )	break;
		// launch the xdomrpc_t on this port
		var	rpc_uri	= "http://" + this.m_hostname + ":" + port + "/neoip_" 
					+ this.m_suffix_name + "_appdetect_jsrest.js";
		this.m_xdomrpc_arr[port]= new neoip.xdomrpc_t(rpc_uri
						, neoip.xdomrpc_cb_t(this._xdomrpc_cb, this, port)
						, "probe_apps");
		// update the nb_active
		nb_active++;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			xdomrpc_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief xdomrpc_t callback
 */
neoip.apps_detect_t.prototype._xdomrpc_cb = function(notifier_obj, userptr, fault, returned_val)
{
	var probe_port	= userptr;
	// log to debug
	//console.info("enter fault=" + fault + " returned_val=" + returned_val);

	// destructor for the m_probe_xdomrpc
	this.m_xdomrpc_arr[probe_port].destructor();
	this.m_xdomrpc_arr[probe_port]	= "done";

	// if there is no error, notify the caller of a success
	if( fault == null ){
		// put the detected information in neoip_apps_detect_arr
		var	obj	= {};
		obj.outter_uri	= "http://" + this.m_hostname + ":" + probe_port;
		obj.version	= returned_val;
		obj.present	= true;
		neoip_apps_detect_arr[this.m_suffix_name]	= obj;
		// notify the caller of the completion
		if( this.m_callback )	this.m_callback("found");
		return;
	}

	// launch next probe if needed
	this._launch_next_probe();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			m_expire_timeout callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief callback for the m_expire_timeout
 */
neoip.apps_detect_t.prototype._expire_timeout_cb	= function()
{
	// mark this apps as undetected
	neoip_apps_detect_arr[this.m_suffix_name]	= { "present"	: false };
	// notify the caller of the completion
	if( this.m_callback )	this.m_callback("expired after " + this.m_expire_delay + "-msec");
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			apps_detect_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a apps_detect_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.apps_detect_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(result_str) {
			fct.call(scope, this, userptr, result_str);
		};
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Storage of the result
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var	neoip_apps_detect_arr	= new Array();

/** \brief Return true if the neoip-apps for this suffix_name is present, false otherwise
 */
neoip.apps_present	= function(suffix_name)
{
	// if neoip_apps_detect_arr doesnt contain suffix_name, return false
	// - as it means it havent even been tested
	if( neoip_apps_detect_arr[suffix_name] == null )	return false;
	// else return the present field
	return neoip_apps_detect_arr[suffix_name].present;
}

/** \brief Return the version for this suffix_name 
 *
 * - assume that the neoip-apps has been previously detected
 */
neoip.apps_version	= function(suffix_name)
{
	// sanity check - the apps MUST be present
	console.assert( neoip.apps_present(suffix_name) );
	// return the version for this apps
	return neoip_apps_detect_arr[suffix_name].version;
}


/** \brief Return true if the version for this suffix_name is >= min_version 
 *
 * - WARNING: assume that the neoip-apps has been previously detected
 * - the version model is major.minor.all.the.rest.ignored
 * ALGO:
 * - if cur_version major < min_version major, return false
 * - if cur_version minor < min_version minor, return false
 * - if all previous tests passed, return true
 */
neoip.apps_version_check	= function(suffix_name, min_version)
{
	var cur_version	= neoip.apps_version(suffix_name);
	// log to debug
	//console.info("suffix_name=" + suffix_name + " cur_version=" + cur_version + " min_version=" + min_version);

	// if cur_version major < min_version major, return false
	var cur_major	= parseInt(cur_version.split(".")[0], 10);
	var min_major	= parseInt(min_version.split(".")[0], 10);
	if( cur_major < min_major )	return false;

	// if cur_version minor < min_version minor, return false
	var cur_minor	= parseInt(cur_version.split(".")[1], 10);
	var min_minor	= parseInt(min_version.split(".")[1], 10);
	if( cur_minor < min_minor )	return false;

	// if cur_version patch < min_version patch, return false
	var cur_patch	= parseInt(cur_version.split(".")[2], 10);
	var min_patch	= parseInt(min_version.split(".")[2], 10);
	if( cur_patch < min_patch )	return false;

	// if all previous tests passed, return true
	return true;
}

/** \brief Return the outter_uri for this suffix_name 
 *
 * - assume that the neoip-apps has been previously detected
 */
neoip.outter_uri	= function(suffix_name)
{
	// sanity check - the apps MUST be present
	console.assert( neoip.apps_present(suffix_name) );
	// return the outter_uri for this apps
	return neoip_apps_detect_arr[suffix_name].outter_uri;
}
