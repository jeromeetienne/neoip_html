/*! \file
    \brief Definition of the class player_curtrack_t

\par Brief Description
player_curtrack_t handle the current track for player_t


- clean it up
- have listener on m_net_cnx too
- notify error if the connection get disconnected
  - goes up to the fromjs thus it gets displayed

*/

/** \brief Definition of the package
 */
package neoip.player {

// list of all import for this package
import flash.events.IOErrorEvent;
import flash.events.NetStatusEvent;
import flash.events.SecurityErrorEvent;
import flash.events.TimerEvent;
import flash.media.SoundTransform;
import flash.net.NetConnection;
import flash.net.NetStream;
import flash.utils.Timer;
import flash.utils.getTimer;

import neoip.debug.console;

/** \brief Class to contain the rate limiter for NetStream
 */
public class player_curtrack_t {

// definition of the fields in this class
private var m_player		:player_t;	//!< backpointer to the player_t
private var m_state		:String;	//!< the current state 
private var m_track_idx		:uint;		//!< the current track_idx

private var m_callback		:Function;

private var m_track_timer	:Timer;
private var m_track_timer_period:Number		= 1.0*1000;

private var m_net_cnx		:NetConnection;
private var m_net_stream	:NetStream;
private var m_net_ratelim	:net_ratelim_t;

private var m_mdata_loader	:flv_mdata_loader_t;
private var m_flv_mdata		:flv_mdata_t;	//!< the flv_mdata_t of the current track


public	static const STATE_STOPPED	:String	= "stopped";
public	static const STATE_KFRAMEFINDING:String	= "kframefinding";
public	static const STATE_CONNECTING	:String	= "connecting";
public	static const STATE_BUFFERING	:String	= "buffering";
public	static const STATE_PLAYING	:String	= "playing";

public	static const EVENT_TIME_CHANGE	:String	= "current_time";
public	static const EVENT_STATE_CHANGE	:String	= "state_change";
public	static const EVENT_NEW_CUEPOINT	:String	= "cuepoint";
public	static const EVENT_GOT_FLV_MDATA:String	= "got_flv_mdata";
public	static const EVENT_ERROR	:String	= "error";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function player_curtrack_t()
{
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// delete m_track_timer if needed
	if( m_track_timer ){
		m_track_timer.stop();
		m_track_timer	= null;
	}
	// delete m_mdata_loader if needed
	if( m_mdata_loader ){
		m_mdata_loader.destructor();
		m_mdata_loader	= null;
	}
	// notify the video that m_player.video must not player this stream
	m_player.video_elem.attachNetStream( null );
	// delete m_net_ratelim if needed
	if( m_net_ratelim ){
		m_net_ratelim.destructor();
		m_net_ratelim	= null;
	}
	// delete m_net_stream if needed
	if( m_net_stream ){
		m_net_stream.close();
		m_net_stream	= null;
	}
	// delete m_net_cnx if needed
	if( m_net_cnx ){
		m_net_cnx.close();
		m_net_cnx	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Setup function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start the operation
 */
public	function start(p_player :player_t, p_track_idx	:uint, p_callback:Function)	:void
{
	// copy the parameteres
	m_player	= p_player;
	m_track_idx	= p_track_idx;
	m_callback	= p_callback;
	
	// set up the initial state
	m_state		= STATE_STOPPED;
	// get the current track_t from m_playlist
	var curr_track	:track_t	= m_player.playlist.m_track_arr[m_track_idx];
	
	// Initialize net stream
	m_net_cnx	= new NetConnection();
	m_net_cnx.addEventListener(IOErrorEvent.IO_ERROR		, cnx_onIOError		, false, 0, true);
	m_net_cnx.addEventListener(NetStatusEvent.NET_STATUS		, cnx_onNetStatus	, false, 0, true);
	m_net_cnx.addEventListener(SecurityErrorEvent.SECURITY_ERROR	, cnx_onSecurityError	, false, 0, true);
	m_net_cnx.connect(null);		// Not using a media server.
	
	m_net_stream	= new NetStream(m_net_cnx);
	
	// NOTE: TODO: sort this out
	// - if bufferTime is left unchanged, and track is a stream, it produce a lot
	//   of buffer event
//	m_net_stream.bufferTime	= 2;	// TODO what is this 2-sec :)
	
	// Add callback method for listening on NetStream meta data
	m_net_stream.client	= {	"onMetaData"	: stream_onMetaData,
					"onCurPoint"	: stream_onCuePoint,
					"onPlayStatus"	: stream_onPlayStatus	};

	// add callback for NET_STATUS			
	m_net_stream.addEventListener(NetStatusEvent.NET_STATUS, stream_onNetStatus	, false, 0, true);

	// Play video
	m_player.video_elem.attachNetStream( m_net_stream );
	// update the SoundTransform of this net_stream
	update_sound_transform();

	// if current_track has a start_time, pause the video immediatly
	// - this avoid to avoid the begining of the video when starting in the middle
	// - TODO beefup the sanity check here
	// - TODO put a state here to say 'the value are not correct... or something'
	if( curr_track.start_time > 0 || curr_track.flv_mdata_type == "external" ){
		// get the default value
		var flv_mdata_uri	:String	= curr_track.content_url;
		var flv_mdata_type	:String	= "internal"
		// overwrite the track_t value when applicable
		if( curr_track.flv_mdata_uri )	flv_mdata_uri	= curr_track.flv_mdata_uri;
		if( curr_track.flv_mdata_type )	flv_mdata_type	= curr_track.flv_mdata_type;
		// launch the m_mdata_loader
		m_mdata_loader	= new flv_mdata_loader_t();
		m_mdata_loader.start(flv_mdata_type, flv_mdata_uri, flv_mdata_loader_cb);
		// goto STATE_KFRAMEFINDING
		goto_state(STATE_KFRAMEFINDING);
	}else{
		m_net_stream.play( curr_track.content_url );
		// if curr_track.has_net_ratelim, start it now
		if( curr_track.has_net_ratelim ){
			m_net_ratelim	= new net_ratelim_t;
			m_net_ratelim.start(m_net_stream, curr_track.net_ratelim_key
							, curr_track.net_ratelim_uri);
		}
		// goto STATE_PLAYING
		// - TODO supposed to be CONNECTING!! and go to PLAYING once flv_mdata_t
		//   is received
		// - it would trigger inter-track busy button
		goto_state(STATE_PLAYING);
		// start the track_timer
		track_timer_start();
	}

	// log to debug
	console.info("track_start: at "			+ getTimer());
	console.info("track_start: m_track_idx="	+ m_track_idx);
	console.info("track_start: content_url="	+ curr_track.content_url);
	console.info("track_start: start_time="		+ curr_track.start_time);
	console.info("track_start: flv_mdata_uri="	+ curr_track.flv_mdata_uri);
	console.info("track_start: flv_mdata_type="	+ curr_track.flv_mdata_type);
}

// TODO put those get function elsewhere
public function get state()		:String		{ return m_state;	}
public function get flv_mdata()		:flv_mdata_t	{ return m_flv_mdata;	}
public function get video_aspect()	:String		{ return m_player.playlist.m_track_arr[m_track_idx].video_aspect;	}	

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start playing after the reception of flv_mdata_t
 */
private function	play_post_flv_mdata()	:void
{
	var curr_track	:track_t= m_player.playlist.m_track_arr[m_track_idx];
	var cooked_url	:String	= curr_track.content_url;
	var rangereq_var:String	= curr_track.rangereq_flv_var;
	console.assert( rangereq_var is String );
	// sanity check - this function MUST be called IIF if curr_track.start_time > 0
	console.assert( curr_track.start_time > 0 );
	// sanity check - m_flv_mdata MUST be set
	console.assert( m_flv_mdata != null );

	// goto STATE_CONNECTING
	goto_state(STATE_CONNECTING);

	// dynamically find the closest keyframes in the flv_mdata_t
	var byte_offset:Number	= m_flv_mdata.closest_kframe_offs(curr_track.start_time);
	console.info("***** byte_offset=" + byte_offset);
	// add the variable separator before the rangereq_varname
	// - append a '&' or a '?' depending on the already present url variables
	// - TODO is it a proper test ?
	if( cooked_url.indexOf("?") == -1 )	cooked_url += "?";
	else					cooked_url += "&";
	// append the varname and the byte_offset
	cooked_url	+= rangereq_var + "=" + byte_offset;
	// relaunch the net_stream.play on this cooked_url
	m_net_stream.play( cooked_url );
	// if curr_track.has_net_ratelim, start it now
	if( curr_track.has_net_ratelim ){
		m_net_ratelim	= new net_ratelim_t;
		m_net_ratelim.start(m_net_stream, curr_track.net_ratelim_key
						, curr_track.net_ratelim_uri);
	}
	// start the track_timer
	track_timer_start();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief update NetStream SoundTransform with the current values
 * 
 * - MUST be called everytime neoip.player_t variables m_sound_* are modified
 *   - m_sound_mute/m_sound_vol/m_sound_pal
 */ 
public function update_sound_transform()	:void
{
	// create and fully set a SoundTransform
	var sound_transform	:SoundTransform;
	sound_transform		= new SoundTransform();
	sound_transform.volume	= m_player.sound_mute ? 0 : m_player.sound_vol;
	sound_transform.pan	= m_player.sound_pan;
	
	// assign it to net_stream 
	// - NOTE: it can NOT be used in net_stream directly 
	// - e.g. net_stream.sound_transform.volume = 0 will NOT mute the video
	m_net_stream.soundTransform	= sound_transform;
}

/** \brief Return the current time of the playhead within the NetStream
 */
public function	get track_time()	:Number
{
	// TODO is this function used at all ?!!?!
	
	if( m_state != STATE_PLAYING )	return -1;
	
	// return the current net_stream time
	return m_net_stream.time;
}


private function goto_state(new_state:String)		:void
{
	// if the state hasnt changed, do nothing
	if( new_state == m_state )	return;
	// backup m_state
	var old_state	:String;
	old_state	= m_state;
	// update m_state
	m_state	= new_state;
	
	// notify the caller
	notify_callback(EVENT_STATE_CHANGE, {	"old_state"	: old_state,
						"new_state"	: new_state	});
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			flv_mdata_loader_t callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief flv_mdata_loader_t callback
 */
private function flv_mdata_loader_cb(event_type:String, cb_flv_mdata:flv_mdata_t)	:void 
{
	// load to debug
	console.info("flv_mdata_loader_cb: event_type=" + event_type + " flv_mdata_t=" + cb_flv_mdata);
	console.dir(cb_flv_mdata);
	// delete the flv_mdata_loader_t
	m_mdata_loader.destructor();
	m_mdata_loader	= null;

	// if event_type IS NOT "succeed", notify an error
	if( event_type != "succeed" ){	
		return notify_callback(EVENT_ERROR, {	"code"	: "not_found",
							"reason": "unable to retrieve flv_mdata"});
	}
	
	// copy the metadata
	m_flv_mdata	= cb_flv_mdata;
	// start playing
	play_post_flv_mdata();
	// notify player_t that it may be resized
	notify_callback(EVENT_GOT_FLV_MDATA	, null);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			NetConnection event
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

private function cnx_onIOError(event	:IOErrorEvent):void
{
	// log to debug
	console.info("enter event=" + event);
	// notify the error
	return notify_callback(EVENT_ERROR, {	"code"	: "cnx_ioerror",
						"reason": event	});
}

private function cnx_onNetStatus(event	:NetStatusEvent):void
{
	// log to debug
	console.info("info.code=" + event.info.code);
}

private function cnx_onSecurityError(event	:SecurityErrorEvent):void
{
	console.info("securityErrorHandler: " + event);
	// notify the error
	return notify_callback(EVENT_ERROR, {	"code"	: "cnx_secuerror",
						"reason": event	});
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			NetStream event
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// MetaData
private function stream_onNetStatus(event	:NetStatusEvent)	:void
{
	var event_type	:String	= event.info.code;
	//console.dir(event.info);
	console.info("info.code=" + event.info.code + " at " + getTimer());
	//console.dir(event);

	// if the stream is not found, what to do ?
	if( event.info.level == "error" ){
		console.info("recved error code " + event.info.code);
		return notify_callback(EVENT_ERROR, {	"code"	: "not_found",
							"reason": event.info.code	});
	}

	// NOTE: NetStream.Buffer.Flush is tested too as video on youtube never
	// trigger a NetStream.Play.Stop - reason currently unknown
	// - this is not a http server issue, as it is reproducible if same video
	//   is copied locally... to retry im not so sure anymore
	// - it seems to work everytime IF start from start_time = 0
	// - sometime it hangs IF start_time > 0 but only for some keyframe
	// - on youtube_video_4.flv
	//   - OK start=1242599
	//   - KO start=963927
	// - i noticed that when it hangs, it does a buffer.empty just after
	//   - and there is some weird flush that i dont understand in the begining
	// - TODO findout what is special about those keyframe

	// if NetStream start to play, goto STATE_PLAYING
if( 0 ){	/***************** only WITHOUT flv_mdata_loader_t	***************/
	if( event_type == "NetStream.Play.Start" && m_flv_mdata != null)
		return goto_state(STATE_PLAYING);
}else{
	if( event_type == "NetStream.Play.Start")	return goto_state(STATE_PLAYING);
}
	// if NetStream stop to play, switch to the next track_t in the playlist
	// - TODO not sure about this one as NetStream.Play.Stop is notified sometime
	//   without the video being completed 
	if( event_type == "NetStream.Play.Stop" )	return goto_state(STATE_STOPPED);
}

// MetaData
private function stream_onMetaData(metadata:Object)	:void
{
	// log to debug
// diplay the seekpoints which are only for .mp4 stuff
// - if metadata['seekpoints'] exists, then it is mp4 stuff
// - if metadata['keyframes'] exists, then it is flv stuff
//	var seekpoints:Array	= metadata['seekpoints'];
//	console.info("seekpoint.length=" + seekpoints.length);
//	for(var i:int = 0; i < seekpoints.length; i++){
//		console.info("i=" + i + " time=" + seekpoints[i]['time'] + " offset="+ seekpoints[i]['offset']);
//	}
//	for(var key:String in metadata)	console.info("metadata: " + key + " = " + metadata[key]);

// TODO with flv_mdata_loader_t this function is not used i think..
// check and see

	// update the local flv_mdata with the received data
	m_flv_mdata	= flv_mdata_t.from_internal(metadata);
	
	// log to debug
	console.info("received flv_mdata m_net_stream.byte_loaded=" + m_net_stream.bytesLoaded
								+ " at " + getTimer());
	// notify player_t that it may be resized
	notify_callback(EVENT_GOT_FLV_MDATA	, null);
}

// MetaData
private function stream_onCuePoint(cuepoint	:Object)	:void
{
	// display all the cuepoint
	//for(var key:String in cuepoint)	console.info("cuepoint: " + key + " = " + cuepoint[key]);

	// just forward the object to the caller
	notify_callback(EVENT_NEW_CUEPOINT	, cuepoint);
}
	
// MetaData
private function stream_onPlayStatus(info:Object)	:void
{
	// display all the cuepoint
	for(var key:String in info)	console.info("playstatus: " + key + "=" + info[key]);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			track_timer stuff
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Build the track_timer
 */
private function track_timer_start()	:void
{
	// sanity check - m_track_timer MUST NOT be already initialized
	console.assert(m_track_timer == null);
	// init a timer every second
	// - NOTE: usefull to notify the javascript of the timeing event
	// - TODO: make this period tunable by caller
	m_track_timer	= new Timer(m_track_timer_period);
	m_track_timer.addEventListener(TimerEvent.TIMER, track_timer_cb	, false, 0, true);
	// start m_track_timer
	m_track_timer.start();
}

/** \brief m_track_timer callback 
 */
private function track_timer_cb(eventArgs	:TimerEvent)	:void
{
	// get the current track_t from m_playlist
	var curr_track	:track_t	= m_player.playlist.m_track_arr[m_track_idx];
	// if the current state IS NOT playing, do nothing
	// - TODO should it be an assert ?
	if( m_state != STATE_PLAYING )		return;

	// if m_net_stream.time is less than start_time, do nothing
	// - TODO this is part of the stuff i dont understand about m_net_stream
	// - may very well be a mistake of mine
	if( m_net_stream.time < curr_track.start_time )	return;

	// notify the caller
	notify_callback(EVENT_TIME_CHANGE, { "time"	: m_net_stream.time	});
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			callback notification
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Notify the caller of a MouseEvent on this object
 */
private function notify_callback(event_type	:String, arg	:Object)	:void
{
	// forward the event to the caller
	m_callback(event_type, arg);	
}


}	// end of class 
} // end of package