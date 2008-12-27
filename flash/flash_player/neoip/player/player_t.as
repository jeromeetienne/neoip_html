/*! \file
    \brief Definition of the package

\par About smoothing and video.clear
if flash.media.Video video.smoothing == true, then video.clear() doesnt clear
the video, but it does if video.smoothing == false
- apparently displaying a single frame in smoothing will trigger this bug
  - aka if start with smoothing, and then go to non smoothing, go on playing
    and then do video.clear... WILL NOT clear the video
- POSSIBLE WORKAROUND: draw a big black rectangle before the video when it is
  supposed to be clear() and remove it when starting to play again

\par TODO
- TODO implement the video aspect ratio
  - there are various policy todo
  - full_noaspect	- display the whole image to the whole stage
  - full_doaspect	- display potentially part of the image on the whole stage
  - fit_doaspect	- display the whole image on part of the stage
  - some do "half_orig" or "orig" likely for speed...
    - seems overengineering for now
    - well full_noaspect seems quite weird too :)
  - find better names....
    - meanwhile compute the formula based on track.width + track.height + size_policy
      generate_video width/size in the stage
  - they simply do it by changing the size of the Video object
    - all data being updated via the flv metadata
    - i got this already for the rangereq stuff
    - now it is required for the aspect... will require something general
    - so it seems that all video gonna start with this 'lets get mdata before display'
    - more regular this way
- when stopped, comes back to blank screen ?
  - seems good as a default behaviour but it may make the transition less
    smooth in neoip_player_t.js ...
  - currently leave it as such 
- DONE put all the event string as constant
- DONE implement the reporting of the state
  - to be able to query it
  - to be reported on change
- DONE support jscallback_str object parameter from the webpage
- DONE put all the state value as constant in a centralize space
  - instead of spreading their value everywhere

\par Brief Description
Implement a flash player, currently only for flv.
the implementation is rather poor as my knowledge of flash is poor too

\par TODO about kframe and external index
- GOAL: external kframe-index are done to allow kframe-index stored outside the .flv
  - some video sites allow http range-request but dont provide kframe-index inside 
    the flv file itself
  - e.g blit.tv/youporn/dailymotion
- google video status is unclear... 
  - doesnt accept http range-request
  - but there is a variable "begin" which allows to seek ala flv
  - where is the index tho ?
- new variables name per track_t
  - kframe_type = "none|external|internal"
    - this may change if google video got another format for the index
  - rangereq_varname = anything. default to "pos"
    - required if kframe_type != none
- generation the external kframe index: implementation note
  - curl/wget to download the file
  - custom program (aka not neoip_flv.so) to filter flv and extract the position
    - why not neoip_flv.so ?
    - under the principle neoip code MUST NOT be used for infrastructure
    - this is important to keep stuff separated
  - from this output, build a file which is the 'external kframe-index'
- how to get the flash swf to read this file ?
  - pushed raw by the javascript ?
  - an url to this whole file in the track_t ?
  - a php script on the server which provide the byteoffset ?
  - several of the above options ? another ?  
- NOTE: kframe-index is needed IIF track_t.start_time is != 0
  - for neoip-oload 'tv' only the first movie have a start_time != 0
    due to the offset when the user start the stream
  - except the track_t which start_time by default, but it is expected to be rare.

\par About video aspect
- there are 4 kinds of option to tune the aspect
  - ASPECT_FILLED:
    - original aspect conserved
    - fill the output (aka no black/dead zone in the output)
    - scaled to fit the output size
  - ASPECT_FITTED: show the whole video maximizing it to fit the output size
    - original aspect conserved
    - show the whole video (aka with dead-zone if the output aspect is different from video one)
    - scaled to fit the output size
  - ASPECT_ORIGIN: dont change the video dimension, whatever the output size
    - original aspect conserved
    - show the whole video (aka with dead-zone if the output aspect is different from video one)
    - scaled to fit the output size
  - ASPECT_STRETCH: 
    - may change the video aspect (if different from the output one)
    - make the video width/height equal to the output one
    
*/
package neoip.player {
	
// list of all import for this package
import com.mattism.http.xmlrpc.*;
import com.mattism.http.xmlrpc.util.*;

import flash.display.Stage;
import flash.display.StageDisplayState;
import flash.events.Event;
import flash.events.TimerEvent;
import flash.external.ExternalInterface;
import flash.media.Video;
import flash.utils.Timer;

import neoip.debug.console;

/** \brief Class to contain the player itself
 */
public class player_t {

// definition of the fields in this class
private var jscallback_str	:String;	//!< javascript callback name (if null, no callback)
private var jscallback_key	:String;	//!< javascript callback key

private var m_stage		:Stage;
private var m_video		:Video;
private var m_smoothing		:Boolean;	//!< true if smooting is applied to video
private var m_deblocking	:int;		//!< the deblocking valud applied to video
private var m_playlist_loop	:Boolean;

private var m_playlist		:playlist_t;	//!< the current playlist_t 

private var m_player_curtrack	:player_curtrack_t;
private var m_track_idx		:uint;

private var m_sound_vol		:Number;
private var m_sound_pan		:Number;
private var m_sound_mute	:Boolean;

private var kframe_finder_arr	:Array	= new Array;


// TODO fix the duplication between here and in player_curtrack_t.as
public	static const STATE_STOPPED	:String	= "stopped";
public	static const STATE_CONNECTING	:String	= "connecting";
public	static const STATE_BUFFERING	:String	= "buffering";
public	static const STATE_PLAYING	:String	= "playing";

private	static const EVENT_TIME_CHANGE	:String	= "current_time";
private	static const EVENT_STATE_CHANGE	:String	= "state_change";
private	static const EVENT_NEW_CUEPOINT	:String	= "cuepoint";

public	static const ASPECT_FILLED	:String	= "filled";
public	static const ASPECT_FITTED	:String	= "fitted";
public	static const ASPECT_ORIGIN	:String	= "origin";
public	static const ASPECT_STRETCH	:String	= "stretch";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function player_t(p_stage:Stage, p_jscallback_str:String, p_jscallback_key:String)
{
	// log to debug
	console.info("enter");

	// copy the parameter
	jscallback_str	= p_jscallback_str;
	jscallback_key	= p_jscallback_key;
	m_stage		= p_stage;
	
	// init the playlist_t
	m_playlist	= new playlist_t();

	m_sound_vol	= 1.0;
	m_sound_pan	= 0;
	m_sound_mute	= false;
	m_playlist_loop	= true;
	m_smoothing	= false;	// NOTE: if smoothing == true, video.clear() dont work
	// NOTE: experimental use of deblocking - aim to improve video quality
	// - currently set to 2 aka "Uses the Sorenson deblocking filter."
	// - see http://livedocs.adobe.com/labs/flex3/langref/flash/media/Video.html#deblocking
	m_deblocking	= 0; 


	// Add video to stage and use the whole stage
	m_stage.align		= "LT";
	m_stage.scaleMode	= "noScale";
	m_video			= new Video(m_stage.stageWidth, m_stage.stageHeight);
	m_video.smoothing	= m_smoothing;
	m_video.deblocking	= m_deblocking;
	recpu_sizepos();
	m_stage.addChild(m_video);

	// to resize the video on any stage resize
	m_stage.addEventListener	(Event.RESIZE	, onResizeEvent);

	// Add all the callback to be called by javascript
	ExternalInterface.addCallback("current_time"	, fromjs_current_time);
	ExternalInterface.addCallback("current_state"	, fromjs_current_state);
	ExternalInterface.addCallback("playing_start"	, fromjs_playing_start);
	ExternalInterface.addCallback("playing_stop"	, fromjs_playing_stop);

	ExternalInterface.addCallback("set_sound_vol"	, fromjs_set_sound_vol);
	ExternalInterface.addCallback("get_sound_vol"	, fromjs_get_sound_vol);
	ExternalInterface.addCallback("set_sound_pan"	, fromjs_set_sound_pan);
	ExternalInterface.addCallback("get_sound_pan"	, fromjs_get_sound_pan);
	ExternalInterface.addCallback("set_sound_mute"	, fromjs_set_sound_mute);
	ExternalInterface.addCallback("get_sound_mute"	, fromjs_get_sound_mute);

	ExternalInterface.addCallback("flv_kframe_find"	, fromjs_flv_kframe_find);
	ExternalInterface.addCallback("playlist_loop"	, fromjs_playlist_loop);
	ExternalInterface.addCallback("set_smoothing"	, fromjs_set_smoothing);
	ExternalInterface.addCallback("get_smoothing"	, fromjs_get_smoothing);
	ExternalInterface.addCallback("set_deblocking"	, fromjs_set_deblocking);
	ExternalInterface.addCallback("get_deblocking"	, fromjs_get_deblocking);
	ExternalInterface.addCallback("set_fullscreen"	, fromjs_set_fullscreen);
	ExternalInterface.addCallback("get_fullscreen"	, fromjs_get_fullscreen);
	ExternalInterface.addCallback("may_fullscreen"	, fromjs_may_fullscreen);

	ExternalInterface.addCallback("track_add"	, fromjs_track_add);
	ExternalInterface.addCallback("track_del"	, fromjs_track_del);
	ExternalInterface.addCallback("track_get"	, fromjs_track_get);
	ExternalInterface.addCallback("track_count"	, fromjs_track_count);
}

/** \brief Destructor
 */
public function destructor()	:void
{
	if( m_player_curtrack ){
		m_player_curtrack.destructor();
		m_player_curtrack	= null;
	}
	// delete the flv_mdata_loader_t if needed
	while( kframe_finder_arr.length > 0 ){
		var kframe_finder	:flv_kframe_finder_t;
		kframe_finder	= kframe_finder_arr.shift();
		kframe_finder.destructor();;
		kframe_finder	= null;
	}
}

	
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

public function get playlist()	:playlist_t	{ return m_playlist;	}
public function get sound_vol()	:Number		{ return m_sound_vol;	}
public function get sound_pan()	:Number		{ return m_sound_pan;	}
public function get sound_mute():Boolean	{ return m_sound_mute;	}
public function get video_elem():Video		{ return m_video;	}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

private function player_curtrack_cb(event_type	:String, arg:Object)	:void
{
	if( event_type == player_curtrack_t.EVENT_GOT_FLV_MDATA ){
		recpu_sizepos();
		return;
	}
	

	if( event_type == EVENT_STATE_CHANGE && arg['new_type'] == STATE_STOPPED ){
		// stop the current track
		track_stop();
		// compute the next curr_idx
		m_track_idx	= (m_track_idx + 1) % m_playlist.m_track_arr.length;
		// start the new current track
		track_start();
	}

	// simply forward to caller
	notify_callback(event_type, arg);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief Start the track_t at cur_track_idx;
 */
private function track_start()	:void
{
	// sanity check - m_player_curtrack MUST be null at this point
	console.assert( m_player_curtrack == null );
	
	m_player_curtrack	= new player_curtrack_t();
	m_player_curtrack.start(this, m_track_idx, player_curtrack_cb);
	
}

private function track_stop()	:void
{
	// sanity check - m_player_curtrack MUST NOT be null at this point
	console.assert( m_player_curtrack != null );

	// delete m_player_curtrack
	m_player_curtrack.destructor();
	m_player_curtrack	= null;
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//			callback for javascript
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** \brief Return the current position of the playhead within the NetStream
 */
public function	fromjs_current_time()	:Number
{
	// TODO is this function used at all ?!!?!
	
	if( m_player_curtrack == null )			return -1;
	
	// return the current net_stream time
	return m_player_curtrack.track_time;
}

/** \brief Return the current state
 */
public function	fromjs_current_state()	:String
{
	if( m_player_curtrack == null )		return STATE_STOPPED;
	return m_player_curtrack.state;
}

public function	fromjs_playing_start()	:void
{
	console.info("enter");
	track_start();
}
public function	fromjs_playing_stop()	:void
{
	console.info("enter m_video=" + m_video);
	track_stop();

	// TODO bug in flash-player itself
	// - m_video.clear() is not working is m_smoothing == true
	// - dunno how to workaround
	// - i tried to set m_video.smoothing = false just before clear(), it failed
	// - i tried to detach m_video while not playing, but the issue is when i 
	//   reattach it, it show the old image again
	//   - similarly i tried with m_video.alpha=0, which got the same issue as of
	//     when i should put it back to 1.0 again
	// - i suspect a delay is included by the .smoothing = true
	//   - may i should try something which does clear periodically 
	//   - so something like:
	//   1. in playing stop, do m_video.smoothing = false, and start timer
	//   2. on timer expiration, if not playing, do clear
	//   3. on playing start, do m_video.smoothing to m_smoothing
	// - what about the enter_frame stuff, maybe i could do, in 3 frames, clear ?
	m_video.clear();
}


/** \brief Set the playlist as looping or not
 */
public function	fromjs_playlist_loop(value:Boolean)		:void
{
	m_playlist_loop	= value;
}

/** \brief Set video smoothing value
 */
public function	fromjs_set_smoothing(value:Boolean)		:void
{
	// update the local value
	m_smoothing		= value;
	// set the value in m_video.smoothing
	m_video.smoothing	= m_smoothing;
}

/** \brief Set video smoothing value
 */
public function	fromjs_get_smoothing()		:Boolean
{
	return m_smoothing;
}


/** \brief Set video deblocking value
 */
public function	fromjs_set_deblocking(value:int)		:void
{
	// update the local value
	m_deblocking		= value;
	// set the value in m_video.deblocking
	m_video.deblocking	= m_deblocking;
}

/** \brief Set video deblocking value
 */
public function	fromjs_get_deblocking()		:int
{
	return m_deblocking;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			fullscreen API fromjs
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Set flash-player fullscreen status
 */
public function	fromjs_set_fullscreen(value:Boolean)	:void
{
	// if fullscreen is not available on this flash-player, return now
	if( m_stage.displayState == null )	return;

	// set stage.displayState according to the value	
	if( value )	m_stage.displayState = StageDisplayState.FULL_SCREEN;
	else		m_stage.displayState = StageDisplayState.NORMAL;
}

/** \brief get flash-player fullscreen status
 */
public function	fromjs_get_fullscreen()		:Boolean
{
	// return true if flash-player is currently in FULL_SCREEN	
	if( m_stage.displayState == StageDisplayState.FULL_SCREEN )	return true;
	// else return false
	return false;
}

/** \brief get flash-player fullscreen status
 */
public function	fromjs_may_fullscreen()		:Boolean
{
	// if object embeded in html does not have "allowfullscreen" == true, return false
	// - NOTE: "allowfullscreen" is a "param" in the embeded object BUT it seems
	//   to be impossible to get the "param" from flash
	//   - used workaround: to duplicate the "allowfullscreen" = "true" in the 
	//     "variable" of the embeded object and to test them
	if( m_stage.root.loaderInfo.parameters['allowfullscreen'] != "true")	return false;
	// test if the flash-player support fullscreen or not
	if( m_stage.displayState == null )					return false;
	// if all previous tests passed, return true
	return true;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			track API fromjs
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

public function	fromjs_track_add(track_arg:Object, track_idx:Number)	:void
{
	// just forward to the playlist_t
	return m_playlist.track_add(track_arg, track_idx);
}
public function	fromjs_track_del(track_idx:Number)	:void
{
	// just forward to the playlist_t
	return m_playlist.track_del(track_idx);
}
public function	fromjs_track_get(track_idx:Number)	:Object
{
	// just forward to the playlist_t
	return m_playlist.track_get(track_idx);
}
/** \brief Return the number of track in the playlist
 */
public function	fromjs_track_count()		:Object
{
	// just forward to the playlist_t
	return m_playlist.track_count();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			sound API fromjs
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Set the sound volume (between 0 and 1)
 */
public function	fromjs_set_sound_vol(value:Number)	:void
{
	// sanity check - the value MUST be in [0, 1]
	if( value < 0 || value > 1 )
		throw new Error ("sound_vol MUST be between 0 and 1 included");
	// update the local variable
	m_sound_vol	= value;
	// update the soundTransform
	update_sound_transform();
}

/** \brief Return the sound pan between -1 and 1
 */
public function	fromjs_set_sound_pan(value:Number)	:void
{
	// sanity check - the value MUST be in [-1,1]
	if( value < -1 || value > 1 )
		throw new Error ("sound_pan MUST be between -1 and 1 included");
	// update the local variable
	m_sound_pan	= value;
	// update the soundTransform
	update_sound_transform();
}

/** \brief Set the sound mute state
 */
public function	fromjs_set_sound_mute(value:Boolean)	:void
{
	// update the local variable
	m_sound_mute	= value;
	// update the soundTransform
	update_sound_transform();
}

public function	fromjs_get_sound_vol()	:Number	{ return m_sound_vol	};
public function	fromjs_get_sound_pan()	:Number	{ return m_sound_pan	};
public function	fromjs_get_sound_mute()	:Boolean{ return m_sound_mute	};


/** \brief update NetStream SoundTransform with the current values
 * 
 * - MUST be called everytime local variables m_sound_* are modified
 *   - m_sound_mute/m_sound_vol/m_sound_pal
 */ 
public function update_sound_transform()	:void
{
	// if m_player_curtrack == null, do nothing and return now
	if( m_player_curtrack == null )	return;
	// update the sound transform in m_player_curtrack
	m_player_curtrack.update_sound_transform();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Handle the flv_kframe_finder service
// - TODO this is external to the player itself...
// - in fact this is similar to embedui service
// - should be done elsewhere
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the number of track in the playlist
 */
public function	fromjs_flv_kframe_find(wished_time:Number, type_str:String
					, src_uri:String, userptr:String)	:void
{
	var kframe_finder	:flv_kframe_finder_t;
	// start the flv_kframe_finder_t
	kframe_finder	= new flv_kframe_finder_t();
	kframe_finder.start(wished_time, type_str, src_uri, userptr, flv_kframe_finder_cb);
	// put it in the kframe_finder_arr
	kframe_finder_arr.push(kframe_finder);
}

/** \brief Callback for the flv_kframe_finder_t
 * 
 * - TODO between the notifier here and the userptr explicitly inside the function
 *   this start to be dirty and very special case.
 *   - make it more generic
 *   - is it what they call 'delegate'
 */
private function flv_kframe_finder_cb(kframe_finder:flv_kframe_finder_t, userptr:String
					, event_type:String, arg:Object)	:void
{
	// simply forward the result to the javascript
	notify_callback("flv_kframe_find_cb", { "event_type"	: event_type,
						"userptr"	: userptr,
						"result" 	: arg		});
	
	// remove this flv_kframe_finder_t from the kframe_finder_arr
	kframe_finder_arr.splice(kframe_finder_arr.indexOf(kframe_finder), 1);
	// delete the flv_kframe_finder_t
	kframe_finder.destructor();
	kframe_finder	= null;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			resize handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief handle Event.RESIZE on the stage
 */
private function onResizeEvent(event	:Event)	:void
{
	recpu_sizepos();
}


/** \brief callback called on resize event
 */
private function recpu_sizepos()	:void
{
	// if it is not currently playing, do nothing
	if( m_player_curtrack == null )	return;
	
	// get flv_mdata_t from m_player_curtrack
	var flv_mdata	:flv_mdata_t;
	flv_mdata	= m_player_curtrack.flv_mdata;
	// if no flv_mdata_t is available, return now
	if( flv_mdata == null )		return;

	// get the video aspect for the current track
	var curr_aspect	:String;
	curr_aspect	= m_player_curtrack.video_aspect;
	// if this track doesnt specify a video_aspect, default to ASPECT_FILLED
	if( curr_aspect == null )	curr_aspect	= ASPECT_FILLED;
	
	// log to debug
	console.info("track_video_aspect=" + m_player_curtrack.video_aspect);
	console.info("curr_aspect=" + curr_aspect);

	// get fictuous number for the content width/height
	// - TODO to get them from the flv metadata later
	//   - currently this is just a sketch to have the logic behind
//	var content_w:Number	= 320;
//	var content_h:Number	= 240;
	var content_w:Number	= flv_mdata.video_width;
	var content_h:Number	= flv_mdata.video_height;
	var content_r:Number	= content_w / content_h;
	
	var stage_w:Number	= m_stage.stageWidth;
	var stage_h:Number	= m_stage.stageHeight;
	var stage_r:Number	= stage_w / stage_h;
	var video_scale:Number;

	if( curr_aspect == ASPECT_FILLED ){
		if( content_r >= stage_r )	video_scale = stage_h / content_h;
		else				video_scale = stage_w / content_w;
		m_video.width	= content_w * video_scale;
		m_video.height	= content_h * video_scale;
	}else if( curr_aspect == ASPECT_FITTED ){
		if( content_r >= stage_r )	video_scale = stage_w / content_w;
		else				video_scale = stage_h / content_h;
		m_video.width	= content_w * video_scale;
		m_video.height	= content_h * video_scale;
	}else if( curr_aspect == ASPECT_ORIGIN ){
		m_video.width	= content_w;
		m_video.height	= content_h;		
	}else if( curr_aspect == ASPECT_STRETCH ){
		m_video.width	= stage_w;
		m_video.height	= stage_h;		
	}else{
		console.assert(false);
	}
	
	// put the video in the center of the stage - whetever the curr_aspect
	m_video.x	= (stage_w/2) - (m_video.width/2);
	m_video.y	= (stage_h/2) - (m_video.height/2);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			main callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback to notify the javascript callback
 */
private	function notify_callback(event_type:String, arg:Object)	:void
{
	// if no callback is specified, do nothing
	if( jscallback_str == null )	return;
	// else notify the javascript function 
	ExternalInterface.call(jscallback_str, jscallback_key, event_type, arg);
}


}	// end of class 
} // end of package


