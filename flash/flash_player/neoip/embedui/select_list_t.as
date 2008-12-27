/*! \file
    \brief Definition of the class select_list_t

\par Brief Description
select_list_t is a class to have bitmap button.
TODO to comment

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.Sprite;
import flash.display.Stage;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.filters.BitmapFilterQuality;
import flash.filters.GlowFilter;
import flash.text.TextField;
import flash.text.TextFormat;
import flash.text.TextFormatAlign;

import neoip.debug.console;


/** \brief Implement a selection of item in list
 */
public class select_list_t implements embedui_vapi_t {

// definition of the fields in this class
private var m_stage		:Stage;
private var m_callback		:Function;
private var m_userptr		:Object;

private var m_selected_idx	:int;
private var m_box		:Sprite;
private var m_bar		:Sprite;
private var m_element_opt	:Object;

// determine the size at which this is drawn before being scaled on the stage
public	static const BASE_W	:Number	= 1024;
public	static const BASE_H	:Number	= 768;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function select_list_t(p_stage:Stage, p_callback:Function, p_embedui_opt:Object)
{
	// log to debug
	console.debug("enter");
	
	// copy the parameter
	m_stage		= p_stage;
	m_callback	= p_callback
	m_userptr	= p_embedui_opt['userptr']; 
	m_element_opt	= p_embedui_opt['element_opt'];
	
	// init m_selected_idx
	m_selected_idx	= m_element_opt['selected_idx'];

	// sanity check - item_arr MUST NOT be empty
	console.assert( m_element_opt['item_arr'].length > 0 );


	// clamp m_selected_idx to the possible values
	m_selected_idx	= Math.max(m_selected_idx, 0);
	m_selected_idx	= Math.min(m_selected_idx, m_element_opt['item_arr'].length-1);

	// listen on Event.RESIZE - using the weakreference so removed automatically by gc
	m_stage.addEventListener(Event.RESIZE	, onResizeEvent, false, 0, true);
	
	// put that according to the stage dimension
	var item_w	:Number	= BASE_W * m_element_opt['item_w'];
	var item_h	:Number	= BASE_H * m_element_opt['item_h'];
	var box_t	:Number	= BASE_W * m_element_opt['box_t'];
	var margin_w	:Number	= BASE_W * m_element_opt['margin_w'];
	var margin_h	:Number	= BASE_H * m_element_opt['margin_h'];
	var font_size	:Number	= BASE_W * m_element_opt['font_size'];

	// create m_bar Sprite
	m_bar			= new Sprite();
	m_bar.cacheAsBitmap	= true;
	m_stage.addChild(m_bar);
	// draw data into m_bar
	draw_bar();

	// create m_box Sprite
	m_box			= new Sprite;
	m_box.cacheAsBitmap	= true;
	m_stage.addChild(m_box);
	// draw data into m_box
	draw_box();

	recpu_sizepos();
	
	// listen on various MouseEvent - using weakreference so removed automatically by gc
	m_box.addEventListener(MouseEvent.MOUSE_WHEEL	, box_onMouseWheel, false, 0, true);
	m_box.addEventListener(MouseEvent.CLICK		, box_onMouseClick, false, 0, true);
	m_bar.addEventListener(MouseEvent.CLICK		, bar_onMouseClick, false, 0, true);
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// log to debug
	console.debug("enter destructor");
	
	// remove m_bar from m_stage
	m_stage.removeChild(m_bar);
	// remove m_box from m_stage
	m_stage.removeChild(m_box);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief Draw the bar
 */
private function draw_bar()	:void
{
	// put that according to the stage dimension
	var item_w	:Number	= BASE_W * m_element_opt['item_w'];
	var item_h	:Number	= BASE_H * m_element_opt['item_h'];
	var box_t	:Number	= BASE_W * m_element_opt['box_t'];

	m_bar.graphics.beginFill(0xFF0000);
	m_bar.graphics.drawRect	(0,0, item_w, item_h);
	m_bar.graphics.moveTo	(0,0);
	m_bar.graphics.curveTo	(-item_h*2 - box_t, item_h/2, 0, item_h);
	m_bar.graphics.moveTo	(item_w,0);
	m_bar.graphics.curveTo	(item_w+item_h*2, item_h/2, item_w, item_h);
	m_bar.graphics.endFill	();
	
	// make m_bar slightly transparent
	m_bar.alpha	= 0.8;
}

/** \brief Draw the box
 */
private function draw_box()	:void
{
	// put that according to the stage dimension
	var item_w	:Number	= BASE_W * m_element_opt['item_w'];
	var item_h	:Number	= BASE_H * m_element_opt['item_h'];
	var box_t	:Number	= BASE_W * m_element_opt['box_t'];
	var margin_w	:Number	= BASE_W * m_element_opt['margin_w'];
	var margin_h	:Number	= BASE_H * m_element_opt['margin_h'];
	var font_size	:Number	= BASE_W * m_element_opt['font_size'];
	var item_arr	:Array	= m_element_opt['item_arr'];
	
	// put all the text inside the box
	for(var j:uint = 0; j < item_arr.length; j++ ){
		// build the TextField
		var textfield		:TextField;
		textfield		= new TextField();
		textfield.multiline	= true;
		textfield.selectable	= false;
		textfield.autoSize	= "left";
		textfield.text		= item_arr[j]['display_text'];
	
		// build the TextFormat
		var text_format		:TextFormat;
		text_format		= new TextFormat();
		text_format.font	= "Arial, Verdana, Helvetica, Sans, Bitstream Vera Sans";
		text_format.size	= font_size;
		text_format.bold	= false;
		if( item_arr[j]['color'] )	text_format.color = item_arr[j]['color'];
		else				text_format.color = 0xFFFFFF;
		text_format.align	= TextFormatAlign.LEFT;
		textfield.setTextFormat(text_format);
		
		// determine the position of the textfield
		textfield.x	= margin_w;
		textfield.y	= margin_h + j * item_h;
		
		// add the textfield to the m_box
		m_box.addChild(textfield);
	}
	
	// build the frame of the box
	for(var i:uint = 0; i < item_arr.length; i++ ){
		m_box.graphics.lineStyle(box_t	, 0x888888);
		m_box.graphics.beginFill(0,0);
		m_box.graphics.drawRect(0, i*item_h, item_w, item_h);
	}

	// add a Glowfilter to 'separate' the bitmap from the background
	// - TODO the power of the glow should be in function of the screen size
	//   - else the glow appear much more powerfull on small screen
	var filter	:GlowFilter	= new GlowFilter();
	filter.color	= 0x000000;
	filter.alpha	= 0.8;
	filter.blurX	= 5;
	filter.blurY	= 5;
	filter.strength	= 2;
	filter.inner	= false;
	filter.knockout	= false;
	filter.quality	= BitmapFilterQuality.HIGH;
	m_box.filters	= new Array(filter);
}

/** \brief re-set the Event.ENTER_FRAME listener depending of m_box.y and m_selected_idx
 */
private function reset_enterFrame_listener()	:void
{
	var is_stable	:Boolean	= Math.abs(m_box.y - cpu_theorical_box_y()) <= 0.5;
	var do_listen	:Boolean	= m_box.hasEventListener(Event.ENTER_FRAME);

	// if the y position IS NOT stable, and ENTER_FRAME is not listened, do it now 
	if( !is_stable && !do_listen )
		m_box.addEventListener(Event.ENTER_FRAME, onEnterFrame, false, 0, true);

	// if the y position IS stable, and ENTER_FRAME is listened, stop doing it now 
	if(  is_stable &&  do_listen )
		m_box.removeEventListener(Event.ENTER_FRAME, onEnterFrame);

}

/** \brief Handle the Event.ENTER_FRAME (for and only during the animation)
 */
private function onEnterFrame(event	:Event)	:void
{
	var theo_box_y	:Number	= cpu_theorical_box_y();
	
	// do a formula for animation...
	// - NOTE: i made this one... no convinced but good placeholder
	m_box.y	+= (theo_box_y - m_box.y)/5;
	
	// TODO there is rounding issue...
	// - at a given point m_box.y no more move
	//console.debug("m_box.y=" + m_box.y + " theo_box_y=" + theo_box_y);
	
	// reset the Event.ENTER_FRAME listener	
	reset_enterFrame_listener();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Return the theorical box_y for m_selected_idx to be in the bar
 */
private function cpu_theorical_box_y()	:Number
{
	var item_h	:Number	= m_stage.stageHeight * m_element_opt['item_h'];
	// return the m_box.y to get m_selected_idx infront of m_bar
	return	m_stage.stageHeight/2 - item_h/2 - m_selected_idx*item_h;
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
	// nothing implemented for now
	console.assert( false );
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
	var item_w	:Number	= m_stage.stageWidth * m_element_opt['item_w'];
	var item_h	:Number	= m_stage.stageHeight* m_element_opt['item_h'];
	// put the m_bar in the middle of the stage
	m_bar.x		= m_stage.stageWidth /2	- item_w/2;
	m_bar.y		= m_stage.stageHeight/2	- item_h/2;
	// put the m_box in the center-horizontal with y depending on m_selected_idx
	m_box.x		= m_stage.stageWidth /2	- item_w/2;
	m_box.y		= cpu_theorical_box_y();

	// determine the scale for m_bar and m_box
	m_bar.scaleX	= m_stage.stageWidth  / BASE_W;
	m_bar.scaleY	= m_stage.stageHeight / BASE_H;
	m_box.scaleX	= m_stage.stageWidth  / BASE_W;
	m_box.scaleY	= m_stage.stageHeight / BASE_H;

	// reset the ENTER_FRAME listener at every change of m_box.y
	reset_enterFrame_listener();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			mouse_event handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief handle the MouseEvent.MOUSE_WHEEL on m_box
 */
private function box_onMouseWheel(mouse_event	:MouseEvent)	:void
{
	// stop the propagation of this event
	mouse_event.stopPropagation();	
	// inc/dec m_selected_idx according to the MOUSE_WHEEL delta
	if( mouse_event.delta < 0 )	m_selected_idx	+= 1;
	if( mouse_event.delta > 0 )	m_selected_idx	-= 1;
	
	// clamp m_selected_idx to the possible values
	m_selected_idx	= Math.max(m_selected_idx, 0);
	m_selected_idx	= Math.min(m_selected_idx, m_element_opt['item_arr'].length-1);

	// reset the Event.ENTER_FRAME listener	
	reset_enterFrame_listener();
}

/** \brief handle the MouseEvent.CLICK on m_box
 */
private function box_onMouseClick(mouse_event	:MouseEvent)	:void
{
	var item_h	:Number	= m_stage.stageHeight * m_element_opt['item_h'];
	// NOTE: use stageY and dont rely on mouse_event.localY because it provides
	// the local coordinate in the text inside the box... reason unknown
	var clicked_idx	:int	= (mouse_event.stageY - m_box.y) / item_h;
	// log to debug
	console.debug("enter clicked_idx=" + clicked_idx);
	// stop the propagation of this event
	mouse_event.stopPropagation();

	// if clicked_idx == m_selected_idx, notify the callback with "selected"
	if( clicked_idx == m_selected_idx )	return notify_callback("selected");

// 2 possible policy - on how to handle the clicked_idx
if(1){	
	/*************** to notify clicked_idx as selected	***************/
	// - use less animation so less cpu
	// - additionnaly less click to select an item	
	m_selected_idx	= clicked_idx
	return notify_callback("selected");
}else{
	/*************** to get the clicked_idx on front of m_bar	*******/	
	// set m_selected_idx with clicked_idx	
	m_selected_idx	= clicked_idx;
	// clamp m_selected_idx to the possible values
	m_selected_idx	= Math.max(m_selected_idx, 0);
	m_selected_idx	= Math.min(m_selected_idx, m_element_opt['item_arr'].length-1);
	// reset the Event.ENTER_FRAME listener	
	reset_enterFrame_listener();
}
}

/** \brief handle the MouseEvent.CLICK on m_bar
 */
private function bar_onMouseClick(mouse_event	:MouseEvent)	:void
{
	var item_w	:Number	= BASE_W * m_element_opt['item_w'];
	// stop the propagation of this event
	mouse_event.stopPropagation();

	// if the click in on the left 'arrow', notify a "backward"
	if( mouse_event.localX < 0 )		return notify_callback("backward");
	// if the click in on the right 'arrow', notify a "forward"
	if( mouse_event.localX > item_w )	return notify_callback("forward");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			callback notification
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Notify the caller of a MouseEvent on this object
 */
private function notify_callback(event_type	:String)	:void
{
	var item_arr	:Array	= m_element_opt['item_arr'];
	// sanity check - m_callback MUST be defined
	console.assert( m_callback != null );
	// build the arg to send to the callback
	var arg	:Object		= {};
	// add the userptr to the arg
	arg['userptr']		= m_userptr;
	arg['item_userptr']	= item_arr[m_selected_idx]['item_userptr'];
	arg['selected_idx']	= m_selected_idx;
	// forward the event to the caller
	m_callback(event_type, arg);	
}

}	// end of class 
} // end of package