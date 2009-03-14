/*! \file
    \brief Definition of the neoip.xdomrpc_t

\par Brief Description
This object implement a cross-domain rpc mechanism based on "remote scripting 
with script tag"

\par About the callback and the notification
- if neoip.xdomrpc_t constructor specify null as callback, no notification is made
  and the object autodelete itself on completion
- if a callback is specified, it MUST be of neoip.xdomrpc_cb_t type

\par About expire_timeout and network issue
- neoip.xdomrpc_t includes a expire_timeout
- this is usefull to detect the network error with the server
  - e.g. if the server is unreachable
- NOTE: any error once the server is reached, will be notified by fault

\par About the number of parameter to send in the callback
- currently only 10 are accepted, but this can be increased at will
- any non-specified parameters wont be sent

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor of the object
 */
neoip.xdomrpc_t = function(p_rpc_url, p_callback, method_name, arg0, arg1, arg2, arg3, arg4
							, arg5, arg6, arg7, arg8, arg9)
{
	// log to debug
	//console.info("enter");
	// copy the parameters
	this.m_obj_id		= neoip_xdomrpc_cb_new_obj_id();
	this.m_callback		= p_callback;
	this.m_rpc_url		= p_rpc_url;
	this.m_expire_delay	= 6.0*1000;		// TODO make this tunable
	this.m_expire_timeout	= setTimeout(neoip.basic_cb_t(this._expire_timeout_cb, this)
							, this.m_expire_delay);
	// register this xdomrpc to the neoip_xdomrpc_cb_arr
	neoip_xdomrpc_cb_doregister(this);
	// build the call_uri
	var	call_uri	= this.m_rpc_url;
	call_uri	+= "?obj_id="		+ this.m_obj_id;
	// TODO what is this js_callback stuff ?!?
	// - it is not used here and not used in webpack
	call_uri	+= "&js_callback="	+ 'neoip_xdomrpc_cb_callback_from_server';
	call_uri	+= "&method_name="	+ escape(method_name);
	if( arg0 != null )	call_uri += "&arg0=" + escape(arg0);
	if( arg1 != null )	call_uri += "&arg1=" + escape(arg1);
	if( arg2 != null )	call_uri += "&arg2=" + escape(arg2);
	if( arg3 != null )	call_uri += "&arg3=" + escape(arg3);
	if( arg4 != null )	call_uri += "&arg4=" + escape(arg4);
	if( arg5 != null )	call_uri += "&arg5=" + escape(arg5);
	if( arg6 != null )	call_uri += "&arg6=" + escape(arg6);
	if( arg7 != null )	call_uri += "&arg7=" + escape(arg7);
	if( arg8 != null )	call_uri += "&arg8=" + escape(arg8);
	if( arg9 != null )	call_uri += "&arg9=" + escape(arg9);
	// copy call_uri into this._call_uri 
	if( 0 ){
		this._call_uri	= call_uri;
	}else{	// NOTE: handle the uri scrambling
		this._call_uri	= neoip.core.doscramble_uri(call_uri);
	}
	// log to debug
	//console.info("call_uri=" + call_uri);
	//console.info("call_uri scrambled=" + neoip.core.doscramble_uri(call_uri));
	// do a m_zerotimer_init
	// - NOTE: needed because opera and IE evaluate the <script> *IMMEDIATLY*
	//   after insertion. while firefox does it at the next event loop iteration.
	this.m_zerotimer_init	= setTimeout(neoip.basic_cb_t(this._zerotimer_init_cb, this), 0);

	// define the script to use
	// - IE + WebKit seem to require the mode "monitor"
	// - firefox seem to support both "monitor" and "default" but "default" seems faster
	this.m_script_monitor	= neoip.core.isIE || neoip.core.isWebKit;
	//this.m_script_monitor	= true;
	//console.info("this.m_script_monitor=" + this.m_script_monitor);
}

/** \brief destructor of the object
 */
