/*! \file
    \brief Definition of the class recorder_pip_t

\par Brief Description
recorder_pip_t is use to display neoip_cam_recorder_t output 

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.BitmapData;
import flash.display.Sprite;
import flash.display.Stage;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.media.Video;

import neoip.debug.console;
import neoip.recorder.*;

/** \brief Implement a selection of item in list
 */
public class recorder_pip_t implements embedui_vapi_t {

// definition of the fields in this class
private var m_stage		:Stage;
private var m_callback		:Function;
private var m_userptr		:Object;
private var m_base_opt		:Object;

private var m_video		:Video;
private var m_cam_recorder	:cam_recorder_t;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function recorder_pip_t(p_stage:Stage, p_callback:Function, p_embedui_opt:Object)
{
	// log to debug
	console.info("enter");

	// copy the parameter
	m_stage		= p_stage;
	m_callback	= p_callback
	m_userptr	= p_embedui_opt['userptr'];
	m_base_opt	= p_embedui_opt['base_sprite'];

	// create cam_recorder_t
	m_cam_recorder	= new cam_recorder_t();

	// do a local reference on the cam_recorder_t.mediaVideo	
	m_video		= m_cam_recorder.mediaVideo;

	// add the cam_recoder_t.mediaVideo on the stage
	// - KLUDGE: the 2 here means "between video player and embedui"
	m_stage.addChildAt(m_video, 2);

	// recompute the size and position 
	recpu_sizepos();
	// listen on Event.RESIZE - using the weakreference so removed automatically by gc
	m_stage.addEventListener(Event.RESIZE	, onResizeEvent, false, 0, true);
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// log to debug
	console.info("enter destructor");

	// remove m_video from m_stage
	m_stage.removeChild(m_video);
	
	// delete cam_recorder_t if needed
	if( m_cam_recorder ){
		m_cam_recorder.destructor();
		m_cam_recorder	= null;
		m_video		= null;
	}

	// remove all the event listener
	// - TODO instead use the weak reference in the add
	m_stage.removeEventListener	(Event.RESIZE	, onResizeEvent	);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			update function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief public function to update the behaviour of this object
 */
public function	update(arg:Object)	:void
{
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			resize handler
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief handle Event.RESIZE on the stage
 */
private function onResizeEvent(event	:Event)	:void
{
	recpu_sizepos();
}

/** \brief compute the position and size of the ui element
 */
private function recpu_sizepos()	:void
{
	var stage_w:Number	= m_stage.stageWidth;
	var stage_h:Number	= m_stage.stageHeight;
	// if m_video not yet initialize, do nothing
	if( m_video == null )			return;
	// log to debug
	//console.info("resize_event"			);
	//console.info("width="	+ m_video.width	);	
	//console.info("height="+ m_video.height	);	

	// build aliases on the m_base_opt about the position and size of this button
	var element_x:Number	= m_base_opt['element_x'];
	var element_y:Number	= m_base_opt['element_y'];
	var element_w:Number	= m_base_opt['element_w'];
	var element_h:Number	= m_base_opt['element_h'];
	var anchor_x:Number	= m_base_opt['anchor_x'];
	var anchor_y:Number	= m_base_opt['anchor_y'];

	if( element_w > 0 )	m_video.width	= stage_w * element_w;
	if( element_h > 0 )	m_video.height	= stage_h * element_h;

	// if either element_w or element_h is undefined, deduce it from the other
	var aspect_ratio:Number	= 4/3;
	if( element_h == 0 ){
		console.assert(elemen_w > 0);
		m_bitmap.height	= m_video.width / aspect_ratio;
	}
	if( element_w == 0 ){
		console.assert(elemen_h > 0);
		m_bitmap.width	= m_video.height * aspect_ratio;
	}
	
	// log to debug
	console.info("width="	+ m_video.width	);	
	console.info("height="+ m_video.height	);	
	
	// compute the X coordinate fo the bitmap
	m_video.x	= stage_w * element_x - anchor_x * m_video.width;
	m_video.x	= Math.max(m_video.x, 0 );
	m_video.x	= Math.min(m_video.x, stage_w - m_video.width );

	// compute the Y coordinate fo the bitmap
	m_video.y	= stage_h * element_y - anchor_y * m_video.height;
	m_video.y	= Math.max(m_video.y, 0 );
	m_video.y	= Math.min(m_video.y, stage_h - m_video.height );
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			callback notification
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Notify the caller of a MouseEvent on this object
 */
private function notify_callback(event_type:String, arg:Object)	:void
{
	// sanity check - m_callback MUST be defined
	console.assert( m_callback != null );
	// add the userptr to the arg
	arg['userptr']	= m_userptr;
	// forward the event to the caller
	// TODO this assert is from an old age. modern time is now :)
	// - i think at least :)
	// - i mean "this assert is obsolete"
	console.assert(false, "embedui_cb is not yet suitable for this format");
	m_callback(event_type, arg);	
}

}	// end of class 
} // end of package