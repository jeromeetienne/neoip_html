<?php

/**
 * This script is just a xdomrpc front in php
 * - xdomrpc is custom scheme to do xdom rpc using <script>
 * - NOTE: this is uselessly custom. jsonp works well
 *   - i didnt use jsonp as i wasnt aware of its existance
*/


/**
 * Return the playlist_jspf from $castname/$privhash
 */
function getPlaylist($castname, $privhash)
{
	$dirname	= "/tmp/.neoip_cast_mdata_server_data/playlist_jspf";
	$basename	= $castname."_".$privhash.".playlist_jspf";
	$fullname	= $dirname."/".$basename;
	if( !file_exists($fullname) )	throw new Exception("Unknown playlist");
	$content	= file_get_contents($fullname);
	return $content;	
}

/**
 * Return playlist_arr
*/
function getPlistArr()
{
	$dirname	= "/tmp/.neoip_cast_mdata_server_data";
	$basename	= "ezplayer_playlist_arr.json";
	$fullname	= $dirname."/".$basename;
	if( !file_exists($fullname) )	throw new Exception("PANIC cant find ".$basename);
	$content	= file_get_contents($fullname);
	return $content;	
}


// set the mime type
header('Content-type: application/javascript');

// extract variable from the URL
$obj_id		= $_GET['obj_id'];
$method_name	= $_GET['method_name'];

try{
	// check that $method_name exists
	if(!is_callable($method_name))	throw new Exception("Unknown method_name");
	
	// gather all the method args
	$method_args	= array();
	for($i = 0; $i < 99; $i++){
		$key	= 'arg'.$i;
		if( !array_key_exists($key, $_GET) )	break;
		$method_args[]	= $_GET[$key];
	}
	// call the method_name itself
	$resp	= call_user_func_array($method_name, $method_args);
	
	// build the json_reply
	$str	= "neoip_xdomrpc_script_reply_var_".$obj_id."=";
	$str	.= "{";
	$str	.= 	"fault: null";
	$str	.= ", ";
	$str	.= 	"returned_val: ".json_encode($resp);
	$str	.= "};";
	echo $str;
	exit;
}catch(Exception $e){
	// build the json replay in case of a error
	$str	= "neoip_xdomrpc_script_reply_var_".$obj_id."=";
	$str	.= "{";
	$str	.= 	"fault: {";
	$str	.= 		"code: -1, ";	
	$str	.= 		"string: \"".$e->getMessage()."\"";	
	$str	.= 	"}";
	$str	.= ", ";
	$str	.= 	"returned_val: null";
	$str	.= "};";
	echo $str;
	exit;
}
