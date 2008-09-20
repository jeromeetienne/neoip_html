/*! \file
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
	//console.info("response=" + xmlhttp.responseText);
	//console.info("status=" + xmlhttp.status);
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

	console.info("cookie_str=" +cookie_str);

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

/** \brief function to extract the variable from the page location url
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
	// extract part_beg "super/path/my/file.ext?var=value"
	var part_end	= /.*?:\/\/.*?\/(.*)/(req_uri)[1];
	
	// encode the part_end using base64
	// - TODO use a function which is less common than base64 to scramble !!! :)))
	part_end	= neoip_base64.encode_safe(part_end);

	// rebuild the uri with the encoded part_end
	return part_beg + "/scrambled/" + part_end;	
}
}
	