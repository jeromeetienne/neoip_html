/*! \file
    \brief Definition of the class button_bitmap_t

\par Brief Description
button_busy_t is a class to have a 'busy' button. aka a animated bitmap
which shows the program is doing something even if nothing new is visible. 

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.Bitmap;
import flash.display.BitmapData;
import flash.display.Sprite;
import flash.display.Stage;
import flash.events.TimerEvent;
import flash.geom.Matrix;
import flash.utils.Timer;

import neoip.debug.console;


/** \brief Class to have busy button
 */
public class button_busy_t extends base_sprite_t implements embedui_vapi_t {

// definition of the fields in this class
private var m_counter		:uint	= 0;
private var m_refresh_delay	:Number	= 0.125 * 1000;
private var m_refresh_timer	:Timer;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function button_busy_t(p_stage:Stage, p_callback:Function, p_element_opt:Object)
{
	// call the parent constructor
	super(p_stage, p_element_opt.base_sprite, p_callback, p_element_opt.userptr);

	// get the refresh_delay from the p_element_opt
	if( p_element_opt['element_opt'] && p_element_opt['element_opt']['refresh_delay'] )
		m_refresh_delay	= p_element_opt['element_opt']['refresh_delay'];

	// initialize m_refresh_timer
	m_refresh_timer	= new Timer(m_refresh_delay);
	m_refresh_timer.addEventListener(TimerEvent.TIMER, refresh_timer_cb);
	m_refresh_timer.start();
		
	// redraw the bitmap
	redraw_bitmap();
}

/** \brief Destructor
 */
public override function destructor()	:void
{
	// log to debug
	console.info("enter destructor");

	// delete m_refresh_timer if needed
	if( m_refresh_timer ){
		m_refresh_timer.stop();
		m_refresh_timer	= null;
	}
	// call the parent destructor
	super.destructor();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			update function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief public function to update the behaviour of this object
 */
override public function	update(arg:Object)	:void
{
	// simply forward it to base_sprite_t
	super.update(arg);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Redraw the bitmap according to the m_element_opt
 */
private function redraw_bitmap()	:void
{
	var circle_r	:Number	= 20;
	var dot_r	:Number	= 7;
	var dot_nb	:Number	= 8;
	var container	:Sprite	= new Sprite();
	var color_low	:Number	= 0x20;
	var color_high	:Number	= 0xFF;

	// draw the box and the amp
	for(var i:int = 0; i < dot_nb; i++){
		var color_shift	:Number	= (i + m_counter) % dot_nb; 
		var color_cur	:uint	= color_high-color_shift*(color_high-color_low)/dot_nb;
		var color_full	:uint	= (color_cur<<16) + (color_cur<<8) + (color_cur<<0);
		// compute the dot, coordinate 
		var x		:Number	= + circle_r * Math.cos( i * 2*Math.PI/dot_nb );
		var y		:Number	= - circle_r * Math.sin( i * 2*Math.PI/dot_nb );
		// draw the dot
		container.graphics.beginFill(color_full);
		container.graphics.drawCircle(x + dot_r/2, y + dot_r/2 , dot_r);
	}

	// build a Bitmap out of the container
	var bitmap_data	:BitmapData	= new BitmapData(container.width + dot_r
						, container.height + dot_r
						, true, 0);
	// do a translation to compensate the fact it is drawn with negative y
	var matrix	:Matrix		= new Matrix();
	matrix.translate(circle_r + dot_r, circle_r + dot_r);
	bitmap_data.draw(container, matrix);
	var bitmap	:Bitmap		= new Bitmap(bitmap_data);

	// set the current bitmap in the parent
	super.set_bitmap(bitmap);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			m_refresh_timer callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for the m_refresh_timer
 */
private function refresh_timer_cb(event	:TimerEvent)	:void
{
	// increase the counter
	m_counter	+= 1;
	// redraw the bitmap
	redraw_bitmap();
}


}	// end of class 
} // end of package