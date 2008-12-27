/*! \file
    \brief Definition of the package
    

\par List of bug in flash-player itself
- if flash.media.Video video.smoothing == true, then video.clear() doesnt clear
  the video, but it does if video.smoothing == false
  - apparently displaying a single frame in smoothing will trigger this bug
    - aka if start with smoothing, and then go to non smoothing, go on playing
      and then do video.clear... WILL NOT clear the video
  - POSSIBLE WORKAROUND: draw a big black rectangle before the video when it is
    supposed to be clear() and remove it when starting to play again.
- if URLLoader is directed to a unreachable port, and a suitable TCP reset is 
  replied, URLLoader dont detect it and hangs for ever.
  - instead of triggering a IOError as expected from the doc
  - POSSIBLE WORKAROUND: handle a timeout on top of URLLoader
  - is it a flash-player bug or a firefox one ? (see on 9.0.60 linux + firefox2.0.0.6)
    - i have seen hint that firefox3.0a3 no more have this behaviour... so maybe
      a firefox bug 
- in 9.0.48, if javascript send {"foo": "bar", { "foo" : "BLI" } } to flash
  flash will receives { "foo" : "BLI", {"foo" : "BLI" } }
  - no more present in 9.0.60
  - btw this bug occurs only from js to flash, in the other direction, it works as
    expected.
  - NOTE: 9.0.48 is a "stable" version... gaps i guess abode does run any testing
    before releasing their software... this seems like a huge bug to me
  - POSSIBLE WORKAROUND: never use the same key in a inner object from js to as
- if the computer is "overloaded", flash-player is slown down and it trigger 
  a race-condition which makes flash-player crashes.
  - POSSIBLE WORKAROUND: make sure the computer is not "overloaded", in my case
    it making sure the disk is not used too much by the swf program itself
    - using memory cache instead of directly the disk
    - delivering the videos only by small chunk. flash-player download as fast
      as possible *and* cache the video file on disk. the conjonction of this
      makes the box real slow when loading a "large" video on a fast network
      connection.
  - the actual reason of the race-condition is unknown.
- flash-player got issue to close socket. NetConnection.close() doesnt close
  the socket as it is describes in the documentation.
  - if NetConnection.close() is done and the socket doesnt deliver any data
    the socket remain open. even if the webpage is closed. to close it the
    browser itself needs to be closed
  - is it a flash-player bug or a firefox one ? (see on 9.0.60 linux + firefox2.0.0.6) 

*/


