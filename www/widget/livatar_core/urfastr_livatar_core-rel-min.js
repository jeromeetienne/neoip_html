function post_jquery(f){var o=[];var j=function(s,t){o.push({query_str:s,callback:t})};var e=function(){if(o.length==0){return}query_arr=[];for(var t=0;t<o.length;t++){query_arr.push(o[t]["query_str"])}var s="http://api.urfastr.net/livatarAPI?format=jsonp&qs="+escape(query_arr.join(","));f.get(s,{},function(u){for(var v=0;v<u.length;v++){var x=o[v]["callback"];var w=u[v];x(w)}o=[]},"jsonp")};var p=function(s,u,t,w){var v=document.createElement("iframe");v.setAttribute("src",u);v.setAttribute("width",t);v.setAttribute("height",w);v.setAttribute("frameborder","0");f(s).empty();f(s).append(v)};var i=function(s,x,w){var t=f(x).attr("width");var u=f(x).attr("height");var v="twitter/username/"+w;j(v,function(y){if(!y){return}p(s,y,t,u)})};var m=function(){var v=f("img#profile-image");var s=v.parents("a");var t=f(s).attr("href");var u=t.match(/\/account\/profile_image\/([a-zA-Z0-9_-]+)/)[1];return i(s,v,u)};var a=function(){var u={};f("ol#timeline li.hentry.status").each(function(){var w=this;var x=f(w).attr("class").match(/u-([\w+]+)/);var y=x[1];if(u[y]){return}u[y]=w});for(username in u){var t=u[username];var s=f(t).find("a:first");var v=f(s).find("img");i(s,v,username)}};var b=function(){f("table.followers-table tr.vcard td.thumb a[rel=contact]").each(function(){var s=this;var w=f(s).find("img");var t=f(s).attr("href");var u=t.split("/");var v=u[u.length-1];i(s,w,v)})};var n=function(){var t=location.pathname;if(t=="/"){return a()}var s=t.split("/");if(s.length==2&&s[0]==""&&s[1]=="followers"){return b()}if(s.length==2&&s[0]==""&&s[1]!=""){return m()}if(s.length==3&&s[2]=="followers"){return b()}return null};var k=function(s,x,w){var t=f(x).attr("width");var u=f(x).attr("height");var v="identica/username/"+w;j(v,function(y){if(!y){return}p(s,y,t,u)})};var l=function(){var u=f("div.author img.photo.avatar");var t=u.attr("alt");var s=u.parents("dd");return k(s,u,t)};var q=function(){var t=location.pathname;var s=t.split("/");if(s.length==2&&s[0]==""&&s[1]!=""){return l()}};var d=function(){if(window.urfastr_livatar_userscript_listener){window.urfastr_livatar_userscript_listener("installed")}};var g=function(s,x,u){var t=f(x).attr("width");var v=f(x).attr("height");var w="facebook/uid/"+u;j(w,function(y){if(!y){return}p(s,y,t,v)})};var h=function(){var u=f("img#profile_pic");container=u.parents("a");var t=f(container).attr("href").match(/id=([\d+]+)/);var s=t[1];g(container,u,s)};var c=function(){var u={};f("div.UIStream a.UIIntentionalStory_Pic img.UIRoundedImage_Image").each(function(){var x=this;var y=f(x).attr("src").match(/\q([\w]+)_/);var w=y[1];if(u[w]){return}u[w]=x});for(uid in u){var t=u[uid];var s=f(t).parents("span.UIRoundedImage");var v=f(t);g(s,v,uid)}};var r=function(){var t=location.pathname;var s=location.search;if(location.hash.substr(0,2)=="#/"){pathname=location.hash.substr(1);qmark_indexof=location.hash.indexOf("?");if(qmark_indexof!=-1){t=location.hash.substr(1,qmark_indexof-1);s=location.hash.substr(qmark_indexof)}else{t=location.hash;s=""}}if(/ref=name/.test(s)){return h()}if(t=="/profile.php"){return h()}if(/ref=home/.test(s)){return c()}if(t=="/home.php"){return c()}};if(location.host=="twitter.com"){n()}else{if(location.host=="identi.ca"){q()}else{if(location.host=="urfastr.net"){d()}else{if(location.host=="www.facebook.com"){r()}}}}e()}(function(){if(typeof jQuery!="undefined"){post_jquery(jQuery);return}var b=document.createElement("script");b.setAttribute("src","http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js");window.document.body.appendChild(b);var a="jQuery.noConflict();";a+="post_jquery(jQuery);";var c=document.createTextNode(a);var b=document.createElement("script");b.appendChild(c);window.document.body.appendChild(b)})();