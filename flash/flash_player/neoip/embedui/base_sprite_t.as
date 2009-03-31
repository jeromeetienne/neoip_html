/*! \file
    \brief Definition of the class base_sprite_t

\par Brief Description
base_sprite_t is a class to have a common base for many of the button
in neoip.embedui.


- TODO comment it better
- TODO code the base_opt sanity check

\par Documentation on all the base_opt
- alpha_min	= [0,1] the minimum alpha of the bitmap
  - default to 0
- alpha_max	= [0,1] the maximum alpha of the bitmap
  - default to 1
- alpha_inc	= [0,1] the increment for alpha (determine the speed of animation)
  - default to 0.2
- smoothing	= bool	if true, the bitmap will be smoothed
  - default to true
  - slower cpu but better visual
- glowing	= bool	if true, the bitmap will have glow
  - default to true
  - slower cpu but distinct from background

- element_h	= [0,1] determine the X position of the 'anchor' within the *stage*
  - default to 0
- element_w	= [0,1] determine the bitmap width as a ratio of stage width
  - no default
  

- element_x	= [0,1]	determine the X position of the 'anchor' within the *stage*
  - no default
- element_y	= [0,1]	determine the Y position of the 'anchor' within the *stage*
  - no default
- anchor_x	= [0,1]	determine the X position of the 'anchor' within the *bitmap*
  - default to 0.5 (aka the center of the bitmap)
- anchor_y	= [0,1]	determine the Y position of the 'anchor' within the *bitmap*
  - default to 0.5 (aka the center of the bitmap)

- display_type	= determine the type of display for this bitmap
  - "always" means it is always visible
  - "mouse_over" mean it is visible only when the mouse is over it
  - "timeout" mean it is visible only during this timeout
    - base_opt['timeout_delay'] giving the delay in msec

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.Bitmap;
import flash.display.Sprite;
import flash.display.Stage;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.events.TimerEvent;
import flash.filters.BitmapFilterQuality;
import flash.filters.GlowFilter;
import flash.utils.Timer;

import neoip.debug.console;

/** \brief Class to have button which appears only when the mouse it on it
 */
