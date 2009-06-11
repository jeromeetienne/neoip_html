/**
 * \par TODO
 * - make it return the number of replaced images
 * 
 * \par TODO (big direction)
 * - make it easy to debug
 * - make it more efficient (especially server side)
 * - make it more pervasive (support as many plateform as possible)
 *
 * \par debug
 * - on which page it this active
 * - do a single core and avoid specifics as much as possible
 * - which images involve a query, and which query
 * - make a dry run option
 *   - avoid to rerun the script many time without reloading the source page
 * - how can i make 2 versions ? dev/prod/test ?
 *   - a preprocessor ala C ?
 * - can i have an automatic testing for this ?
 *   - something like google js testing stuff ?
 *
 * \par efficient
 * - moto: "query server only once per page"
 * - to limit the number of pages and/or image is a way to limit server load
 * - the server load of livatar webservice may be negligible compared to video streaming
 * - make it easy to determine which image/page trigger a query
 * - livatar corejs: group all the images query into on server query
 *   - build an global array of query
 *     query_str: function(result){}
 *   - then process this in a global fashion
 * - livatar websrv: support multiple query in a single call 
 * 
 * \par pervasive
 * - chrome extension/mozilla jetpack/greasemonkey
 * - how to build them
 *   - automatic with makefile
 * - where to store them
 *   - close to the other widgets aka www/widgets/
 *   - widget/livatar_core
 *   - widget/livatar_jetpack
 *   - widget/livatar_chrome
 *   - widget/livatar_greasemonkey
 * - what are the good names for it
 * - currenlty there is already stuff close to this script
 *   - pipjs/firefox extension/greasemonkey 
 *   - do i make this completly distinct from livatar script or not ?
 *   - To bundle them would increase the value by providing more features per install
 *   - i dont know how to do those bundles and what to bundle
 *     - so impossible for now 
*/

/*

output_env=rel

/**
 * \par TODO
 * - make it return the number of replaced images
*/