neoip.xdomrpc_t.prototype.destructor = function()
{
	// log to debug
	//console.info("enter");
	// delete the m_zerotimer_init if needed
	if( this.m_zerotimer_init )	clearTimeout( this.m_zerotimer_init );
	// delete the m_expire_timeout if needed
	if( this.m_expire_timeout )	clearTimeout( this.m_expire_timeout );
	// unregister this xdomrpc to the neoip_xdomrpc_cb_arr
	neoip_xdomrpc_cb_unregister(this);

	// delete the elements for this xdomrpc
	var htmlid_root	= "neoip_xdomrpc_script_" + this.m_obj_id;
	
	if( this.m_script_monitor )	this._dtor_all_script_monitor(htmlid_root);
	else				this._dtor_all_script_default(htmlid_root);
	// log to debug
	//console.info("leave");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			m_zerotimer_launch callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The _zerotimer_init_cb
 */
neoip.xdomrpc_t.prototype._zerotimer_init_cb	= function()
{
	var	call_uri	= this._call_uri;
	// log to debug
	//console.info("enter zerotimer obj_id=" + this.m_obj_id);
	// delete the m_zerotimer_init
	clearTimeout( this.m_zerotimer_init );
	this.m_zerotimer_init	= null;


	// setup some variable
	var root_elem	= this._get_root_elem();
	var htmlid_root	= "neoip_xdomrpc_script_" + this.m_obj_id;
	var reply_var	= "neoip_xdomrpc_script_reply_var_" + this.m_obj_id;

	/*************** pre script	***************************************/
	// build an script element PRE-call to detect if the call <script> failed
	// - NOTE: IE requires to use .text for <script> element and not .appendChild
	var intern_elem	= document.createElement('script');
	intern_elem.setAttribute('id', htmlid_root + "_pre");
	intern_elem.text	= "var " + reply_var + "=null;";
	root_elem.appendChild(intern_elem);
	/*************** call script	***************************************/
	// build an script element pointing to the url passed in parameter
	var intern_elem	= document.createElement('script');
	intern_elem.setAttribute('src', call_uri);
	intern_elem.setAttribute('id', htmlid_root + "_call");
	root_elem.appendChild(intern_elem);
	
	/*************** post script	***************************************/
	if( this.m_script_monitor )	this._ctor_post_script_monitor(intern_elem, htmlid_root);
	else				this._ctor_post_script_default(intern_elem, htmlid_root);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Build the post script in the default case
 */
neoip.xdomrpc_t.prototype._get_root_elem	= function()
{
if(0){	// Get the  in which to store the iframe
	var	root_elem	= document.getElementById('neoip.xdomrpc_temp_div');
	// if  doest not exist, create it now
	if( !root_elem ){
		root_elem	= document.createElement('div');
		root_elem.setAttribute('id','neoip.xdomrpc_temp_div');
		document.body.appendChild(root_elem);
	}
}else{
	// experiement to put all the script into the 'head' element 
	// - cleaner than creating fake div
	var root_elem	= document.getElementsByTagName('head')[0]
}
	// return the root_elem
	return root_elem;
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Implement the default case of browser
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Build the post script in the default case
 */
neoip.xdomrpc_t.prototype._ctor_post_script_default	= function(callscript_elem, htmlid_root)
{
	var root_elem	= this._get_root_elem();
	// build an script element POST-call to detect if the call <script> failed
	// - NOTE: IE requires to use .text for <script> element and not .appendChild
	var intern_elem	= document.createElement('script');
	intern_elem.setAttribute('id', htmlid_root + "_post");
	intern_elem.text= "neoip_xdomrpc_cb_callback_from_server("+this.m_obj_id+");"

	// NOTE: this should be the LAST thing of the function as it will notify the caller
	// - to appendChild of a <script> on opera/IE cause its IMMEDIATE evaluation
	root_elem.appendChild(intern_elem);
}

/** \brief Destroy all the scripts in the default case
 */
neoip.xdomrpc_t.prototype._dtor_all_script_default	= function(htmlid_root)
{
	var root_elem	= this._get_root_elem();
	try {	root_elem.removeChild(document.getElementById(htmlid_root + "_pre"));
	}catch(e){}
	try {	root_elem.removeChild(document.getElementById(htmlid_root + "_call"));
	}catch(e){}
	try {	root_elem.removeChild(document.getElementById(htmlid_root + "_post"));
	}catch(e){}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Implement the case of IE
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Build the post script in the case of IE
 */
neoip.xdomrpc_t.prototype._ctor_post_script_monitor	= function(callscript_elem, htmlid_root)
{
	/*************** post script	***************************************/
	// - IE executes the multiple <script> in parallele, so this script is done
	//   only AFTER the call_script is loaded
	// - http://www.ejeliot.com/blog/109 "Dynamically loading JS libraries and 
	//   detecting when they're loaded"
	// - http://unixpapa.com/js/dyna.html "Dynamic Script Loading"
	var script_state_cb	= function(p_obj_id){
		var obj_id		= p_obj_id;
		return	function() {
			// log to debug
			//console.info("readystate=" + this.readyState );

			// on FF/Safari this.readyState is undefined
			// on IE6sp, the readyState is 'loaded'
			// TODO to test on IE7
			if( this.readyState == null || this.readyState == 'loaded'
						|| this.readyState == 'complete' ){
				neoip_xdomrpc_cb_callback_from_server(obj_id);
			}
		};
	}
	// register the script_state_cb - for IE
	callscript_elem.onreadystatechange	= script_state_cb(this.m_obj_id);
	// register the script_state_cb - for most browser
	callscript_elem.onload			= script_state_cb(this.m_obj_id);
	// register onerror - incase it is not found
	callscript_elem.onerror			= script_state_cb(this.m_obj_id);
}

/** \brief Destroy all the scripts in the case of IE
 */
neoip.xdomrpc_t.prototype._dtor_all_script_monitor	= function(htmlid_root)
{
	var root_elem	= this._get_root_elem();

	// delete the elements for this xdomrpc - it is done asynchronously
	// - if done synchronously, it makes IE crash (tested on IE6sp2 and IE7)
	//   - apparently only <script> which are "loaded" or "complete"
	//   - likely because i remove the element _post while the
	// - as xdomrpc_t may be destroy before completion, script_pre and script_call
	//   may not yet be "complete" or "loaded" at this point, so this function
	//   retry periodically until they become so 
	var async_delete_cb	= function(p_htmlid, p_root_elem, p_subfct){
		var htmlid	= p_htmlid;
		var root_elem	= p_root_elem;
		var subfct	= p_subfct;
		return	function() {
			var elem	= document.getElementById(htmlid)
			var readyState	= elem.readyState;
			// if this elem is not yet loaded/complete, relaunch timer and return
			if( readyState != null && readyState != "loaded" && readyState != "complete"){
				//console.info("looping on " + htmlid + " as it is still in " + readyState);
				setTimeout(subfct(htmlid, root_elem, subfct), 1*1000);
				return;
			}
			//console.info("deleting htmlid=" + htmlid);
			// delete the elem now
			try {	root_elem.removeChild(elem);
			}catch(e){}
		};
	}
	// start the timeout
	setTimeout(async_delete_cb(htmlid_root + "_pre"	, root_elem, async_delete_cb), 0);
	setTimeout(async_delete_cb(htmlid_root + "_call", root_elem, async_delete_cb), 0);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			m_expire_timeout callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The _expire_timeout_cb
 */
neoip.xdomrpc_t.prototype._expire_timeout_cb	= function()
{
	// log to debug
	//console.info("enter");
	// stop the expire_timeout
	clearInterval( this.m_expire_timeout );
	this.m_expire_timeout	= null;
	// do the normal callback_cb mechanism with a special error
	var	fault	= { code: -1, string: "expired after " + this.m_expire_delay};
	this.callback_cb(this.m_obj_id, fault, null);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			local callback from the global one
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief callback to receive the result from the server
 */
neoip.xdomrpc_t.prototype.callback_cb	= function(obj_id, fault, returned_val)
{
	// sanity check - the obj_id MUST matches
	console.assert( this.m_obj_id == obj_id );
	// log to debug
	//console.info("obj_id=" + obj_id + " fault=" + fault + " returned_value=" + returned_val);
	// to notify the caller if there is a callback
	if( this.m_callback ){
		this.m_callback(fault, returned_val);
	}else{
		// if there is no callback, autodelete
		this.destructor();
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			xdomrpc_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a xdomrpc_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.xdomrpc_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(fault, returned_val) {
			fct.call(scope, this, userptr, fault, returned_val);
		};
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Global callback for xdomrpc
// - TODO i could put all those function in a namespace
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var	neoip_xdomrpc_cb_arr	= new Array();

/** \brief Return a free obj_id
 */
function neoip_xdomrpc_cb_new_obj_id(obj)
{
	var	obj_id;
	// draw a new random obj_id until a free one is found
	do {
		obj_id	= Math.floor(Math.random() * 65536);
	}while( neoip_xdomrpc_cb_arr[obj_id] != null );
	// return the obj_id
	return obj_id;
}

/** \brief Register a neoip.xdomrpc_t
 */
function neoip_xdomrpc_cb_doregister(obj)
{
	// log to debug
	//console.info("doregister obj_id=" + obj.m_obj_id);
	// sanity check - this obj.m_obj_id MUST NOT already exists
	console.assert( !neoip_xdomrpc_cb_arr[obj.m_obj_id] );
	// register this obj into the global array
	neoip_xdomrpc_cb_arr[obj.m_obj_id]	= obj;
}

/** \brief UnRegister a neoip.xdomrpc_t
 */
function neoip_xdomrpc_cb_unregister(obj)
{
	// log to debug
	//console.info("unregister obj_id=" + obj.m_obj_id);
	// sanity check - this obj.m_obj_id MUST already exists
	console.assert( neoip_xdomrpc_cb_arr[obj.m_obj_id] );
	// delete it from the array
	// TODO delete is bad!!!! it should be a splice.. but splice doesnt seems to work
	// - likely an issue with another bug
	//neoip_xdomrpc_cb_arr.splice(obj.m_obj_id, 1);
	delete neoip_xdomrpc_cb_arr[obj.m_obj_id];
	// sanity check - this obj.m_obj_id MUST NOT already exists
	console.assert( !neoip_xdomrpc_cb_arr[obj.m_obj_id] );
}

/** \brief Global callback called from the script
 */
function neoip_xdomrpc_cb_callback_from_server(obj_id)
{
	var	reply	= eval("neoip_xdomrpc_script_reply_var_" + obj_id);
	// log to debug
	//console.info("obj_id=" + obj_id + " reply=" + reply);
	// get the subplayer for this pid
	var	obj	= neoip_xdomrpc_cb_arr[obj_id];
	// if obj is no more registered, return now
	// - NOTE: this may happen as a race if the xdomrpc_t is destroyed before completion
	if( obj == null )	return;
	// sanity check - this key MUST already exists
	console.assert( obj != null );
	// delete the reply_var
	eval("delete neoip_xdomrpc_script_reply_var_" + obj_id);
	// if reply is still null, this means the server has not been reached
	if( reply == null ){
		obj.callback_cb(obj_id, { code: -1, string: "Server Unreachable"}, null);
		return;	
	}
	// log to debug
	//console.info("fault=" + reply.fault + " returned_val=" + reply.returned_val);
	// forward it to this obj
	obj.callback_cb(obj_id, reply.fault, reply.returned_val);
};