public class base_sprite_t {

// definition of the fields in this class
private var m_stage	:Stage;
private var m_container	:Sprite;

private var m_bitmap	:Bitmap;

private var m_state	:String;
private var m_alpha	:Number	= -1;	//!< always equal to m_bitmap.alpha
private var m_callback	:Function;
private var m_userptr	:Object;
private var m_base_opt	:Object;

private var m_display_timeout	:Timer;	

private	var base_opt_dfl	:Object	= {
					"element_h"	: 0.0,
					"anchor_x"	: 0.5, 
					"anchor_y"	: 0.5,
					"alpha_min"	: 0.0,
					"alpha_max"	: 1.0,
					"alpha_inc"	: 0.2,
					"smoothing"	: true,
					"mouse_action"	: true,
					"glowing"	: true
				}; 

// constant for the various state
public	static const STATE_APPEARING	:String	= "appearing";
public	static const STATE_VISIBLE	:String	= "visible";
public	static const STATE_DISAPPEARING	:String	= "disappearing";
public	static const STATE_INVISIBLE	:String	= "invisible";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function base_sprite_t(p_stage:Stage, p_base_opt:Object, p_callback:Function
							, p_userptr:Object)
{
	// copy the parameters
	m_stage		= p_stage;
	m_callback	= p_callback;
	m_userptr	= p_userptr;

	// copy the parameter
	// - TODO do strict sanity check on the m_io_opt
	m_base_opt	= p_base_opt;
	// put the default value in m_base_opt if needed
	for(var opt_key:String in base_opt_dfl){
		if( m_base_opt[opt_key] != null )	continue;
		m_base_opt[opt_key]	= base_opt_dfl[opt_key];
	}

	// sanity check - alpha_min MUST be <= than alpha_max
	console.assert( m_base_opt['alpha_min'] <= m_base_opt['alpha_max']
					, "alpha_min MUST be <= than alpha_max" );

	// TODO handle a m_base_opt['alpha_dec'] ?
	// - if not provided here, copy the ['alpha_inc'] to 'alpha_dec'


	// set m_state according to m_base_opt['display_type']
	if( m_base_opt['display_type'] == "always" ){
		m_state	= STATE_VISIBLE;
	}else if( m_base_opt['display_type'] == "mouse_over" ){
		m_state = STATE_INVISIBLE;
	}else if( m_base_opt['display_type'] == "timeout" ){
		m_state = STATE_APPEARING;
	}else { console.assert(false, "Unknown display_type=" + m_base_opt['display_type']);}
	
	// init m_container 
	m_container	= new Sprite();
	

	// add a Glowfilter to 'separate' the bitmap from the background
	// - TODO the power of the glow should be in function of the screen size
	//   - else the glow appear much more powerfull on small screen
	if( m_base_opt['glowing'] ){
		var filter	:GlowFilter	= new GlowFilter();
		filter.color	= 0x000000;
		filter.alpha	= 0.8;
		filter.blurX	= 5;
		filter.blurY	= 5;
		filter.strength	= 2;
		filter.inner	= false;
		filter.knockout	= false;
		filter.quality	= BitmapFilterQuality.HIGH;
		m_container.filters	= new Array(filter);
	}

		
	// add m_container to m_stage and listen on Event.RESIZE
	m_stage.addChild(m_container);
	m_stage.addEventListener	(Event.RESIZE		, onResizeEvent		);


	// enable DOUBLE_CLICK - this is required to get event forward to lower layers
	m_container.doubleClickEnabled	= true;
	// reset the mouse_action
	reset_mouse_action();

	// listen on MOUSE_OVER/MOUSE_OUT iif m_base_opt['display_type'] = "mouse_over"
	if( m_base_opt['display_type'] == "mouse_over" ){
		m_container.addEventListener(MouseEvent.MOUSE_OVER	, onMouseOver);
		m_container.addEventListener(MouseEvent.MOUSE_OUT	, onMouseOut);
	}
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// log to debug
	console.debug("enter destructor");

	// remove m_container from m_stage
	m_stage.removeChild(m_container);

	// delete m_display_timeout if needed
	if( m_display_timeout ){
		m_display_timeout.stop();
		m_display_timeout	= null;
	}

	// remove all the event listener
	// - TODO instead use the weak reference in the add
	m_stage.removeEventListener	(Event.RESIZE		, onResizeEvent		);
	m_container.removeEventListener	(MouseEvent.MOUSE_OVER	, onMouseOver		);
	m_container.removeEventListener	(MouseEvent.MOUSE_OUT	, onMouseOut		);
	m_container.removeEventListener	(Event.ENTER_FRAME	, onEnterFrame		);
	m_container.removeEventListener	(MouseEvent.MOUSE_WHEEL	, notify_mouse_event	);
	m_container.removeEventListener	(MouseEvent.CLICK	, notify_mouse_event	);
	m_container.removeEventListener	(MouseEvent.DOUBLE_CLICK, notify_mouse_event	);
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
	// sanity check - arg['action'] MUST be defined
	console.assert(arg['action'], "arg MUST contain an 'action'");
	// handle it according to the arg['action'] command
	if( arg['action'] == "base_update_opt" ){
		update_base_opt(arg['arg']);
	}else if( arg['action'] == "base_reset_state" ){
		update_reset_state(arg['arg']);
	}else{	console.assert(false, "unknown action=" + arg['action']);	}
}

/** \brief Handle an update for m_base_opt
 */
private function update_base_opt(arg:Object)	:void
{
	// log to debug
	console.debug("enter");
	// put the default value in m_base_opt if needed
	for(var opt_key:String in arg){
		m_base_opt[opt_key]	= arg[opt_key];
	}
	
	// TODO check if the new m_base_opt match the current state
	// - e.g. i know there is an issue with timeout appearance.
	//   - aka it display = timeout, relaunch the timeout
	//   - and be appearing


	// reset the mouse_action - just in case it has been changed
// TODO dont work for now
//	reset_mouse_action();

	// TODO to comment 
	recpu_sizepos();
}

/** \brief Handle a change for m_state
 */
private function update_reset_state(arg:Object)	:void
{
	// log to debug
	console.debug("enter");
	
	// set the new_state
	m_state	= arg['new_state'];
	// sanity check - the new_state MUST be valid
	console.assert( state_is_valid() );
	
	// recompute the m_alpha according to the new state
	m_alpha		= initial_alpha_from_state();
	// update m_bitmap.alpha with m_alpha
	m_bitmap.alpha	= m_alpha;
	
	
	// if start listening on Event.ENTER_FRAME to do the animation
	if( state_is_unstable() && !m_container.hasEventListener(Event.ENTER_FRAME) ){
		m_container.addEventListener(Event.ENTER_FRAME	, onEnterFrame);
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

private function state_is_valid()	:Boolean
{
	if( m_state == STATE_APPEARING )	return true;
	if( m_state == STATE_VISIBLE )		return true;
	if( m_state == STATE_DISAPPEARING )	return true;
	if( m_state == STATE_INVISIBLE )	return true;
	return false;
}

/** \brief return true if m_state is stable, false otherwise
 * 
 * - stable state means that the bitmap is not animated
 */
private function state_is_stable()	:Boolean
{
	if( m_state == STATE_VISIBLE )		return true;
	if( m_state == STATE_INVISIBLE )	return true;
	return false;
}

/** \brief return true if m_state is unstable, false otherwise
 * 
 * - unstable state means that the bitmap is animated
 */
private function state_is_unstable()	:Boolean
{
	return !state_is_stable();
}

/** \brief Return the initial alpha from the state in parameter
 * 
 * - TODO put this function elsewhere
 */
private function initial_alpha_from_state()	:Number
{
	// if there is no old_alpha, set it to the initial value depending
	if( m_state == STATE_APPEARING )	return m_base_opt['alpha_min'];
	else if( m_state == STATE_VISIBLE )	return m_base_opt['alpha_max'];
	else if( m_state == STATE_DISAPPEARING)	return m_base_opt['alpha_max'];
	else if( m_state == STATE_INVISIBLE )	return m_base_opt['alpha_min'];
	// NOTE: this point MUST never be reached
	console.assert(false);
	return -1;
}


/** \brief re-set all the MouseEvent listener depending on m_base_opt['mouse_action']
 */
private function reset_mouse_action()	:void
{
	// add listener if 'mouse_action' is true
	if( m_base_opt['mouse_action'] == true ){
		m_container.addEventListener	(MouseEvent.MOUSE_WHEEL	, notify_mouse_event	);
		m_container.addEventListener	(MouseEvent.CLICK	, notify_mouse_event	);
		m_container.addEventListener	(MouseEvent.DOUBLE_CLICK, notify_mouse_event	);
	}
	// remove listener if 'mouse_action' is false
	if( m_base_opt['mouse_action'] == false ){
		m_container.removeEventListener	(MouseEvent.MOUSE_WHEEL	, notify_mouse_event	);
		m_container.removeEventListener	(MouseEvent.CLICK	, notify_mouse_event	);
		m_container.removeEventListener	(MouseEvent.DOUBLE_CLICK, notify_mouse_event	);
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Set/update the current m_bitmap 
 * 
 * - used by all the derived classes
 */
protected function set_bitmap(p_bitmap:Bitmap)	:void
{
	// if there is already a m_bitmap, remove it
	if( m_bitmap ){
		// detach it from m_container
		m_container.removeChild(m_bitmap);
	}else{
		// if this is the first m_bitmap, initialize the m_alpha
		m_alpha	= initial_alpha_from_state();
	}
	
	// copy the paramter
	m_bitmap	= p_bitmap;
	// update m_bitmap.alpha with m_alpha
	m_bitmap.alpha	= m_alpha;
	
	// set m_bitmap.smoothing according to m_base_opt
	m_bitmap.smoothing	= m_base_opt['smoothing'];
	// add the m_bitmap to m_container
	m_container.addChild(m_bitmap);
	// recompute the size and position 
	recpu_sizepos();
	
	// if start listening on Event.ENTER_FRAME to do the animation
	if( state_is_unstable() && !m_container.hasEventListener(Event.ENTER_FRAME) ){
		m_container.addEventListener(Event.ENTER_FRAME	, onEnterFrame);
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//	m_display_timeout callback IIF m_io_opt['display_type'] = "timeout"
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for the m_display_timeout
 */
private function display_timeout_cb(event :TimerEvent)	:void
{
	// log to debug
	console.debug("enter");
	// delete m_display_timeout
	m_display_timeout.stop();
	m_display_timeout	= null;
	
	// if m_state is STATE_INVISIBLE or STATE_DISAPPEARING, leave now
	if( m_state == STATE_INVISIBLE )	return;
	if( m_state == STATE_DISAPPEARING )	return;
	
	// set m_state to STATE_DISAPPEARING
	m_state	= STATE_DISAPPEARING;
	// start listening on Event.ENTER_FRAME to do the animation
	if( !m_container.hasEventListener(Event.ENTER_FRAME) ){
		m_container.addEventListener(Event.ENTER_FRAME	, onEnterFrame);
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//	event handling for m_base_opt['display_type'] = "mouse_over"
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
      
/** \brief Handle MOUSE_OVER event
 */
private function onMouseOver(mouce_event:MouseEvent)	:void
{
	// if m_state is STATE_INVISIBLE, goto STATE_APPEARING
	if( m_state == STATE_INVISIBLE ){
		m_state	= STATE_APPEARING;
		// start listening on Event.ENTER_FRAME to do the animation
		if( !m_container.hasEventListener(Event.ENTER_FRAME) ){
			m_container.addEventListener(Event.ENTER_FRAME	, onEnterFrame);
		}
	}
}

/** \brief Handle MOUSE_OUT event
 */
private function onMouseOut(mouse_event	:MouseEvent)	:void
{
	// if m_state is STATE_INVISIBLE or STATE_APPEARING, goto STATE_DISAPPEARING
	if( m_state == STATE_VISIBLE || m_state == STATE_APPEARING ){
		m_state	= STATE_DISAPPEARING;
		// start listening on Event.ENTER_FRAME to do the animation
		if( !m_container.hasEventListener(Event.ENTER_FRAME) ){
			m_container.addEventListener(Event.ENTER_FRAME	, onEnterFrame);
		}
	}
}

/** \brief Handle the Event.ENTER_FRAME (for and only during the animation)
 */
private function onEnterFrame(event	:Event)	:void
{
	// log to debug
	console.debug('onEnterFrame='+m_state);
	// if m_bitmap not yet initialize, do nothing
	if( m_bitmap == null )			return;
	
	// if STATE_APPEARING, increase m_alpha
	if( m_state == STATE_APPEARING )	m_alpha	+= m_base_opt['alpha_inc'];
	// if STATE_DISAPPEARING, decrease m_alpha
	if( m_state == STATE_DISAPPEARING )	m_alpha	-= m_base_opt['alpha_inc'];
	
	// if m_alpha is >= m_base_opt['alpha_max'], it is now considered STATE_VISIBLE
	if( m_alpha >= m_base_opt['alpha_max'] ){
		m_state	= STATE_VISIBLE;
		m_alpha	= m_base_opt['alpha_max'];	
	}
	// if m_alpha is <= m_base_opt['alpha_min'], it is now considered STATE_INVISIBLE
	if( m_alpha <= m_base_opt['alpha_min'] ){
		m_state	= STATE_INVISIBLE;
		m_alpha	= m_base_opt['alpha_min'];
	}

	// update m_bitmap.alpha with m_alpha
	m_bitmap.alpha	= m_alpha;

	// if m_base_opt['display_type'] == "timeout", start/reinit the timer
	if( m_state == STATE_VISIBLE && m_base_opt['display_type'] == "timeout" ){
		// delete m_display_timeout if needed
		if( m_display_timeout ){
			m_display_timeout.stop();
			m_display_timeout	= null;
		}
		// initialize m_display_timeout
		m_display_timeout	= new Timer(m_base_opt['timeout_delay']);
		m_display_timeout.addEventListener(TimerEvent.TIMER, display_timeout_cb);
		m_display_timeout.start();
	}
	
	// if m_state is not an animated one, stop listening on frame event 
	// - this avoid to uselessly consume cpu
	if( m_state == STATE_VISIBLE || m_state == STATE_INVISIBLE ){
		m_container.removeEventListener(Event.ENTER_FRAME, onEnterFrame);
	}
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
	// if m_bitmap not yet initialize, do nothing
	if( m_bitmap == null )			return;
	// log to debug
	//console.info("resize_event"			);
	//console.info("width="	+ m_bitmap.width	);	
	//console.info("height="+ m_bitmap.height	);	

	// build aliases on the m_base_opt about the position and size of this button
	var element_x:Number	= m_base_opt['element_x'];
	var element_y:Number	= m_base_opt['element_y'];
	var element_w:Number	= m_base_opt['element_w'];
	var element_h:Number	= m_base_opt['element_h'];
	var anchor_x:Number	= m_base_opt['anchor_x'];
	var anchor_y:Number	= m_base_opt['anchor_y'];

	if( element_w > 0 )	m_bitmap.width	= stage_w * element_w;
	if( element_h > 0 )	m_bitmap.height	= stage_h * element_h;
	
	// log to debug
	//console.info("width="	+ m_bitmap.width	);	
	//console.info("height="+ m_bitmap.height	);	
	
	if( element_h == 0 ){
		m_bitmap.height	= m_bitmap.bitmapData.height * (m_bitmap.width / m_bitmap.bitmapData.width);
	}
	if( element_w == 0 ){
		m_bitmap.width	= m_bitmap.bitmapData.width * (m_bitmap.height / m_bitmap.bitmapData.height);
	}

	// compute the X coordinate fo the bitmap
	m_bitmap.x	= stage_w * element_x - anchor_x * m_bitmap.width;
	m_bitmap.x	= Math.max(m_bitmap.x, 0 );
	m_bitmap.x	= Math.min(m_bitmap.x, stage_w - m_bitmap.width );

	// compute the W coordinate fo the bitmap
	m_bitmap.y	= stage_h * element_y - anchor_y * m_bitmap.height;
	m_bitmap.y	= Math.max(m_bitmap.y, 0 );
	m_bitmap.y	= Math.min(m_bitmap.y, stage_h - m_bitmap.height );
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			callback notification
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief Notify the caller of a MouseEvent on this object
 */
private function notify_mouse_event(mouse_event	:MouseEvent)	:void
{
	var event_type	:String	= mouse_event.type;
	var arg		:Object	= {};
	// stop the propagation of this event
	mouse_event.stopPropagation();	
	// if event_type == "mouseWheel", add its direction in cb_arg
	if( event_type == "mouseWheel" )	arg['wheel_delta'] = mouse_event.delta;
	// forward the event to the caller
	notify_callback(event_type, arg);	
}

/** \brief Notify the caller of a MouseEvent on this object
 */
private function notify_callback(event_type:String, arg:Object)	:void
{
	// sanity check - m_callback MUST be defined
	console.assert( m_callback != null );
	// add the userptr to the arg
	arg['userptr']		= m_userptr;
	// forward the event to the caller
	m_callback(event_type, arg);	
}

}	// end of class 
} // end of package