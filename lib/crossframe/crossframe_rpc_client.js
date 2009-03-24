// define the namespace if not already done
if( !crossframe ) var crossframe = {};


/**
 * crossframe_rpc_client_t handle the client part of a RPC system on top
 * of crossframe_msg
*/
crossframe.rpc_client_t = function(param_opt){
	var opt		= param_opt || {};
	var calls	= {};

	// create a crossframe_msg
	var crossframe_msg	= new crossframe_msg_t();
	// make it global to receive the reply
	window[opt.resp_addr.listener_obj]	= crossframe_msg;

	/**
	 * Perform a call
	*/
	var doCall	= function(){
		// convert arguments[] array into a real Array object
		var call_ctx		= {};
		call_ctx.resp_addr	= param_opt.resp_addr;
		call_ctx.method_name	= arguments[0];
		call_ctx.nonce		= Math.random();
		call_ctx.args		= [];
		for(var i = 1; i < arguments.length; i++){
			if( i == arguments.length && typeof arguments[i] == 'function') continue;
			call_ctx.args.push(arguments[i]);
		}
		// get the callback if any
		var callback	= typeof arguments[arguments.length-1] == 'function' ? arguments[arguments.length-1] : null;
		// store the call while waiting for the response
		calls[call_ctx.nonce]	= { call_ctx: call_ctx, callback: callback };
		// log to debug
		console.info('rpc call');
		console.dir(call_ctx);
		console.info("in json:"+JSON.stringify(call_ctx));
		// send the msg to the other frame
		var call_str	= "rpc_call("+JSON.stringify(call_ctx)+")";
		console.log("sending '" + call_str + "' to " + opt.dest_addr.iframe_dst);
		crossframe_msg.send(call_str	, opt.dest_addr.proxyUrl
						, opt.dest_addr.iframe_dst
						, opt.dest_addr.listener_obj);
	}
	
	// subscribe to the event
	crossframe_msg.event.bind(function(msg, src_domain, src_uri){
		// initial stuff to handle a 
		rpc_resp_match	= msg.match(/^rpc_resp\((.*)\)/);
		if( rpc_resp_match === null )	return;

		console.info("received a RPC reply");
		var resp_ctx	= JSON.parse(rpc_resp_match[1]);
		console.dir(resp_ctx);
		
		// sanity check - if this resp_ctx expected
		if( !(resp_ctx.nonce in calls) ){
			console.info('received a unexpected rpc_resp...');
			return;
		}
		console.info('expected rpc_resp');
		// copy the call
		var call	= calls[resp_ctx.nonce];
		// remove it from the expected replies
		delete calls[resp_ctx.nonce];
		// notify the callback if needed
		if( call.callback )	call.callback(resp_ctx);
	});
	

	// return public functions and variables
	return {
		call:		doCall
	};
}
