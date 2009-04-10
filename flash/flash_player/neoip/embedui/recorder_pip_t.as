/*! \file
    \brief Definition of the class recorder_pip_t

- HALF BACKED - HALF BACKED

\par Brief Description
recorder_pip_t is a class to have a dock ala macosx.
- this is half backed
- i gave up in the middle

\par About possibility
- imagine a infinitly long dock ala macosx as channel chooser
  - with an icon specific to each channel
- it is possible to get a dock 'infinitly long' by simply sliding the dock
  - via mouse wheel
  - via autoscrool is the mouse is on the border of the dock
- a dock without real time zooming would allow to use much less cpu
  - so it needs to be available on option 

\par about Implementation
- the autohide is not implemented
- it is half backed and dirty - gave up in the middle
- the item are not read fromjs
- all the bmp are hardcoded instead of getting them from config
  - similar to button_bitmap_t
  - NOTE: a common layer between the 2 would be nice
- TODO should it be done on top of base_sprite_t ?
  - no reason not to at first
- the drawing/resizing is crappy 
  - i think i draw in the stage dimension all the time
- when to redraw is unclear as wheel
- this takes a significant amount of cpu
 

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.Bitmap;
import flash.display.BitmapData;
import flash.display.Sprite;
import flash.display.Stage;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.text.TextField;
import flash.text.TextFieldAutoSize;
import flash.text.TextFormat;
import flash.text.TextFormatAlign;

import neoip.debug.console;

/** \brief Implement a selection of item in list
 */
