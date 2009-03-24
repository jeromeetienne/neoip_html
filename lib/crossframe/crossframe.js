/**
 * crossframe_msg_t handle the transmission and reception of
 * message between frames (even on different domains)
*/
var crossframe_msg_t = function(){
	/**
	 * Send a message to a iframe_dst
	 * 
	 * @param proxy_uri {string} uri of the proxy document
	 * @param iframe_dst {string} the reference of destination frame. e.g "parent.frames['foo']"
	 * @param message {string} the message to send (if you need a non string object, do the json convertion)
	*/
	var send	= function(message, proxy_uri, iframe_dst, listener_obj){
		// Create a new hidden iframe.
		var el = document.createElement("iframe");
		el.style.visibility	= "hidden";
		el.style.position	= "absolute";
		el.style.top 		= el.style.left		= "0";
		el.style.width		= el.style.height	= "0";

		// Listen for the onload event.
		el.addEventListener('load', function (){
			//console.info('msg iframe loaded. will be deleted in a sec');
			// first, remove the event listener or the iframe
			// we intend to discard will not be freed...
			el.removeEventListener("load", arguments.callee, false);
			// discard the iframe... after 1sec
			// - i dislike this timer a lot
			setTimeout(function (){
				//console.info('msg iframe deleted');
				document.body.removeChild(el);
			}, 1000);
		}, false);
		
		// Compose the message...
		// TODO why do i care about domain/uri here ?
		var hash_str	= "iframe_dst="		+ escape(iframe_dst)		+
					"&message="	+ escape(message)		+
					"&domain="	+ escape(document.domain)	+
					"&uri="		+ escape(location.href)		+
					"&listener_obj="+ escape(listener_obj);
		console.info('send ' + hash_str);
		// Set its src first...
		el.src = proxy_uri + "#" + hash_str;
		// happen it to the body
		document.body.appendChild(el);
	}

	/**
	 * Handle the event
	 * - it is used to trigger/bind event
	*/
	var event = (function() {
		//function to call on event fire
		var callback	= null;
	
		// bind a function to the event
		var bind	= function(fct) {
			callback	= fct;
		};
	
		// trigger the event
		var trigger	= function(domain, uri, message){
			if( callback === null )	return;
			if( callback === null )	console.info('There was no function subscribed to the event!');
			callback(domain, uri, message);
		};

		// return public functions and variables
		return {
			bind:		bind,
			trigger:	trigger
		}
	})();

	// return public functions and variables
	return {
		send:	send,
		event:	event
	};
}
