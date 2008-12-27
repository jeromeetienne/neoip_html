/*! \file
    \brief Definition of the class nested_uri_build_t

\par Brief Description
nested_uri_build_t to build nested uri.

\par Implementation notes
- this object exist in javascript and actionscript. it is very similar in both
  - neoip_nested_uri_builder_t.js and neoip_nested_uri_builder_t.as
  - this is a straight forward porting
  - any modification made in one, must be done in the other

\par Status
- TODO biffup the is_sane function
- else it seems to work
- TODO should i handle the uri metavar here ?

*/
 
/** \brief Definition of the package
 */
package neoip.utils {
	

// list of all import for this package
import neoip.debug.console;
	
/** \brief Class to build nested_uri 
 * 
 */
public class nested_uri_builder_t {

// definition of the fields in this class
private var m_outter_uri	:String;
private var m_inner_uri		:String;

private var m_var_arr		:Array;
private var m_dupuri_arr	:Array;	//!< store all the dupuri - possible with duplicate
private var m_subfile_path	:String;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function nested_uri_builder_t()
{
	// zero some values
	m_dupuri_arr	= new Array;
	m_var_arr	= new Array;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			action function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief to set the inner_uri
 */
public function inner_uri(val:String)	:void	{ m_inner_uri	= val;	}

/** \brief to set the outter_uri
 */
public function outter_uri(val:String)	:void	{ m_outter_uri	= val;	}


/** \brief To set any outter_var
 */
public function outter_var(key:String, val:String)	:void
{
	if( key == "dupuri" ){
		// handled separatly because it is legitimate to have multiple dupuri
		m_dupuri_arr.push(val);
	}else if( key == "subfile_path" ){
		// add a variable 'subfile_level' in m_var_arr to give the 'level' of the path		
		m_var_arr['subfile_level']	= val.split("/").length - 1;
		// copy the value
		m_subfile_path	= val;
	}else{
		// push this variable into the m_var_arr
		m_var_arr[key]	= val;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Internal function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief throw an exception is this object is not considered sane 
 */
private function is_sane_internal()	:void
{
	if( !m_outter_uri )	throw new Error("No outter_uri");
	if( !m_inner_uri )	throw new Error("No inner_uri");
	
	// TODO do all the sanity check here
	// - if subfile_level exist, a subfile_path MUST too
	// - subfile_path MUST always start with '/'
	// - if 'type' check the value is a legal one
	// - if 'mod' check the value is a legal one
	// - for dupuri and announce uri, it MUST start by 'http://'
}

/** \brief If this object is considered sane, return true. false otherwise
 */
public function is_sane()	:Boolean
{
	try {
		// call the version with exception
		is_sane_internal();
	}catch(error:Error) {
		console.info("nested_uri_build_t not sane due to " + error);
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
 * 
 * - TODO should be renamed build() ?
 */
public function to_string()	:String
{
	var	result	:String	= "";
	// sanity check - the object MUST be sane
	console.assert( is_sane() );

	// start building the nested_uri
	result	+= m_outter_uri + "/";
	
	// put the 'mod' variable first
	if( m_var_arr['mod'] )	result += m_var_arr['mod'] + "/";
	
	// put all the variables
	for(var var_key:String in m_var_arr){
		// if 'mod', goto the next - it has already been handled
		if( var_key == "mod" )	continue;
		// put the key of the variable
		result	+= "*" + var_key + "*";
		// put the values according to the keys
		if( var_key == "announce_uri" ){
			// announce uri is specific - values are encoded in base64-urlsafe
			result	+= base64_t.encode(m_var_arr[var_key]);
		}else{
			result	+= m_var_arr[var_key];
		}
		// add the separator
		result	+= "/";
	}
	// put all the dupuri with value in base64-urlsafe encoding
	for(var dupuri_idx:String in m_dupuri_arr)
		result	+= "*dupuri*" + base64_t.encode(m_dupuri_arr[dupuri_idx]) + "/";

	// put the inner_uri at the end
	// - made complex by the need to put the m_subfile_path between the 
	//   path and the query part of the inner_uri
	var	query_pos:Number	 = m_inner_uri.indexOf("?");
	if( query_pos != -1 )	result	+= m_inner_uri.substr(0, query_pos);
	else			result	+= m_inner_uri;
	if( m_subfile_path )	result	+= m_subfile_path
	if( query_pos != -1 )	result	+= m_inner_uri.substr(query_pos, m_inner_uri.length);

	// return the just built nested_uri
	return result;
}


}	// end of class 
} // end of package