public class recorder_pip_t implements embedui_vapi_t {

// definition of the fields in this class
private var m_stage		:Stage;
private var m_callback		:Function;
private var m_userptr		:Object;

private var m_container		:Sprite;

private var m_item_lo_w		:Number	= 64;
private var m_item_hi_w		:Number	= 64*1.8;
private var m_item_margin	:Number	= 5;
private var m_zoom_span		:Number	= 64*1.8;
private var m_caption_margin	:Number	= 5;
private var m_item_arr		:Array	= new Array;
private var m_bitmap_arr	:Array	= new Array;

private var m_caption_bmp	:Bitmap;

// TODO from my crappy way to redraw
private var m_prev_mouse_x	:Number	= -1;
private var m_prev_mouse_y	:Number	= -1;

// list of embedded bitmap
// - no more embeded as it is not used - it save memory in the .swf
//[Embed(source='../../globe.png')]
private var embed_pic_globe	:Class;

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
public function recorder_pip_t(p_stage:Stage, p_callback:Function, p_embedui_opt:Object)
{
	// log to debug
	console.info("enter");

	// copy the parameter
	m_stage		= p_stage;
	m_callback	= p_callback
	m_userptr	= p_embedui_opt['userptr'];

	// populate m_item_arr with fake items
	// - TODO to remove and get it from ctor parameter
	for(var j:uint = 0; j < 9; j++){
		var item_tmp	:Object	= new Object;
		item_tmp['caption']	= "item " + j;
		//item_tmp['bmp_class']	= "embeded";
		//item_tmp['bmp_url']	= "globe";
		//item_tmp['bmp_class']	= "dynamic";
		//item_tmp['bmp_url']	= "http://balbalbal";
		m_item_arr.push(item_tmp); 
	}
// TODO on getting all the bitmap
// - te bitmap may need some time to retrieve if they are remote
// - this is very similar to button_bitmap
//   - do a common function ?
// - algo to retrieve them
//   - if m_bitmap_arr == m_item_arr then all bitmap are retrieved
//   - else try to get the m_item_arr[m_bitmap_arr.length] item bitmap


	// create m_container Sprite
	m_container	= new Sprite;
//	m_container.cacheAsBitmap	= true;
	m_stage.addChild(m_container);
	
	// create the Bitmap for all the items
	for(var i:uint = 0; i < m_item_arr.length; i++){
		var item	:Object	= m_item_arr[i];
		var item_bmp	:Bitmap	= new embed_pic_globe();
		item_bmp.smoothing	= true;
		m_bitmap_arr.push(item_bmp);
		m_container.addChild(item_bmp);
	}
	
	// create m_caption_bmp and attach it to m_container
	m_caption_bmp	= new Bitmap();
	m_container.addChild(m_caption_bmp);
	

	// listen on MOUSE_MOVE - using weakreference so removed automatically by gc
	m_container.addEventListener(Event.ENTER_FRAME, onEnterFrame, false, 0, true);

	// listen on various MouseEvent - using weakreference so removed automatically by gc
	m_container.addEventListener(MouseEvent.CLICK	, onMouseClick, false, 0, true);
	// listen on Event.RESIZE - using the weakreference so removed automatically by gc
	m_stage.addEventListener(Event.RESIZE	, onResizeEvent, false, 0, true);

	// BLBLBA
	redraw_bitmap();
	recpu_sizepos();
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// log to debug
	console.info("enter destructor");
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			redraw_bitmap
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Redraw the bitmap accoding to the m_element_opt
 */
private function redraw_bitmap()	:void
{
	var container_w	:Number	= m_item_arr.length * (m_item_lo_w + m_item_margin);
	var container_h	:Number	= m_item_hi_w;
	var container_x	:Number	= m_stage.stageWidth /2	- container_w / 2;
	var container_y	:Number	= m_stage.stageHeight/2	- container_h / 2;
	var mouse_x	:Number	= m_stage.mouseX - container_x;
	var mouse_y	:Number	= m_stage.mouseY - container_y;
	var width_arr	:Array	= new Array();
	var width_max	:Number	= -1;
	
//	console.info("container_x=" + container_x);
//	console.info("mouse_x=" + mouse_x);
//	console.info("stage.mouse_X=" + m_stage.mouseX);

	// test if out of zoom_span ... so no zooming
	if( mouse_y < container_y - m_zoom_span )		mouse_x = 9999;
	if( mouse_y >= container_y + container_h + m_zoom_span)	mouse_x = 9999;	 
	if( mouse_x < -m_zoom_span )				mouse_x = 9999;
	if( mouse_x >= container_w + m_zoom_span)		mouse_x = 9999;	 
	
	
	// compute the distance in y
	var dist_y:Number;
	if( mouse_y < container_y - m_zoom_span )	dist_y	= 0;
	else if( mouse_y >= container_y )		dist_y	= 0;
	else{
		dist_y	= (container_y - mouse_y) * 2;
	}	
	
	// compute the width of each bmp, according to its distance to the mouse pointer
	for(var i:Number = 0; i < m_item_arr.length; i++){
		var item_mid_x	:Number	= (i + 0.5) * m_item_lo_w;	 	
		var item_dist	:Number	= Math.abs(item_mid_x - mouse_x);
		var item_w	:Number;
		item_dist	+= dist_y;
		item_dist	-= (m_item_lo_w + m_item_margin)/2;
		// compute the item_w according to the item_dist
		if( item_dist < 0 ){
			item_w	= m_item_hi_w;
		}else if( item_dist < m_zoom_span ){
			item_w	 = m_item_hi_w;
			item_w	-= (m_item_hi_w - m_item_lo_w) * (item_dist / m_zoom_span) 
		}else{
			item_w	= m_item_lo_w;
		}
		
	
		width_max	= Math.max(width_max, item_w);		
		width_arr.push(item_w);
	}

	// compute the scaleX/Y of each bmp
	for(var j:uint = 0; j < m_item_arr.length; j++){
		var item_bmp	:Bitmap = m_bitmap_arr[j];
		// compute the scale of this item
		item_bmp.scaleX	= width_arr[j] / item_bmp.bitmapData.width;
		item_bmp.scaleY	= item_bmp.scaleX;
	}

	// compute the x/y position of each bmp
	var cur_x	:Number	= 0;
	for(var item_idx:uint = 0; item_idx < m_item_arr.length; item_idx++){
		var item_bmp2	:Bitmap = m_bitmap_arr[item_idx];
		// compute the position		
		item_bmp2.x	= cur_x;
		item_bmp2.y	= width_max - item_bmp2.bitmapData.height * item_bmp2.scaleY;
		cur_x	+= width_arr[item_idx] + m_item_margin; 
	}
	
	redraw_caption();
}

/** \brief Redraw the bitmap accoding to the m_element_opt
 */
private function redraw_caption()	:void
{
	// if m_caption_bmp already exists, delete it
	if( m_caption_bmp ){
		m_container.removeChild( m_caption_bmp );
		m_caption_bmp	= null;		
	}

	var item_idx	:uint;;
	// loop over each item to determine on which item the click may occurs
	for(item_idx = 0; item_idx < m_item_arr.length; item_idx++){
		var item_bmp1	:Bitmap = m_bitmap_arr[item_idx];
		if( item_bmp1.hitTestPoint(m_stage.mouseX, m_stage.mouseY) )
			break;
	}
	// if it didnt happends on a item, return now
	if( item_idx == m_item_arr.length )	return;
	
	// build the TextField
	var textfield		:TextField;
	textfield		= new TextField();
	textfield.multiline	= true;
	textfield.selectable	= false;
	textfield.autoSize	= TextFieldAutoSize.LEFT;
	textfield.text		= m_item_arr[item_idx]['caption'];

	// build the TextFormat
	var text_format		:TextFormat;
	text_format		= new TextFormat();
	text_format.font	= "Arial, Verdana, Helvetica, Sans, Bitstream Vera Sans";
	text_format.size	= 20;
	text_format.bold	= true;
	text_format.color	= 0xFFFFFF;
	text_format.align	= TextFormatAlign.CENTER;
	textfield.setTextFormat(text_format);	

	// put the textfield in a container
	var text_container	:Sprite	= new Sprite();
	text_container.addChild(textfield);

	// build a Bitmap out of the container
	var bitmap_data		:BitmapData;
	bitmap_data	= new BitmapData(text_container.width, text_container.height, true, 0);
	bitmap_data.draw(text_container);
	
	// create the new m_caption_bmp from the bitmap_data
	m_caption_bmp	= new Bitmap(bitmap_data);

	var item_bmp	:Bitmap = m_bitmap_arr[item_idx];
	m_caption_bmp.x	= (item_bmp.x + item_bmp.width/2) - m_caption_bmp.width / 2;
	m_caption_bmp.y	= item_bmp.y + (m_caption_bmp.height + m_caption_margin);
	m_container.addChild(m_caption_bmp);
}


/** \brief Handle the Event.ENTER_FRAME
 * 
 * - this is quite crappy
 * - the whole stuff to know when to redraw is crappy
 * - do the rest and then come back to make it clean
 */
private function onEnterFrame(event	:Event)	:void
{
	// detect if the mouse pointer changed
	if( m_prev_mouse_x == m_stage.mouseX  && m_prev_mouse_y == m_stage.mouseY )
		return;
	m_prev_mouse_x	= m_stage.mouseX;
	m_prev_mouse_y	= m_stage.mouseY;

	redraw_bitmap();
	recpu_sizepos();	
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
	redraw_bitmap();
	recpu_sizepos();
}

/** \brief compute the position and size of the ui element
 */
private function recpu_sizepos()	:void
{
	// put m_container on bottom-center
	m_container.x		= m_stage.stageWidth /2	- m_container.width/2;
	m_container.y		= m_stage.stageHeight	- m_container.height;
	// determine the scale for m_container
//	m_container.scaleX	= m_stage.stageWidth / BASE_W;
//	m_container.scaleY	= m_container.scaleX;
}

/** \brief handle the MouseEvent.CLICK on m_container
 */
private function onMouseClick(mouse_event	:MouseEvent)	:void
{
	// log to debug
	console.info("enter");
	// loop over each item to determine on which item the clicked occured	
	for(var item_idx:uint = 0; item_idx < m_item_arr.length; item_idx++){
		var item_bmp	:Bitmap = m_bitmap_arr[item_idx];
		if( item_bmp.hitTestPoint(mouse_event.stageX, mouse_event.stageY) )
			break;
	}
	// if it didnt happends on a item, return now
	if( item_idx == m_item_arr.length )	return;
	// else just display the result
	console.info("click item_idx=" + item_idx);
	// notify the caller
	// TODO to notify the caller
	//notify_callback("clicked_item", { "item_idx"	: item_idx	});
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