package {
	
// list of all import for this package
import flash.display.Bitmap;
import flash.display.BitmapData;
import flash.display.Sprite;
import flash.events.ContextMenuEvent;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.external.ExternalInterface;
import flash.text.TextField;
import flash.text.TextFormat;
import flash.text.TextFormatAlign;
import flash.ui.ContextMenu;
import flash.ui.ContextMenuItem;
import flash.ui.Mouse;
import flash.utils.getTimer;

import neoip.debug.console;
import neoip.debug.gc_watch_t;
import neoip.embedui.embedui_main_t;
import neoip.player.*;
import neoip.utils.apps_detect_t;
import neoip.utils.nested_uri_builder_t;

/** \brief Class to contain the main() of the swf
 */
public class flash_player extends Sprite {


private var m_embedui_main	:neoip.embedui.embedui_main_t;

private var m_jscallback_str	:String;
private var m_jscallback_key	:String;


private var test_pic		:Bitmap;		// TODO to remove
private var flv_mdata_loader	:flv_mdata_loader_t;	// TODO to remove - only for testing
private	var apps_detect		:apps_detect_t;		// TODO to remove - only for testing

/** \brief Constructor
 */
public function flash_player()
{
	// get the variables from the 'cmdline'
	var cmdline_var	:Object;
	cmdline_var	= this.root.loaderInfo.parameters;

	// get the parameter from the webpage to pass them to player_t
	m_jscallback_str	= cmdline_var['jscallback_str'];
	m_jscallback_key	= cmdline_var['jscallback_key'];

	// create the embedui_handler - to answer all the embedui request fromjs
	// - it acts as a service to javascript.
	// - it doesnt handles the player_t directly. only thru javascript
	m_embedui_main	= new neoip.embedui.embedui_main_t(this.stage
						, m_jscallback_str, m_jscallback_key);
				
	// launch the player_t
	var player	:player_t;
	player		= new player_t(this.stage, m_jscallback_str, m_jscallback_key);

	ctxmenu_ctor();

//return;


/******************* Experimentation with apps_detect_t	***********************/
if( 0 ){
	function apps_detect_cb(event_type:String, version:String, port:uint)	:void
	{
		console.info("event_type=" + event_type + " version=" + version + " port=" + port);
		apps_detect.destructor();
		apps_detect	= null;
	}
	apps_detect	= new apps_detect_t("oload", apps_detect_t.OLOAD_PORT_BEG
					, apps_detect_t.OLOAD_PORT_END, apps_detect_cb);
}


/******************* EXPERIMENTATION with loading external mdata	*******/
if( 0 ){
	// - ok the loading works ok
	// - the generation is ok too, neoip-flvfilter doing the flv parsing
	//   a ruby script generating the xml
	// - the player_t.as do not now how to handle those
	// - the type of mdata should be specified in the track_t
	// - what are the various type of mdata ?
	// - is there mdata globally or just kframe index 
	// - mdata may be present or not in the flv
	// - mdata may or may not contain the kframe index 
	// - mdata may be internal/external
	// - they may be optional too. are they present for sure ? or not
	flv_mdata_loader	= new flv_mdata_loader_t();

	console.info("start at " + getTimer());
//	flv_mdata_loader.start("internal", "http://jmehost2/~jerome/output.flv", flv_mdata_loader_cb);
	flv_mdata_loader.start("internal", "http://127.0.0.1:4550/flv/*static_filelen*11048646/*read_ahead*3004/http://blip.tv/file/get/TheSmartShow-TheSmartShowEpisode24331.flv", flv_mdata_loader_cb);
//	flv_mdata_loader.start("internal", "http://127.0.0.1:4550/flv/*static_filelen*18385529/*read_ahead*9196/http://sjl-v116.sjl.youtube.com/get_video?video_id=8y5AxLiUqC8&neoip_metavar_http_mod_flv_varname=start&neoip_metavar_http_mod_type=flv", flv_mdata_loader_cb);
//	flv_mdata_loader.start("internal", "http://127.0.0.1:4550/flv/*static_filelen*45168483/*read_ahead*5848/http://ash-v184.ash.youtube.com/get_video?video_id=hOyQ3nTDgCs&neoip_metavar_http_mod_flv_varname=start&neoip_metavar_http_mod_type=flv", flv_mdata_loader_cb);
//	flv_mdata_loader.start("internal", "http://127.0.0.1:4550/flv/*static_filelen*9618863/*read_ahead*1006/http://chi-v91.chi.youtube.com/get_video?video_id=cDq0HqHXuq0&neoip_metavar_http_mod_flv_varname=start&neoip_metavar_http_mod_type=flv", flv_mdata_loader_cb);
//	flv_mdata_loader.start("internal", "http://chi-v91.chi.youtube.com/get_video?video_id=cDq0HqHXuq0", flv_mdata_loader_cb);

	function flv_mdata_loader_cb(event_type:String, arg:flv_mdata_t)	:void {
		console.info("flv_mdata_loader_cb: event_type=" + event_type + " arg=" + arg);
		console.dir(arg);
		console.info("completed at " + getTimer());
		// delete the flv_mdata_loader_t
		flv_mdata_loader.destructor();
		flv_mdata_loader	= null;
		//if( event_type == "succeed" )	flv_mdata	= arg;
	}
}

	/*************** experiment on filepp as preprocessor	***************/
	// - http://flex2cpp.sourceforge.net/ <- another - very complete but more intrussive
	// with filepp -kc "//#" dtor1_t.as, it will produce the proper output
	//#if 0
		function KLOG_ERR(str:String) :void {}
	//#endif
	//#define KLOG_ERR(str)	console.info("__FILE__:__LINE__ " + str)
	KLOG_ERR("TesT");
	
	/*************** unittest for the nested_uri_build_t	***************/
	if( 0 ){	// unittest for the nested_uri_build_t
		var	nested_uri	:nested_uri_builder_t;
		nested_uri		= new nested_uri_builder_t;
		nested_uri.outter_uri	( "http://localhost:4550" );
		nested_uri.inner_uri	( "http://jmehost1/~jerome/output.torrent?bla=blop" );
		nested_uri.outter_var	( "subfile_path"	, "/slota/bipo");
		console.info("nested_uri=" + nested_uri.to_string());
	}

	/**************** to experiment with mouse.hide()	***************/
if( 0 ){
	// - possible solution:
	//   - periodically look at the coordinate
	//   - if the coordinate are the same for several iteration considere the cursor
	//     is still and so hide it
	//   - to make it reappaer with the same probbing strategy would create high latency
	//   - short timer would make it better
	//   - but still this is bad
	// - possible solution
	//   - detect MOUSE_MOVE and if it doesnt move for X-msec hide it
	//   - if move and is hidden, show it
	//   - simple coding and understanding, not sure about perf tho
	//     - would take cpu only when moving the mouse...
	//     - this is not that frequent
	// - possible solution: misc between the 2
	//   - use the probbing to make it disappear so low cpu while moving
	//   - use the mouse_move to when hidden
	//   - low cpu in both cases
	// - ok code the last version in a object neoip.embedui.hide_idle_mouse_t
	Mouse.hide();
}


	/*************** experiementation with a text	***********************/
if(0){
	var txt_contain	:Sprite	= new Sprite();

	// NOTE: warning this is displayed in black... and black on black doesnt show :)
	var display_txt:TextField = new TextField();
	display_txt.text	= "1234567890\nslota\nBLOUBLOU";
	display_txt.multiline	= true;
	display_txt.selectable	= false;
	display_txt.autoSize	= "left";
	txt_contain.addChild(display_txt);
	
	var text_format:TextFormat	= new TextFormat();
	text_format.font	= "Arial, Verdana, Helvetica, Sans, Bitstream Vera Sans";
	text_format.size	= 40;
	text_format.bold	= true;
	text_format.color	= 0xFFFF00;
	text_format.align	= TextFormatAlign.CENTER;
	display_txt.setTextFormat(text_format);



	var bla_data	:BitmapData	= new BitmapData(txt_contain.width, txt_contain.height
						, true, 0);
	bla_data.draw(txt_contain);
	var bla_bmap	:Bitmap		= new Bitmap(bla_data);
	bla_bmap.x	= 50;
	bla_bmap.y	= 50;
	bla_bmap.alpha	= 0.5;
	bla_bmap.scaleX	= 0.5;
	bla_bmap.scaleY	= 0.5;
	addChild(bla_bmap);
	

//	console.log("beofre textformat");
//	var fmt2:TextFormat	= display_txt.getTextFormat();
//	fmt2.size		= 50;
//	display_txt.setTextFormat(fmt2);
}

	
	/*************** experiementation with gc_watch_t	***************/
if(0){	// TODO this worked once... 
	var	slota:String	= new String();
	
	var	gc_watch1:gc_watch_t	= new gc_watch_t(slota);
	var	gc_watch2:gc_watch_t	= new gc_watch_t(gc_watch1);
}


	/*************** experiementation with a rect and event	***************/
if(0){
	var box_w:Number	= 20;
	var box_h:Number	= 30;
	var amp_w:Number	= 15; 
	var amp_h:Number	= 50;
	
	var wave_nb:int		= 5;
	var wave_curve:Number	= 5;
	var wave_inc_x:Number	= 8;
	var wave_inc_y:Number	= 3;
	
	var mute_off_x:Number	= 10;
	var mute_off_y:Number	= 5;
	
	var rect:Sprite = new Sprite();
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
		var beg_x:Number	= box_w+amp_w 	+ (i+1)*wave_inc_x;
		var beg_y:Number	= -amp_h/2	- (i+1)*wave_inc_y;
		rect.graphics.lineStyle	(4	, 0xFFFFFF);
		rect.graphics.moveTo	(beg_x, beg_y);
		rect.graphics.curveTo	(beg_x- beg_y/2, 0, beg_x, -beg_y);
	}
	
	// draw the mute cross
if(0){
	rect.graphics.lineStyle	(10	, 0xFF0000);
	rect.graphics.moveTo	(mute_off_x	, -box_h/2 - (i+1)*wave_inc_y - mute_off_y);
	rect.graphics.lineTo	(box_w+amp_w + (i+1)*wave_inc_x - mute_off_x, +box_h/2 + (i+1)*wave_inc_y + mute_off_y);
	rect.graphics.moveTo	(box_w+amp_w + (i+1)*wave_inc_x - mute_off_x, -box_h/2 - (i+1)*wave_inc_y - mute_off_y);
	rect.graphics.lineTo	(mute_off_x	, +box_h/2 + (i+1)*wave_inc_y + mute_off_y);
}
		
	rect.x		= 300;
	rect.y		= 100;
//	rect.alpha	= 0.5
	addChild(rect);
}

//	stage.addEventListener(MouseEvent.MOUSE_OVER	, onMouseOver);
//	stage.addEventListener(MouseEvent.MOUSE_OUT	, onMouseOut);
//	stage.addEventListener(Event.ENTER_FRAME	, onEnterFrame);

	return;
}

        
private function onMouseOver(event	:MouseEvent)	:void
{
	console.info("mouse_over");
}
private function onMouseOut(event	:MouseEvent)	:void
{
	console.info("mouse_out");
}

private function onEnterFrame(event	:Event)	:void
{
	test_pic.rotation += 1;
	console.info("enter_frame");
}

private function onMouseWheel(event	:MouseEvent)	:void
{
	console.info("mouse_wheel delay=" + event.delta);
//	test_pic.rotation += event.delta;
	test_pic.alpha	+= event.delta/5;
	test_pic.alpha	= Math.max(test_pic.alpha, 0);
	test_pic.alpha	= Math.min(test_pic.alpha, 1);
}



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			menu handling
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief construct the menu
 */
private function ctxmenu_ctor()	:void
{
	// build the ContextMenuItem
	var menu_item	:ContextMenuItem= new ContextMenuItem("UrFastR Player v0.42");
	// add a listener on menu_item
	menu_item.addEventListener(ContextMenuEvent.MENU_ITEM_SELECT, onMenuItemSelect);
	// modify the context menu - hide builtin item and put the title in it
	var ctx_menu	:ContextMenu	= new ContextMenu();
	ctx_menu.customItems.push(menu_item);
	ctx_menu.hideBuiltInItems();
	// set the contentMenu
	this.contextMenu	= ctx_menu;
}

/** \brief handle ContextMenuEvent.MENU_ITEM_SELECT on the stage
 */
private function onMenuItemSelect(event	:ContextMenuEvent)	:void
{
	// log to debug
	console.info("MENU ITEM SELECTED " + event);

	// TODO i dunno how to know which item has been selected from the event values
	// - this is not a problem *currently* as i handle only one context menu item
	// - so its value is hardcoded here as "home_item"

	// just notify the callback
	var event_type	:String	= "asmenu_item_select";
	var arg		:Object	= { "item_name"	: "home_item" }; 
	// notify the javascript function
	ExternalInterface.call(m_jscallback_str, m_jscallback_key, event_type, arg);
}


}	// end of class 
} // end of package


