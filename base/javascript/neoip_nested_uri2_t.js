/*! \file
    \brief Definition of the nested_uri2_t

\par Brief Description
nested_uri2_t is a class to help build neoip-oload nested uri.

\par Implementation notes
- this object exist in javascript and actionscript. it is very similar in both
  - neoip_nested_uri2_t.js and neoip_nested_uri2_t.as
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
neoip.nested_uri2_t = function()
{
	// zero some values
	this.m_data	= {};
}

/** \brief Destructor
 */
neoip.nested_uri2_t.prototype.destructor	= function()
{
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			action function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////



/**
 * Set the variable namespace/key to the value val
 */
neoip.nested_uri2_t.prototype.set	= function(key, val)
{
	var kparts	= key.split("/");
	
	var temp_data	= this.m_data;
	for(var i = 0; i < kparts.length; curs_data++){
		var kpart	= kparts[curs_data];
		if( kpart in temp_data )	continue;
		temp_data[kpart]	= {}
	}
	tmp_data[kparts.length-1]
	console.dir(kparts);
	console.dir(kparts.slice(1));
	console.info('subkey=', kparts.slice(1).join('/'));


	// outter_var/http_slota= 34
	// inner_uri=kjdfkjdf
	var _set	= function(key, val){
		var kparts	= key.split("/");
		if( kparts.length > 1 ){
			var subkey	= kparts.slice(1).join('/');
// TODO TODO
		}		
	}
	return _set(key, val);
	console.dir(kparts);
}

/**
 * Return the value of the variable namespace/key (note: it MUST be defined)
*/
neoip.nested_uri2_t.prototype.get	= function(key)
{
}

/**
 * Return true if this variable is defined, false otherwize
*/
neoip.nested_uri2_t.prototype.has	= function(key)
{
}

// shortcuts
neoip.nested_uri2_t.prototype.outter_uri	= function(val){ this.set('main/outter_uri'	, val); }
neoip.nested_uri2_t.prototype.inner_uri		= function(val){ this.set('main/inner_uri'	, val); }


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Internal function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief throw an exception is this object is not considered sane 
 */
neoip.nested_uri_builder_t.prototype._is_sane_internal	= function()
{
	if( !this.has("main/outter_uri") )	throw new Error("No outter_uri");
	if( !this.has("main/inner_uri") )	throw new Error("No inner_uri");
	
	// TODO do all the sanity check here
	// - if subfile_level exist, a subfile_path MUST too
	// - subfile_path MUST always start with '/'
	// - if 'type' check the value is a legal one
	// - if 'mod' check the value is a legal one
	// - for dupuri and http_peersrc_uri, it MUST start by 'http://'
}

/** \brief If this object is considered sane, return true. false otherwise
 */
neoip.nested_uri2_t.prototype.is_sane	= function()
{
	try {
		// call the version with exception
		this._is_sane_internal();
	}catch(error) {
		console.log("nested_uri_t not sane due to " + error);
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
neoip.nested_uri2_t.prototype.to_string	= function()
{
	var	result	= "";
	// sanity check - the object MUST be sane
	console.assert( this.is_sane() );

	// start building the nested_uri
	result	+= this.m_data['main']['inner_uri'] + "/";
	
	// put the 'mod' variable first
	if( this.m_data['main']['mod'] )	result += this.get('main','mod') + "/";
	
	// put all the outter variables
	for(var key in this.m_data['outter_var']){
		// skip key equal to dupuri/subfile_path, they are handled separatly
		if( key == 'dupuri' )		continue;
		if( key == 'subfile_path' )	continue;
		// put the key of the variable
		result	+= "*" + key + "*";
		// get the value
		var val	= this.m_data['outter_var'][key];
		// http_peersrc_uri is specific - values are encoded in base64-urlsafe
		if( key == "http_peersrc_uri" )	val = neoip_base64.encode_safe(val)
		// put the values according to the keys
		result	+= this.m_data['outter_var'][key];
		// add the separator
		result	+= "/";
	}
	
// TODO how to handle dupuri stuff ?
// - not here !
// - here dupuri is a outter_var like any other
// - this is handled in the setter with a special setter

	// put all the dupuri with value in base64-urlsafe encoding
	for(var dupuri_idx in this.m_data['outter_var']['dupuri']){
		result	+= "*dupuri*";
		result	+= neoip_base64.encode_safe(this.m_data['outter_var']['dupuri'][dupuri_idx]);
		result	+= "/";
	}


// TODO how to port this subfile_path stuff 
	// put the inner_uri at the end
	// - made complex by the need to put the m_subfile_path between the 
	//   path and the query part of the inner_uri
	var	query_pos		 = this.m_inner_uri.indexOf("?");
	if( query_pos != -1 )	result	+= this.m_inner_uri.substr(0, query_pos);
	else			result	+= this.m_inner_uri;
	if(this.m_subfile_path)	result	+= this.m_subfile_path
	if( query_pos != -1 )	result	+= this.m_inner_uri.substr(query_pos, this.m_inner_uri.length);
	
	// put all the inner variables aka "neoip_metavar_"
	for(var key in this.m_data['minner_var']){
		// put the variable separator
		result	+= result.indexOf('?') == -1 ? "?" : "&";
		// put the key of the variable
		result	+= key + "=" + escape(this.m_data['minner_var'][key]);
	}
	
	// scramble the result
	result	= neoip.core.doscramble_uri(result);
	// return the just built nested_uri
	return result;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			from_string() function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief return a string of the nested_uri
 */
neoip.nested_uri2_t.prototype.from_string	= function(from_str)
{
	// return the just built nested_uri
	return result;
}

