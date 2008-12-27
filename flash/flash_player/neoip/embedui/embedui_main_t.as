/*! \file
    \brief Definition of the class button_bitmap_t

\par Brief Description
main_embedui_main_t is a class to have a 'busy' button. aka a animated bitmap
which shows the program is doing something even if nothing new is visible. 

*/
 
/** \brief Definition of the package
 */
package neoip.embedui {
	

// list of all import for this package
import flash.display.Stage;
import flash.external.ExternalInterface;
import flash.utils.Dictionary;

import neoip.debug.console;

/** \brief Class to handle all the embedui
 */
public class embedui_main_t {

// definition of the fields in this class
private var m_stage		:Stage;
private var m_embedui_obj_arr	:Dictionary	= new Dictionary;
private var m_jscallback_str	:String;
private var m_jscallback_key	:String;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
public function embedui_main_t(p_stage:Stage, p_jscallback_str:String, p_jscallback_key:String)
{
	// copy the parameters
	m_stage		= p_stage;
	m_jscallback_str= p_jscallback_str;
	m_jscallback_key= p_jscallback_key;	
	
	// Add all the callback to be called by javascript
	ExternalInterface.addCallback("embedui_exist"	, embedui_exist_fromjs);
	ExternalInterface.addCallback("embedui_create"	, embedui_create_fromjs);
	ExternalInterface.addCallback("embedui_delete"	, embedui_delete_fromjs);
	ExternalInterface.addCallback("embedui_update"	, embedui_update_fromjs);
}

/** \brief Destructor
 */
public function destructor()	:void
{
	// log to debug
	console.debug("enter destructor");

	// delete all the current embedui
	for(var embedui_id:String in m_embedui_obj_arr){
		var embedui_obj	:Object	= m_embedui_obj_arr[embedui_id];
		// remove this embedui_obj from the m_embedui_obj_arr
		delete	m_embedui_obj_arr[embedui_id];
		// destroy this embedui_obj object
		embedui_obj.destructor();
	}
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			all the function fromjs
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/** \brief return true is this embedui_id already exists, false otherwise
 */
public function	embedui_exist_fromjs(embedui_id:String)		:Boolean
{
	// if this embedui_id doesnt exists, return false
	if( m_embedui_obj_arr[embedui_id] == null )	return false;
	// else return true
	return true;
}

/** \brief Create a embedui element from javascript
 */
public function	embedui_create_fromjs(embedui_opt:Object)	:void
{
	var embedui_class:String= embedui_opt['embedui_class'];
	var embedui_id	:String	= embedui_opt['embedui_id'];
	// sanity check - embedui_id and embedui_calss MUST be defined
	console.assert( embedui_id != null );
	console.assert( embedui_class != null );
	
	// create the ui_elem according to embedui_opt['elem_type']
	var embedui_obj	:Object;
	if( embedui_class == "button_bitmap" ){
		embedui_obj	= new button_bitmap_t	(m_stage, embedui_obj_cb, embedui_opt);
	}else if( embedui_class == "button_volume" ){
		embedui_obj	= new button_volume_t	(m_stage, embedui_obj_cb, embedui_opt);
	}else if( embedui_class == "button_busy" ){
		embedui_obj	= new button_busy_t	(m_stage, embedui_obj_cb, embedui_opt);
	}else if( embedui_class == "text_caption" ){
		embedui_obj	= new text_caption_t	(m_stage, embedui_obj_cb, embedui_opt);
	}else if( embedui_class == "select_list" ){
		embedui_obj	= new select_list_t	(m_stage, embedui_obj_cb, embedui_opt);
	}else if( embedui_class == "select_dock" ){
		embedui_obj	= new select_dock_t	(m_stage, embedui_obj_cb, embedui_opt);
	}else if( embedui_class == "root_stage" ){
		embedui_obj	= new root_stage_t	(m_stage, embedui_obj_cb, embedui_opt);
	}else{ console.assert(false)	}
		
	// sanity check - this embedui_obj_key MUST NOT be used
	console.assert( !m_embedui_obj_arr[embedui_id] );
	// put the embedui_obj in the 
	m_embedui_obj_arr[embedui_id]	= embedui_obj; 
}

/** \brief delete a embedui element from javascript
 */
public function	embedui_delete_fromjs(embedui_id:String)		:void
{
	// sanity check - this embedui_id MUST be used
	console.assert( m_embedui_obj_arr[embedui_id] );

	// get the embedui_obj from m_embedui_obj_arr
	var embedui_obj	:Object;
	embedui_obj	= m_embedui_obj_arr[embedui_id];

	// remove this embedui_obj from the m_embedui_obj_arr
	delete	m_embedui_obj_arr[embedui_id];
	console.assert( m_embedui_obj_arr[embedui_id] == null );
	
	// destroy this embedui_obj object
	embedui_obj.destructor();
	embedui_obj	= null;
}

/** \brief delete a embedui element from javascript
 */
public function	embedui_update_fromjs(embedui_id:String, arg:Object)		:void
{
	// log to debug
	console.debug("enter");
	// get the embedui_obj from m_embedui_obj_arr
	var embedui_obj	:Object	= m_embedui_obj_arr[embedui_id];
	// sanity check - this embedui_id MUST be used
	console.assert( embedui_obj );
	// call embedui_obj update function
	embedui_obj.update(arg);
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			embedui_obj_cb
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback for the embedui_obj
 */
private function embedui_obj_cb(event_type:String, arg:Object)	:void
{
	// just notify the callback
	notify_callback("embedui_event", { 	"event_type"	: event_type,
						"arg"		: arg		});
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			main callback
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Callback to notify the javascript callback
 */
private	function notify_callback(event_type:String, arg:Object)	:void
{
	// else notify the javascript function 
	ExternalInterface.call(m_jscallback_str, m_jscallback_key, event_type, arg);
}

}	// end of class 
} // end of package