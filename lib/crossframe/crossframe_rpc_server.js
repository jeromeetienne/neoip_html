// define the namespace if not already done
if( !crossframe ) var crossframe = {};

/**
 * crossframe_rpc_server_t handle the server part of a RPC system on top
 * of crossframe_msg
*/
crossframe.rpc_server_t = function(param_opt){
	var opt		= param_opt || {};
	var cb_arr	= {}
	
	// create a crossframe_msg
	var crossframe_msg	= new crossframe_msg_t();
	// make it global to receive the reply
	window[opt.listener_obj]	= crossframe_msg;
	
	/**
	 * register the fctname to this callback
	*/
	var register	= function(fctname, callback){
		cb_arr[fctname]	= callback;
	}

	// subscribe to the event
	crossframe_msg.event.bind(function(msg, src_domain, src_uri){
		// initial stuff to accept rpc_call
		rpc_call_match	= msg.match(/^rpc_call\((.*)\)/);
		if( rpc_call_match == null )	return;

		console.info("received a RPC call");
		var call_ctx	= JSON.parse(rpc_call_match[1]);
		var resp_ctx	= {
			nonce:		call_ctx.nonce,
			result:		null,
			fault:		null
		};
		try{
			if( !(call_ctx.method_name in cb_arr) )	throw "Unknown method name";
			var callback	= cb_arr[call_ctx.method_name];
			resp_ctx.result	= callback.apply(null, call_ctx.args);
		}catch(e){
			resp_ctx.fault	= e;
		}
		// build the resp_str to replay
		var resp_str	= "rpc_resp("+JSON.stringify(resp_ctx)+")";
		// reply the resp_ctx
		crossframe_msg.send(resp_str, call_ctx.resp_addr.proxyUrl, call_ctx.resp_addr.iframe_dst
					, call_ctx.resp_addr.listener_obj);
		console.dir(call_ctx);
	});

	// return public functions and variables
	return {
		register:	register
	};
}

