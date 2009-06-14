/* TODO
 * - make the js script A LOT cleaner. this is the one which gonna be cut/paste by the users
 *   - another issue if the js size... compress it
 * - If state == toupdate or toinstall, then a click on the badge must go to the download page
 * - the "web badge" wikipedia page contains standard size... use them.
 */


/*
-- ok this is an example of how it should look once properly done 
- DONE how to minified this script ?
- DONE write the neoip-webpack badge_start function
- TODO make the img a <div> to be more flexible. change it to img inside _start()
- put all this on the server
  - script AND image
- put the description of it in a web4web.tv page
<center><img id="blabla"/></center>
<sBBbcript src="http://web4web.tv/jspackmin/neoip_webpack_badge_packmin.js"></script> 
<sBBcript>neoip_webpack_badge_start("180x33", "blabla");</script>
*/

// defined the namespace if not yet done
if( typeof neoip == 'undefined' )	var neoip	= {};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			ctor/dtor
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** \brief Constructor
 */
neoip.webpack_badge_t = function()
{
	console.info("enter constructor");

	// TODO issue here with the src_pattern
	var src_pattern	= /neoip_webpack_badge/;
	// get the first <script> with a src matching src_pattern
	var scripts	= document.getElementsByTagName('script');
	for(var i = 0; i < scripts.length && !scripts[i].src.match(src_pattern); i++ );
	script_cur	= scripts[i];

	// parse the parameter inside the script	
	var badge_param	= {}
	if( script_cur.innerHTML )	badge_param	= this.parse_json(script_cur.innerHTML);
	if( !badge_param['size'] )	badge_param['size']	= "180x33";
	
	built_elem	= this.build_element(badge_param['size'], "inprobing");

	// insert the elem_link just before
	script_cur.parentNode.insertBefore(built_elem, script_cur);

	// launch neoip.webpack_detect_t
	var userptr	= {	"built_elem"	: built_elem,
				"size"		: badge_param['size']
			};
	var callback		= neoip.webpack_detect_cb_t(this._webpack_detect_cb, this, userptr);
	this.m_webpack_detect	= new neoip.webpack_detect_t(callback);	
}

/** \brief Destructor of webpack_badge_t
 */
neoip.webpack_badge_t.prototype.destructor = function()
{
	// stop the webpack_detect if needed
	if( this.m_webpack_detect ){
		this.m_webpack_detect.destructor();
		this.m_webpack_detect	= null;
	}
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//			Utility function
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Build a DOM element of the badge depending on size_str and state
*/
neoip.webpack_badge_t.prototype.build_element	= function(size_str, state)
{
	var url_img	= "http://urfastr.net/static/player/widget/webpack_badge/cache/neoip_webpack_badge_" + state + "_" + size_str + ".png";
	var url_link	= "http://urfastr.net/webpack/download";
	if( state == "installed" )	url_link	= "http://urfastr.net/webpack";
	// build the image inside
	elem_img	= document.createElement('IMG');
	elem_img.setAttribute('style' 	, 'border-width: 0;');
	elem_img.setAttribute('src'	, url_img);
	// build the alink which will be activated when clicked on 
	elem_link	= document.createElement('A');
	elem_link.setAttribute('style' 	, 'text-decoration: none' );
	elem_link.setAttribute('href' 	, url_link);
	// append the image in the alink
	elem_link.appendChild( elem_img );
	// return the whole element
	return elem_link;
}

/** \brief neoip.webpack_detect_cb_t functions
 */
neoip.webpack_badge_t.prototype._webpack_detect_cb	= function(webpack_detect, userptr, new_state)
{
	// detroy m_webpack_detect
	this.m_webpack_detect.destructor();
	this.m_webpack_detect	= null;

	console.dir(userptr);
	// log the result
	console.info("result=" + new_state);	

	// build a new DOM element with the new_state
	new_elem	= this.build_element(userptr['size'], new_state);
	old_elem	= userptr['built_elem'];
	old_elem.parentNode.insertBefore(new_elem, old_elem);
	old_elem.parentNode.removeChild(old_elem);
}

/** \brief parsing json from a string
 *
 * - TODO put that elsewhere
 */
neoip.webpack_badge_t.prototype.parse_json = function(json)
{
	if( typeof json !== 'string'){
		return {"err":"trying to parse a non-string JSON object"};
	}
	try {
		var f = Function(['var document,top,self,window,parent,Number,Date,Object,Function,',
				'Array,String,Math,RegExp,Image,ActiveXObject;',
				'return (' ,
				json.replace(/<\!--.+-->/gim,'').replace(/\bfunction\b/g,'function­') , ');'].join(''));
		return f();
	}catch( e ){
		return {"err":"trouble parsing JSON object"};
	}
}

function neoip_webpack_badge_start(size_str)
{
	// log to debug
	console.info("entereeeee");
	
	/** \brief neoip.webpack_detect_cb_t functions
	 */
	function webpack_detect_cb(webpack_detect, userptr, new_state)
	{
		// log to debug
		console.info(new_state);
		console.dir(userptr);
		console.info("blabla")
		// destroy this object
		this.webpack_detect.destructor();
		// set the initial state
		var htmlid	= userptr["htmlid"];
		var size_str	= userptr["size_str"];
		neoip_webpack_badge_set(htmlid, size_str, new_state);
	}

	// launch neoip.webpack_detect_t
	var userptr	= {	"htmlid"	: htmlid,
				"size_str"	: size_str
			};
			
	var callback		= neoip.webpack_detect_cb_t(this._webpack_detect_cb, this, userptr);
	this.m_webpack_detect	= new neoip.webpack_detect_t(callback);	
	
	// set the initial state
	neoip_webpack_badge_set(htmlid, size_str, "inprobing");
}


function test_init()
{
//	neoip_webpack_badge_start("180x33");	


	var state	= "inprobing";
	var size_str	= "180x33";
	

	built_elem	= neoip_webpack_badge_elem_build(size_str, state);
	
	var src_pattern	= /neoip_webpack_badge2.js/;
	var scripts	= document.getElementsByTagName('SCRIPT');
	// get the first <script> with a src matching src_pattern
	for(var i = 0; i < scripts.length && !scripts[i].src.match(src_pattern); i++ );
	// insert the elem_link just before
	scripts[i].parentNode.insertBefore(built_elem, scripts[i]);
	
	badge_param	= {}
//	if( scripts[i].innerHTML ){
//		badge_param	= 
//	}
	console.dir(scripts[i].innerHTML);
}

var thisScript = /neoip_webpack_badge2.js/;
if( typeof window.addEventListener !== 'undefined' ){
	window.addEventListener('load', function(){ new neoip.webpack_badge_t(); }, false);
}else if( typeof window.attachEvent !== 'undefined' ){
	window.attachEvent('onload',	function(){ new neoip.webpack_badge_t(); });
}


