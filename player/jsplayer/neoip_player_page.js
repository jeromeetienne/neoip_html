var cast_name		= "";
var cast_privhash	= "";
var playlist_id		= "";
var server_date		= neoip.core.download_file_insync("../../cgi-bin/server_date.php", true);

// just to debug
if( false ){
	cast_name		= "LCP an"
	cast_privhash		= "e334e91c";
	playlist_id		= "001.ruby_conf";
}


//var cast_name		= "<?php echo $_GET['cast_name'];	?>";
//var cast_privhash	= "<?php echo $_GET['cast_privhash'];	?>";
//var playlist_id	= "<?php echo $_GET['playlist_id'];	?>";
//var server_date	=  <?php printf("%f",microtime(true) );	?>


// determine the playlist_uid (if any)
var playlist_uid	= "";
// if the uri contains cast_name/cast_privhash variable and dfl_plistarr_uid == live, use it to load this playlist
if( neoip.globalCfg.dfl_plistarr_uid == "plistarr_live" && cast_name != "" && cast_privhash != "" ){
	playlist_uid	= neoip.globalCfg.dfl_plistarr_uid+"/"+cast_name +"_"+cast_privhash+".playlist_jspf";
// if the uri contains playlist_id and dfl_plistarr_uid == play, use it to load this playlist
}else if( neoip.globalCfg.dfl_plistarr_uid == "plistarr_play" && playlist_id != "" ){
	playlist_uid	= neoip.globalCfg.dfl_plistarr_uid+"/"+playlist_id+".playlist.jspf";		
}

// extract all configuration options from the document URI
// - this is ok as it is suppposed to be used as iframe
var urivar_arr	= neoip.core.doc_urivar_arr();
var cfgvar_arr	= {
	//'onload_start_play'	: "enabled",
	fullpage_state	: 'maximized'
};	
for(var key in urivar_arr){
	// goto the next if not prefixed by "neoip_var_"
	if( /^neoip_var_/.test(key) == false )	continue;
	// remove the prefix from the key
	stripped_key	= /^neoip_var_(.*)/.exec(key)[1]
	// copy the value in cfgvar_arr
	cfgvar_arr[stripped_key]	= urivar_arr[key];
}

console.dir(cfgvar_arr);

// build the neoip.ezplayer_t
var ezplayer	= new neoip.ezplayer_t(cfgvar_arr);
// set the server_date in ezplayer
ezplayer.set_server_date( server_date*1000 );

// if there is a playlist_uid , use it to load this playlist
// - additionnaly dont put a playlist_arr, so impossible to change channel
if( playlist_uid != "" ){
	ezplayer.change_playlist(playlist_uid);
}else{
	var plistarr_uid	= neoip.globalCfg.dfl_plistarr_uid;
	ezplayer.load_plistarr(plistarr_uid);
}
// start the ezplayer_t
ezplayer.start();
