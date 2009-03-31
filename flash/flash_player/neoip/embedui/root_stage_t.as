/*! \file
    \brief Definition of the class root_stage_t

\par Brief Description
root_stage_t is a class to handle mouse_event at the stage level.
- it detect MouseEvent.CLICK, MouseEvent.MOUSE_WHEEL, and MouseEvent.DOUBLE_CLICK
- additionnaly it has a detection of mouse movement.

\par About mouse movement detection
- it done with 2 states: idle_detect and move_detect
- idle_detect: try to detect if the mouse position is idle
  - if periodically probe the current mouse position
  - if it isnt changing for a given number of probe, the mouse position is
    considered stable and it switch to move_detect
- move_detect: try to detect if the mouse position is moving
  - it listen on the stage MOUSE_MOVE
  - as soon as the event is triggered, it switch back to idle_detect
- About cpu usage - coded to have negligible cpu usage
  - idle_detect run only a small code once every few seconds, so the cpu usage may
    be considered negligible
  - move_detect listen on a MOUSE_MOVE event but stop listening as soon as a single
    move is detected. so the cpu usage may be considered negligible

\par About element_opt
- mouse_visibility	: determine the mouse pointer is visible or not
  - valid value are "hide" or "show"
  - default to "show"

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.Stage;
import flash.events.MouseEvent;
import flash.events.TimerEvent;
import flash.ui.Mouse;
import flash.utils.Timer;

import neoip.debug.console;


/** \brief TODO to comment
 */
