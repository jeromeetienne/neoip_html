/*! \file
    \brief Definition of the class cam_recorder_t

\par Brief Description
cam_recorder_t is the main class to record the webcam inside neoip_asplayer

*/

/** \brief Definition of the package
 */
package neoip.recorder {

// list of all import for this package
import flash.display.Stage;
import flash.external.ExternalInterface;

import flash.net.ObjectEncoding;
import flash.net.NetConnection;
import flash.net.NetStream;
	
import flash.media.Video;
import flash.media.Camera;
import flash.media.Microphone;

import flash.events.IOErrorEvent;
import flash.events.NetStatusEvent;
import flash.events.AsyncErrorEvent;
import flash.events.SecurityErrorEvent;
	
import neoip.debug.console;
	
/** \brief Class to contain 
 */
public class cam_recorder_t {

// definition of the fields in this class
private var m_stage		:Stage;
private var m_video		:Video;
private var m_camera		:Camera;
private var m_micro		:Microphone;

private var m_net_cnx		:NetConnection;
private var m_net_stream	:NetStream;

private var m_video_w		:Number;
private var m_video_h		:Number;
private var m_video_fps		:Number;
private var m_video_bw		:Number;
private var m_audio_bw		:Number;
private var m_audio_mute	:Boolean;
private var m_rtmp_uri		:String;
private var m_cam_idx		:Number;
private var m_mic_idx		:Number;

private var m_recording		:Boolean;
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function cam_recorder_t(p_stage:Stage)
{
	// copy the parameter
	m_stage		= p_stage;

	m_recording	= false;

	// Add video to stage and use the whole stage
	m_stage.align		= "LT";
	m_stage.scaleMode	= "noScale";
	m_video			= new Video(m_stage.stageWidth, m_stage.stageHeight);
	m_video.smoothing	= true;

	// make as3 exception sent to js
	ExternalInterface.marshallExceptions = true;
	
	// Add all the callback to be called by javascript
	ExternalInterface.addCallback("record_start"		, fromjs_record_start);
	ExternalInterface.addCallback("record_stop"		, fromjs_record_stop);	
	ExternalInterface.addCallback("record_inprogress"	, fromjs_record_inprogress);
	ExternalInterface.addCallback("record_dopublishing"	, fromjs_record_dopublishing);
	ExternalInterface.addCallback("record_unpublishing"	, fromjs_record_unpublishing);
	ExternalInterface.addCallback("record_ispublishing"	, fromjs_record_ispublishing);
	ExternalInterface.addCallback("record_has_availcamera"	, fromjs_has_availcamera);	
	ExternalInterface.addCallback("record_cam_names"	, fromjs_cam_names);	
	ExternalInterface.addCallback("record_mic_names"	, fromjs_mic_names);
	
	// log to debug
	console.info("end of ctor");
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// if a recording is in progress, stop it now
	if( is_recording() )	stop();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//		setup functions
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** |brief Start a recording
 */
public	function start(arg:Object)	:void
{
	// log to debug
	console.info("enteer start");
	// sanity check - if there is already a recording in progress, return now
	if( is_recording() )
		throw new Error("Cant start a recording while one is already in progress");
	// sanity check - rtmp_uri parameter MUST be defined
	if( arg['rtmp_uri'] == undefined )
		throw new Error("rtmp_uri parameter MUST be defined");

	// copy parameters
	m_video_w	= (arg['video_w']	!= undefined) ? arg['video_w']		: 320;
	m_video_h	= (arg['video_h']	!= undefined) ? arg['video_h']		: 240;
	m_video_fps	= (arg['video_fps']	!= undefined) ? arg['video_fps']	: 25.0;
	m_video_bw	= (arg['video_bw']	!= undefined) ? arg['video_bw']		: 48*1024;
	m_audio_bw	= (arg['audio_bw']	!= undefined) ? arg['audio_bw']		: 16*1024;
	m_audio_mute	= (arg['audio_mute']	!= undefined) ? arg['audio_mute']	: true;
	m_cam_idx	= (arg['cam_idx']	!= undefined) ? arg['cam_idx']		: null;
	m_mic_idx	= (arg['mic_idx']	!= undefined) ? arg['mic_idx']		: null;
	m_rtmp_uri	= arg['rtmp_uri'];
	
	console.info("video_bw=" + m_video_bw);
	console.info("m_cam_idx=" + m_cam_idx);
	console.info("cam name="+ Camera.names[m_cam_idx]);
	// attach the camera to m_video
	m_camera	= Camera.getCamera();
//	m_camera	= Camera.getCamera(m_cam_idx != null ? String(m_cam_idx) : null);
	if( !m_camera )	throw new Error("No Camera Installed");

	m_camera.setMode(m_video_w, m_video_h, m_video_fps);
	m_camera.setQuality(m_video_bw, 0);	// TODO no audio_bw ?
	m_camera.setLoopback(true);		// TODO loopback should be on option with true as default
	//m_camera.setKeyFrameInterval(CAMERA_KEY_FRAME_INTERVAL);
	m_video.attachCamera(m_camera);

	// init the microphone IIF audio_mute
	if( ! m_audio_mute ){
//		m_micro		= Microphone.getMicrophone(m_mic_idx);
		m_micro		= Microphone.getMicrophone();
		// TODO flash10 allow to encode with speex
		// - better quality. so use it by default ?
		// - at least allow the tuning
		
		// TODO how to setup the bandwidth
		// TODO should be on option with true as default
		m_micro.setUseEchoSuppression(true);
		// TODO loopback should be on option with true as default
		m_micro.setLoopBack(true); 
	}
	
	// mark cam_recorder_t as recording
	m_recording	= true;
	// log to debug
	console.info("leave start");	
}

/** |brief Stop a recording
 */
public	function stop()	:void
{
	// sanity check - if there is no recording in progress, return an error
	if( !is_recording() )	throw new Error("no recording in progress");	

	// unpublishing if needed
	if( ispublishing() )	unpublishing();

	// zero some local variable
	m_camera	= null;
	m_micro		= null;
	// detach the camera from the video
	m_video.attachCamera(null);
	m_video.clear();

	// mark cam_recorder_t as nomore recording
	m_recording	= false;
}

/** \brief test if this object is recording or not
 *
 * @return boolean true if a recording is inprogress, false otherwise
*/
public function is_recording()	:Boolean	{ return( m_recording );	}

/** \brief return the video element
 * - this is used to attach it 
*/
public function get mediaVideo():Video		{ return m_video;		}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief test if there is available camera (called only from js)
 *
 * @return return true if there is at least one camera available, false otherwise
 */
public function has_availcamera()	:Boolean
{
	var has_camera:Boolean = Camera.getCamera() == null ? true: false;
	return has_camera;
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief to publish the webcam
 *
*/
public function dopublishing()	:void
{
	// sanity check - this object MUST be called IIF it is_recording()
	console.assert( is_recording() );

	// encode the variable for the uri
	// - this is used to set the metadata in the rebuild flv
	var var_arr:Array	= new Array();
	var_arr.push({key: "video_w"	, val: m_video_w});
	var_arr.push({key: "video_h"	, val: m_video_h});
	var_arr.push({key: "video_fps"	, val: m_video_fps});
	var var_str	:String		= "";
	var myFunction	:Function	= function(element:*, index:int, arr:Array):void {
			if( index > 0 )	var_str	+= "&";
			var_str	+= encodeURIComponent(element.key);
			var_str	+= '=';
			var_str	+= encodeURIComponent(element.val);			
		};
	var_arr.forEach(myFunction);	
	// set up m_net_cnx
	m_net_cnx	= new NetConnection();
	m_net_cnx.objectEncoding	= flash.net.ObjectEncoding.AMF0;
	m_net_cnx.addEventListener( NetStatusEvent.NET_STATUS		, onNetConnectionStatus		);
	m_net_cnx.addEventListener( IOErrorEvent.IO_ERROR		, onNetConnectionIOError	);
	m_net_cnx.addEventListener( NetStatusEvent.NET_STATUS		, onNetConnectionStatus		);
	m_net_cnx.addEventListener( AsyncErrorEvent.ASYNC_ERROR		, onNetConnectionAsyncError	);
	m_net_cnx.addEventListener( SecurityErrorEvent.SECURITY_ERROR	, onNetConnectionSecurityError	);	
	m_net_cnx.connect( m_rtmp_uri +"?"+ var_str, true );
}

/** \brief to unpublish the webcam
*/
public function unpublishing()	:void
{
	// sanity check - this object MUST be called IIF it is_recording()
	console.assert( is_recording() );
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

/** \brief test if this object is publishing or not
 *
 * @return boolean true if a publishing is inprogress, false otherwise
*/
public function ispublishing()	:Boolean	{ return( m_net_cnx != null );	}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//		NetConnection Event handler
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

private function onNetConnectionStatus(event : NetStatusEvent ) : void
{
	// log to debug
	console.info("netconnection event=" + event.info.code);
	// TODO test if it is the proper info.code and if it is sane to get it now
	m_net_stream	= new NetStream( m_net_cnx );
	// attach camera+micro
	m_net_stream.attachCamera( m_camera );
	if( ! m_audio_mute )	m_net_stream.attachAudio( m_micro );
	// add a event listener
	m_net_stream.addEventListener( NetStatusEvent.NET_STATUS , onNetStreamStatus );
	// do the publish
	m_net_stream.publish("dummy" , "record");
}

private function onNetConnectionIOError ( pEvent : IOErrorEvent ) : void
{
	console.info("AMFConnection.onIOError : " + pEvent);
}
		
private function onNetConnectionAsyncError ( pEvent : AsyncErrorEvent ) : void
{
	console.info("AMFConnection.onAsyncError : " + pEvent);	
}
		
private function onNetConnectionSecurityError ( pEvent : SecurityErrorEvent ) : void
{
	console.info("AMFConnection.onSecurityError : " + pEvent);	
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//		NetStream Event handler
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


public function onNetStreamStatus( event : NetStatusEvent ) : void
{
	console.info("netstream event=" + event.info.code);
	console.info("netStream bufferLength="+ m_net_stream.bufferLength);
	console.info("netStream bufferTime="+ m_net_stream.bufferTime);
//	console.info("m_net_stream.currentFps="+m_net_stream.currentFps);
	console.info("m_net_stream.liveDelay="+m_net_stream.liveDelay);
	console.info("m_net_stream.time =" + m_net_stream.time);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			fromjs API
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start a recording (called only from js)
 */
public function	fromjs_record_start(arg:Object)	:void
{
	return start(arg);
}

/** \brief stop a record (called only from js)
 *
 * @return void
 */
public function	fromjs_record_stop()	:void
{
	return stop();
}

/** \brief test if there is a record in progress (called only from js)
 *
 * @return return true if there is a record in progress, false otherwise
 */
public function	fromjs_record_inprogress()	:Boolean
{
	return is_recording();
}

/** \brief to publish the recording of the webcam to the sever (called only from js)
 * 
 * @return void
 */
public function	fromjs_record_dopublishing()	:void
{
	return dopublishing();
}

/** \brief to publish the recording of the webcam to the sever (called only from js)
 * 
 * @return void
 */
public function	fromjs_record_unpublishing()	:void
{
	return unpublishing();
}

/** \brief test if there is a publishing in progress (called only from js)
 *
 * @return return true if there is a publishing in progress, false otherwise
 */
public function	fromjs_record_ispublishing()	:Boolean
{
	return ispublishing();
}

/** \brief test if there is available camera (called only from js)
 *
 * @return return true if there is at least one camera available, false otherwise
 */
public function	fromjs_has_availcamera()	:Boolean
{
	return has_availcamera();
}

/** \brief return the list of cameras (called only from js)
 *
 * @return array readonly list of camera names
 */
public function	fromjs_cam_names()	:Array
{
	return Camera.names;
}

/** \brief return the list of microphones (called only from js)
 *
 * @return array readonly list of microphone names
 */
public function	fromjs_mic_names()	:Array
{
	return Microphone.names;
}

}	// end of class 
} // end of package