var livatar_dbg=null;function post_jquery(g,f){var p=[];var k=function(t,u){p.push({query_str:t,callback:u})};var e=function(){if(p.length==0){return}query_arr=[];for(var u=0;u<p.length;u++){query_arr.push(p[u]["query_str"])}var t="http://api.urfastr.net/livatarAPI?format=jsonp&qs="+escape(query_arr.join(","));g.get(t,{},function(v){for(var w=0;w<v.length;w++){var y=p[w]["callback"];var x=v[w];y(x)}p=[]},"jsonp")};var q=function(t,v,u,x){var w=document.createElement("iframe");w.setAttribute("src",v);w.setAttribute("width",u);w.setAttribute("height",x);w.setAttribute("frameborder","0");g(t).empty();g(t).append(w)};var j=function(t,y,x){var u=g(y).attr("width");var v=g(y).attr("height");var w="twitter/username/"+x;k(w,function(z){if(!z){return}q(t,z,u,v)})};var n=function(){var w=g("img#profile-image");var t=w.parents("a");var u=g(t).attr("href");var v=u.match(/\/account\/profile_image\/([a-zA-Z0-9_-]+)/)[1];return j(t,w,v)};var a=function(){var v={};g("ol#timeline li.hentry.status").each(function(){var x=this;var y=g(x).attr("class").match(/u-([\w+]+)/);var z=y[1];if(v[z]){return}v[z]=x});for(username in v){var u=v[username];var t=g(u).find("a:first");var w=g(t).find("img");j(t,w,username)}};var b=function(){g("table.followers-table tr.vcard td.thumb a[rel=contact]").each(function(){var t=this;var x=g(t).find("img");var u=g(t).attr("href");var v=u.split("/");var w=v[v.length-1];j(t,x,w)})};var o=function(){var u=location.pathname;if(u=="/"){return a()}var t=u.split("/");if(t.length==2&&t[0]==""&&t[1]=="followers"){return b()}if(t.length==2&&t[0]==""&&t[1]!=""){return n()}if(t.length==3&&t[2]=="followers"){return b()}return null};var l=function(t,y,x){var u=g(y).attr("width");var v=g(y).attr("height");var w="identica/username/"+x;k(w,function(z){if(!z){return}q(t,z,u,v)})};var m=function(){var v=g("div.author img.photo.avatar");var u=v.attr("alt");var t=v.parents("dd");return l(t,v,u)};var r=function(){var u=location.pathname;var t=u.split("/");if(t.length==2&&t[0]==""&&t[1]!=""){return m()}};var d=function(){if(window.urfastr_livatar_userscript_listener){window.urfastr_livatar_userscript_listener()}};var h=function(t,y,v){var u=g(y).attr("width");var w=g(y).attr("height");var x="facebook/uid/"+v;k(x,function(z){if(!z){return}q(t,z,u,w)})};var i=function(){var v=g("img#profile_pic");container=v.parents("a");var u=g(container).attr("href").match(/id=([\d+]+)/);var t=u[1];h(container,v,t)};var c=function(){var v={};g("div.UIStream a.UIIntentionalStory_Pic img.UIRoundedImage_Image").each(function(){var y=this;var z=g(y).attr("src").match(/\q([\w]+)_/);var x=z[1];if(v[x]){return}v[x]=y});for(uid in v){var u=v[uid];var t=g(u).parents("span.UIRoundedImage");var w=g(u);h(t,w,uid)}};var s=function(){var u=location.pathname;var t=location.search;if(location.hash.substr(0,2)=="#/"){pathname=location.hash.substr(1);qmark_indexof=location.hash.indexOf("?");if(qmark_indexof!=-1){u=location.hash.substr(1,qmark_indexof-1);t=location.hash.substr(qmark_indexof)}else{u=location.hash;t=""}}if(/ref=name/.test(t)){return i()}if(u=="/profile.php"){return i()}if(/ref=home/.test(t)){return c()}if(u=="/home.php"){return c()}};if(location.host=="twitter.com"){o()}else{if(location.host=="identi.ca"){r()}else{if(location.host=="urfastr.net"){d()}else{if(location.host=="www.facebook.com"){s()}}}}e()}(function(){if(typeof jQuery!="undefined"){var b=new livatar_dbg_t(jQuery);post_jquery(jQuery,b);return}var c=document.createElement("script");c.setAttribute("src","http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js");window.document.body.appendChild(c);var a="jQuery.noConflict();";a+="livatar_dbg	= new livatar_dbg_t(jQuery);";a+="post_jquery(jQuery, livatar_dbg);";var d=document.createTextNode(a);var c=document.createElement("script");c.appendChild(d);window.document.body.appendChild(c)})();