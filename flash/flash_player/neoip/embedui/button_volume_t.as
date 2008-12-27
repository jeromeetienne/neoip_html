/*! \file
    \brief Definition of the class button_volume_t

\par Brief Description
button_bitmap_t is a class to handle volume, with level of volime and mute or not.

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.Bitmap;
import flash.display.BitmapData;
import flash.display.Sprite;
import flash.display.Stage;
import flash.geom.Matrix;

import neoip.debug.console;


/** \brief Class to have button which appears only when the mouse it on it
 */
public class button_volume_t extends base_sprite_t implements embedui_vapi_t {

// definition of the fields in this class
private var m_element_opt	:Object;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function button_volume_t(p_stage:Stage, p_callback:Function, p_element_opt:Object)
{
	// call the parent constructor
	super(p_stage, p_element_opt['base_sprite'], p_callback, p_element_opt['userptr']);

	// copy the element_opt
	m_element_opt	= p_element_opt['element_opt'];
	// sanity check - m_element_opt MUST contain 'sound_vol' and 'sound_mute' keys
	console.assert( m_element_opt['sound_vol'] != null );	
	console.assert( m_element_opt['sound_mute'] != null );
	
	// draw the bitmap
	redraw_bitmap();
}

/** \brief Destructor
 */
public override function destructor()	:void
{
	// log to debug
	console.debug("enter destructor");

	// TODO what about m_bmap_loader

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
	// sanity check - arg.action MUST be defined
	console.assert(arg.action);
	// handle it according to the arg.action command
	if( arg.action == "element_update_opt" ){
		update_element_opt(arg['arg']);
	}else{
		// if arg.action is handled here, forward it to base_sprite_t
		super.update(arg);
	}
}

private function update_element_opt(update_opt:Object)	:void
{
	// log to debug
	console.debug("enter");
	// update m_element_opt with update_opt
	for(var opt_key:String in update_opt){
		m_element_opt[opt_key]	= update_opt[opt_key];
	}
	// TODO what about the reloading if needed?
	// redraw the bitmap to match the new element_opt
	redraw_bitmap();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Redraw the bitmap accoding to the m_element_opt
 * 
 * - TODO clean up this function
 */
private function redraw_bitmap()	:void
{
	var box_w:Number	= 20;
	var box_h:Number	= 30;
	var amp_w:Number	= 15; 
	var amp_h:Number	= 50;
	
	var wave_nb:int		= 5;
	var wave_curve:Number	= 15;
	var wave_inc_x:Number	= 8;
	var wave_inc_y:Number	= 3;
	
	var mute_off_x:Number	= 10;
	var mute_off_y:Number	= 0;
	
	var rect:Sprite		= new Sprite();

	// draw the box and the amp
	rect.graphics.lineStyle	(5	, 0xFFFFFF);
	rect.graphics.moveTo	(box_w	, -box_h/2);
	rect.graphics.lineTo	(0	, -box_h/2);
	rect.graphics.lineTo	(0	, +box_h/2);
	rect.graphics.lineTo	(box_w	, +box_h/2);
	rect.graphics.lineTo	(box_w+amp_w, +amp_h/2);
	rect.graphics.lineTo	(box_w+amp_w, -amp_h/2);
	rect.graphics.lineTo	(box_w	, -box_h/2);

	// draw the waves
	for(var i:int = 0; i < wave_nb; i++){
		var alpha	:Number;
		// determine the alpha for this wave depending on m_element_opt['sound_vol']
		if( Number(i)/wave_nb < m_element_opt['sound_vol'] )	alpha	= 1.0;
		else							alpha	= 0.0;
		// draw this wave
		var beg_x:Number	= box_w+amp_w 	+ (i+1)*wave_inc_x;
		var beg_y:Number	= -amp_h/2	- (i+1)*wave_inc_y;
		rect.graphics.lineStyle	(4	, 0xFFFFFF, alpha);
		rect.graphics.moveTo	(beg_x, beg_y);
		rect.graphics.curveTo	(beg_x+ wave_curve, 0, beg_x, -beg_y);
	}
	
	// draw the mute cross
	if( m_element_opt['sound_mute'] || m_element_opt['sound_vol'] == 0 ){
		rect.graphics.lineStyle	(10	, 0xFF0000);
		rect.graphics.moveTo	(mute_off_x	, -box_h/2 - (i+1)*wave_inc_y - mute_off_y);
		rect.graphics.lineTo	(box_w+amp_w + (i+1)*wave_inc_x - mute_off_x, +box_h/2 + (i+1)*wave_inc_y + mute_off_y);
		rect.graphics.moveTo	(box_w+amp_w + (i+1)*wave_inc_x - mute_off_x, -box_h/2 - (i+1)*wave_inc_y - mute_off_y);
		rect.graphics.lineTo	(mute_off_x	, +box_h/2 + (i+1)*wave_inc_y + mute_off_y);
	}
	
	// build a Bitmap out of the container
	var bitmap_data	:BitmapData	= new BitmapData(10+rect.width, 10+rect.height
						, true, 0);
	// do a translation to compensate the fact it is drawn with negative y
	var matrix	:Matrix		= new Matrix();
	matrix.translate(5, 5+rect.height/2);
	bitmap_data.draw(rect, matrix);
	var bitmap	:Bitmap		= new Bitmap(bitmap_data);

	// set the current bitmap in the parent
	super.set_bitmap(bitmap);
}


}	// end of class 
} // end of package