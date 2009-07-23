/*! \file
    \brief Definition of the ezplayer_api_t

\par Brief Description
handle the api call for the ezplayer iframe widget

*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};



/**
 * ezplayer_api_t
*/
neoip.ezplayer_api_t = function(p_ezplayer){
	var ezplayer	= p_ezplayer;
	var rpc_server	= null;

	/**
	 * constructor
	*/
	var ctor	= function(){
		// TODO make ezplayer to notify me as callback		
		
		// build the rpc_server_t
		rpc_server	= crossframe.rpc_server_t({
			listener_obj:	"crossframe_msg"
		});

		rpc_server.register("playing_start", function(){
			console.info("rpc_server playing start");
			ezplayer.playing_start();
		});
		rpc_server.register("playing_stop", function(){
			console.info("rpc_server playing stop");
			ezplayer.playing_stop();
		});

		// register observer's calls in crossframe.rpc_server_t		
		rpc_server.register("observer_add", observer_add );
		rpc_server.register("observer_del", observer_del);
	}
	
	/****************************************************************/
	/****************************************************************/
	/*	observer pattern					*/
	/****************************************************************/
	/****************************************************************/
	var observers	= [];
	/**
	 * Add an observer
	*/
	var observer_add	= function(){
		// TODO add this observer
	}	
	/**
	 * Delete an observer
	*/
	var observer_del	= function(){
		
	}
	/**
	 * return true if it this observer is already registered
	*/
	var observer_has	= function(){
		
	}
	var observer_notify	= function(event_type, event_args){
		// go thru all the observers
		for(var i = 0; i < observers.length; i++){
			// TODO call the observers
		}
	}
	
	// call the constructor
	ctor();

	// return public functions and variables
	return {
	};
}