function post_jquery($){
	var replace_by_iframe	= function(container, iframe_url, iframe_w, iframe_h){	
		// build the iframe element
		var iframeEl = document.createElement("iframe");
		iframeEl.setAttribute("src"		, iframe_url	);
		iframeEl.setAttribute('width'		, iframe_w	);
		iframeEl.setAttribute('height'		, iframe_h	);
		iframeEl.setAttribute('frameborder'	, "0"		);	
	
		// empty the container
		$(container).empty();
		// append the iframe inside it
		$(container).append(iframeEl);
	}
	
	/********************************************************************************/
	/*		Handle Twitter 							*/	
	/********************************************************************************/
	var twitter_replace_username	= function(container, imageEl, username)
	{
		// get iframe_w/iframe_h
		var iframe_w	= $(imageEl).attr('width');
		var iframe_h	= $(imageEl).attr('height');
		
		// build livaterAPI call
		query_str	= "twitter/username/"+username;
		query_url	= "http://api.urfastr.net/livatarAPI?format=jsonp&q="+escape(query_str);
		// fetch the iframe_url
		$.get(query_url, {}, function(iframe_url){
			if( iframe_url == "" )	return;
			replace_by_iframe(container, iframe_url, iframe_w, iframe_h);
		}, "jsonp");		
	}
	var twitter_process_profile	= function(){		
		var imageEl	= $("img#profile-image");	// http://twitter.com/jerome_etienne		
		var container	= imageEl.parents('a');		
		// get the username
		var href	= $(container).attr('href');
		var username	= href.match(/\/account\/profile_image\/([a-zA-Z0-9_-]+)/)[1];
		
		return twitter_replace_username(container, imageEl, username);
	}
	var twitter_process_home	= function(){
		// collect all the username
		var usernames	= {};
		$('ol#timeline li').each(function(){
			var element	= this;
			var matches	= $(element).attr('class').match(/u-([\w+]+)/);
			var username	= matches[1];
			// if username already is in usernames, return now
			if( usernames[username] )	return;
			// add this element in usernames
			usernames[username]	= element;
		});
		// log to debug
		console.dir(usernames);
		
		// got thru each username		
		for(username in usernames){
			var element	= usernames[username];
			var container	= $(element).find('a:first');
			var imageEl	= $(container).find('img');
			twitter_replace_username(container, imageEl, username);
		}
	}
	var twitter_process_followers	= function(){
		// collect all the username
		$('table.followers-table tr.vcard td.thumb a[rel=contact]').each(function(){
			var container	= this;
			var imageEl	= $(container).find('img');
			var href	= $(container).attr('href');
			var tmp		= href.split('/');
			var username	= tmp[tmp.length-1];
			//console.dir(container);
			twitter_replace_username(container, imageEl, username);
		});
	}

	var twitter_process	= function(){
		var pathname	= location.pathname;
		if( pathname == '/' )
			return twitter_process_home();
		
		var tmp		= pathname.split('/');
		if( tmp.length == 2 && tmp[0] == "" && tmp[1] != "" )
			return twitter_process_profile();
		if( tmp.length == 3 && tmp[2] == "followers" )
			return twitter_process_followers();
		return null;
	}


	/********************************************************************************/
	/*		Handle identi.ca						*/	
	/********************************************************************************/
	var identica_process	= function(){
		var imageEl	= $("div.author img.photo.avatar");
		var container	= imageEl.parents('dd');
	
		var iframe_w	= $(imageEl).attr('width');
		var iframe_h	= $(imageEl).attr('height');
	
		var iframe_url	= "http://player.urfastr.net/live";
	
		replace_by_iframe(container, iframe_url, iframe_w, iframe_h);
	}

	/********************************************************************************/
	/*		Handle urfastr.net						*/	
	/********************************************************************************/
	var urfastr_process	= function(){
		// just to notify urfastr_livatar userscript presence to the webpage
		if( window.urfastr_livatar_userscript_listener )
			window.urfastr_livatar_userscript_listener("installed");
	}


	/********************************************************************************/
	/*		Handle facebook							*/	
	/********************************************************************************/
	var facebook_replace_uid	= function(container, imageEl, uid)
	{
		// get iframe_w/iframe_h
		var iframe_w	= $(imageEl).attr('width');
		var iframe_h	= $(imageEl).attr('height');

		// build livaterAPI call
		query_str	= "facebook/uid/"+uid;
		query_url	= "http://api.urfastr.net/livatarAPI?format=jsonp&q="+escape(query_str);
		// fetch the iframe_url
		$.get(query_url, {}, function(iframe_url){
			if( iframe_url == "" )	return;
			replace_by_iframe(container, iframe_url, iframe_w, iframe_h);
		}, "jsonp");
	}
	var facebook_process_profile	= function(){
		// http://www.facebook.com/home.php#/profile.php?id=1382401184&ref=name
		var imageEl	= $("img#profile_pic");
		container	= imageEl.parents('a');
		// get facebook uid
		var matches	= $(container).attr('href').match(/id=([\d+]+)/);
		var uid		= matches[1];
		// replace the profile picture
		facebook_replace_uid(container, imageEl, uid);
	}	
	var facebook_process	= function(){
		var pathname	= location.pathname;

		// detect the profile page
		if( pathname == '/profile.php' )	return facebook_process_profile();
		
		return null;
	}

	var container	= null;
	// http://twitter.com/jerome_etienne
	if( location.host == "twitter.com" )		return twitter_process();	
	// http://identi.ca/jetienne
	if( location.host == "identi.ca" )		return identica_process();
	// http://urfastr.net
	if( location.host == "urfastr.net" )		return urfastr_process();
	// http://identi.ca/jetienne
	if( location.host == "www.facebook.com" )	return facebook_process();
	
	return null;
}

(function(){
	// TODO what is jquery is already loaded ?
	// TODO make jquery loadable on google ?
	// - http://code.google.com/apis/ajaxlibs/
	var element = document.createElement("script");
	element.setAttribute("src", "http://urfastr.net/js/jquery/jquery.js");
	window.document.body.appendChild(element);
	
	var mytxt	= 'jQuery.noConflict(); post_jquery(jQuery);';
	var textEl	= document.createTextNode(mytxt);
	var element	= document.createElement("script");
	element.appendChild(textEl);
	window.document.body.appendChild(element);
})();