public class root_stage_t implements embedui_vapi_t {

// definition of the fields in this class
private var m_stage		:Stage;
private var m_callback		:Function;
private var m_userptr		:Object;

private var m_element_opt	:Object;
private var m_last_mouse_x	:uint;
private var m_last_mouse_y	:uint;

private var m_probe_timeout	:Timer;	
private var m_probe_delay	:Number	= 1.0 * 1000;
private var m_probe_count_cur	:uint	= 0; 
private var m_probe_count_max	:uint	= 3; 

private	var element_opt_dfl	:Object	= {
					"mouse_visibility"	: "show"
				}; 
				
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function root_stage_t(p_stage:Stage, p_callback:Function, p_embedui_opt:Object)
{
	// log to debug
	console.debug("enter");
	
	// copy the parameter
	m_stage		= p_stage;
	m_callback	= p_callback
	m_userptr	= p_embedui_opt['userptr'];

	// copy the parameter
	// - TODO do strict sanity check on the m_io_opt
	m_element_opt	= p_embedui_opt['element_opt'];
	// put the default value in m_element_opt if needed
	for(var opt_key:String in element_opt_dfl){
		if( m_element_opt[opt_key] != null )	continue;
		m_element_opt[opt_key]	= element_opt_dfl[opt_key];
	}
	
	// start the idle_detect
	idle_detect_start();
		
	// listen on various MouseEvent - using weakreference so removed automatically by gc
	m_stage.doubleClickEnabled	= true;
	m_stage.addEventListener	(MouseEvent.MOUSE_WHEEL	, onMouseWheel	, false, 0, true);
	m_stage.addEventListener	(MouseEvent.CLICK	, onMouseClick	, false, 0, true);
	m_stage.addEventListener	(MouseEvent.DOUBLE_CLICK, onMouseDClick	, false, 0, true);
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// log to debug
	console.debug("enter destructor");

	// always make the mouse pointer visible when leaving
	Mouse.show();

	// stop idle/move detection
	idle_detect_stop();
	move_detect_stop();
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
	console.assert(arg['action']);
	// handle it according to the arg['action'] command
	if( arg['action'] == "element_update_opt" ){
		update_element_opt(arg['arg']);
	}else if( arg['action'] == "element_reset_state" ){
		update_reset_state(arg['arg']);
	}else{	console.assert(false, "unknown action=" + arg['action']);	}
}

private function update_element_opt(update_opt:Object)	:void
{
	// log to debug
	console.debug("enter");
	// update m_element_opt with update_opt
	for(var opt_key:String in update_opt){
		m_element_opt[opt_key]	= update_opt[opt_key];
	}
	// reset_mouse_visibility - in case the update changed it
	reset_mouse_visibility();	
}

private function update_reset_state(arg	:Object)	:void
{
	var new_state:String	= arg['new_state'];
	// sanity check - new_state MUST be either "idle_detect" or "move_detect"
	console.assert(new_state == "idle_detect" || new_state == "move_detect"
					, "invalid new_state=" + new_state);
	// log to debug
	console.debug("enter");

	// stop the current state
	idle_detect_stop();
	move_detect_stop();
	// start the new state
	if(new_state == "idle_detect")	idle_detect_start();
	if(new_state == "move_detect")	move_detect_start();
}

/** \brief set the mouse pointer visibility according to m_element_opt['mouse_visibility']
 */ 
private function reset_mouse_visibility()	:void
{
	// if mouse_visibility is "hide", hide the mouse pointer
	if( m_element_opt['mouse_visibility'] == "hide" )	Mouse.hide();		
	// if mouse_visibility is "show", show the mouse pointer
	if( m_element_opt['mouse_visibility'] == "show" )	Mouse.show();		
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			handle idle_detect
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start the idle_detect
 */
private function idle_detect_start()	:void
{
	// log to debug
	console.debug("Start idle_detect");

	// reset the m_probe_count_cur
	m_probe_count_cur	= 0;
	
	// set the m_last_mouse_xy to the current m_stage.mouseXY
	m_last_mouse_x	= m_stage.mouseX;
	m_last_mouse_y	= m_stage.mouseY;

	// sanity check - m_probe_timeout MUST be null
	console.assert(m_probe_timeout == null);
	// start m_probe_timeout
	m_probe_timeout	= new Timer(m_probe_delay);
	m_probe_timeout.addEventListener(TimerEvent.TIMER, probe_timeout_cb);
	m_probe_timeout.start();	
}

/** \brief Stop the idle_detect
 */
private function idle_detect_stop()	:void
{
	// log to debug
	console.debug("Stop idle_detect");
	// delete m_probe_timeout if needed
	if( m_probe_timeout ){
		m_probe_timeout.stop();
		m_probe_timeout	= null;
	}
}

/** \brief Callback for the m_probe_timeout
 */
private function probe_timeout_cb(event :TimerEvent)	:void
{
	// log to debug
	console.debug("enter");
	// delete m_probe_timeout
	m_probe_timeout.stop();
	m_probe_timeout	= null;

	// log to debug
	//console.info("m_last_mouse_x=" + m_last_mouse_x);
	//console.info("m_last_mouse_y=" + m_last_mouse_y);
	//console.info("m_stage.mouseX=" + m_stage.mouseX);
	//console.info("m_stage.mouseY=" + m_stage.mouseY);

	// test if the mouse position changed
	var mouse_pos_changed	:Boolean	= false;
	if( m_last_mouse_x != m_stage.mouseX )	mouse_pos_changed = true;
	if( m_last_mouse_y != m_stage.mouseY )	mouse_pos_changed = true;

	// set the m_last_mouse_xy to the current m_stage.mouseXY
	m_last_mouse_x	= m_stage.mouseX;
	m_last_mouse_y	= m_stage.mouseY;

	// if mouse_pos_changed, then reset m_probe_count_cur
	if( mouse_pos_changed )		m_probe_count_cur = 0;
	// if not mouse_pos_changed, then increase m_probe_count_cur
	if( !mouse_pos_changed )	m_probe_count_cur++;

	// log to debug
	console.debug("mouse_pos_changed="+mouse_pos_changed
			+ " m_probe_count_cur=" + m_probe_count_cur
			+ " m_probe_count_max=" + m_probe_count_max
			);

	// if m_probe_count_cur == m_probe_count_max, the mouse is considered "not moving"
	if( m_probe_count_cur == m_probe_count_max ){
		// goto move_detect
		move_detect_start();
		// notify the caller
		notify_callback("changed_state", { "new_state": "move_detect"	} );
		return;
	}

	// start m_probe_timeout for the next probe
	m_probe_timeout	= new Timer(m_probe_delay);
	m_probe_timeout.addEventListener(TimerEvent.TIMER, probe_timeout_cb);
	m_probe_timeout.start();	
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			handle the move_detect
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Start the move_detect
 */
private function move_detect_start()	:void
{
	// log to debug
	console.debug("Start move_detect");
	// listen on MOUSE_MOVE - using weakreference so removed automatically by gc
	m_stage.addEventListener(MouseEvent.MOUSE_MOVE	, onMouseMove	, false, 0, true);
}

/** \brief Stop the move_detect
 */
private function move_detect_stop()	:void
{
	// log to debug
	console.debug("Stop move_detect");
	// stop listening on the event
	m_stage.removeEventListener(MouseEvent.MOUSE_MOVE, onMouseMove	, false);
}

/** \brief handle the MouseEvent.MOUSE_MOVE
 */
private function onMouseMove(mouse_event	:MouseEvent)	:void
{
	// log to debug
	console.debug("enter MOUSE MOVING");
	// stop  the move_detect
	move_detect_stop();
	// start the idle_detect
	idle_detect_start();
	// notify the caller
	notify_callback("changed_state", { "new_state": "idle_detect"	} );
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			mouse_event handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief handle the MouseEvent.MOUSE_WHEEL
 */
private function onMouseWheel(mouse_event	:MouseEvent)	:void
{
	notify_mouse_event(mouse_event);
}

/** \brief handle the MouseEvent.CLICK
 */
private function onMouseClick(mouse_event	:MouseEvent)	:void
{
	notify_mouse_event(mouse_event);
}

/** \brief handle the MouseEvent.DOUBLE_CLICK
 */
private function onMouseDClick(mouse_event	:MouseEvent)	:void
{
	notify_mouse_event(mouse_event);
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
	// if event_type == "mouseWheel", add its direction in cb_arg
	if( event_type == "mouseWheel" )	arg['wheel_delta'] = mouse_event.delta;
	// forward the event to the caller
	notify_callback(event_type, arg);	
}

/** \brief Notify the caller of a MouseEvent on this object
 */
private function notify_callback(event_type	:String, arg	:Object)	:void
{
	var item_arr	:Array	= m_element_opt['item_arr'];
	// sanity check - m_callback MUST be defined
	console.assert( m_callback != null, "m_callback is not provided" );
	// add the userptr to the arg
	arg['userptr']		= m_userptr;
	// forward the event to the caller
	m_callback(event_type, arg);	
}

}	// end of class 
} // end of package