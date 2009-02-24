/*! \file
    \brief Make all firebug js call act as a no-op (with or without firebug ext installed)

\par Brief Description
- this allow to stay compatible with firebug js calls
  - it consumes less rescource
- it is a simple modification of the firebugx.js from the firebug-lite library
  - it is the same as firebugx.js except that it is enable ALL the time
  - even with firebug is present
  
*/

/** \brief function to disable firebug calls
 *
 * - this is stored in a function in order to avoid global variable declaration
 */
function disable_firebug()
{
	// list of all the firebug calls
	var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
				"group", "groupEnd", "time", "timeEnd", "count", "trace",
				"profile", "profileEnd"];
	// put an empty function for all firebug calls
	window.console = {};
	for(var i = 0; i < names.length; ++i)	window.console[names[i]] = function() {}
}

// disable_firebug
disable_firebug();/*! \file
    \brief Definition of various core functions

\par Brief Description
This file contains various core functions. which are very close to js
- e.g. neoip.object_clone do a copy of js object

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
neoip.core_t	= function(){}

// create neoip.core_t as an object with only static functions
neoip.core	= new neoip.core_t();

// set a special variable which is true if the browser is IE, false otherwise
// - taken from http://code.google.com/p/doctype/wiki/ArticleUserAgent
neoip.core.isIE		= (navigator.appName.indexOf("Microsoft") != -1);
neoip.core.isWebKit	= (navigator.userAgent.indexOf('WebKit') != -1);

///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			object_clone
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Copy a javascript object (if reccursive == true, this is a deep copy, else it is 
 *         it is a shallow copy
 */
