/*! \file
    \brief Definition of the class button_bitmap_t

\par Brief Description
button_bitmap_t is a class to have bitmap button.

- TODO - change the name  
  - button_bitmap_t is able to handled embedded bitmap, dynamically loaded bitmap
    or embedded vector ..
  - button_generic_t ? 

\par About element_opt
- location	: determine the location of this button_bitmap
  - this is a String with a meaning depending on the "type"
- type		: determine the type of this button_bitmap
  - "dynamic"	: to get the bitmap from a remote server
    - "location": contains the URL of bitmap
  - "embeded"	: to get the bitmap embedded in the flash code 
    - "location": is the name of the embedded bitmap  
  - "vector"	: to draw a set of predefined bitmap in vector
    - "location": is the name of the vector bitmap
      - "play"/"stop"/"win_normalizer"/"win_maximizer"

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.Bitmap;
import flash.display.BitmapData;
import flash.display.Loader;
import flash.display.Sprite;
import flash.display.Stage;
import flash.events.Event;
import flash.events.IOErrorEvent;
import flash.net.URLRequest;
import flash.text.TextField;
import flash.text.TextFieldAutoSize;
import flash.text.TextFormat;
import flash.text.TextFormatAlign;

import neoip.debug.console;


/** \brief Class to have button which appears only when the mouse it on it
 */
