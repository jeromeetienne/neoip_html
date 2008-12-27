/*! \file
    \brief Definition of the class flv_kframe_finder_t

\par Brief Description
flv_kframe_finder_t allows to find the kframe byte offset for a given wished time.
This is done as a service to the javascript. It is used for the prefetching of 
track which do not start at the begining of the file.

*/
 
/** \brief Definition of the package
 * 
 */
package neoip.player {

// list of all import for this package
import neoip.debug.console;

/** \brief Class load external flv metadata
 */
public class flv_kframe_finder_t {

// definition of the fields in this class
private var m_mdata_loader	:flv_mdata_loader_t;
private var m_wished_time	:Number;	// the wished time in second
private var m_callback		:Function;
private var m_userptr		:String;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function flv_kframe_finder_t()
{
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// delete the flv_mdata_loader_t if needed
	if( m_mdata_loader ){
		m_mdata_loader.destructor();
		m_mdata_loader	= null;
	}
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

public function start(p_wished_time:Number, type_str:String, src_uri:String
				, p_userptr:String, p_callback:Function)	:void
{
	// copy the parameter
	m_wished_time	= p_wished_time;
	m_callback	= p_callback;
	m_userptr	= p_userptr;
	
	// start the flv_mdata_loader_t
	m_mdata_loader	= new flv_mdata_loader_t();
	m_mdata_loader.start(type_str, src_uri, flv_mdata_loader_cb);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			flv_mdata_loader_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief flv_mdata_loader_t callback
 */
private function flv_mdata_loader_cb(event_type:String, arg:Object)	:void
{
	// log to debug
	//console.info("event_type=" + event_type + " arg=" + arg);
	// if the event_type is not "succeed", just forward the result
	if( event_type != "succeed" ){
		m_callback(this, m_userptr, event_type, null);
		return;
	}
	// find the closest_kframe from the m_wished_time
	var byte_offset:Number	= arg.closest_kframe_offs(m_wished_time);
	// notify the caller	
	m_callback(this, m_userptr, event_type, {	wished_time: 	m_wished_time,
						 	byte_offset: 	byte_offset	} );
}


}	// end of class 
} // end of package