neoip.core_t.prototype.object_clone	= function(src_obj, reccursive)
{
	// if src_obj is not an 'object', simply return it
	if(typeof(src_obj) != 'object')	return src_obj;
	// if src_obj is the null object, simply return it
	if(src_obj == null)		return src_obj;
	// create the new object
	var dst_obj	= new Object();
	// copy each field of src_obj into dst_obj
	if( reccursive == true ){
		for(var i in src_obj)	dst_obj[i] = neoip.object_clone(src_obj[i], reccursive);
	}else{
		for(var i in src_obj)	dst_obj[i] = src_obj[i];
	}
	// return the newly created object
	return dst_obj;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			build_nonce_str
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Build a nonce_str of nonce_len character 
 * 
 * - take random number and convert them into [A-Z][a-z][0-9]
 */
neoip.core_t.prototype.build_nonce_str	= function(nonce_len)
{
	var nonce	= "";
	// loop nonce_len time
	for(var i = 0; i < nonce_len; i++){
		var rnd	= Math.floor(Math.random() * (26 + 26 + 10));
		if( rnd < 26 ){
			nonce += String.fromCharCode(rnd 	+ "A".charCodeAt(0));
		}else if( rnd < (26+26)){
			nonce += String.fromCharCode(rnd-(26)	+ "a".charCodeAt(0));
		}else{
			nonce += String.fromCharCode(rnd-(26+26)+ "0".charCodeAt(0));
		}
	}
	// return the just built nonce
	return nonce;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			dom event
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief add a event_listener to an object
 */
neoip.core_t.prototype.dom_event_listener	= function(obj, event_type, fct)
{ 
	if( obj.addEventListener ){
		obj.addEventListener(event_type, fct, false);
		return true; 
	}else if( obj.attachEvent ){
		return	obj.attachEvent("on" + event_type, fct);
	}else{
		return false;
	} 
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a basic_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.basic_cb_t	= function(fct, p_scope) 
{
	var	scope	= p_scope || window;
	return	function() { fct.call(scope); };
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			download_file_insync
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief build a XMLHttpRequest - dealing with IE non conformance
 */
neoip.core_t.prototype.build_xmlhttp_obj	= function()
{
	var xmlhttp_obj	= null;
	try{
		xmlhttp_obj	= new ActiveXObject("Msxml2.XMLHTTP"); //later IE
	}catch(e){
		try{
			xmlhttp_obj	= new ActiveXObject("Microsoft.XMLHTTP"); //earlier IE
		}catch(e){
			xmlhttp_obj	= null;
		}
	}
	
	//IE7, Firefox, Safari
	if( xmlhttp_obj == null )	xmlhttp_obj	= new XMLHttpRequest();
	// return the just-built object	
	return xmlhttp_obj;
}


/** \brief Load the content of a url synchronously
 */
neoip.core_t.prototype.download_file_insync	= function(url, do_nocache_workaround)
{
	var xmlhttp	= this.build_xmlhttp_obj();
	// do a open insync
	// NOTE: use the classical workaround to workaround browser caching it
	if( do_nocache_workaround == true ){
		url	+= url.indexOf('?') == -1 ? "?" : "&";
		url	+= "nocache_workaround=" + Math.floor(Math.random()*999999)
	}
	// do a open insync
	xmlhttp.open("GET", url, false);
	// start the request
	xmlhttp.send(null);
	// log to debug
	//
	//
	// if request failed, return a null object 
	if( xmlhttp.status != 200 )	return null;
	// else return the content of the file as text
	return xmlhttp.responseText;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			cookie management
// - taken from http://www.quirksmode.org/js/cookies.html
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief create a cookie
 */
neoip.core_t.prototype.cookie_write	= function(name, value, days, path)
{
	var cookie_str	= name + "=" + value;
	// determine the expires part 
	if( days ){
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		cookie_str += "; expires="+date.toGMTString();
	}
	
	// determine the path part
// TODO with IE. here is a issue with putting full pathname.
// - i tried to put only the dirname. which kindof work
// - but after i had trouble with page cookie.
// - in fact the real solution would be to understand why IE refuse this cookie and when 
//	if( path == null )	path	= this.dirname(window.location.pathname);
	if( path == null )	path	= window.location.pathname;
	cookie_str	+= "; path=" + path;

	

	// write the cookie itself 
	document.cookie = cookie_str;
}

/** \brief read a cookie
 */
neoip.core_t.prototype.cookie_read	= function(name)
{
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

/** \brief delete a cookie
 */
neoip.core_t.prototype.cookie_delete	= function(name)
{
	createCookie(name,"",-1);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			doc_urivar_get
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief function to extract a given variable from the page location url
 */
neoip.core_t.prototype.doc_urivar_get	= function(varname)
{
	var query_str	= window.location.search.substring(1);
	var urivar_arr	= query_str.split("&");
	// go thru all the variable of the uri
	for(var i=0; i < urivar_arr.length; i++ ){
		var pair = urivar_arr[i].split("=");
		// if this variable name matches, return its value
		if( pair[0] == varname) return pair[1];
	}
	// if no variable matches, return null
	return null;
}

/** \brief function to extract an array of variables from the page location url
 */
neoip.core_t.prototype.doc_urivar_arr	= function()
{
	// init a blank urivar_arr
	var urivar_arr	= {}
	// get the variable part of the uri
	var searchstr	= document.location.search.substring(1);
	var keyval_arr	= searchstr.split("&");
	// go thru each variable
	for(var i = 0; i < keyval_arr.length; i++ ){
		var keyval	= keyval_arr[i].split("=");
		var key		= keyval[0];
		var val		= keyval[1];
		// set this variable in urivar_arr
		urivar_arr[key]	= val;
	}
	// return the just built uri_varr
	return urivar_arr;
}

/** \brief Return true if uri_str is an absolute_uri, false otherwise
 */
neoip.core_t.prototype.is_absolute_uri	= function(str)
{
	if( /^http:\/\//.test(str) )	return true;
	if( /^https:\/\//.test(str) )	return true;
	if( /^ftp:\/\//.test(str) )	return true;
	return false;
}
/** \brief Return true if str is an absolute_path, false otherwise
 */
neoip.core_t.prototype.is_absolute_path	= function(str)
{
	if( /^\//.test(str) )	return true;
	return false;
}

/** \brief Return dirname from a pathname
 *
 * - the algo is : if the last char of the string is not a /, remove it and test again
 */
neoip.core_t.prototype.dirname	= function(pathname)
{
	return pathname.replace(/([^\/]*)$/, "");
}

/** \brief return an absolute uri based on uri_str
 *
 * - uri_str may be a absolute uri already
 * - uri_str may be a relative path
 * - uri_str may be a absolute path 
 * - NOTE: if it is a path, use the document location to get the absolute uri
 */
neoip.core_t.prototype.to_absolute_uri	= function(uri_str)
{
	// if uri_str is already an absolute_uri, return it now unchanged
	if( this.is_absolute_uri(uri_str) )	return uri_str;

	// if uri_str is an absolute_path, handle it here
	if( this.is_absolute_path(uri_str) ){
		// extract the scheme://host_port/ from the location.href
		var re		= /(.*:\/\/.*?)\//(location.href);
		var uri_hostport= re[1];
		// return the result
		return uri_hostport + uri_str;
	}

	var base_uri	= location.href;	
	base_uri	= base_uri.substring(0, base_uri.lastIndexOf('/'));
	// if the uri_str start with a 'parent delimiter' (aka ..), update 
	while( /^\.\./.test(uri_str) ){
		base_uri= base_uri.substring(0, base_uri.lastIndexOf('/'));
		uri_str	= uri_str.substring(3);
	}
	// return the result
	return base_uri + '/' + uri_str;
}



/** \brief Produce a scrambled uri
 * 
 * - the algo is simple:
 *   - the scheme + hostport remains untouched
 *   - all the rest are scrambled (currently using base64)
 * - TODO use a function which is less common than base64 to scramble !!! :)))
 *   - this is ultra easy to decode and the "==" at the end of the scrambled 
 *     data are a dead giveaway of the base64 algo
 * - TODO put this function elsewhere the use of neoip_base64 dependancy make it
 *   unsuitable for neoip.core_t
 */
neoip.core_t.prototype.doscramble_uri	= function(req_uri)
{
if( 1 ){
	// NOTE: to disable the uri scrambling
	return req_uri;
}else{
	// handle the special case of req_uri being only "http://example.com"
	// - aka with no '/' or path after the hostport
	if( /.*?:\/\/.*?\//.test(req_uri) == false )	return req_uri;	
	
	// http://example.com:3333/super/path/my/file.ext?var=value
	
	// extract part_beg "http://example.com:3333"
	var part_beg	= /(.*?:\/\/.*?)\//(req_uri)[1];
	// extract part_end "super/path/my/file.ext?var=value"
	var part_end	= /.*?:\/\/.*?\/(.*)/(req_uri)[1];
	
	// encode the part_end using base64
	// - TODO use a function which is less common than base64 to scramble !!! :)))
	part_end	= neoip_base64.encode_safe(part_end);

	// rebuild the uri with the encoded part_end
	return part_beg + "/scrambled/" + part_end;	
}
}
	/*! \file
    \brief Definition of the neoip.objembed_initmon_t

\par Brief Description
This object implement a monitor which notify when a given objembed to be initialized.
- the browser may not create the object immediatly after its insertion in the page.
- after the object is created, additionnal time is required for it to initialize itself.
- objembed_initmon_t allows to be notified when this objembed is ready to be used.

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
neoip.objembed_initmon_t = function()
{
	// log to debug
	//
	// init some parameters
	this.m_cur_delay	= 0.1*1000;
	this.m_end_delay	= 5.0*1000;
}

/** \brief destructor of the object
 */
neoip.objembed_initmon_t.prototype.destructor = function()
{
	// log to debug
	//
	// delete the m_expire_timeout if needed
	if( this.m_expire_timeout ){
		clearTimeout( this.m_expire_timeout );
		this.m_expire_timeout	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start the operation
 */
neoip.objembed_initmon_t.prototype.start = function(html_id, fct_str, callback)
{
	// log to debug
	//
	// copy the parameters
	this.m_html_id	= html_id;
	this.m_fct_str	= fct_str;
	this.m_callback	= callback;
	
	// start the next timeout
	this.m_expire_timeout	= setTimeout(neoip.basic_cb_t(this._expire_timeout_cb, this)
							, this.m_cur_delay);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			m_expire_timeout callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The _expire_timeout_cb
 */
neoip.objembed_initmon_t.prototype._expire_timeout_cb	= function()
{
	// log to debug
	//
	// stop the expire_timeout
	clearInterval( this.m_expire_timeout );
	this.m_expire_timeout	= null;
	
	// get the embed_elem in the page
	var embed_elem	= document.getElementById(this.m_html_id);
	// if embed_elem exists and has fct_str, notify the callback
	if( embed_elem != undefined && eval("typeof(embed_elem."+this.m_fct_str+")") == "function"){
		this.m_callback();
		return;
	}
	
	// NOTE: at this point, the objembed is NOT YET initialized

	// do the exponantial backoff on this.m_cur_delay, clamped by max_delay
	this.m_cur_delay	= this.m_cur_delay * 2;
	this.m_cur_delay	= Math.min(this.m_cur_delay, this.m_end_delay);

	// start the next timeout
	this.m_expire_timeout	= setTimeout(neoip.basic_cb_t(this._expire_timeout_cb, this)
							, this.m_cur_delay);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			objembed_initmon_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a objembed_initmon_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.objembed_initmon_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function() {
			fct.call(scope, this, userptr);
		};
}
/**
 * - this file provide a way to encode/decode base64 using the url-self alphabet
 * - it is used to build the dupuri in the nested uri
 * - adapted to use the base64 safe alphabet
 *   - rfc3548.4 "Base 64 Encoding with URL and Filename Safe Alphabet"
 * - this source has been taken from http://www.webtoolkit.info/ 
 *   - the license is unknown aka unspecified
 * - TODO put this in the neoip namespace
**/


/** 
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/

var neoip_base64 = {

	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=",

	// public method for encoding
	encode_safe : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = this._utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

		}

		return output;
	},

	// public method for decoding
	decode_safe : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\-\_\=]/g, "");

		while (i < input.length) {

			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}

		}

		output = this._utf8_decode(output);

		return output;

	},

	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while ( i < utftext.length ) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}

		return string;
	}

}/*! \file
    \brief Definition of the nested_uri_builder_t

\par Brief Description
nested_uri_builder_t is a class to help build neoip-oload nested uri.

\par Implementation notes
- this object exist in javascript and actionscript. it is very similar in both
  - neoip_nested_uri_builder_t.js and neoip_nested_uri_builder_t.as
  - this is a straight forward porting
  - any modification made in one, must be done in the other

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
neoip.nested_uri_builder_t = function()
{
	// zero some values
	this.m_dupuri_arr	= new Array;
	this.m_var_arr		= new Array;
}

/** \brief Destructor
 */
neoip.nested_uri_builder_t.prototype.destructor	= function()
{
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			action function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief to set the inner_uri
 * 
 * - if val is not an absolute uri, convert it to one
 */
neoip.nested_uri_builder_t.prototype.inner_uri	= function(val)	{
	this.m_inner_uri = neoip.core.to_absolute_uri(val);
}

/** \brief to set the outter_uri
 */
neoip.nested_uri_builder_t.prototype.outter_uri	= function(val)	{ this.m_outter_uri= val;}


/** \brief To set any outter_var
 */
neoip.nested_uri_builder_t.prototype.set_var	= function(key, val)
{
	if( key == "dupuri" ){
		// handled separatly because it is legitimate to have multiple dupuri
		this.m_dupuri_arr.push(val);
	}else if( key == "subfile_path" ){
		// add a variable 'subfile_level' in m_var_arr to give the 'level' of the path		
		this.m_var_arr['subfile_level']	= val.split("/").length - 1;
		// copy the value
		this.m_subfile_path	= val;
	}else{
		// push this variable into the m_var_arr
		this.m_var_arr[key]	= val;
	}
}

/** \brief Helper to set outter_var via an array
 */
neoip.nested_uri_builder_t.prototype.set_var_arr	= function(var_arr)
{
	// set all the variables of var_arr as outter_var
	for(var key in var_arr)	this.set_var(key, var_arr[key]);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Internal function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief throw an exception is this object is not considered sane 
 */
neoip.nested_uri_builder_t.prototype._is_sane_internal	= function()
{
	if( !this.m_outter_uri )	throw new Error("No outter_uri");
	if( !this.m_inner_uri )		throw new Error("No inner_uri");
	
	// TODO do all the sanity check here
	// - if subfile_level exist, a subfile_path MUST too
	// - subfile_path MUST always start with '/'
	// - if 'type' check the value is a legal one
	// - if 'mod' check the value is a legal one
	// - for dupuri and http_peersrc_uri, it MUST start by 'http://'
}

/** \brief If this object is considered sane, return true. false otherwise
 */
neoip.nested_uri_builder_t.prototype.is_sane	= function()
{
	try {
		// call the version with exception
		this._is_sane_internal();
	}catch(error) {
		
		return	false;		
	}
	// if all previous tests passed, this is considered sane
	return true;
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			to_string() function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief return a string of the nested_uri
 */
neoip.nested_uri_builder_t.prototype.to_string	= function()
{
	var	result	= "";
	// sanity check - the object MUST be sane
	console.assert( this.is_sane() );

	// start building the nested_uri
	result	+= this.m_outter_uri + "/";
	
	// put the 'mod' variable first
	if( this.m_var_arr['mod'] )	result += this.m_var_arr['mod'] + "/";
	
	// put all the outter variables
	for(var var_key in this.m_var_arr){
		// if 'mod', goto the next - it has already been handled
		if( var_key == "mod" )				continue;
		// if it is a "neoip_metavar_", goto the next - it will be handled later
		if( var_key.indexOf("neoip_metavar_") == 0 )	continue;
		// put the key of the variable
		result	+= "*" + var_key + "*";
		// put the values according to the keys
		if( var_key == "http_peersrc_uri" ){
			// http_peersrc_uri is specific - values are encoded in base64-urlsafe
			result	+= neoip_base64.encode_safe(this.m_var_arr[var_key]);
		}else{
			result	+= this.m_var_arr[var_key];
		}
		// add the separator
		result	+= "/";
	}
	// put all the dupuri with value in base64-urlsafe encoding
	for(var dupuri_idx in this.m_dupuri_arr){
		result	+= "*dupuri*";
		result	+= neoip_base64.encode_safe(this.m_dupuri_arr[dupuri_idx]);
		result	+= "/";
	}

	// put the inner_uri at the end
	// - made complex by the need to put the m_subfile_path between the 
	//   path and the query part of the inner_uri
	var	query_pos		 = this.m_inner_uri.indexOf("?");
	if( query_pos != -1 )	result	+= this.m_inner_uri.substr(0, query_pos);
	else			result	+= this.m_inner_uri;
	if(this.m_subfile_path)	result	+= this.m_subfile_path
	if( query_pos != -1 )	result	+= this.m_inner_uri.substr(query_pos, this.m_inner_uri.length);
	
	// put all the inner variables aka "neoip_metavar_"
	for(var var_key in this.m_var_arr){
		// if it is NOT a "neoip_metavar_", goto the next - it has been handled before
		if( var_key.indexOf("neoip_metavar_") != 0 )	continue;
		// put the variable separator
		result	+= result.indexOf('?') == -1 ? "?" : "&";
		// put the key of the variable
		result	+= var_key + "=" + escape(this.m_var_arr[var_key]);
	}
	
	
	result	= neoip.core.doscramble_uri(result);
	// return the just built nested_uri
	return result;
}

/**
 * SWFObject v1.5: Flash Player detection and embed - http://blog.deconcept.com/swfobject/
 *
 * SWFObject is (c) 2007 Geoff Stearns and is released under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */
if(typeof deconcept=="undefined"){var deconcept=new Object();}if(typeof deconcept.util=="undefined"){deconcept.util=new Object();}if(typeof deconcept.SWFObjectUtil=="undefined"){deconcept.SWFObjectUtil=new Object();}deconcept.SWFObject=function(_1,id,w,h,_5,c,_7,_8,_9,_a){if(!document.getElementById){return;}this.DETECT_KEY=_a?_a:"detectflash";this.skipDetect=deconcept.util.getRequestParameter(this.DETECT_KEY);this.params=new Object();this.variables=new Object();this.attributes=new Array();if(_1){this.setAttribute("swf",_1);}if(id){this.setAttribute("id",id);}if(w){this.setAttribute("width",w);}if(h){this.setAttribute("height",h);}if(_5){this.setAttribute("version",new deconcept.PlayerVersion(_5.toString().split(".")));}this.installedVer=deconcept.SWFObjectUtil.getPlayerVersion();if(!window.opera&&document.all&&this.installedVer.major>7){deconcept.SWFObject.doPrepUnload=true;}if(c){this.addParam("bgcolor",c);}var q=_7?_7:"high";this.addParam("quality",q);this.setAttribute("useExpressInstall",false);this.setAttribute("doExpressInstall",false);var _c=(_8)?_8:window.location;this.setAttribute("xiRedirectUrl",_c);this.setAttribute("redirectUrl","");if(_9){this.setAttribute("redirectUrl",_9);}};deconcept.SWFObject.prototype={useExpressInstall:function(_d){this.xiSWFPath=!_d?"expressinstall.swf":_d;this.setAttribute("useExpressInstall",true);},setAttribute:function(_e,_f){this.attributes[_e]=_f;},getAttribute:function(_10){return this.attributes[_10];},addParam:function(_11,_12){this.params[_11]=_12;},getParams:function(){return this.params;},addVariable:function(_13,_14){this.variables[_13]=_14;},getVariable:function(_15){return this.variables[_15];},getVariables:function(){return this.variables;},getVariablePairs:function(){var _16=new Array();var key;var _18=this.getVariables();for(key in _18){_16[_16.length]=key+"="+_18[key];}return _16;},getSWFHTML:function(){var _19="";if(navigator.plugins&&navigator.mimeTypes&&navigator.mimeTypes.length){if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","PlugIn");this.setAttribute("swf",this.xiSWFPath);}_19="<embed type=\"application/x-shockwave-flash\" src=\""+this.getAttribute("swf")+"\" width=\""+this.getAttribute("width")+"\" height=\""+this.getAttribute("height")+"\" style=\""+this.getAttribute("style")+"\"";_19+=" id=\""+this.getAttribute("id")+"\" name=\""+this.getAttribute("id")+"\" ";var _1a=this.getParams();for(var key in _1a){_19+=[key]+"=\""+_1a[key]+"\" ";}var _1c=this.getVariablePairs().join("&");if(_1c.length>0){_19+="flashvars=\""+_1c+"\"";}_19+="/>";}else{if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","ActiveX");this.setAttribute("swf",this.xiSWFPath);}_19="<object id=\""+this.getAttribute("id")+"\" classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" width=\""+this.getAttribute("width")+"\" height=\""+this.getAttribute("height")+"\" style=\""+this.getAttribute("style")+"\">";_19+="<param name=\"movie\" value=\""+this.getAttribute("swf")+"\" />";var _1d=this.getParams();for(var key in _1d){_19+="<param name=\""+key+"\" value=\""+_1d[key]+"\" />";}var _1f=this.getVariablePairs().join("&");if(_1f.length>0){_19+="<param name=\"flashvars\" value=\""+_1f+"\" />";}_19+="</object>";}return _19;},write:function(_20){if(this.getAttribute("useExpressInstall")){var _21=new deconcept.PlayerVersion([6,0,65]);if(this.installedVer.versionIsValid(_21)&&!this.installedVer.versionIsValid(this.getAttribute("version"))){this.setAttribute("doExpressInstall",true);this.addVariable("MMredirectURL",escape(this.getAttribute("xiRedirectUrl")));document.title=document.title.slice(0,47)+" - Flash Player Installation";this.addVariable("MMdoctitle",document.title);}}if(this.skipDetect||this.getAttribute("doExpressInstall")||this.installedVer.versionIsValid(this.getAttribute("version"))){var n=(typeof _20=="string")?document.getElementById(_20):_20;n.innerHTML=this.getSWFHTML();return true;}else{if(this.getAttribute("redirectUrl")!=""){document.location.replace(this.getAttribute("redirectUrl"));}}return false;}};deconcept.SWFObjectUtil.getPlayerVersion=function(){var _23=new deconcept.PlayerVersion([0,0,0]);if(navigator.plugins&&navigator.mimeTypes.length){var x=navigator.plugins["Shockwave Flash"];if(x&&x.description){_23=new deconcept.PlayerVersion(x.description.replace(/([a-zA-Z]|\s)+/,"").replace(/(\s+r|\s+b[0-9]+)/,".").split("."));}}else{if(navigator.userAgent&&navigator.userAgent.indexOf("Windows CE")>=0){var axo=1;var _26=3;while(axo){try{_26++;axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash."+_26);_23=new deconcept.PlayerVersion([_26,0,0]);}catch(e){axo=null;}}}else{try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");}catch(e){try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");_23=new deconcept.PlayerVersion([6,0,21]);axo.AllowScriptAccess="always";}catch(e){if(_23.major==6){return _23;}}try{axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");}catch(e){}}if(axo!=null){_23=new deconcept.PlayerVersion(axo.GetVariable("$version").split(" ")[1].split(","));}}}return _23;};deconcept.PlayerVersion=function(_29){this.major=_29[0]!=null?parseInt(_29[0]):0;this.minor=_29[1]!=null?parseInt(_29[1]):0;this.rev=_29[2]!=null?parseInt(_29[2]):0;};deconcept.PlayerVersion.prototype.versionIsValid=function(fv){if(this.major<fv.major){return false;}if(this.major>fv.major){return true;}if(this.minor<fv.minor){return false;}if(this.minor>fv.minor){return true;}if(this.rev<fv.rev){return false;}return true;};deconcept.util={getRequestParameter:function(_2b){var q=document.location.search||document.location.hash;if(_2b==null){return q;}if(q){var _2d=q.substring(1).split("&");for(var i=0;i<_2d.length;i++){if(_2d[i].substring(0,_2d[i].indexOf("="))==_2b){return _2d[i].substring((_2d[i].indexOf("=")+1));}}}return "";}};deconcept.SWFObjectUtil.cleanupSWFs=function(){var _2f=document.getElementsByTagName("OBJECT");for(var i=_2f.length-1;i>=0;i--){_2f[i].style.display="none";for(var x in _2f[i]){if(typeof _2f[i][x]=="function"){_2f[i][x]=function(){};}}}};if(deconcept.SWFObject.doPrepUnload){if(!deconcept.unloadSet){deconcept.SWFObjectUtil.prepUnload=function(){__flash_unloadHandler=function(){};__flash_savedUnloadHandler=function(){};window.attachEvent("onunload",deconcept.SWFObjectUtil.cleanupSWFs);};window.attachEvent("onbeforeunload",deconcept.SWFObjectUtil.prepUnload);deconcept.unloadSet=true;}}if(!document.getElementById&&document.all){document.getElementById=function(id){return document.all[id];};}var getQueryParamValue=deconcept.util.getRequestParameter;var FlashObject=deconcept.SWFObject;var SWFObject=deconcept.SWFObject;/*! \file
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
	//
	// copy the parameters
	this.m_obj_id		= neoip_xdomrpc_cb_new_obj_id();
	this.m_callback		= p_callback;
	this.m_rpc_url		= p_rpc_url;
	this.m_expire_delay	= 3.0*1000;		// TODO make this tunable
	this.m_expire_timeout	= setTimeout(neoip.basic_cb_t(this._expire_timeout_cb, this)
							, this.m_expire_delay);
	// register this xdomrpc to the neoip_xdomrpc_cb_arr
	neoip_xdomrpc_cb_doregister(this);
	// build the call_uri
	var	call_uri	= this.m_rpc_url;
	call_uri	+= "?obj_id="		+ this.m_obj_id;
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
	//
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
	//
}

/** \brief destructor of the object
 */
neoip.xdomrpc_t.prototype.destructor = function()
{
	// log to debug
	//
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
	//
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
	//
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
			//

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
				//
				setTimeout(subfct(htmlid, root_elem, subfct), 1*1000);
				return;
			}
			//
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
	//
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
	
	// log to debug
	//
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
	//
	// sanity check - this obj.m_obj_id MUST NOT already exists
	
	// register this obj into the global array
	neoip_xdomrpc_cb_arr[obj.m_obj_id]	= obj;
}

/** \brief UnRegister a neoip.xdomrpc_t
 */
function neoip_xdomrpc_cb_unregister(obj)
{
	// log to debug
	//
	// sanity check - this obj.m_obj_id MUST already exists
	
	// delete it from the array
	// TODO delete is bad!!!! it should be a splice.. but splice doesnt seems to work
	// - likely an issue with another bug
	//neoip_xdomrpc_cb_arr.splice(obj.m_obj_id, 1);
	delete neoip_xdomrpc_cb_arr[obj.m_obj_id];
	// sanity check - this obj.m_obj_id MUST NOT already exists
	
}

/** \brief Global callback called from the script
 */
function neoip_xdomrpc_cb_callback_from_server(obj_id)
{
	var	reply	= eval("neoip_xdomrpc_script_reply_var_" + obj_id);
	// log to debug
	//
	// get the subplayer for this pid
	var	obj	= neoip_xdomrpc_cb_arr[obj_id];
	// if obj is no more registered, return now
	// - NOTE: this may happen as a race if the xdomrpc_t is destroyed before completion
	if( obj == null )	return;
	// sanity check - this key MUST already exists
	
	// delete the reply_var
	eval("delete neoip_xdomrpc_script_reply_var_" + obj_id);
	// if reply is still null, this means the server has not been reached
	if( reply == null ){
		obj.callback_cb(obj_id, { code: -1, string: "Server Unreachable"}, null);
		return;	
	}
	// log to debug
	//
	// forward it to this obj
	obj.callback_cb(obj_id, reply.fault, reply.returned_val);
};

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
	//
	
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
	//
	
	// count the number of currently active probe
	var nb_active	= 0;
	var nb_done	= 0;
	for(var port in this.m_xdomrpc_arr){
		if( this.m_xdomrpc_arr[port] == "done" )		nb_done++;
		if( typeof(this.m_xdomrpc_arr[port]) == "object" )	nb_active++;
	}
	
	// log to debug
	//
	//
	//console.info("nb_port=" + (this.m_last_port - this.m_first_port + 1));
	
	// sanity check - nb_active MUST be <= to this.m_max_concurrent
	 

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
	//

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
	//

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
/*! \file
    \brief Definition of the apps_detect_wikidbg_t

\par Brief Description
neoip.apps_detect_wikidbg_t provides various wikidbg keyword in order to debug
the neoip.apps_detect_t.

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
neoip.apps_detect_wikidbg_t	= function(){}

// create apps_detect_wikidbg_t as an object with only static functions
neoip.apps_detect_wikidbg	= new neoip.apps_detect_wikidbg_t();


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			wikidbg
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief main callback for wikidbg
 */
neoip.apps_detect_wikidbg_t.prototype.main_cb	= function(cb_obj, keyword, dom_elem)
{
	// if dom_elem is a string, then it is the html_id for the actual dom element
	if( typeof(dom_elem) == "string")	dom_elem = document.getElementById(dom_elem);
	// delete the all subelem of dom_elem
	neoip.wikidbg_subelem_delete(dom_elem);
	// create a neoip.wikidbg_elem_t to ease the building
	var root_elem	= new neoip.wikidbg_elem_t(dom_elem);
	
	// handle the wikidbg according to the keyword
	if( keyword == "page" ){
		return this._page_cb	(cb_obj, keyword, root_elem);
	}else{
		throw "unknown keyword " + keyword;
	}	
}

/** \brief wikidbg callback for keyword "page"
 */
neoip.apps_detect_wikidbg_t.prototype._page_cb	= function(apps_detect, keyword, root_elem)
{
	// log to debug
	//
	// create the table_elem
	var table_elem	= root_elem.table().tbody();
	// fillup the table
	for(var suffix_name in neoip_apps_detect_arr ){
		var str;
		// determine the text according to its presence or not
		if( neoip.apps_present(suffix_name) ){
			str	 = " <font color='green'>HAS been found</font> -";
			str	+= " version " + neoip.apps_version(suffix_name);
			str	+= " with outter_uri of " + neoip.outter_uri(suffix_name);
		}else{
			str	 = "<font color='red'>HAS NOT</font> been found";
			str	+= " running on your computer.";
		}
		// add the result into the table
		table_elem.clone().tr().td()	.bold("neoip-" + suffix_name)
				.up(2).td()	.span().inner_html(": " + str);
	}
}





/*! \file
    \brief Definition of the neoip.webpack_detect_t

\par Brief Description
This object implements the detection of neoip-webpack. It is mainly used
to display the neoip-webpack badge on webpages.

\par About state automata
- assumed initial state = "inprobing"
- start the neoip.apps_detect_t probing of each neoip-apps inside neoip-webpack
- once they are all completed
  - IF ANY of neoip-apps is NOT present, goto "toinstall" state
  - IF ANY of neoip-apps has a version below minimal, goto "toupgrade" state
  - else goto "installed"

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
neoip.webpack_detect_t = function(p_callback)
{
	// copy the parameter
	this.m_callback		= p_callback;
	
	// define the parameters for each neoip-apps inside neoip-webpack
	this.m_apps_params	= { 	"oload"	: {	"first_port"	: 4550,
							"last_port"	: 4553,
							"min_version"	: "0.0.1"
						},
					"casto"	: {	"first_port"	: 4560,
							"last_port"	: 4563,
							"min_version"	: "0.0.1"
						},
					"casti"	: {	"first_port"	: 4570,
							"last_port"	: 4573,
							"min_version"	: "0.0.1"
						}
				};
	// start probing neoip-apps
	this.m_apps_detects	= new Array();
	for(var suffix_name in this.m_apps_params){
		var apps_param	= this.m_apps_params[suffix_name];
		var apps_detect	= new neoip.apps_detect_t(suffix_name
					, apps_param['first_port'], apps_param['last_port']
					, neoip.apps_detect_cb_t(this._apps_detect_cb, this));
		this.m_apps_detects.push( apps_detect );
	}
	// initial state is inprobing
	this._goto_state("inprobing");
}

/** \brief Destructor of player_t
 */
neoip.webpack_detect_t.prototype.destructor = function()
{
	// delete all remainig neoip.apps_detect_t in this.m_apps_detects array
	while( this.m_apps_detects.length > 0 ){
		// delete this apps_detect_t from this.m_apps_detects
		this.m_apps_detects[0].destructor();
		this.m_apps_detects.splice(0, 1);
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			TODO to comment
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief neoip.apps_detect_t callback
 */
neoip.webpack_detect_t.prototype._apps_detect_cb	= function(apps_detect, userptr, result_str)
{
	var	suffix_name	= apps_detect.suffix_name();
	// log the result
	//console.info("enter suffix_name=" + apps_detect.suffix_name() + " result_str=" + result_str);
	// delete this neoip.apps_detect_t in this.m_apps_detects array
	for(var idx in this.m_apps_detects){
		if( apps_detect != this.m_apps_detects[idx] )	continue;
		// delete this apps_detect_t from this.m_apps_detects
		this.m_apps_detects[idx].destructor();
		this.m_apps_detects.splice(idx, 1);
	}
	
	// if some neoip.apps_detect_t are unfinished, return now
	if( this.m_apps_detects.length > 0 )	return;

	// log to debug
	//
	
	// IF ANY of neoip-apps is NOT present, goto "toinstall" state
	for(var suffix_name in this.m_apps_params){
		// if this neoip-apps is present, goto the next
		if( neoip.apps_present(suffix_name) )	continue;
		// goto state "toinstall" and return
		this._goto_state("toinstall");
		return;	
	}
	
	// IF ANY of neoip-apps is NOT present, goto "toupgrade" state
	for(var suffix_name in this.m_apps_params){
		var min_version	= this.m_apps_params[suffix_name]['min_version'];
		// if this neoip-apps version is checked ok, goto the next
		if( neoip.apps_version_check(suffix_name, min_version) )	continue;
		// goto state "toupgrate" and return
		this._goto_state("toupgrade");
		return;	
	}
	// IF all previous tests passed, goto "installed" 
	this._goto_state("installed");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief function called to change state
 */
neoip.webpack_detect_t.prototype._goto_state	= function(new_state)
{
	// log to debug
	//
	// if new_state is "inprobing", return now
	if( new_state == "inprobing" )	return;
	// notify the callback
	this.m_callback(new_state);	
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			webpack_detect_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a webpack_detect_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.webpack_detect_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(new_state) {
			fct.call(scope, this, userptr, new_state);
		};
}/*! \file
    \brief Definition of the neoip.wikidbg_t

\par Brief Description
neoip.wikidbg_t implements a bunch of tool to help the debugging of javascript

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			wikidb misc
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Delete all the subelement from the root_elem
 */
neoip.wikidbg_subelem_delete	= function(root_elem)
{
	// loop until there is no more childNodes in the root_elem
	while( root_elem.childNodes.length ){
		// delete the first child
		var childnode	= root_elem.childNodes[0];
		root_elem.removeChild(childnode);
	}
}

/** \brief Delete all the subelement from the root_elem
 */
neoip.wikidbg_dump_object	= function(root_elem, obj)
{
	// handle the 'simple type' immediatly
	if( typeof(obj) != "object"){
		var text_elem	= document.createTextNode("[" + typeof(obj) + "] - " + obj);
		root_elem.appendChild(text_elem);
		return;
	}

	// handle the special case of null
	if( obj == null ){
		var text_elem	= document.createTextNode("null");
		root_elem.appendChild(text_elem);
		return;
	}

	// add the object type
	var text_elem	= document.createTextNode("[" + typeof(obj) + "]");
	root_elem.appendChild(text_elem);
	// create the ul which gonna hold this object
	var ul_elem	= document.createElement('ul');
	// handle each property of this object
	for(var key in obj){
		// skip this key if this is a "function"
		if( typeof(obj[key]) == "function" )	continue;
		// create the 'li' for this key 
		var li_elem	= document.createElement('li');
		li_elem.appendChild(document.createTextNode(key + ": "));
		// reccusive call this this obj
		neoip.wikidbg_dump_object(li_elem, obj[key]);
		// attach this 'li' to the 'ul'
		ul_elem.appendChild(li_elem);
	}
	// add the list to the root_elem		
	root_elem.appendChild(ul_elem);
}


/** \brief Delete all the subelement from the root_elem
 */
neoip.wikidbg_periodic	= function(period, wikidbg_obj, obj, keyword, root_elem)
{
	// log to debug
	//
	// call the actual wikidbg function
	wikidbg_obj.main_cb(obj, keyword, root_elem)
	
	// create the function closure to the timeout callback
	var timeout_cb_fct  = function() { 
			neoip.wikidbg_periodic(period, wikidbg_obj, obj, keyword, root_elem);
		}	
	// init the timeout for the next call after period-ms expired
	setTimeout(timeout_cb_fct, period);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			wikidbg_elem_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief Constructor
 */
neoip.wikidbg_elem_t = function(dom_elem)
{
	this.m_dom_elem	= dom_elem
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			private function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief append a child element from a dom_element
 */
neoip.wikidbg_elem_t.prototype._append_child_elem	= function(new_elem)
{
	// do the appendChild to the current dom_elem
	this.m_dom_elem.appendChild(new_elem);
	// update the current dom_elem to be the new one
	this.m_dom_elem	= new_elem;
	// return the object itself
	return this; 
}

/** \brief Create a dom elem with the tag_str and then append it as child
 */
neoip.wikidbg_elem_t.prototype._append_child_create	= function(tag_str)
{
	// create the new dom element
	var new_elem	= document.createElement(tag_str);
	return this._append_child_elem(new_elem);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			public function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

neoip.wikidbg_elem_t.prototype.ul	= function(){ return this._append_child_create("ul");	}
neoip.wikidbg_elem_t.prototype.ol	= function(){ return this._append_child_create("ol");	}
neoip.wikidbg_elem_t.prototype.li	= function(){ return this._append_child_create("li");	}
neoip.wikidbg_elem_t.prototype.table	= function(){ return this._append_child_create("table");}
neoip.wikidbg_elem_t.prototype.tbody	= function(){ return this._append_child_create("tbody");}
neoip.wikidbg_elem_t.prototype.thead	= function(){ return this._append_child_create("thead");}
neoip.wikidbg_elem_t.prototype.tr	= function(){ return this._append_child_create("tr");	}
neoip.wikidbg_elem_t.prototype.td	= function(){ return this._append_child_create("td");	}
neoip.wikidbg_elem_t.prototype.span	= function(){ return this._append_child_create("span");	}

neoip.wikidbg_elem_t.prototype.text	= function(text_str)
{
	// create the new dom element
	var new_elem	= document.createTextNode(text_str);
	return this._append_child_elem(new_elem);
}

neoip.wikidbg_elem_t.prototype.inner_html	= function(value)
{
	this.m_dom_elem.innerHTML	= value;
}

neoip.wikidbg_elem_t.prototype.bold	= function(text_str)
{
	var tmp		= this._append_child_create("b");
	// if text_str is not specified, return now
	if(typeof(text_str) == "undefined")	return tmp;
	// if text_str is specified, add it and return
	return tmp.text(text_str).up();	
}

/** \brief Goes up in the node hierarchy nb_time (if not specified, go once)
 */
neoip.wikidbg_elem_t.prototype.up	= function(nb_time)
{
	// if nb_time is not specified, default to 1 
	if(typeof(nb_time) == "undefined")	nb_time = 1;
	// goto the parent nb_time
	for(var i = 0; i < nb_time; i++)	this.m_dom_elem	= this.m_dom_elem.parentNode;
	// return the object itself
	return this; 
}

/** \brief Close the wikidbg_elem_t object
 */
neoip.wikidbg_elem_t.prototype.clone	= function()
{
	return neoip.core.object_clone(this);
}
// 
// this script implement a playlist_t for the player_t
// 
// - TODO it has 2 format jspf and a json custom (obsolete to remove)


// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor of the playlist_t
 */
neoip.playlist_t = function(playlist_str)
{
	// if playlist_str is provided parse it now	
	if( playlist_str )	this.from_jspf(playlist_str);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Parse the playlist_t from a string contains 'jspf format
 * 
 * - jspf is the json version of xspf
 * - http://wiki.xiph.org/index.php/JSPF_Draft
 */
neoip.playlist_t.prototype.from_jspf = function(jspf_str)
{
	// TODO to do eval on json as if if were javascript cause some security issue
	// - IIF the json string is untrusted tho. aka not coming from the same site
	// - some json only parser are available in http://json.org
	// - an additionnal dependancy
	var jspf_data		= eval('(' + jspf_str + ')');
	var jspf_playlist	= jspf_data.playlist;
	//
	//
	
	// get data about the playlist itself
	this.m_base_date	= Date.parse(jspf_playlist.date);
	this.m_identifier	= jspf_playlist.identifier;
	this.m_meta		= {};
	this.m_extension	= {};
	
	// put some default in the this.m_meta
	this.m_meta['may_loop']		= true;
	this.m_meta['trackidx_beg']	= 0;
	

	// parse all the meta of the jspf_track
	if( jspf_playlist.meta == undefined )		jspf_playlist.meta	= null;	
	for(var key in jspf_playlist.meta)	this.m_meta[key]	= jspf_playlist.meta[key];
	// parse all the known extension
	if( jspf_playlist.extension == undefined )	jspf_playlist.extension	= null;	
	for(var key in jspf_playlist.extension)	this.m_extension[key]	= jspf_playlist.extension[key];

	// parse all the track_arr
	this.m_track_arr	= new Array();
	this.m_total_duration	= 0.0;
	for(var i = 0; i < jspf_playlist.track.length; i++){
		// create a new playlist_track
		var track	= new this.track_t(this, i + this.trackidx_beg()
					, this.m_total_duration, jspf_playlist.track[i]);
		// put it in the m_track_arr
		this.m_track_arr.push(track);
		// update the total_duration
		this.m_total_duration	+= this.m_track_arr[i].duration();
	}

	// sanity check - the resulting object MUST be valid
	//console.assert(this.is_valid());
	this.check();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the current track_pos
 */
neoip.playlist_t.prototype.current_track_pos = function(present_date)
{
	// sanity check - present_date MUST be set
	
	// compute the age of the playlist
	var playlist_age	= present_date - this.m_base_date;
	// compute the delay within the playlist
	var track_reltime	= playlist_age % this.m_total_duration;
	// find the track for the current time 
	for(var i = 0; i < this.m_track_arr.length; i++){
		// if this track is the current one, leave the loop
		if( this.m_track_arr[i].m_duration > track_reltime )	break;	
		// update the track_reltime
		track_reltime -= this.m_track_arr[i].m_duration;
	}
	
	console.info("trackidx_beg()=" + this.trackidx_beg());
	
	// sanity check - i MUST be less than this.m_track_arr.length
	
	// return the result
	return {"trackidx"	: i + this.trackidx_beg(),
		"track_reltime"	: track_reltime
		 }
}

/** \brief Return the current track_pos
 */
neoip.playlist_t.prototype.current_track_pos_wseek = function(present_date)
{
	//
	// get the current_track_pos
	var track_pos	= this.current_track_pos(present_date);
	// if this track_t.may_not_startinmid, zero the track_reltime
	var track	= this.track_at(track_pos.trackidx);
	if( track.may_not_startinmid() )	track_pos.track_reltime	= 0;
	// return the result
	return track_pos;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			check functions
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Check that the playlist is valid
 * 
 * - if the playlist is not valid an exception will be thrown
 */
neoip.playlist_t.prototype.check = function()
{
	// check the type of each fields
	if( !typeof(this.m_base_date) == "number" )	throw("base_date is NOT Number");
	if( !(this.m_track_arr  instanceof Array) )	throw("track_arr is NOT Array");

	// check each track of the track_arr
	for(var i = 0; i < this.m_track_arr.length; i++){
		// check the type of this track
		if( !(this.m_track_arr[i]  instanceof this.track_t) )
			throw("track " + i + " is not an playlist_t.track_t");
		// check this track_t
		this.m_track_arr[i].check();
	}
}

/** \brief Return true if the playlist_t is valid, false otherwise
 */
neoip.playlist_t.prototype.is_valid	= function()
{
	try 	{	this.check();	return true;	}
	catch(e){	return false;			}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return true if both playlist_t are of the same instance, false otherwise
 */
neoip.playlist_t.prototype.same_instance_as	= function(other_playlist)
{
	// test all cases
	if( this.identifier()		!= other_playlist.identifier() )	return false;
	if( this.instance_nonce()	!= other_playlist.instance_nonce() )	return false;
	// if all tests passed, both playlist_t are considered of the same instance
	return true;
}

/** \brief Maintain a outter_uri_arr in the playlist_t
 */
neoip.playlist_t.prototype.set_outter_uri_arr	= function(outter_uri_arr)
{
	// sanity check - outter_uri_arr MUST not be null
	
	// copy the value
	this.m_outter_uri_arr	= outter_uri_arr;
}

neoip.playlist_t.prototype.contain_trackidx	= function(trackidx)
{
	if( trackidx	<  this.trackidx_beg() )	return false;
	if( trackidx	>= this.trackidx_end() )	return false;
	return true;
}

/** \brief Return the track at trackidx (with a handling for this.m_trackidx_beg)
 */
neoip.playlist_t.prototype.track_at		= function(trackidx)
{
	// TODO to remove - only display to debug
	if( !this.contain_trackidx(trackidx) ){
		
		console.info("trackidx_beg=" + this.trackidx_beg());
		console.info("trackidx_end=" + this.trackidx_end());
		
		
	}
	// sanity check - this trackidx MUST be present
	console.assert( this.contain_trackidx(trackidx) );
	// return the track_t for this trackidx
	return this.m_track_arr[trackidx - this.trackidx_beg()];
}

// declare all the methods to read the variables
neoip.playlist_t.prototype.total_duration	= function(){ return this.m_total_duration;	}

neoip.playlist_t.prototype.base_date		= function(){ return this.m_base_date;		}
neoip.playlist_t.prototype.identifier		= function(){ return this.m_identifier;		}

neoip.playlist_t.prototype.meta			= function(){ return this.m_meta;		}
neoip.playlist_t.prototype.extension		= function(){ return this.m_extension;		}

neoip.playlist_t.prototype.may_loop		= function(){ return this.m_meta['may_loop'];		}
neoip.playlist_t.prototype.may_not_loop		= function(){ return !this.may_loop();			}
neoip.playlist_t.prototype.reload_delay		= function(){ return this.m_meta['reload_delay'];	}
neoip.playlist_t.prototype.instance_nonce	= function(){ return this.m_meta['instance_nonce'];	}
neoip.playlist_t.prototype.trackidx_beg		= function(){ return this.m_meta['trackidx_beg'];	}

neoip.playlist_t.prototype.trackidx_end		= function(){ return this.trackidx_beg()
								+ this.m_track_arr.length;	}
neoip.playlist_t.prototype.nb_track		= function(){ return this.m_track_arr.length;	}



// 
// this script implement a playlist_t for the player_t
// 


// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief the track_t for each track of the playlist_t
 */
neoip.playlist_t.prototype.track_t = function(p_playlist, p_trackidx, p_base_reltime
							, track_data)
{
	// sanity check - track_data MUST be non null
	
	// copy the parameter
	this.m_playlist		= p_playlist;
	this.m_trackidx		= p_trackidx;
	this.m_base_reltime	= p_base_reltime;
	
	// parse the track_data
	if( track_data )	this._from_jspf(track_data);
}

/** \brief Parse the track_t from track element of a jspf playlist
 */
neoip.playlist_t.prototype.track_t.prototype._from_jspf = function(jspf_track)
{
	this.m_location		= jspf_track.location;
	this.m_duration		= jspf_track.duration;
	this.m_meta		= {};
	this.m_extension	= {};

	// convert the jspf_track.title 
	this.m_title		= "unspecified title"; 
	if( jspf_track.title )	this.m_title = jspf_track.title;

	// put some default in the this.m_meta
	this.m_meta['start_time']	= 0;
	this.m_meta['content_type']	= "static";
	this.m_meta['prefetch_delay']	= Math.min(30*1000, this.m_duration);
	
	// parse all the meta of the jspf_track
	if( jspf_track.meta == undefined )	jspf_track.meta		= null;
	for(var key in jspf_track.meta)		this.m_meta[key]	= jspf_track.meta[key];
	// parse all the known extension
	if( jspf_track.extension == undefined )	jspf_track.extension	= null;
	for(var key in jspf_track.extension)	this.m_extension[key]	= jspf_track.extension[key];
}

/** \brief Check that the playlist is valid
 * 
 * - if the playlist is not valid an exception will be thrown
 */
neoip.playlist_t.prototype.track_t.prototype.check = function()
{
	// check the type of each fields
	if( !typeof(this.m_location) == "string" )	throw("m_location is NOT a string");
	if( !typeof(this.m_duration) == "number" )	throw("m_duration is NOT number");
	if( typeof(this.m_meta['start_time']) != "number" )	throw("m_meta start_time is NOT number");
	if( typeof(this.m_meta['content_type']) != "string" )	throw("m_meta content_type is NOT string");
	if( typeof(this.m_meta['prefetch_delay']) != "number")	throw("m_prefetch_delay is NOT number");
// TODO unclear what it is... is it an object?
//	if( !(this.m_extension instanceof Array) )	throw("m_extension is NOT an Array");


	// if track_t.is_stream, then this.m_meta['start_time'] MUST be 0
	if( this.is_stream() )	
	
	// the prefetch_delay MUST be <= than the duration
	// - TODO what is the reason behind this ? seem weird to me
	console.assert( this.prefetch_delay() <= this.duration() );
}

// declare all the methods to read the variables
neoip.playlist_t.prototype.track_t.prototype.playlist	= function(){ return this.m_playlist;		}
neoip.playlist_t.prototype.track_t.prototype.trackidx	= function(){ return this.m_trackidx;		}
neoip.playlist_t.prototype.track_t.prototype.base_reltime=function(){ return this.m_base_reltime;	}

neoip.playlist_t.prototype.track_t.prototype.location	= function(){ return this.m_location;		}
neoip.playlist_t.prototype.track_t.prototype.title	= function(){ return this.m_title;		}
neoip.playlist_t.prototype.track_t.prototype.duration	= function(){ return this.m_duration;		}

neoip.playlist_t.prototype.track_t.prototype.meta	= function(){ return this.m_meta;		}
neoip.playlist_t.prototype.track_t.prototype.extension	= function(){ return this.m_extension;		}

neoip.playlist_t.prototype.track_t.prototype.start_time	= function(){ return this.m_meta['start_time'];	}
neoip.playlist_t.prototype.track_t.prototype.content_type=function(){ return this.m_meta['content_type'];}
neoip.playlist_t.prototype.track_t.prototype.video_aspect=function(){ return this.m_meta['video_aspect'];}

neoip.playlist_t.prototype.track_t.prototype.is_static	= function(){ return this.content_type() == "static";	}
neoip.playlist_t.prototype.track_t.prototype.is_stream	= function(){ return this.content_type() == "stream";	}

/** \brief Return the static_filelen from this.extension['oload'] if present, null otherwise
 */
neoip.playlist_t.prototype.track_t.prototype.static_filelen	= function()
{
	// if this track_t has no "oload" extension, return null
	if( this.m_extension['oload'] == null )				return null;
	// if this.m_extension['oload'] has no "static_filelen", return null
	if( this.m_extension['oload']['static_filelen'] == null )	return null;
	// else return the value
	return this.m_extension['oload']['static_filelen'];
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			seekability
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return true if this track is may be started in the middle, false otherwise
 */
neoip.playlist_t.prototype.track_t.prototype.may_startinmid	= function()
{
	var outter_uri_var	= this.m_playlist.m_outter_uri_arr;
	// a track_t.is_stream can always start in the middle
	if( this.is_stream() )	return true;
	// NOTE: from here the track_t.is_static
	console.assert( this.is_static() );
	
	// TODO to code
	// - ok the data is now available in the track_t
	// - how to pass the oload presence here ?
	// - and the subplayer_caps
	
	/* note: a track may not start in the middle if:
	 * - track with vlc and vlc is unable to seek thru it
	 * - player_t is flash and flv has no kframe_index
	 * - player_t is flash and the http server does not support rangereq_byuri
	 *   - depend on the presence of oload (as oload support rangereq_byuri)
	 *   - depend on the http server pointed by 'location' if oload is not present
	 *   - imply to get playlist_t to be aware of the player type and the oload presence
	 *     - maybe to have various precomputation everytime those data changes
	 */

	// NOTE: this assumes to be an flv
	// - how does this work in case of vlc ?
	
	// determine if the track_t is accessed directly or thru neoip
	// NOTE: it assume that if neoip-oload is present it is used.
	var direct_location	= outter_uri_var.oload ? false : true;
	
	// if it is accessed directly to the location, and location_rangereq_byuri_varname
	// is not specified, this track may not start in the middle
	if( direct_location && !this.meta()['location_rangereq_byuri_varname'] )
		return false;

	// if flv_mdata_info['kframe_index_present'] is not 1, this track may not startinmid
	var flv_mdata_info	= this.extension()['flv_mdata_info'];
	if( !flv_mdata_info || flv_mdata_info['kframe_index_present'] != 1 )
		return false;

	// if all previous tests passed, it is considered to be startable in the middle
	return true;
}

/** \brief Just an alias on top of track_t.may_startinmid
 */
neoip.playlist_t.prototype.track_t.prototype.may_not_startinmid	= function(){ return !this.may_startinmid();	}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			query function about prefetch
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

neoip.playlist_t.prototype.track_t.prototype.prefetch_delay	= function(){ return this.m_meta['prefetch_delay'];	}
neoip.playlist_t.prototype.track_t.prototype.prefetchable	= function(){ return this.prefetch_delay() > 0;		}

/** \brief Return true if this track_t is prefetchable at this base_time
 */
neoip.playlist_t.prototype.track_t.prototype.prefetchable_at	= function(base_time)
{
	// sanity check - ensure the base_time is in an acceptable 
	console.assert( base_time >= 0 && base_time < this.m_playlist.total_duration() );

	// compute the range in which this track_t is considered prefetchable
	var	range_beg	= this.m_base_reltime - this.prefetch_delay();
	var	range_end	= this.m_base_reltime;
	
	// if range_beg may warparound and playlist.may_not_loop, clamp range_beg to 0
	if( range_beg < 0 && this.m_playlist.may_not_loop() )
		range_beg	= 0;

	// special case if the range goes 'before' the begining of the playlist_t
	// - aka if there is a warparound in the range
	if( range_beg < 0 ){
		// update the range_beg
		range_beg	+= this.m_playlist.total_duration();
		// perform the test - taking into account the  
		if( base_time >= range_beg )	return true;
		if( base_time <= range_end )	return true;
		return false;
	}
	
	// if base_time is outside the range, return false
	if( base_time < range_beg )	return false;
	if( base_time > range_end )	return false;
	// if all previous tests passed, this track_t is considered prefetchable
	return true;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** Return the outter_uri for the content_type of this track_t
 * 
 * - or null if there is no outter_uri
 */
neoip.playlist_t.prototype.track_t.prototype.outter_uri = function()
{
	var outter_uri_arr	= this.m_playlist.m_outter_uri_arr;
	// if this track_t is static, return outter_uri for neoip-oload
	if( this.is_static() )	return outter_uri_arr.oload;
	// if this track_t is stream, return outter_uri for neoip-casto
	if( this.is_stream() )	return outter_uri_arr.casto;
	// NOTE: this point SHOULD NEVER be reached
	
	return null;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			cooked_uri stuff
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** Return a string of the cooked_uri for this track 
 */
neoip.playlist_t.prototype.track_t.prototype.cooked_uri = function(outter_var)
{
	var outter_uri_arr	= this.m_playlist.m_outter_uri_arr;
	var result_uri		= null;
	// handle it according to its content_type
	if( this.is_static() ){
		// if neoip-oload is not present, return the raw track_t.location() 
		// if neoip-oload is present, return the cooked_uri
		if( !outter_uri_arr.oload )	result_uri	= this.location();
		else				result_uri	= this._cooked_uri_static(outter_uri_arr.oload, outter_var);
	}else if( this.is_stream() ){
		// if neoip-casto is not present, return the raw track_t.location() 
		// if neoip-casto is present, return the cooked_uri
		if( !outter_uri_arr.casto )	result_uri	= this.location();
		else				result_uri	= this._cooked_uri_stream(outter_uri_arr.casto, outter_var);
	}
	// Introduce a dummy random variable into the URI - for static and stream
	// - NOTE: it is done for uri with or without casto/oload. in case of without...
	//   - it may cause conflict with the http server 
	// - it is made to make the browser believes this file is unique
	// - firefox has an optimisation which say "if firefox already download a file, dont start downloading
	//   it again". it is an optimisation not to download it twice.
	//   - unfortunatly it is invalid when this file is a video which is player as it is downloaded :)
	//   - so when a single firefox got several players on the same playlist, only one was played
	// add the variable separator + the key+value
	result_uri	+= result_uri.indexOf('?') == -1 ? "?" : "&";
	result_uri	+= "uri_unifier_workaround=" + Math.floor(Math.random()*999999);
	// return the result_uri
	return result_uri;
}

/** \brief Return the location cooked to be used for static playlist_track
 *
 * - TODO to handle the extension['oload']['required'] == true
 */
neoip.playlist_t.prototype.track_t.prototype._cooked_uri_static= function(outter_uri, outter_var)
{
	// sanity check - track_t MUST be static
	console.assert( this.is_static() );

	// build the nested_uri
	var	nested_uri	= new neoip.nested_uri_builder_t();
	nested_uri.outter_uri	(outter_uri);
	nested_uri.inner_uri	(this.location());
	// merge this.extension().oload and outter_var array into tmp_var
	var	tmp_var		= {};
	for(var key in this.extension().oload )	tmp_var[key] = this.extension().oload[key];
	for(var key in outter_var )		tmp_var[key] = outter_var[key];
	// set all the outter_var in the nested_uri
	nested_uri.set_var_arr(tmp_var);
	// return the result
	return nested_uri.to_string();
}

/** \brief Return the location cooked to be used for stream playlist_track
 *
 * - TODO to handle the extension['casto']['required'] == true
 *
 * \param track the playlist_t.track_t to build an location for
 * \param prefetching if true, build an location for prefetching
 */
neoip.playlist_t.prototype.track_t.prototype._cooked_uri_stream= function(outter_uri, outter_var)
{
	// sanity check - track MUST be stream
	console.assert( this.is_stream() );
	// build the cooked_uri
	var	cooked_uri	= outter_uri 	+ "/" + this.extension().casto.cast_privhash
						+ "/" + this.extension().casto.cast_name;
	// merge this.extension().casto and outter_var array into tmp_var
	var	tmp_var		= {};
	for(var key in this.extension().casto)	tmp_var[key] = this.extension().casto[key];
	for(var key in outter_var)		tmp_var[key] = outter_var[key];
	// append all tmp_var at the end of the cooked_uri
	for(var key in tmp_var ){
		// if this is "cast_privhash", goto the next - it always has been given in path
		if( key == "cast_privhash" )	continue;
		// if this is "cast_name", goto the next - it always has been given in path
		if( key == "cast_name" )	continue;
		// add the variable separator
		cooked_uri	+= cooked_uri.indexOf('?') == -1 ? "?" : "&";
		// add the key+value
		cooked_uri	+= escape(key) + "=" + escape(tmp_var[key]);
	}
	// log to debug
	
	// return the result
	return cooked_uri;
}


/** \brief Return the mdata_uri for the track_t, adding all specific outter_var
 * 
 * - WARNING: to use ONLY to get flv_mdata_t .. not the content
 */
neoip.playlist_t.prototype.track_t.prototype.flv_mdata_uri	= function(p_outter_var)
{
	var	result_uri;
	// get the "flv_mdata" extension of this track
	var flv_mdata_info	= this.extension()['flv_mdata_info'];
	if( !flv_mdata_info )	flv_mdata_info = { "type": "internal"	};
	
	// copy outter_var into tmp_var
	var	outter_var	= {};
	for(var key in p_outter_var )	outter_var[key] = p_outter_var[key];
	
	if( flv_mdata_info['type'] == "external" ){
		// if flv_mdata_info.intmdata_len is specified, update the outter_var
		// - NOTE: only an optimisation to avoid downloading more than necessary
		if( flv_mdata_info['extmdata_len'] )
			outter_var['static_filelen']	= flv_mdata_info['extmdata_len'];
		// build the nested_uri
		var	nested_uri	= new neoip.nested_uri_builder_t();
		nested_uri.outter_uri	(this.outter_uri());
		nested_uri.set_var_arr	(outter_var);
		nested_uri.inner_uri	(flv_mdata_info['extmdata_uri']);
		// set tmp_uri with the just built nested_uri
		result_uri	= nested_uri.to_string();
	}else if( flv_mdata_info['type'] == "internal" ){
		// if flv_mdata_info.intmdata_len is specified, update the outter_var
		// - NOTE: only an optimisation to avoid downloading more than necessary
		if( flv_mdata_info['intmdata_len'] )
			outter_var['read_ahead']	= flv_mdata_info['intmdata_len'];
		// TODO experiment with 'cache_buster' 
		//tmp_var['cache_buster']	= Math.floor(Math.random()*999999);
		// get the cooked_uri for this playlist_track
		result_uri	= this.cooked_uri(outter_var);
	}
	// return the just-built result_uri
	return	result_uri;
}
/*! \file
    \brief Definition of the neoip.playlist_loader_t

- TODO the xmlHttpRequest is currently insync
  - this is an remain of experimentation
  - this is useless and harmfull
  - make it async

\par Brief Description
This object implement the mechanism to periodically reload playlist. this 
is part of the 'infinitly long playlist'.

\par Note Implementation
- caching workaround
  - it seems that the result of XMLHttpRequest got cached by firefox
  - so add a fake uri variable with a random number in it to workaround the cache


*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			playlist_loader_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor 
 */
neoip.playlist_loader_t	= function(p_playlist_uri, p_callback) 
{
	// copy the parameter
	this.m_playlist_uri	= p_playlist_uri;
	this.m_callback		= p_callback;
	
	// start the initial m_reload_timeout
	this.m_reload_timeout	= setTimeout(neoip.basic_cb_t(this._reload_timeout_cb, this), 0);
}

/** \brief Destructor
 */
neoip.playlist_loader_t.prototype.destructor	= function()
{
	// log to debug
	//
	// delete the timeout if needed
	if( this.m_reload_timeout ){
		clearTimeout(this.m_reload_timeout);
		this.m_reload_timeout	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			internal function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Load the playlist from the m_playlist_uri
 */
neoip.playlist_loader_t.prototype._load_playlist_now	= function()
{
	// log to debug
	
	// delete the timeout if needed
	if( this.m_reload_timeout ){
		clearTimeout(this.m_reload_timeout);
		this.m_reload_timeout	= null;
	}	
	// load the data
	var playlist_str	= neoip.core.download_file_insync(this.m_playlist_uri, true);
	if( playlist_str == null ){
		var retry_delay	= 10*1000;	// TODO make this tunable
		
		this.m_reload_timeout	= setTimeout(neoip.basic_cb_t(this._reload_timeout_cb, this)
								, retry_delay);
		return;
	}

	// build the playlist_t
	var playlist	= new neoip.playlist_t(playlist_str);
	// init the reload timeout if needed
	if( playlist.reload_delay() ){
		this.m_reload_timeout	= setTimeout(neoip.basic_cb_t(this._reload_timeout_cb, this)
						, playlist.reload_delay());
	}
	// update the playlist in the player 
	// - NOTE: this MUST be the last thing done in this function
	//   - it allows the callback to destroy this object
	this._notify_callback("new_playlist", { "playlist" : playlist });			
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			timeout callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The timeout callback
 */
neoip.playlist_loader_t.prototype._reload_timeout_cb	= function()
{
	// simply forward to load_playlist_now
	this._load_playlist_now();
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Main callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The flash plugin event callback
 */
neoip.playlist_loader_t.prototype._notify_callback	= function(event_type, arg)
{
	// log to debug
	//
	
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

/** \brief constructor for a playlist_loader_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.playlist_loader_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(event_type, arg) {
			fct.call(scope, this, userptr, event_type, arg);
		};
}


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

/** \brief the track_t for each track of the playlist_t
 */
neoip.plistarr_t = function(json_str)
{
	// create an empty item_arr
	this.m_item_arr	= new Array();
	// parse the json_data if provided
	if( json_str )	this._from_json(json_str);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Parsing function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Parse the json_str
 */
neoip.plistarr_t.prototype._from_json = function(json_str)
{
	// TODO to do eval on json as if if were javascript cause some security issue
	// - IIF the json string is untrusted tho. aka not coming from the same site
	// - some json only parser are available in http://json.org
	// - an additionnal dependancy
	var json_data		= eval('(' + json_str + ')');
	
	// go thru all the json_data
	for(var i = 0; i < json_data.length; i++){
		// create a new item
		var item	= new this.item_t(json_data[i]);
		// put it in the m_item_arr
		this.m_item_arr.push(item);
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// declare all the methods to read the variables
neoip.plistarr_t.prototype.item_arr	= function()	{ return this.m_item_arr;	}

// 
// this script implement a plistarr_t.item_t for the player_t
// 

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief the track_t for each track of the playlist_t
 */
neoip.plistarr_t.prototype.item_t = function(json_data)
{
	// parse the json_data if provided
	if( json_data )		this._from_json(json_data);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Parsing function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Parse the track_t from track element of a jspf playlist
 */
neoip.plistarr_t.prototype.item_t.prototype._from_json = function(json_data)
{
	this.m_json_data	= json_data;
	
	// sanity check - the produced item_t MUST be valid
	this.check();
}

/** \brief Check that the item_t is valid
 * 
 * - if it is not valid an exception will be thrown
 */
neoip.plistarr_t.prototype.item_t.prototype.check = function()
{
	if( typeof(this.m_json_data['playlist_title']) != "string" )	throw("playlist_title is NOT a string");
	if( typeof(this.m_json_data['playlist_uri']) != "string" )	throw("playlist_uri is NOT a string");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// declare all the methods to read the variables
neoip.plistarr_t.prototype.item_t.prototype.playlist_title	= function()
				{ return this.m_json_data['playlist_title'];	}
neoip.plistarr_t.prototype.item_t.prototype.playlist_uri	= function()
				{ return this.m_json_data['playlist_uri'];	}
neoip.plistarr_t.prototype.item_t.prototype.external_dep	= function()
				{ return this.m_json_data['external_dep'];	}


/** \brief Return true if this item_t is playable, false otherwise
 *
 * - is_playable() == does the external_dep fully satisfied
 */
neoip.plistarr_t.prototype.item_t.prototype.is_playable		= function()
{
	// if no external_dep is specified, it is playable by default
	if( this.external_dep() == null )		return true;
	// return false, if it is not playable for 'oload'
	if( this._is_not_playable_suffix('oload') )	return false;
	// return false, if it is not playable for 'casto'
	if( this._is_not_playable_suffix('casto') )	return false;
	// return true if all previous tests passed
	return true;
}

/** \brief Return true if this item_t IS NOT playable, false otherwise
 *
 * - is_playable() == does the external_dep fully satisfied
 */
neoip.plistarr_t.prototype.item_t.prototype.is_not_playable	= function()
{
	return !this.is_playable();
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return true if this item_t IS playable for a neoip-apps suffix, false otherwise
 */
neoip.plistarr_t.prototype.item_t.prototype._is_playable_suffix	= function(apps_suffix)
{
	if( this.external_dep() == null )				return true;
	if( this.external_dep()[apps_suffix] == null )			return true;
	if( this.external_dep()[apps_suffix]['required'] != true )	return true;
	if( neoip.apps_present(apps_suffix) )				return true;
	return false;
}

/** \brief Return true if this item_t IS NOT playable for a neoip-apps suffix, false otherwise
 */
neoip.plistarr_t.prototype.item_t.prototype._is_not_playable_suffix	= function(apps_suffix)
{
	return !this._is_playable_suffix(apps_suffix);
}


/*! \file
    \brief Definition of the neoip.subplayer_t

\par Brief Description
This object implement the callback object for the neoip.subplayer_t
- if a callback is specified, it MUST be of neoip.subplayer_cb_t type

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			subplayer_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a subplayer_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.subplayer_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(event_type, arg) {
			fct.call(scope, this, userptr, event_type, arg);
		};
}


/*! \file
    \brief Definition of the subplayer_vlc_t

\par Notes
- for doc about the vlc mozilla plugin:
 - http://www.videolan.org/doc/play-howto/en/ch04.html#id293992

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
neoip.subplayer_vlc_t = function(p_plugin_id, p_clisrv_diffdate)
{
	// copy the parameters
	this.m_plugin_id	= p_plugin_id;
	this.m_clisrv_diffdate	= p_clisrv_diffdate;
	// zero some fields
	this.m_callback		= null;
	this.m_trackidx		= null;
	this.m_start_time	= null;
	this.m_current_state	= null;
	this.m_plugin_abstime	= null;

	// some value for the event feature
	// - TODO make those values tunable
	// - TODO experiment to determine what are good defaults
	this.m_event_period	= 1*1000;
	this.m_event_timeout	= null;
}

/** \brief destructor of the object
 */
neoip.subplayer_vlc_t.prototype.destructor = function()
{
	// TODO to destruct the object
	// - especially the timeout
	// - and likely other thing
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Time handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the present date
 *
 * - adjusted by m_clisrv_diffdate thus all client get the same 'present_date'
 */
neoip.subplayer_vlc_t.prototype._server_date = function()
{
	// get the current client date
	var mydate	= new Date();
	// update it to reflect the server date
	mydate.setTime( mydate.getTime() - this.m_clisrv_diffdate);
	// return the result
	return mydate;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief get the callback
 */
neoip.subplayer_vlc_t.prototype.callback = function(p_callback)
{
	// copy the parameter
	this.m_callback	= p_callback;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the current state
 */
neoip.subplayer_vlc_t.prototype.current_state	= function()
{
	return this.m_current_state;
}

/** \brief Return the current track_pos for the subplayer
 */
neoip.subplayer_vlc_t.prototype.current_track_pos	= function()
{
	// build the track_pos
	var track_pos	= {	"trackidx"	: this.m_trackidx,
			 	"track_reltime"	: this.track_reltime() };
	// if the track_reltime can not be established, return null
	if( track_pos.track_reltime == null )	return null;
	// return the track_pos
	return track_pos;
}

/** \brief Return the time relative to the begining of this track
 */
neoip.subplayer_vlc_t.prototype.track_reltime	= function()
{
	// if this.m_reltime_begdate is not null, report the track_reltime according to it
	if( this.m_reltime_begdate )	return this._server_date() - this.m_reltime_begdate;

	// NOTE: if this.m_reltime_begdate is null, report according to the plugin value
	
	// if no absolute_time has been set, return null
	if( this.m_plugin_abstime == null )	return null;
	// if the current_state is not playing, return null
	if( this.m_current_state != "playing" )	return null;
	// return the time relative this the begining of this track
	return this.m_plugin_abstime - this.m_start_time;
}
// declare all the methods to read the variables
neoip.subplayer_vlc_t.prototype.trackidx	= function(){ return this.m_trackidx;		}
neoip.subplayer_vlc_t.prototype.start_time	= function(){ return this.m_start_time;		}
neoip.subplayer_vlc_t.prototype.current_state	= function(){ return this.m_current_state;	}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			action function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Build the player
 */
neoip.subplayer_vlc_t.prototype.build_objembed	= function(p_container_id, p_width, p_height)
{
	var	html_str = "";
	// build the html object string
	html_str	+= '<object type="application/x-vlc-plugin"'
	html_str	+= 	' pluginspage="http://www.videolan.org/"'
	html_str	+= 	' version="VideoLAN.VLCPlugin.2"'
	html_str	+= ' width="'	+ p_width		+ '"';
	html_str	+= ' height="'	+ p_height		+ '"';
	html_str	+= ' id="'	+ this.m_plugin_id	+ '"';
	html_str	+= '>'
	html_str	+= '</object>'
	// log to debug
	//console.log(html_str)
	// write the html object string to the dest_id
	document.getElementById(p_container_id).innerHTML = html_str;
}


/** \brief Play the neoip.playlist_t.track_t with a delay_within
 */
neoip.subplayer_vlc_t.prototype.play	= function(p_track_pos, p_player)
{
	var playlist_track	= p_player.playlist().track_at(p_track_pos.trackidx);
	var track_uri		= playlist_track.cooked_uri();

	// sanity check - track_data MUST be non null
// TODO syntax error in that
//	
	
	// stop the current playing if any
	this.stop();
	

	// copy the parameters
	this.m_trackidx		= p_track_pos.trackidx;
	this.m_start_time	= playlist_track.start_time();

	
	// if the playlist_track.is_stream, then this.m_reltime_begdate is present, else is null
	// - this is used to determine the track_reltime. 
	// - in stream, the plugin track_reltime is not valid
	if( playlist_track.is_stream() )	this.m_reltime_begdate	= this._server_date();
	else					this.m_reltime_begdate	= null;

	// relaunch a new one
	var opt		= new Array();
	opt.push(":start-time=" + (this.m_start_time + p_track_pos.track_reltime));
// to reduce the delay of input caching by vlc in ms
	opt.push(":http-caching=50");
// to force vlc to fill the output window
//	opt.push(":crop");
	var plugin	= document.getElementById(this.m_plugin_id);
	plugin.playlist.add(track_uri, null, opt);
	plugin.playlist.play();

	// start the event_timeout
	this.m_event_timeout= setTimeout(neoip.basic_cb_t(this._event_timeout_cb, this)
							, this.m_event_period);
}

/** \brief Stop playing
 */
neoip.subplayer_vlc_t.prototype.stop	= function()
{
	var 	plugin	= document.getElementById(this.m_plugin_id);
	// zero some fields
	this.m_trackidx		= null;
	this.m_start_time	= null;
	this.m_current_state	= null;
	this.m_plugin_abstime	= null;
	this.m_reltime_begdate	= null;
	// stop the event_timeout if needed
	if( this.m_event_timeout ){
		clearTimeout( this.m_event_timeout );
		this.m_event_timeout	= null;
	}
	
	try {
		// if plugin is currently playing, stop it
		if( plugin.playlist.isPlaying )		plugin.playlist.stop();
		// if the plugin.playlist is is not empty, clear it
		if( plugin.playlist.tracks.count > 0 )	plugin.playlist.clear();
	}catch(e){
		
	}
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			event_timeout_cb
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The  event_timeout_cb
 */
neoip.subplayer_vlc_t.prototype.event_timeout_cb	= function()
{
	var 	plugin	= document.getElementById(this.m_plugin_id);

	/*************** handle the m_current_state update	***************/
	var	old_state	= this.m_current_state;
	var	new_state;
	if( plugin.input.state == 1 )		new_state	= "connecting";
	else if( plugin.input.state == 2 )	new_state	= "buffering";
	else if( plugin.input.state == 3 )	new_state	= "playing";
	else					new_state	= "unknown";
	// if the new state is different than m_current_state, update it
	if( new_state != this.m_current_state ){
		// update the m_current_state
		this.m_current_state	= new_state;
		// notify the caller if a callback is present
		if( this.m_callback ){
			var	arg = { old_state: old_state, new_state: new_state };
			this.m_callback("changed_state", arg);
		}
	}

	// if not playing, what to do !?!?!
	// - reset the value ?!?!
	if( !plugin.playlist.isPlaying )	return;
	

	/*************** handle the m_plugin_abstime update	***************/
	try {	// get the abs_pos within this track
		var abs_pos	= plugin.input.time;
	}catch(e){
		
		return;
	}
		
	// WORKAROUND: sometime vlc plugin report an abs_pos of 0 even with a start_time > 0
	// - so this workaround this bug
	if( abs_pos < this.m_start_time )	abs_pos	= this.m_start_time;
	// update the m_plugin_abstime
	this.m_plugin_abstime	= abs_pos;
	// notify the caller if a callback is present
	if( this.m_callback ){
		var	arg = { new_time: this.track_reltime()};
		this.m_callback("new_time", arg);
	}
	
	/*************** relaunch event_timeout	*******************************/
	this.m_event_timeout= setTimeout(neoip.basic_cb_t(this._event_timeout_cb, this)
							, this.m_event_period);
}



/*! \file
    \brief Definition of the subplayer_asplayer_t

\par Brief Description
This is a subplayer using my own flash object.

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
neoip.subplayer_asplayer_t = function(p_plugin_id, p_clisrv_diffdate)
{
	// copy the parameters
	this.m_plugin_htmlid	= p_plugin_id;
	this.m_clisrv_diffdate	= p_clisrv_diffdate;
	// zero some fields
	this.m_callback		= null;
	this.m_trackidx		= null;
	this.m_start_time	= null;
	this.m_current_state	= null;
	this.m_plugin_abstime	= null;
	// register this subplayer_asplayer_t to the neoip_subplayer_asplayer_cb_arr
	neoip_subplayer_asplayer_cb_doreg(this);
}

/** \brief destructor of the object
 */
neoip.subplayer_asplayer_t.prototype.destructor = function()
{
	// unregister this subplayer_asplayer_t to the neoip_subplayer_asplayer_cb_arr
	neoip_subplayer_asplayer_cb_unreg(this);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief get the callback
 */
neoip.subplayer_asplayer_t.prototype.callback = function(p_callback)
{
	// copy the parameter
	this.m_callback	= p_callback;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the current state
 */
neoip.subplayer_asplayer_t.prototype.current_state	= function()
{
	return this.m_current_state;
}

/** \brief Return the current track_pos for the subplayer
 */
neoip.subplayer_asplayer_t.prototype.current_track_pos	= function()
{
	// build the track_pos
	var track_pos	= {	"trackidx"	: this.m_trackidx,
			 	"track_reltime"	: this.track_reltime() };
	// if the track_reltime can not be established, return null
	if( track_pos.track_reltime == null )	return null;
	// return the track_pos
	return track_pos;
}

/** \brief Return the time relative to the begining of this track
 */
neoip.subplayer_asplayer_t.prototype.track_reltime	= function()
{
	// if this.m_reltime_begdate is not null, report the track_reltime according to it
	if( this.m_reltime_begdate )	return this._server_date().getTime() - this.m_reltime_begdate;

	// NOTE: if this.m_reltime_begdate is null, report according to the plugin value

	// if no absolute_time has been set, return null
	if( this.m_plugin_abstime == null )	return null;
	// return the time relative this the begining of this track
	return this.m_plugin_abstime - this.m_start_time;
}

// declare all the methods to read the variables
neoip.subplayer_asplayer_t.prototype.trackidx	= function(){ return this.m_trackidx;	}
neoip.subplayer_asplayer_t.prototype.start_time	= function(){ return this.m_start_time;	}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			action function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Build the player
 */
neoip.subplayer_asplayer_t.prototype.build_objembed = function(p_container_id, p_width, p_height)
{
	// TODO this require only the flash7... while it is rather advanced AS3... unlikely to be correct :)w
	var so		= new SWFObject("neoip_asplayer.swf", this.m_plugin_htmlid
					, p_width.toString(), p_height.toString()
					, "9", "#000000", true);
	// put the parameter to the flash plugin itself
	so.addParam("allowScriptAccess"	, "always");


	var allowfullscreen	= true;
	so.addParam("allowfullscreen"	, allowfullscreen ? "true" : "false");
	// mirror addParam "allowfullscreen" because unable to get addParam from as
	so.addVariable("allowfullscreen", allowfullscreen ? "true" : "false");  
	// put the variable for the flash program
	so.addVariable("jscallback_str"	, "neoip_subplayer_asplayer_plugin_cb");
	so.addVariable("jscallback_key"	, neoip_subplayer_asplayer_cb_build_key(this));
	// write the result in the html
	var succeed	= so.write(p_container_id);
	if( succeed )	return;
	
	// NOTE: at this point,  SWFObject failed to detect flash, so display something to warn the user
	var innerhtml	= "<table width='100%' height='100%' align='center'>"
				+ "<tr><td valign='middle' align='center'>"
					+ "<span style='color:red; font-size: larger;'>"
						+ "Flash required"
					+ "</span>"
					+ "<br/>"
					+ "<a href='http://get.adobe.com/flashplayer/' target='_blank'>download it</a>"
				+ "</td></tr>"
			+ "</table>";
	document.getElementById(p_container_id).innerHTML = innerhtml;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			function from player_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Play the neoip.playlist_t.track_t with a delay_within
 */
neoip.subplayer_asplayer_t.prototype.play	= function(p_track_pos, p_player)
{
	var playlist_track	= p_player.playlist().track_at(p_track_pos.trackidx);
	var plugin_track_arg	= {};
	var cooked_uri_arg	= {};
	// copy the parameters
	this.m_trackidx		= p_track_pos.trackidx;
	this.m_start_time	= playlist_track.start_time();

	// declare the variable to contain the time to seek in
	var seek_time	= null;
	
	// if the playlist_track.is_stream, then this.m_reltime_begdate is present, else is null
	// - this is used to determine the track_reltime. 
	// - in stream, the plugin track_reltime is not valid
	if( playlist_track.is_stream() ){
		seek_time		= null;
		this.m_reltime_begdate	= this._server_date().getTime() - p_track_pos.track_reltime;
	}else if( playlist_track.is_static() ){
		seek_time		= this.m_start_time + p_track_pos.track_reltime;
		this.m_reltime_begdate	= null;
	}else{
		
	}
	

if(1){	/*************** to enable or disable net_ratelim in flash	*******/
	// setup flash net_ratelim - if playlist_track.is_static and p_player.has_oload
	// TODO apparently this trigger a bug where no data get delivered by neoip-oload
	// - it is shown by web player trying to reconnect in the middle of the track 
	if( playlist_track.is_static() && p_player.has_oload() ){
		// - net_ratelim_t in neoip_asplayer.swf will issue the first xmlrpc
		//   set_httpo_maxrate immediatly after starting the NetStream.
		// - by the time for this set_httpo_maxrate to reach neoip-oload,
		//   neoip-oload will already have started downloading at full speed
		// - in order to limit this waste of bandwidth, an initial httpo_maxrate
		//   is set to a minimal value after a given threshold. 
		//   - 1k and not 0k because a bug in flash-player which is unable to close
		//     connection which doesnt send anything. details in neoip_net_ratelim.as 
		// - determination of the threshold
		//   - if ['oload']['static_filelen'] is not present, default to "500k"
		//   - it it is present, compute an average rate for the track
		//     and put the threshold at 5.0*1000 msec
		//   - this algo works IIF the duration of playlist_track is for the 
		//     whole file. aka IIF start_time is 0
		cooked_uri_arg['httpo_maxrate']		= "1k";
		if( playlist_track.static_filelen() != null && playlist_track.start_time()==0){
			var buffer_msec	= 5.0*1000;	// TODO this one should be tunable
			var filelen	= playlist_track.static_filelen();
			var duration	= playlist_track.duration();
			var threshold	= buffer_msec * (filelen / duration);
			cooked_uri_arg['httpo_maxrate_thres']	= Math.round(threshold);
		}else{
			cooked_uri_arg['httpo_maxrate_thres']	= "500k";
		}
		
		// add a "httpo_full_id" outter var in the cooked_uri for the track_uri
		cooked_uri_arg['httpo_full_id']= neoip.core.build_nonce_str(16);
		
		// build the net_ratelim_uri - to perform the oload_httpo_ctrl xmlrpc
		var net_ratelim_uri;
		net_ratelim_uri	= p_player.m_outter_uri_arr['oload'] + "/neoip_oload_httpo_ctrl_xmlrpc.cgi";
		net_ratelim_uri	= neoip.core.doscramble_uri(net_ratelim_uri);
		
		// tell the plugin to handle this track with net_ratelim
		plugin_track_arg['net_ratelim']= {	"key"	: cooked_uri_arg['httpo_full_id'],
							"uri"	: net_ratelim_uri };
	}
}

	// get the track_uri
	var track_uri			= playlist_track.cooked_uri(cooked_uri_arg);
	// compute the track_arg to pass to the plugin
	plugin_track_arg['content_url']	= track_uri;
	// if there is a playlist_track.video_aspect(), pass it to the asplayer
	if( playlist_track.video_aspect() )
		plugin_track_arg['video_aspect']	= playlist_track.video_aspect();

	
	
	
	


	if( seek_time > 0 ){
		// sanity check - if seek_time, playlist_track MUST be may_startinmid()
		console.assert( playlist_track.may_startinmid() );
		// sanity check - if track_abstime is > 0, playlist_track MUST be static
		console.assert( playlist_track.is_static() );
		
		// start updating track_arg to get the proper start_time
		plugin_track_arg['start_time']		= seek_time/1000;
		plugin_track_arg['rangereq_type']	= "flv";
		// determine the rangereq_flv_var according to the presence of neoip-oload
		if( p_player.has_oload() ){
			var flv_mdata_info	= playlist_track.extension()['flv_mdata_info'];
			// if it goes thru neoip-oload, use 'pos' by default
			plugin_track_arg['rangereq_flv_var']	= "pos";
			plugin_track_arg['flv_mdata_uri']	= playlist_track.flv_mdata_uri();
			if( flv_mdata_info ){
				plugin_track_arg['flv_mdata_type']	= flv_mdata_info['type'];
			}else{
				plugin_track_arg['flv_mdata_type']	= "internal";
			}
		}else{
			// if it goes directly to the location, use the proper meta
			// - TODO this name is way too long
			var varname	= playlist_track.meta()['location_rangereq_byuri_varname'];
			// sanity check - the varname MUST be specified
			
			// set the value into track_arg
			plugin_track_arg['rangereq_flv_var']	= varname;
		}
	}
	
	
	
	var plugin	= document.getElementById(this.m_plugin_htmlid)
	// sanity check - the plugin playlist MUST be empty
	console.assert( plugin.track_count() == 0 );	
	// add this track to the plugin
	plugin.track_add(plugin_track_arg, 0);
	// set the pluging as not playlist_loop
	// - it is never supposed to loop on its playlist
	plugin.playlist_loop(false);
	
	// set plugin smoothing to true
	// - TODO: is this the proper place. why is it hardcoded
	// - in anycase, just an experiment because smoothing trigger a bug in 
	//   flash-player plugin, and cause video.clear() to fails
	plugin.set_smoothing(true);
	
	// start playing
	plugin.playing_start();
}

/** \brief Stop playing
 */
neoip.subplayer_asplayer_t.prototype.stop	= function()
{
	var	plugin	= document.getElementById(this.m_plugin_htmlid)
	
	// stop playing
	plugin.playing_stop();
	// remove the current track from the plugin playlist
	plugin.track_del(0);
	// zero some fields
	this.m_trackidx		= null;
	this.m_start_time	= null;
	this.m_current_state	= null;
	this.m_plugin_abstime	= null;
	this.m_reltime_begdate	= null;
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Time handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the present date
 *
 * - adjusted by m_clisrv_diffdate thus all client get the same 'present_date'
 */
neoip.subplayer_asplayer_t.prototype._server_date = function()
{
	// get the current client date
	var mydate	= new Date();
	// update it to reflect the server date
	mydate.setTime( mydate.getTime() - this.m_clisrv_diffdate);
	// return the result
	return mydate;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			plugin_cb
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The flash plugin event callback
 */
neoip.subplayer_asplayer_t.prototype.plugin_cb	= function(event_type, arg)
{
	// log to debug
	//

	// parse the event_type 
	if( event_type == "state_change" ){
		var	old_state	= this.m_current_state;
		var	new_state	= arg.new_state;
		// if the new state is different than m_current_state, update it
		// - TODO unsure what to do when the track are switching from one another
		if( new_state != this.m_current_state ){
			// update the m_current_state
			this.m_current_state	= new_state;
			// notify the caller if a callback is present
			var cb_arg	= { old_state: old_state, new_state: new_state };
			this.notify_callback("changed_state", cb_arg);
		}
	}else if( event_type == "current_time"){
		// update the m_plugin_abstime
		this.m_plugin_abstime	= arg.time*1000;
		// notify the caller if a callback is present
		var cb_arg	= { new_time: this.track_reltime()};
		this.notify_callback("new_time", cb_arg);
	}else{	// simply forward the event
		this.notify_callback(event_type, arg);
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			flv_kframe_find	service
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief find a flv kframe byte offset
 * 
 * - NOTE: this function is specific to this flash player
 */
neoip.subplayer_asplayer_t.prototype.flv_kframe_find
				= function(wished_delay, mdata_type, src_uri, userptr)
{
	var	plugin	= document.getElementById(this.m_plugin_htmlid)
	// forward the function
	plugin.flv_kframe_find(wished_delay/1000, mdata_type, src_uri, userptr);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Main callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The flash plugin event callback
 */
neoip.subplayer_asplayer_t.prototype.notify_callback	= function(event_type, arg)
{
	// log to debug
	//
	
	// if no callback is defined, do nothing
	if( this.m_callback == null )	return;
	// forward the event to the callback
	this.m_callback(event_type, arg);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Global callback for subplayer flash_t
// - this global is dirty but this is a part of the flash plugin
// - It include a callback registration for each instance of subplayer_asplayer_t
//   to register and thus receives the event for itself.
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var neoip_subplayer_asplayer_cb_arr	= new Array();

function neoip_subplayer_asplayer_cb_build_key(subplayer)
{
	return "tag_" + subplayer.m_plugin_htmlid;
}
function neoip_subplayer_asplayer_cb_doreg(subplayer)
{
	var key	= neoip_subplayer_asplayer_cb_build_key(subplayer);
	// sanity check - this key MUST NOT already exists
	
	// register this subplayer into the neoip_subplayer_asplayer_cb_arr
	neoip_subplayer_asplayer_cb_arr[key]	= subplayer;
}

function neoip_subplayer_asplayer_cb_unreg(subplayer)
{
	var key	= neoip_subplayer_asplayer_cb_build_key(subplayer);
	// sanity check - this key MUST already exists
	
	// delete it from the array - aka make it null
	// - TODO to use a splice instead
	delete neoip_subplayer_asplayer_cb_arr[key];
}

function neoip_subplayer_asplayer_plugin_cb(key, event_type, arg)
{
	// log to debug
	//
	// get the subplayer_t matching this key
	var subplayer	= neoip_subplayer_asplayer_cb_arr[key];
	// sanity check - the subplayer MUST exist
	
	// notify the subplayer of the event
	subplayer.plugin_cb(event_type, arg);
};


/*! \file
    \brief Definition of the player_t

\par Brief Description
neoip.player_t is able to player neoip.playlist_t and use various neoip.subplayer_t

\par TODO
- the resync feature is sketched but not tested
- apparently resync is triggered a LOT with the subplayer_vlc_t when it is isnt on screen
  - likely a vlc plugin bug related to having focus or not
- to rename all the outter_uri into webdetect_uri
  - in the player_t stuff and elsewhere
  - outter_uri is only for nested_uri in neoip-oload

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor of the player_t
 */
neoip.player_t = function(p_subplayer, p_clisrv_diffdate, p_callback)
{
	// copy the parameter
	this.m_subplayer	= p_subplayer;
	this.m_clisrv_diffdate	= p_clisrv_diffdate;
	this.m_callback		= p_callback;
	// set the player_t backpointer in the m_subplayer
	this.m_subplayer.callback(neoip.subplayer_cb_t(this.subplayer_cb, this));
	// zero some fields
	this.m_playlist		= null;
	this.m_outter_uri_arr	= new Array();
	this.m_prefetcher_arr	= new Array();
	
	this.m_curtrack_timeout	= null;	
	this.m_is_playing	= false;

	this.m_prefetch_timeout	= null;	

	// some value for the resync feature
	// - TODO make those values tunable
	//   - by player_t or by playlist ?
	// - TODO experiment to determine what are good defaults
	this.m_resync_period	= 1.0;
	this.m_resync_threshold	= 30*1000;
	this.m_resync_timeout	= null;
}

/** \brief Destructor of player_t
 */
neoip.player_t.prototype.destructor = function()
{
	// TODO to code
	
	// if player_t is_playing(), stop it
	if( this.is_playing() )	this.playing_stop();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Time handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the present date
 *
 * - adjusted by m_clisrv_diffdate thus all client get the same 'present_date'
 */
neoip.player_t.prototype._server_date = function()
{
	// get the current client date
	var mydate	= new Date();
	// update it to reflect the server date
	mydate.setTime( mydate.getTime() - this.m_clisrv_diffdate);
	// return the result
	return mydate; 
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			curtrack stuff
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start a curtrack
 */
neoip.player_t.prototype._curtrack_start = function(track_pos)
{
	// alias on the playlist_track
	var playlist_track	= this.m_playlist.track_at([track_pos.trackidx]);

	// log to debug
	

	// if the playlist_track is_static, provide the start_time
	this.m_subplayer.play(track_pos, this);

	// launch the timeout to expire at the end of this track
	var delay_remain	= playlist_track.duration() - track_pos.track_reltime;
	
	
	this.m_curtrack_timeout	= setTimeout(neoip.basic_cb_t(this._curtrack_timeout_cb, this)
							, delay_remain);
}

/** \brief Stop a curtrack
 */
neoip.player_t.prototype._curtrack_stop = function()
{
	// log to debug
	console.info("enter trackidx=" + this.m_subplayer.trackidx());

	// stop the m_curtrack_timeout
	
	clearTimeout( this.m_curtrack_timeout );
	this.m_curtrack_timeout	= null;

	// stop the prefetch
	// - NOTE: may happen if subplayer never reached to 'playing' state on track
	//   and thus its player_t.prefetcher_t never got stopped.
	this._prefetch_try_stop(this.m_subplayer.trackidx());

	// notify the subplayer to play this one now
	this.m_subplayer.stop();
}


/** \brief callback for the m_curtrack_timeout
 */
neoip.player_t.prototype._curtrack_timeout_cb	= function()
{
	var	next_trackidx	= this.m_subplayer.trackidx() + 1;
	// sanity check - the player_t MUST be is_playing()
	console.assert( this.is_playing() );
	// stop the curtrack
	this._curtrack_stop();

	// if the next_trackidx cause the playlist_t to loop
	if( next_trackidx >= this.m_playlist.trackidx_end() ){
		// if playlist_t can't loop stop completly
		if( this.m_playlist.may_loop() == false ){
			
			console.info("trackidx_end=" + this.m_playlist.trackidx_end());
			console.info("trackidx_beg=" + this.m_playlist.trackidx_beg());
			 // likely other things to do
			return;
		}
		// sanity check - if m_track_firstidx MUST be equal to this.m_playlist.trackidx_end()
		console.assert( next_trackidx == this.m_playlist.trackidx_end() );
		// warparound the trackidx to the begining of the playlist
		next_trackidx	= this.m_playlist.trackidx_beg();
	}

	// log to debug
	
	// get the track_pos for the next track
	// - NOTE: track_reltime: is explicitly set to 0 to ensure no seek at the begining
	var	track_pos	= { trackidx: next_trackidx, track_reltime: 0 };
	// start the curtrack
	this._curtrack_start(track_pos);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			prefetch stuff
// - TODO put that in its own file
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Initial prefetch
 *
 * - TODO this function has a poor nameing
 *   - should it be private/public ?
 * - Start prefetch the playlist_t.track_t to play 
 * - this function is intended to be used before the player_t started playing
 * - USE CASE: when the browser read the page, it start prefetching immediatly
 *   so when the user actually asks to play, the track has been prefetched 
 *   reducing the initialization latency and so improving the 
 */
neoip.player_t.prototype._prefetch_initial	= function()
{
	// get the current position from the playlist_t - the theorical one
	var	curtrack_pos	= this.m_playlist.current_track_pos(this._server_date());
	// sanity check - the player_t MUST NOT be is_playing()
	console.assert( !this.is_playing() );

	// TODO what is curtrack_pos.track_reltime is non 0...
	// start a prefetch on this one
	this._prefetch_try_start(curtrack_pos);
}

/** \brief init all the prefetch
 *
 * - TODO to handle the m_prefetch_timeout
 */
neoip.player_t.prototype._prefetch_reinit_full	= function()
{
	// take the time from the playlist_t
	// - NOTE: this is directly in relation when the next track will start playing
	// - so it is tiedly related to how the inter track transition is done
	// - currently this is done solely by the playlist_t time
	var curtrack_pos	= this.m_playlist.current_track_pos(this._server_date());

	// log to debug
	

	// stop the prefetch_timeout if needed
	if( this.m_prefetch_timeout ){
		clearTimeout( this.m_prefetch_timeout );
		this.m_prefetch_timeout	= null;
	}

	// alias on the playlist_t.track_t
	var	curtrack	= this.m_playlist.track_at(curtrack_pos.trackidx);
	// compute the present/now moment relative to the playlist_t.base_date()	
	var	cur_base_time	= curtrack.base_reltime() + curtrack_pos.track_reltime;

	// to get the delay before the next prefetch
	var	timeout_delay	= Number.MAX_VALUE;

	// go thru each playlist_t.track_t of this.m_playlist
	for(var i = this.m_playlist.trackidx_beg(); i != this.m_playlist.trackidx_end(); i++){
		var	playlist_track	= this.m_playlist.track_at(i);
// log to debug
//console.info("playlist_track:" + " trackidx="	+ playlist_track.trackidx() 	);
//console.info("playlist_track:" + " duration="	+ playlist_track.duration() 	);
//console.info("playlist_track:" + " title="	+ playlist_track.title()	);

		// if this playlist_track is NOT prefetchable(), goto the next
		if( !playlist_track.prefetchable() )	continue;

		// if this playlist_track is prefetchable now, start a prefetch for it
		// - it is up to _prefetch_start to detect already started prefetch
		if( playlist_track.prefetchable_at(cur_base_time) ){
//
			this._prefetch_try_start({trackidx: playlist_track.trackidx()
						, track_reltime: 0});
			continue;
		}

		// NOTE: at this point, playlist_track is not to be prefetched now

		// compute the amount of time between now and this playlist_track start playing
		var start_base_time	= playlist_track.base_reltime() - playlist_track.prefetch_delay();
//
		// handle special case if start_base_time is before current time
		if( start_base_time < cur_base_time ){
			// if playlist.may_not_loop, goto the next -it wont be prefeteched ever
			if( this.m_playlist.may_not_loop() )	continue;
			// update start_base_time to reflext the time
//console.info("total_duration=" + this.m_playlist.total_duration());
			start_base_time	+= this.m_playlist.total_duration();
		}
		// compute the delay before triggering the next prefetch
//
//
//
		timeout_delay	= Math.min(timeout_delay, start_base_time - cur_base_time);
		
//
		
		// NOTE: it is NOT up to this function to stop any prefetch
	}
	
	// launch the m_prefetch_timeout to expire when the next prefetch it to be started
	if( timeout_delay != Number.MAX_VALUE ){
		// log to debug
		
		// sanity check - timeout_delay MUST be > 0
		
		// launch the timeout itself
		this.m_prefetch_timeout	= setTimeout(neoip.basic_cb_t(this._prefetch_reinit_full, this)
							, timeout_delay);
	}
	
}

/** \brief Start prefetching this trackidx in the current playlist_t
 */
neoip.player_t.prototype._prefetch_try_start = function(track_pos)
{
	var trackidx	= track_pos.trackidx;
	// if already in prefetching, do nothing
	if( this.m_prefetcher_arr[trackidx] )	return;
	// create a prefetcher_t for this track_pos
	var prefetcher	= new neoip.prefetcher_t(track_pos, this);
	// put the prefetcher in the m_prefetcher_arr at the trackidx position
	this.m_prefetcher_arr[trackidx]	= prefetcher;
}

/** \brief Stop prefetching this trackidx in the current playlist_t
 */
neoip.player_t.prototype._prefetch_try_stop = function(trackidx)
{
	// it no prefetcher for this trackidx, do nothing
	if( !this.m_prefetcher_arr[trackidx] )	return;
	// create an alias on this prefetcher_t
	var prefetcher	= this.m_prefetcher_arr[trackidx];
	// delete it from the array
	this.m_prefetcher_arr.splice(trackidx, 1);
	// destruct the prefetcher
	prefetcher.destructor();
	prefetcher	= null;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			resync stuff
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Resync the subplayer if needed
 */
neoip.player_t.prototype._resync_if_needed = function()
{
	// restart the resync_timeout
	this.m_resync_timeout	= setTimeout(neoip.basic_cb_t(this._resync_if_needed, this)
							, this.m_resync_period);
		
	// get the track_pos for the playlist and for the subplayer
	var	playlist_track_pos	= this.m_playlist.current_track_pos(this._server_date());
	var	subplayer_track_pos	= this.m_subplayer.current_track_pos();

	// if the subplayer is unable to provide an track_pos, do nothing and return now
	// - TODO it is unclear why it would be unable to provide an track_pos
	//   - but the knowledge on the vlc plugin is very unknown
	if( subplayer_track_pos == null )	return;
		
	// alias the playlist_t.track_t
	var	playlist_track	= this.m_playlist.track_at(playlist_track_pos.trackidx);
	var	subplayer_track	= this.m_playlist.track_at(subplayer_track_pos.trackidx);
	
	// compute the base_time of each track_pos
	var	playlist_base_time	= playlist_track.base_reltime() + playlist_track_pos.track_reltime;
	var	subplayer_base_time	= subplayer_track.base_reltime() + subplayer_track_pos.track_reltime;

// TODO what if the track is stream ? no resync here
	
	// TODO BUG BUG BUG
	// - if the subplayer practical time is at the end of the playlist 
	// - but the theorical time is now at the begining of the playlist
	// - the jitter will be close to the whole duration of the playlist....
	// - causing unneeded resync action
	// - TODO find a formula to include this
	
	// TODO BUG BUG
	// - another bug is in subplayer_jwplayer_t which report playing the 
	//   begining of the track while it is supposed to seek at a start_time
	//   in the middle of the movie
	
	// compute the delta_sync - abs of difference between playlist/subplayer base_time
	var	delta_sync	= Math.abs(playlist_base_time - subplayer_base_time);
	// log to debug
	//console.info("delta_sync=" + delta_sync.toFixed(2) + "-sec")
	
	// if the delta_sync is less than m_resyn_threshold, do nothing
	if( delta_sync < this.m_resync_threshold )	return;
	
	// log to debig
	console.error("NEEDS RESYNC! delta_sync=" + (delta_sync/1000).toFixed(2) + "-sec");
	
	

// TODO disable resync - just during debug - to remove
return;
	// relaunch a _play_current
	this._curtrack_stop();
	// launch a _curtrack_start
	this._curtrack_start(playlist_track_pos);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			subplayer_cb
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief The subplayer_cb called every time the subplayer has event to notify
 */
neoip.player_t.prototype.subplayer_cb	= function(notifier_obj, userptr, event_type, arg)
{
	// log to debug
	//

	// if m_subplayer just became "playing", _prefetch_try_stop for this trackidx
	if( event_type == "changed_state" && arg.new_state == "playing" )
		this._prefetch_try_stop(this.m_subplayer.trackidx());

// TODO to reenable - currently the stuff it too bugged to be trusted	
//	// if m_subplayer just became "playing", do a _prefetch_reinit_full
	if( event_type == "changed_state" && arg.new_state == "playing" )
		this._prefetch_reinit_full();

	// if a event_type == "flv_kframe_find_cb" notify a result back to javascript
	if( event_type == "flv_kframe_find_cb" ){
		var trackidx	= arg.userptr;	// userptr is set to the trackidx
		var prefetcher	= this.m_prefetcher_arr[trackidx];
		// if the triggering prefetcher is still here, forward the result
		if( prefetcher)	prefetcher.flv_kframe_find_cb(arg);
	}

	
	// forward the event to the player_cb_t
	if( this.m_callback )	this.m_callback(event_type, arg);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			public function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Set the playlist
 */
neoip.player_t.prototype.playlist = function(new_playlist)
{
	// if there are no parameter, return the current playlist
	if( !new_playlist )	return this.m_playlist;

	// backup the current this.m_playlist
	// - NOTE: old_playlist may be null
	var old_playlist	= this.m_playlist

	/*************** determine if player_t is restartable	***************/
	var restartable		= false;
	// if both playlist_t are not of the same instance, then it should be restarted
	if( old_playlist && old_playlist.same_instance_as(new_playlist) == false ){
		restartable	= true;
	}
	// if the subplayer.trackidx() is not in new_playlist, then 
	if( new_playlist.contain_trackidx(this.m_subplayer.trackidx()) == false ){
		restartable	= true;
	}
	// if the player_t is not playing, it is not restartable
	if( this.is_not_playing() )	restartable	= false;
	
	/*************** do restart the player_t	***********************/
	// stop playing with the old_playlist - if restartable
	// NOTE: this allow to get proper stopping notification in the callback
	if( restartable )	this.playing_stop();
	// set the new_playlist as the current one
	this.m_playlist		= new_playlist;
	this.m_playlist.set_outter_uri_arr(this.m_outter_uri_arr);
	// restart playing with the new current playlist  - if restartable
	if( restartable )	this.playing_start();
	
	// return the playlist
	return this.m_playlist;
}

/** \brief Return the practical trackidx within the subplayer
 *
 * - WARNING: the player_t MUST be playing
 */
neoip.player_t.prototype.practical_trackidx	= function()
{
	// sanity check - player_t MUST be in is_playing()
// TODO to check - apparently i use them in player_cb_t and there is a race in which it is not
//	console.assert( this.is_playing() );
	// return the m_subplayer.trackidx
	return this.m_subplayer.trackidx();
}

/** \brief Return the practical track_reltime for the subplayer
 *
 * - WARNING: if subplayer is unable to return the track_reltime, it may return null
 * - WARNING: the player_t MUST be playing
 */
neoip.player_t.prototype.practical_reltime	= function()
{
	// sanity check - player_t MUST be in is_playing()
// TODO to check - apparently i use them in player_cb_t and there is a race in which it is not
//	console.assert( this.is_playing() );
	// get the track_reltime from the subplayer_t - the practical one
	return this.m_subplayer.track_reltime();
}

/** \brief Return the current state from the subplayer
 *
 * - WARNING: if subplayer is unable to return the current_state, it may return null
 * - WARNING: the player_t MUST be playing
 */
neoip.player_t.prototype.practical_state		= function()
{
	// sanity check - player_t MUST be in is_playing()
// TODO to check - apparently i use them in player_cb_t and there is a race in which it is not
//	console.assert( this.is_playing() );
	// get the track_reltime from the subplayer_t - the practical one
	return this.m_subplayer.current_state();
}

/** \brief Set the oload_outter_uri
 */
neoip.player_t.prototype.set_outter_uri	= function(p_apps_suffix, p_outter_uri)
{
	// log to debug
	//
	// copy the value
	this.m_outter_uri_arr[p_apps_suffix]	= p_outter_uri;
	// notify the playlist_t of the change
	if( this.m_playlist )	this.m_playlist.set_outter_uri_arr(this.m_outter_uri_arr);
}

neoip.player_t.prototype.has_oload	= function(){ return this.m_outter_uri_arr.oload != null;	}
neoip.player_t.prototype.has_casto	= function(){ return this.m_outter_uri_arr.casto != null;	}

/** \brief Return true if the player is currently playing, false otherwise
 */
neoip.player_t.prototype.is_playing	= function()	{ return this.m_is_playing;	}
neoip.player_t.prototype.is_not_playing	= function()	{ return !this.is_playing();	}


/** \brief Start playing
 */
neoip.player_t.prototype.playing_start = function()
{
	// sanity check - the playlist MUST be set
	
	// if it is already playing, do nothing and return now
	if( this.is_playing() )	return;
	
	// set this.m_is_playing to true
	this.m_is_playing	= true;
	
	// get the theorical track_pos
	var track_pos	= this.m_playlist.current_track_pos_wseek(this._server_date());
	// launch a _curtrack_start
	this._curtrack_start(track_pos);

	// start the resync_timeout
if( 0 ){	// TODO to reenable later
	this.m_resync_timeout	= setTimeout(neoip.basic_cb_t(this._resync_if_needed, this)
						, this.m_resync_period);
}
}

/** \brief Stop Playing
 */
neoip.player_t.prototype.playing_stop = function()
{
	// stop all the prefetcher_t
	// - NOTE: done before testing is_playing, as prefetching may happen when not playing
	for(trackidx in this.m_prefetcher_arr)	this._prefetch_try_stop(trackidx)

	// if it is already NOT playing, do nothing and return now
	if( !this.is_playing() )	return;

	// set this.m_is_playing to false
	this.m_is_playing	= false;
	
	// stop the curtrack
	this._curtrack_stop();

	// stop the prefetch_timeout if needed
	if( this.m_prefetch_timeout ){
		clearTimeout( this.m_prefetch_timeout );
		this.m_prefetch_timeout	= null;
	}
}



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			player_cb_t
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief constructor for a player_ctrl_cb_t
 *
 * - see http://www.dustindiaz.com/javascript-curry/ for principle description 
 */
neoip.player_cb_t	= function(fct, p_scope, userptr) 
{
	var	scope	= p_scope || window;
	return	function(event_type, arg) {
			fct.call(scope, this, userptr, event_type, arg);
		};
}

/*! \file
    \brief Definition of the player_wikidbg_t

\par Brief Description
neoip.player_wikidbg_t provides various wikidbg keyword in order to debug
the neoip.player_t.

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
neoip.player_wikidbg_t	= function(){}

// create player_wikidbg_t as an object with only static functions
neoip.player_wikidbg	= new neoip.player_wikidbg_t();


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			wikidbg
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief main callback for wikidbg
 */
neoip.player_wikidbg_t.prototype.main_cb	= function(cb_obj, keyword, dom_elem)
{
	// if dom_elem is a string, then it is the html_id for the actual dom element
	if( typeof(dom_elem) == "string")	dom_elem = document.getElementById(dom_elem);
	// delete the all subelem of dom_elem
	neoip.wikidbg_subelem_delete(dom_elem);
	// create a neoip.wikidbg_elem_t to ease the building
	var root_elem	= new neoip.wikidbg_elem_t(dom_elem);
	
	// handle the wikidbg according to the keyword
	if( keyword == "page" ){
		return this._page_cb		(cb_obj, keyword, root_elem);
	}else if( keyword == "prefetch" ){
		return this._prefetch_cb	(cb_obj, keyword, root_elem);
	}else if( keyword == "admin" ){
		return this._admin_cb		(cb_obj, keyword, root_elem);
	}else{
		throw "unknown keyword " + keyword;
	}	
}

/** \brief wikidbg callback for keyword "page"
 */
neoip.player_wikidbg_t.prototype._page_cb	= function(player, keyword, root_elem)
{
	// create the table_elem
	var table_elem	= root_elem.table().tbody();
	// fillup the table
	table_elem.clone().tr().td()	.bold("Title")
			.up(2).td()	.text(": " + "wow super title");
	table_elem.clone().tr().td()	.bold("State")	
			.up(2).td()	.text(": " + "wow super state");
}

/** \brief wikidbg callback for keyword "prefetch"
 */
neoip.player_wikidbg_t.prototype._prefetch_cb	= function(player, keyword, root_elem)
{
	// create the table_elem
	var ol_elem	= root_elem.ol();
	
	// loop over all the pending prefetcher_t
	for(var trackidx in player.m_prefetcher_arr){
		var prefetcher	= player.m_prefetcher_arr[trackidx];

		// fillup the table
		var table_elem	= ol_elem.clone().li().table().tbody();
		// fillup the table
		table_elem.clone().tr().td()	.bold("track idx")	
				.up(2).td()	.text(": " + trackidx);
		table_elem.clone().tr().td()	.bold("track pos")	
				.up(2).td()	.text(": idx:"	+ prefetcher.m_track_pos.trackidx)
				.up(1)		.text("  reltime:" + prefetcher.m_track_pos.track_reltime);
		table_elem.clone().tr().td()	.bold("mdata_uri")	
				.up(2).td()	.text(": " + prefetcher.m_mdata_uri);
		table_elem.clone().tr().td()	.bold("track_uri")
				.up(2).td()	.text(": " + prefetcher.m_track_uri);
	}
}

/** \brief wikidbg callback for keyword "admin"
 */
neoip.player_wikidbg_t.prototype._admin_cb	= function(player, keyword, root_elem)
{
	// get some info from the player
	var	trackidx	= player.practical_trackidx();
	var	track_reltime	= player.practical_reltime();
	var	track_state	= player.practical_state();
	var	playlist_track	= player.playlist().track_at(trackidx);
	
	// determine the title
	var	title	= "undefined";
	if( playlist_track.title() )	title	= playlist_track.title();

	// compute the position string
	var	pos_str	= '';
	if( track_reltime ){
		pos_str += (track_reltime/1000).toFixed(2) + "-sec";
		pos_str += " - ";
		pos_str += (100.0 * track_reltime/playlist_track.duration()).toFixed(0) + "%";
		pos_str += " of total ";
	}else{
		pos_str += "position unknown but total "
	}
	pos_str +=( playlist_track.duration()/1000).toFixed(2) + "-sec";

	// create the table_elem
	var table_elem	= root_elem.table().tbody();
	// fillup the table
	table_elem.clone().tr().td().bold("Title")	.up(2).td().text(": " + title);
	table_elem.clone().tr().td().bold("State")	.up(2).td().text(": " + track_state);
	table_elem.clone().tr().td().bold("Position")	.up(2).td().text(": " + pos_str);
}






/*! \file
    \brief Definition of the prefetcher_t

\par Brief Description
neoip.prefetcher_t handles the prefetching of the track_t for player_t

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
neoip.prefetcher_t = function(m_track_pos, m_player)
{
	// copy the parameter
	this.m_track_pos	= m_track_pos;
	this.m_player		= m_player;
	// log to debug
	
	// get the playlist_track for the trackidx
	var playlist_track	= m_player.m_playlist.track_at(m_track_pos.trackidx);
	// prefetching is only valid when going thru neoip apps
	if( playlist_track.is_static() && !m_player.has_oload() )	return;
	if( playlist_track.is_stream() && !m_player.has_casto() )	return;
	// get the "flv_mdata" extension of this track
	var flv_mdata_info	= playlist_track.extension().flv_mdata_info;
	if( !flv_mdata_info )	flv_mdata_info = { "type": "internal"	};

	// get the outter_uri toward which sending the create/delete_prefetch xmlrpc
	var outter_uri;
	if( playlist_track.is_static())	outter_uri = m_player.m_outter_uri_arr.oload;
	if( playlist_track.is_stream())	outter_uri = m_player.m_outter_uri_arr.casto;

	// set the uri toward which sending the rpc
	this.m_rpc_uri	= outter_uri + "/neoip_uri_prefetch_jsrest.js";

	// compute the absolute time within the track
	var	track_abstime	= playlist_track.start_time() + m_track_pos.track_reltime;

	// create_prefetch specific for the mdata
	this.m_mdata_uri	= playlist_track.flv_mdata_uri({ "httpo_maxrate": "0k"	});
	// launch to debug
	
	// launch the create_prefetch for this.m_mdata_uri - with no callback
	new neoip.xdomrpc_t(this.m_rpc_uri, null, "create_prefetch", this.m_mdata_uri);

	// determine if it is possible to get the exact kframe byte position
	var	has_kframe_find	= m_player.m_subplayer.flv_kframe_find != null;
	// If subplayer has_kframe_find, and track_abstime > 0, do flv_kframe_find
	if( has_kframe_find && track_abstime > 0){
		m_player.m_subplayer.flv_kframe_find(track_abstime, flv_mdata_info.type
					, playlist_track.flv_mdata_uri(), m_track_pos.trackidx);
		// return now - create_prefetch on this.m_track_uri will be done in callback 
		return;
	}

	// get the cooked_uri for this playlist_track, with prefetching as true
	this.m_track_uri	= this._cpu_track_uri();

	// log to debug
	

	// launch the create_prefetch for this.m_track_uri - with no callback
	new neoip.xdomrpc_t(this.m_rpc_uri, null, "create_prefetch", this.m_track_uri);
}

/** \brief destructor
 */
neoip.prefetcher_t.prototype.destructor	= function()
{
	// log to debug
	//
	// launch the delete_prefetch - with no callback
	if( this.m_track_uri )	new neoip.xdomrpc_t(this.m_rpc_uri, null, "delete_prefetch", this.m_track_uri);
	if( this.m_mdata_uri )	new neoip.xdomrpc_t(this.m_rpc_uri, null, "delete_prefetch", this.m_mdata_uri);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			compute the uri
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the track_uri for the track_t, adding all specific outter_var
 */
neoip.prefetcher_t.prototype._cpu_track_uri	= function(outter_var)
{
	// get the playlist_track for the trackidx
	var playlist_track	= this.m_player.m_playlist.track_at(this.m_track_pos.trackidx);	
	// build the outter_var for playlist_track.cooked_uri
	var	tmp_var		= { "httpo_maxrate" : "0k" };
	for(var key in outter_var )	tmp_var[key] = outter_var[key];
	// call playlist_track.cooked_uri
	return	playlist_track.cooked_uri(tmp_var);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			flv_kframe_find_cb
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for the subplayer flv_kframe_find
 * 
 * - called by player_t which receive it from subplayer_cb
 */
neoip.prefetcher_t.prototype.flv_kframe_find_cb	= function(arg)
{
	// log to debug
		
	// sanity check - this.m_track_uri MUST NOT be set
	
	// If the operation "succeed", use its result
	if( arg.event_type == "succeed" ){
		// compute the this.m_track_uri - using the byte_offset	
		this.m_track_uri = this._cpu_track_uri({"subfile_byteoffset" : arg.result.byte_offset});
	}else{
		// compute the this.m_track_uri - fallback on the begining of the file	
		this.m_track_uri = this._cpu_track_uri();
	}
	// log to debug
	
	// launch the create_prefetch for this.m_track_uri - with no callback
	new neoip.xdomrpc_t(this.m_rpc_uri, null, "create_prefetch", this.m_track_uri);
}


/*! \file
    \brief Definition of the ezplayer_t

\par Brief Description
A bunch of function on top of neoip.player_t to really simplify the usage of it

\par List of cfgvar_arr
- onload_force_mute=boolean
  - if true force mute when loaded, no matter what previously saved preferences
  - if false, dont do anything
  - typical usage: this avoid to get a loud webpage when being loaded.
    - especially when the user doesnt explicitly asks for a player
    - typically when the player is included in a larger page

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
 * @param p_cfgvar_arr	array of all the configuration variable for this ezplayer_t
 */
neoip.ezplayer_t	= function(p_cfgvar_arr)
{
	// copy the parameters
	this.m_cfgvar_arr		= p_cfgvar_arr;
	
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

	// initilize the playlist_uri
	this.m_playlist_uri	= "../playlist.jspf/sample_static.playlist.jspf";
//	this.m_playlist_uri	= "../playlist.jspf/sample_stream.playlist.jspf";
//	this.m_playlist_uri	= "../playlist.jspf/sample_stream_static.playlist.jspf";
//	this.m_playlist_uri	= "../playlist.jspf/ntv002.playlist.jspf";
//	this.m_playlist_uri	= "../playlist.jspf/auto_bliptv.playlist.jspf";
//	this.m_playlist_uri	= "../playlist.jspf/bliptv_at_random.playlist.jspf";
//	this.m_playlist_uri	= "../playlist.jspf/youtube_featured_at_random.playlist.jspf";
//	this.m_playlist_uri	= "../playlist.jspf/youtube_tag_at_random.playlist.jspf";
//	this.m_playlist_uri	= "../playlist.jspf/youporn_at_random.playlist.jspf";

	// create a fake dummy 'unload' event_listener
	// - this is needed to get 'forward/backward' button in firefox 
	// - as explained in http://developer.mozilla.org/en/docs/Using_Firefox_1.5_caching
	//   firefox got a special cache for forward/backward which play funky with .js
	// - as a consequence the initialization of ezplayer doesnt work
	// - BUT if 'unload' event is listened on, it is not cached by the
	//   'forward/backward' firefox cache 
	neoip.core.dom_event_listener(window,"unload", function(){});
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
	
	// update the local value
	this.m_play_post_playlist	= value;
	// sanity check - the autobuffer and play_post_playlist feature are mutually exclusive
	 
}

/** \brief Allow to set the 'autobuffer' feature 
 * 
 * - MUST be done before start()
 */
neoip.ezplayer_t.prototype.autobuffer = function(value)
{
	// sanity check - the value MUST be a valid one
	
	// update the local value
	this.m_autobuffer	= value;
	// sanity check - the autobuffer and play_post_playlist feature are mutually exclusive
	 
}

/** \brief Allow to set the 'fullpage_state' 
 * 
 * - MUST be done before start() ?
 */
neoip.ezplayer_t.prototype.fullpage_state = function(value)
{
	// sanity check - the value MUST be a valid one
	
	// update the local value
	this.m_fullpage_state	= value;
}

/** \brief Allow to set the 'plistarr' - used to build the playlist in ezplayer_embedui_t
 *
 * - if prev_playlist_uri function param is specified, use this one.else use the cookie
 * - TODO make this plistarr read asynchronous
 *   - this plistarr is read in sync, which increase the latency of the start
 */
neoip.ezplayer_t.prototype.load_plistarr = function(plistarr_uri, prev_playlist_uri)
{
	// log to debug
	

	// setup the plistarr for ezplayer_t 
	var plistarr_str	= neoip.core.download_file_insync(plistarr_uri, true);
	this.m_plistarr		= new neoip.plistarr_t(plistarr_str);
	//

	// change the playlist
	// - if prev_playlist_uri function param is specified, use this one.
	// - if there is a "ezplayer_playlist_uri" cookie, use this one
	// - else pick the first of the this.m_plistarr
	if( !prev_playlist_uri )	prev_playlist_uri = neoip.core.cookie_read("ezplayer_playlist_uri");
	// if prev_playlist_uri != null, check if it is contained in this.m_plistarr
	if( prev_playlist_uri ){
		var not_found	= true;
		for(var i = 0; i < this.m_plistarr.item_arr().length; i++ ){
			var	item	= this.m_plistarr.item_arr()[i];
			if( item.playlist_uri() != prev_playlist_uri )	continue;
			not_found	= false;
			break;
		}
		if( not_found )	prev_playlist_uri = null;
	}
	// TODO what if there is no item in this.m_plistarr... there is a bug ?
	if( prev_playlist_uri )	ezplayer.change_playlist(prev_playlist_uri);
	else			ezplayer.change_playlist(this.m_plistarr.item_arr()[0].playlist_uri());
}


/** \brief Load the server_date from an uri
 *
 * - if this function is not called, the server date is assumed to have the 
 *   same as the client.
 */
neoip.ezplayer_t.prototype.set_server_date = function(server_date_epochms)
{
	// log to debug
	//

	// determine the client date
	var client_date	= new Date();

	// store the difference between the client and server date
	this.m_clisrv_diffdate	= client_date.getTime() - server_date_epochms;

	// log to debug
	//
}

/** \brief start the operation
 */
neoip.ezplayer_t.prototype.start = function()
{
	// log to debug
	//
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
	//
	// build the neoip.subplayer_t  - has it been tested
	if( this.m_subplayer_type == "vlc" ){
		var subplayer_fct_str	= "playlist.isPlaying";
		this.m_subplayer	= new neoip.subplayer_vlc_t(this.m_subplayer_html_id, this.m_clisrv_diffdate);
	}else if( this.m_subplayer_type == "asplayer" ){
		var subplayer_fct_str	= "track_count";
		this.m_subplayer	= new neoip.subplayer_asplayer_t(this.m_subplayer_html_id, this.m_clisrv_diffdate);
	}else{		}

	// determine the objembed size depending on this.m_fullpage_state
	// - TODO how does this fit in the embedui stuff?
	if( this.m_fullpage_state == "normal" ){
		var objembed_w	= "320";	// TODO hardcode value- bad
		var objembed_h	= "240";
	}else if( this.m_fullpage_state == "maximized" ){
		var objembed_w	= "100%";
		var objembed_h	= "100%";
	}else{		}	
	// build the objembed for this.m_subplayer
	this.m_subplayer.build_objembed('neoip_player_container_id', objembed_w, objembed_h);

	// start waiting for the browser to initialize the plugin
	this.m_objembed_initmon	= new neoip.objembed_initmon_t()
	this.m_objembed_initmon.start(this.m_subplayer_html_id, subplayer_fct_str
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
	 

	// if this.m_autobuffer is enabled, notify this.m_player
	// - TODO neoip.player_t._prefetch_initial is a VERY bad name for it. change it	
	if( this.m_autobuffer )		this.m_player._prefetch_initial();
	
	// if there is still a webpack_detect_t running, return now
	if( this.webpack_detect_running() )	return;
	
	// if there is no playlist, return now
	if( this.m_player.playlist() == null )	return;
	// if this.m_play_post_playlist is disabled, return now
	if( this.m_play_post_playlist == false)	return;
	
	// set this.m_play_post_playlist to false
	this.m_play_post_playlist	= false;

	// update the cookie 'ezplayer_playlist_uri'
	neoip.core.cookie_write("ezplayer_playlist_uri", this.m_playlist_uri, 30);
	
	// NOTE: here m_play_post_playlist is enabled and this.m_player is ready to start_playing

	// start playing
	this.playing_start();
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
	
	// destruct the existing neoip.playlist_loader_t if needed
	this._playlist_loader_dtor();	
	// init the playlist_loader for this playlist_uri
	this.m_playlist_loader = new neoip.playlist_loader_t(this.m_playlist_uri
			, neoip.playlist_loader_cb_t(this._neoip_playlist_loader_cb, this));
}

/** \brief destruct neoip.playlist_loader_t
 */
neoip.ezplayer_t.prototype._playlist_loader_dtor = function()
{
	// if no neoip.playlist_loader_t is running, return now 
	if( this._playlist_loader_running() == false )	return;
	// log to debug
	
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
	
	//
	
	// if this.m_player is not yet set, do nothing
	if( !this.m_player )	return;
		
	// sanity check - arg['playlist'] MUST exist
	
	// set the playlist in this.m_player
	this.m_player.playlist( arg['playlist'] );
	
	// if this.m_play_post_playlist is enable, see if it is possible to run it now
	if( this.m_play_post_playlist )	this._player_post_init();
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
	//	
	
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
	this.m_webpack_detect	= new neoip.webpack_detect_t(cb_fct);
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

neoip.ezplayer_t.prototype.cfgvar_arr	= function()	{ return this.m_cfgvar_arr;	}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			public function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief To change the playlist
 */
neoip.ezplayer_t.prototype.change_playlist	= function(p_playlist_uri)
{
	// delete the current playlist_loader if needed
	this._playlist_loader_dtor();
	// update the local playlist_uri
	this.m_playlist_uri	= p_playlist_uri;
	// EXPERIMENTAL track the playlist_uri change with googe analytic
	// TODO to test... not sure it works, or that it is symply at the proper place
	if( typeof(pageTracker) != "undefined" )	pageTracker._trackPageview('/' + this.m_playlist_uri);
	// if this.m_player is not yet initialized, return now
	if( !this.m_player )	return; 
	// init the playlist_loader for this playlist_uri
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
}

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
					"display_type"	: "mouse_over" 
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
					"display_type"	: "mouse_over"
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
					"type"		: "embedded",
					"location"	: "embed_pic_globe"
					},
			 	"base_sprite" : {
			 		"element_x"	: 0.0,
			 		"element_y"	: 0.5,
			 		"element_w"	: 0.08,
			 		"element_h"	: 0.0,
					"display_type"	: "mouse_over"
					}
				};
	// create the embedui_id_playlist_toggle IIF there is this.m_ezplayer.m_plistarr 
	if( this.m_ezplayer.m_plistarr ){
		plugin.embedui_create(embedui_opt);
	}
	
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
	
	// create the "embedui_id_track_title"
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
	plugin.embedui_delete("embedui_id_track_title");
	plugin.embedui_delete("embedui_id_status_line");
	// delete all the 'moving' embedui element
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
	//	
	
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
	}else if( event_type == "mouseWheel" || event_type == "click" ){
		if( plugin.getAttribute("width") == "100%" ){
			plugin.setAttribute("width", "320");
			plugin.setAttribute("height", "240");
		}else{
			plugin.setAttribute("width", "100%");
			plugin.setAttribute("height", "100%");
		}
	}

	// make the embedui invisible
	plugin.embedui_update(embedui_id, { "action": "base_reset_state",
				"arg":	{ "new_state": "invisible" } });


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
	//	

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
		if( new_state == "idle_detect" ){
			plugin.embedui_update(embedui_id, { "action": "element_update_opt",
					"arg":	{ "mouse_visibility" : "show"	}});
		}else{
			plugin.embedui_update(embedui_id, { "action": "element_update_opt",
					"arg":	{ "mouse_visibility" : "hide"	}});
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
	//

	// if the event_type is not "click", do nothing
	if( event_type != "click" )	return;

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
	this.m_ezplayer.change_playlist(item_userptr['playlist_uri']);
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
					"playlist_uri"	: plistarr_item.playlist_uri()
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
		// if this plistarr_item.playlist_uri() matches current playlist_uri, select it 
		if( plistarr_item.playlist_uri() == this.m_ezplayer.m_playlist_uri ){
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
	//

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
	//
	//
	
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
					"display_type"	: "mouse_over"
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
 
/*
sometime while loaded in adobe air, it trigger this error and stop
- i had similar cases before in chrome or air1.0 but less often
- if the js is not concatenated it doesnt fails
- if the box is loaded it doesnt fails
- all seems to points on a race condition in flash init
TypeError: Value undefined does not allow function calls.
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 6015
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 5875
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 5836
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 5116
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 4907
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 4973
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 2779
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 2762
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 2730
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 2744
 at http://player.urfastr.tv/jspackmin/data/neoip_jsplayer_packmin.js : 145

- 6015 is a call to the flash plugin but 6013 too...
  - how one the plugin may be defined on 6013 but not on 6015...
  - find a way to display some trace
  - find a way reproduce it easily
    - currently it is trigger IIF the player is on dedixl and js concatenated
    - maybe to improve caching would help
      - like a expire on the js+swf ? it would not hurt anyway :)
- possible test procedure in LOCAL
  - put the mac on webcam toward jmehost2 on dev flv record
  - jmehost2, get a wget this stream
  - point the adobe_air player to casto_rel.php
*/