public class button_bitmap_t extends base_sprite_t implements embedui_vapi_t {

// definition of the fields in this class
private var m_bmap_loader	:Loader;
private var m_element_opt	:Object;

// list of embedded bitmap
[Embed(source='../../globe.png')]
private var embed_pic_globe	:Class;


// constant for the various element_opt['type']
public	static const TYPE_DYNAMIC	:String	= "dynamic";
public	static const TYPE_EMBEDDED	:String	= "embedded";
public	static const TYPE_VECTOR	:String	= "vector";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function button_bitmap_t(p_stage:Stage, p_callback:Function, p_embedui_opt:Object)
{
	// call the parent constructor
	super(p_stage, p_embedui_opt['base_sprite'], p_callback, p_embedui_opt['userptr']);

	// copy the element_opt
	m_element_opt	= p_embedui_opt['element_opt'];
	// TODO code strict sanity check on the element_opt
	// sanity check - m_element_opt MUST contain 'type' and 'location'
	console.assert( m_element_opt['type'] );
	console.assert( m_element_opt['location'] );

	// draw the bitmap
	redraw_bitmap();
}

/** \brief Destructor
 */
public override function destructor()	:void
{
	// log to debug
	console.debug("enter destructor");

	// delete m_bmap_loader if needed
	if( m_bmap_loader ){
		m_bmap_loader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR, onLoadIoError);
		m_bmap_loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, onLoadComplete);
		m_bmap_loader	= null;
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
	// sanity check - arg['action'] MUST be defined
	console.assert(arg['action']);
	// handle it according to the arg['action'] command
	if( arg['action'] == "element_update_opt" ){
		update_element_opt(arg['arg']);
	}else{
		// if arg['action'] is handled here, forward it to base_sprite_t
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
 */
private function redraw_bitmap()	:void
{
	// Startthe m_bmap_loader if m_element_opt['type'] == TYPE_DYNAMIC 
	if( m_element_opt['type'] == TYPE_DYNAMIC )	return redraw_dynamic();
	else if(m_element_opt['type'] == TYPE_EMBEDDED)	return redraw_embedded();
	else if( m_element_opt['type'] == TYPE_VECTOR )	return redraw_vector();
	else { console.assert(false);	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			post_ctor per element_opt['type']
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Redraw the bitmap when m_element_opt['type'] == TYPE_DYNAMIC
 */ 
private function redraw_dynamic()	:void
{
	// sanity check - the element type MUST be TYPE_DYNAMIC
	console.assert( m_element_opt['type'] == TYPE_DYNAMIC );
	
	// delete m_bmap_loader if needed
	if( m_bmap_loader ){
		m_bmap_loader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR, onLoadIoError);
		m_bmap_loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, onLoadComplete);
		m_bmap_loader	= null;
	}
	
	// init m_bmap_loader to load the url in element_opt['location']ief 
	m_bmap_loader	= new Loader();
	m_bmap_loader.load(new URLRequest(m_element_opt['location']));
	m_bmap_loader.contentLoaderInfo.addEventListener(Event.COMPLETE		, onLoadComplete);
	m_bmap_loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR	, onLoadIoError);
}

/** \brief Redraw the bitmap when m_element_opt['type'] == TYPE_EMBEDDED
 */ 
private function redraw_embedded()	:void
{
	// sanity check - the element type MUST be TYPE_EMBEDDED
	console.assert( m_element_opt['type'] == TYPE_EMBEDDED );
	// get the bitmap from the embedded pic 
	var bitmap	:Bitmap;
	if( m_element_opt['location'] == "embed_pic_globe" ){
		bitmap	= new embed_pic_globe();
	}else {	console.assert(false);	}
	// set the current bitmap in the parent
	super.set_bitmap(bitmap);
}

/** \brief Redraw the bitmap when m_element_opt['type'] == TYPE_VECTOR
 */ 
private function redraw_vector()	:void
{
	var container	:Sprite	= new Sprite();
	// sanity check - the element type MUST be TYPE_VECTOR
	console.assert( m_element_opt['type'] == TYPE_VECTOR );
	//console.info("location="+ element_opt['location']);

	// get the bitmap from the embedded pic 
	if( m_element_opt['location'] == "play" ){
		var play_t	:Number	= 10;
		var play_w	:Number	= 60;
		var play_h	:Number	= 60;
		container.graphics.beginFill	( 0xFFFFFF );
		container.graphics.lineStyle	( play_t, 0xFFFFFF);
		container.graphics.moveTo	( play_t, play_t);
		container.graphics.lineTo	( play_t, play_t + play_h);
		container.graphics.lineTo	( play_t+play_w, play_t + play_h/2);
		container.graphics.lineTo	( play_t, play_t);
		container.graphics.endFill	();
	}else if( m_element_opt['location'] == "stop" ){
		var stop_t	:Number	= 10;
		var stop_w	:Number	= 20;
		var stop_h	:Number	= 50;
		container.graphics.lineStyle	( stop_t, 0xFFFFFF);
		container.graphics.beginFill	( 0xFFFFFF );
		container.graphics.drawRect	( stop_t, stop_t, stop_w, stop_h);
		container.graphics.drawRect	( stop_t*3 + stop_w, stop_t, stop_w, stop_h);
	}else if( m_element_opt['location'] == "win_maximizer" ){
		var maxer_t	:Number	= 2;
		var maxer_w	:Number	= 30;
		var maxer_h	:Number	= 30;
		var maxer_top_h	:Number	= 6;
		container.graphics.lineStyle	( maxer_t, 0xFFFFFF);
		container.graphics.drawRect	( maxer_t, maxer_t, maxer_w, maxer_h);
		container.graphics.beginFill	( 0xFFFFFF );
		container.graphics.drawRect	( maxer_t, maxer_t, maxer_w, maxer_top_h);
		container.graphics.endFill	( );
	}else if( m_element_opt['location'] == "win_normalizer" ){
		var normer_t	:Number	= 2;
		var normer_w	:Number	= 30;
		var normer_h	:Number	= 30;
		var normer_top_h:Number	= 6;
		var normer_2nd	:Number	= 15;
		container.graphics.lineStyle	( normer_t, 0xFFFFFF);
		container.graphics.drawRect	( normer_t + normer_2nd, normer_t, normer_w, normer_h);
		container.graphics.beginFill	( 0xFFFFFF );
		container.graphics.drawRect	( normer_t + normer_2nd, normer_t, normer_w, normer_top_h);
		container.graphics.endFill	( );

		container.graphics.lineStyle	( normer_t, 0xFFFFFF);
		container.graphics.drawRect	( normer_t, normer_t + normer_2nd, normer_w, normer_h);
		container.graphics.beginFill	( 0xFFFFFF );
		container.graphics.drawRect	( normer_t, normer_t + normer_2nd, normer_w, normer_top_h);
		container.graphics.endFill	( );
	}else if( m_element_opt['location'] == "webpack_install" ){
		// display the red-square
		var nopack_t	:Number	= 50;
		var nopack_w	:Number	= 320;
		var nopack_h	:Number	= 180;
		container.graphics.lineStyle	( nopack_t, 0xFF0000);
		container.graphics.beginFill	( 0xFF0000 );
		container.graphics.drawRect	( nopack_t, nopack_t, nopack_w, nopack_h);

		// build the TextField
		var textfield		:TextField;
		textfield		= new TextField();
		textfield.multiline	= true;
		textfield.selectable	= false;
		textfield.autoSize	= TextFieldAutoSize.LEFT;
		textfield.width		= 350;
		textfield.wordWrap	= true;
		textfield.text		= m_element_opt['text'];
		textfield.y		= 50;
		textfield.x		= 30;
	
		// build the TextFormat
		var text_format		:TextFormat;
		text_format		= new TextFormat();
		text_format.font	= "Arial, Verdana, Helvetica, Sans, Bitstream Vera Sans";
		text_format.size	= 60;
		text_format.bold	= true;
		text_format.color	= 0xFFFFFF;
		text_format.align	= TextFormatAlign.CENTER;
		textfield.setTextFormat(text_format);
	
		// put the textfield in a container
		container.addChild(textfield);	
	}else {	console.assert(false);	}
	
	//console.info("width=" + container.width);
	//console.info("height=" + container.height);


	// build a Bitmap out of the container
	var bitmap_data :BitmapData	= new BitmapData(container.width + 10
						, container.height + 10, true, 0);
	bitmap_data.draw(container);
	var bitmap	:Bitmap		= new Bitmap(bitmap_data);

	// set the current bitmap in the parent
	super.set_bitmap(bitmap);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			misc
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

public function onLoadComplete(event	:Event)		:void
{
	// convert the loaded content into a Bitmap
	var bitmap	:Bitmap	= Bitmap(m_bmap_loader.content);
	// dereference m_bmap_loader 
	m_bmap_loader	= null;
	// set the current bitmap in the parent
	super.set_bitmap(bitmap);
} 

private function onLoadIoError(event	:IOErrorEvent)	:void
{
	// log to debug
	console.info("enter");
	// TODO not sure what to do here...
	// - well not much can be done... just notify the caller of the error
}

}	// end of class 
} // end of package