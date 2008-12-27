/*! \file
    \brief Definition of the class track_t

\par Brief Description
track_t stores the information about a given track of the playlist_t

*/
 
/** \brief Definition of the package
 */
package neoip.player {

// list of all import for this package
import neoip.debug.console;
	
/** \brief Class to contain the track of the playlist
 */
public class track_t {

// definition of the fields in this class
private var m_content_url	:String;
private var m_flv_mdata_uri	:String;
private var m_flv_mdata_type	:String;
private var m_start_time	:Number;
private var m_rangereq_type	:String;
private var m_rangereq_flv_var	:String;
private var m_video_aspect	:String;
private var m_net_ratelim_key	:String;
private var m_net_ratelim_uri	:String;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function track_t(arg:Object)
{
	// copy the parameters
	m_content_url		= arg['content_url'];
	m_flv_mdata_uri		= arg['flv_mdata_uri'];
	m_flv_mdata_type	= arg['flv_mdata_type'];
	m_start_time		= arg['start_time'];
	m_rangereq_type		= arg['rangereq_type'];
	m_rangereq_flv_var	= arg['rangereq_flv_var'];
	m_video_aspect		= arg['video_aspect'];
	if( arg['net_ratelim'] ){
		m_net_ratelim_key	= arg['net_ratelim']['key']; 
		m_net_ratelim_uri	= arg['net_ratelim']['uri'];
		// sanity check - m_net_ratelim_key and m_net_ratelim_uri MUST be defined
		console.assert( m_net_ratelim_key != null, "net_ratelim key MUST be defined" );
		console.assert( m_net_ratelim_uri != null, "net_ratelim uri MUST be defined" );
	}



	// sanity check 
	console.assert(m_content_url != null	, "content_url MUST be specified");
	if( m_flv_mdata_type != null ) {
		console.assert(m_flv_mdata_type == "external" || m_flv_mdata_type == "internal"
			, "flv_mdata_type MUST be either 'internal' or 'external'");
	}
	if( m_flv_mdata_uri != null )	console.assert(m_flv_mdata_type != null	, "flv_mdata_type MUST be specified IF flv_mdata_uri is");
	if( m_flv_mdata_type != null )	console.assert(m_flv_mdata_uri != null	, "flv_mdata_uri MUST be specified IF flv_mdata_type is");

	// TODO make a LOT of sanity check here	
	// TODO should i pass all those property as a Array
	// - more flexible and less overhead for dev
	// - less checking tho...
	// - ok i decide that no... checking is important for maintenance
}
	
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			query function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

public function arg()	:Object
{
	var obj:Object	= new Object();
	obj['content_url']	= m_content_url;
	obj['flv_mdata_uri']	= m_flv_mdata_uri;
	obj['flv_mdata_type']	= m_flv_mdata_type;
	obj['start_time']	= m_start_time;
	obj['rangereq_type']	= m_rangereq_type;
	obj['rangereq_flv_var']	= m_rangereq_flv_var;
	obj['video_aspect']	= m_video_aspect;
	// return the just built object
	return obj;
}


public function get content_url()	:String	{ return m_content_url;			}
public function get flv_mdata_uri()	:String	{ return m_flv_mdata_uri;		}
public function get flv_mdata_type()	:String	{ return m_flv_mdata_type;		}
public function get start_time() 	:Number	{ return m_start_time;			}
public function get rangereq_type() 	:String	{ return m_rangereq_type;		}
public function get rangereq_flv_var()	:String	{ return m_rangereq_flv_var;		}
public function get video_aspect()	:String	{ return m_video_aspect;		}
public function get has_net_ratelim()	:Boolean{ return m_net_ratelim_key != null;	}
public function get net_ratelim_key()	:String	{ return m_net_ratelim_key;		}
public function get net_ratelim_uri()	:String	{ return m_net_ratelim_uri;		}

}	// end of class 
} // end of package