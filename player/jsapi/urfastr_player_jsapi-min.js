var urfastr_player_jsapi=function(c){var b={player_url:"http://player.urfastr.net/live",width:"320",height:"240",event_cb:null,neoip_var_arr:{widget_src:"api_js",onload_start_play:"enabled"}};var p="urfastr_live_frame_"+Math.floor(Math.random()*100000);var a=null;var i=null;var n={dest_addr:{proxyUrl:c.crossframe_proxyUrl,listener_obj:"crossframe_msg_rpc_server_"+p,iframe_dst:"parent"},resp_addr:{proxyUrl:"http://localhost/~jerome/neoip_html/lib/crossframe/crossframe_proxy.html",listener_obj:"crossframe_msg_event_listener_page",iframe_dst:"frames['"+p+"']"}};var g=function(){for(key in b){if(c[key]!==undefined){continue}c[key]=b[key]}if(typeof crossframe==="undefined"){return}a=new crossframe.rpc_client_t({dest_addr:{proxyUrl:"http://localhost/~jerome/neoip_html/lib/crossframe/crossframe_proxy.html",listener_obj:"crossframe_msg_rpc_server_page",iframe_dst:"frames['"+p+"']"},resp_addr:{proxyUrl:c.crossframe_proxyUrl,listener_obj:"crossframe_msg_rpc_client_"+p,iframe_dst:"parent"}});if(c.event_cb){m();c.neoip_var_arr.api_addEventListener=JSON.stringify(n)}};var r=function(t,s){if(c.event_cb){c.event_cb(t,s)}};var m=function(){if(i){return}i=new crossframe.rpc_server_t({listener_obj:"crossframe_msg_rpc_server_"+p});i.register("event_notification",r)};var k=function(){q();var v="";for(key in c.neoip_var_arr){if(v.length){v+="&"}v+="neoip_var_"+escape(key)+"="+escape(c.neoip_var_arr[key])}var u=c.player_url;if(v.length){u+="?"+v}var s=document.createElement("iframe");s.setAttribute("src",u);s.setAttribute("width",c.width);s.setAttribute("height",c.height);s.setAttribute("frameborder","no");s.setAttribute("frameborder","no");s.setAttribute("id",p);s.setAttribute("name",p);var t=document.getElementById(c.container_id);t.appendChild(s)};var q=function(){var s=document.getElementById(c.container_id);while(s.hasChildNodes()){s.removeChild(s.lastChild)}};var d=function(s){c.event_cb=s;if(!i){m();a.call("addEventListener",n)}};var l=function(){a.call("playing_start")};var j=function(){a.call("playing_stop")};var h=function(s){a.call("is_playing",function(t){s(t)})};var f=function(s){a.call("plistarr_get",function(t){s(t)})};var o=function(s){a.call("webpack_status",function(t){s(t)})};var e=function(s,t){a.call("change_playlist",s,t)};g();return{build:k,destroy:q,event_cb_set:d,playing_start:l,playing_stop:j,is_playing:h,plistarr_get:f,webpack_status:o,change_playlist:e}};