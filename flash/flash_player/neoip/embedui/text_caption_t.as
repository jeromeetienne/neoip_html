/*! \file
    \brief Definition of the class text_caption_t

\par Brief Description
text_caption_t is a class to have bitmap button.

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.Bitmap;
import flash.display.BitmapData;
import flash.display.Sprite;
import flash.display.Stage;
import flash.text.TextField;
import flash.text.TextFieldAutoSize;
import flash.text.TextFormat;
import flash.text.TextFormatAlign;

import neoip.debug.console;


/** \brief Class to have button which appears only when the mouse it on it
 */
public class text_caption_t extends base_sprite_t implements embedui_vapi_t {

// definition of the fields in this class
private var m_element_opt	:Object;

private	var m_element_opt_dfl	:Object	= {
					"text"		: " ",
					"font_color"	: 0xFFFF00
				};
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function text_caption_t(p_stage:Stage, p_callback:Function, p_embedui_opt:Object)
{
	// call the parent constructor
	super(p_stage, p_embedui_opt['base_sprite'], p_callback, p_embedui_opt['userptr']);

	// copy the element_opt
	m_element_opt	= p_embedui_opt['element_opt'];
	// put the default value in m_element_opt if needed
	for(var opt_key:String in m_element_opt_dfl){
		if( m_element_opt[opt_key] != null )	continue;
		m_element_opt[opt_key]	= m_element_opt_dfl[opt_key];
	}
	// TODO code strict sanity check on the element_opt

	// draw the bitmap
	redraw_bitmap();
}

/** \brief Destructor
 */
public override function destructor()	:void
{
	// log to debug
	console.debug("enter destructor");

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
	// redraw the bitmap to match the new element_opt
	redraw_bitmap();
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			redraw_bitmap
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Redraw the bitmap accoding to the m_element_opt
 * 
 * - TODO clean up this function
 */
private function redraw_bitmap()	:void
{
	// build the TextField
	var textfield		:TextField;
	textfield		= new TextField();
	textfield.multiline	= true;
	textfield.selectable	= false;
	textfield.autoSize	= TextFieldAutoSize.LEFT;
	textfield.width		= 1024;
	textfield.wordWrap	= true;
	textfield.text		= m_element_opt['text'];

	// build the TextFormat
	var text_format		:TextFormat;
	text_format		= new TextFormat();
	text_format.font	= "Arial, Verdana, Helvetica, Sans, Bitstream Vera Sans";
	text_format.size	= 60;
	text_format.bold	= true;
	text_format.color	= m_element_opt['font_color'];
	text_format.align	= TextFormatAlign.CENTER;
	textfield.setTextFormat(text_format);

	// put the textfield in a container
	var container	:Sprite	= new Sprite();
	container.addChild(textfield);

	// log to debug
	console.debug("container.width=" + container.width);
	console.debug("container.height=" + container.height);
	 
	// build a Bitmap out of the container
	var bitmap_data	:BitmapData	= new BitmapData(container.width, container.height
						, true, 0);
	bitmap_data.draw(container);
	var bitmap	:Bitmap		= new Bitmap(bitmap_data);
	

	// log to debug	
	console.debug( "numlines=" + textfield.numLines );
	console.debug( "font_size=" + m_element_opt['font_size'] );
	
	// set the current bitmap in the parent
	super.set_bitmap(bitmap);
}



}	// end of class 
} // end of package