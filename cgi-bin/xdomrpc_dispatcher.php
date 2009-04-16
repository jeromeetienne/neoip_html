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
function castGetPlaylist($playlist_id)
{
	$tmp		= explode("/", $playlist_id, 2);
	$plistarr_id	= $tmp[0];
	$basename	= $tmp[1];
	if( $plistarr_id == "plistarr_live" ){
		$dirname	= "/tmp/.neoip_cast_mdata_server_data/playlist_jspf";
		if( !file_exists($dirname."/".$basename) )	$basename = "none_not_found_cast_privhash.playlist_jspf";
		$fullname	= $dirname."/".$basename;
	}else if( $plistarr_id == "plistarr_play" ){
		$dirname	= "/home/jerome/public_html/neoip_html/player/cache/playlist.jspf";
		if( !file_exists($dirname."/".$basename) )	throw new Exception("PANIC basename ".$basename." does not exists");
		$fullname	= $dirname."/".$basename;		
	}else {
		throw new Exception("PANIC plistarr_id ".$plistarr_id." is unknown");
	}
	$content	= file_get_contents($fullname);
	return $content;
}

/**
 * Return playlist_arr
*/
function castGetPlistArr($plistarr_id)
{
	if( $plistarr_id == "plistarr_live" ){
		$dirname	= "/tmp/.neoip_cast_mdata_server_data";
		$basename	= "ezplayer_playlist_arr.json";
		$fullname	= $dirname."/".$basename;
	}else if( $plistarr_id == "plistarr_play" ){
		$dirname	= "/home/jerome/public_html/neoip_html/player/cache";
		$basename	= "ezplayer_playlist_arr.json";
		$fullname	= $dirname."/".$basename;
	}else {
		throw new Exception("PANIC plistarr_id ".$plistarr_id." is unknown");
	}
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
