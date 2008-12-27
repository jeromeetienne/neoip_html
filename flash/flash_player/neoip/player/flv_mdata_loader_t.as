/*! \file
    \brief Definition of the class flv_mdata_loader_t

\par Brief Description
flv_mdata_loader_t loads the metadata of track_t pointing to an flv file.
- they may be of 2 types
  - TYPE_INTERNAL: aka data inside a flv
  - TYPE_EXTERNAL: aka data in a xml file distinct from flv
- NOTE: flash-player is bugged on URLLoader
  - if TYPE_EXTERNAL on a src_uri which is unreachable, URLLoader will hang for
    ever, and so the expire timer will be hit.

\par Usage
- this is used in case the track_t have a start_time > 0
  - so the track_t doesnt start at the begining of the file
- this is used in case the track_t metadata are stored externally
  - typically when the flv file doesnt have a kframe_index
  - and they have been generated and stored elsewhere


*/
 
/** \brief Definition of the package
 * 
 */
package neoip.player {

// list of all import for this package
import flash.events.*;
import flash.media.SoundTransform;
import flash.net.*;
import flash.utils.Timer;

import neoip.debug.console;

/** \brief Class load flv metadata
 */
public class flv_mdata_loader_t {

// definition of the fields in this class
private var m_url_loader	:URLLoader;
private var m_net_stream	:NetStream;

private var m_expire_timer	:Timer;
private var m_expire_delay	:Number		= 60.0*1000;
private var m_callback		:Function;

private static const TYPE_INTERNAL	:String	= "internal";
private static const TYPE_EXTERNAL	:String	= "external";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function flv_mdata_loader_t()
{
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// delete the m_url_loader if needed
	if( m_url_loader ){
		m_url_loader.close();
		m_url_loader	= null;
	}
	// delete m_net_stream if needed
	if( m_net_stream ){
		m_net_stream.close();
		m_net_stream	= null;
	}
	// stop the m_expire_timer
	if( m_expire_timer ){
		m_expire_timer.stop();
		m_expire_timer	= null;
	}
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

public function start(type_str:String, src_uri:String, p_callback:Function)	:void
{
	// copy the parameter
	m_callback	= p_callback;

	// initialize m_expire_timer
	m_expire_timer	= new Timer(m_expire_delay);
	m_expire_timer.addEventListener(TimerEvent.TIMER, expire_timer_cb	, false, 0, true);
	m_expire_timer.start();

	// go on the start according to the type 
	if( type_str == TYPE_INTERNAL ){
		start_internal(src_uri);
	}else if( type_str == TYPE_EXTERNAL ){
		start_external(src_uri);
	}else{	console.assert(false, "unknown type=" + type_str);	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			external mdata
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start the loading of the external flv_mdata_t from the src_uri
 */
private function start_external(src_uri:String)	:void
{
	// create the URLLoader
	m_url_loader	= new URLLoader();
	// add the listeners
	m_url_loader.addEventListener(Event.COMPLETE		, url_loader_oncomplete	, false, 0, true);
	m_url_loader.addEventListener(IOErrorEvent.IO_ERROR	, url_loader_onioerror	, false, 0, true);

	// start the operation itself
	m_url_loader.load(new URLRequest(src_uri));
}

/** \brief URLLoader callback on Event.COMPLETE
 */
private function url_loader_oncomplete(event:Event)	:void
{
	// build the flv_mdata_t from the received data
	var flv_mdata	:flv_mdata_t;
	flv_mdata	= flv_mdata_t.from_external(m_url_loader.data);
	// notify a success with the just built flv_mdata_t
	m_callback("succeed", flv_mdata);
}

/** \brief URLLoader callback on IOErrorEvent.IO_ERROR
 */
private function url_loader_onioerror(event:IOErrorEvent)	:void
{
	// notify the caller of the error
	m_callback("failed", null);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			internal metadata
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start the loading of the internal flv_mdata_t from the src_uri
 */
private function start_internal(src_uri:String)	:void
{
	// log to debug
	console.info("src_uri=" + src_uri);

	// create NetConnection
	var net_cnx	:NetConnection;
	net_cnx		= new NetConnection();
	net_cnx.connect(null);		// Not using a media server.

	// create the m_net_stream
	m_net_stream	= new NetStream(net_cnx);
	// Add callback method for listening on NetStream meta data
	m_net_stream.client	= {	"onMetaData"	: net_stream_onMetaData	};
	// add callback for NET_STATUS			
	m_net_stream.addEventListener(NetStatusEvent.NET_STATUS, net_stream_onnetstatus	, false, 0, true);
	// start playing the .flv to retrieve the metadata
	m_net_stream.play( src_uri );
	

	// create a SoundTransform to ensure that nosound is produced
//	var sound_transform	:SoundTransform;
//	sound_transform		= new SoundTransform();
//	sound_transform.volume	= 0;
//	m_net_stream.soundTransform	= sound_transform;	

	m_net_stream.pause();
}

/** \brief NetStream callback onMetaData
 */
private function net_stream_onMetaData(metadata:Object)	:void
{
	// log to debug
	console.info("received flv_mdata m_net_stream.byte_loaded=" + m_net_stream.bytesLoaded);
	//console.dir(metadata['keyframes']);

	// close the m_net_stream
	// - this is useless now as this is use IIF track_t.start-time > 0
	m_net_stream.close();

	// build the flv_mdata_t from the received data
	var flv_mdata	:flv_mdata_t;
	flv_mdata	= flv_mdata_t.from_internal(metadata);
	// notify a success with the just built flv_mdata_t
	m_callback("succeed", flv_mdata);
}

/** \brief NetStream callback on NetStatusEvent.NET_STATUS
 */
private function net_stream_onnetstatus(event:NetStatusEvent)	:void
{
	var event_type:String	= event.info.code;
	// log to debug
	console.info("enter net_stream_onnetstatus: " + event_type);

	// TODO here add all the possible error
	if( event_type == "NetStream.Play.StreamNotFound" )	m_callback("failed", null);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			m_expire_timer callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for the m_expire_timer
 */
private function expire_timer_cb(eventArgs:TimerEvent)	:void
{
	m_callback("timedout", null);
}


}	// end of class 
} // end of package

