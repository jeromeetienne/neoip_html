var urfastr_page_name="not parsed";var urfastr_queries=[];function page_name_collect(b,a){urfastr_page_name=a}function page_name_display(b,a){console.info("page_name="+a);page_name_undisplay(b);htmlid="htmlid_page_process";b("<div>").css({position:"fixed",top:"0px",left:"0px","background-color":"red"}).attr({id:htmlid}).html("Livatar Page: <strong>"+a+"</strong>").appendTo("body")}function page_name_undisplay(a){htmlid="htmlid_page_process";a("#"+htmlid).remove()}function query_display(d,a,f,e,b){console.info("query_str="+e);var c=d("<div>").css({"font-size":"9px","background-color":"red","line-height":"10px",}).attr({"class":"urfastr_query_element"});d("<span>").text("query: "+e).appendTo(c);if(b){c.css({"background-color":"green"});d("<a>").attr({href:b}).text("Found!").appendTo(c)}d(a).prepend(c)}function queries_undisplay(a){a(".urfastr_query_element").remove()}function display_stats(a){page_name_display(a,urfastr_page_name)}function undisplay_stats(a){page_name_undisplay(a);queries_undisplay(a)}function post_jquery(l){var j=[];var n=function(r,s){j.push({query_str:r,callback:s})};var e=function(){for(var s=0;s<j.length;s++){var t=j[s]["query_str"];var u=j[s]["callback"];var r="http://api.urfastr.net/livatarAPI?format=jsonp&q="+escape(t);l.get(r,{},u,"jsonp")}};var g=function(r,t,s,v){var u=document.createElement("iframe");u.setAttribute("src",t);u.setAttribute("width",s);u.setAttribute("height",v);u.setAttribute("frameborder","0");l(r).empty();l(r).append(u)};var p=function(r,w,v){var s=l(w).attr("width");var t=l(w).attr("height");var u="twitter/username/"+v;n(u,function(x){query_display(l,r,w,u,x);return;if(!x){return}g(r,x,s,t)})};var o=function(){page_name_collect(l,"twitter profile");var u=l("img#profile-image");var r=u.parents("a");var s=l(r).attr("href");var t=s.match(/\/account\/profile_image\/([a-zA-Z0-9_-]+)/)[1];return p(r,u,t)};var a=function(){page_name_collect(l,"twitter home");var t={};l("ol#timeline li.hentry.status").each(function(){var v=this;var w=l(v).attr("class").match(/u-([\w+]+)/);var x=w[1];if(t[x]){return}t[x]=v});console.dir(t);for(username in t){var s=t[username];var r=l(s).find("a:first");var u=l(r).find("img");p(r,u,username)}};var f=function(){page_name_collect(l,"twitter followers");l("table.followers-table tr.vcard td.thumb a[rel=contact]").each(function(){var r=this;var v=l(r).find("img");var s=l(r).attr("href");var t=s.split("/");var u=t[t.length-1];p(r,v,u)})};var q=function(){var s=location.pathname;if(s=="/"){return a()}var r=s.split("/");if(r.length==2&&r[0]==""&&r[1]=="followers"){return f()}if(r.length==2&&r[0]==""&&r[1]!=""){return o()}if(r.length==3&&r[2]=="followers"){return f()}return null};var i=function(r,w,v){var s=l(w).attr("width");var t=l(w).attr("height");var u="identica/username/"+v;n(u,function(x){query_display(l,r,w,u,x);return;if(!x){return}g(r,x,s,t)})};var d=function(){page_name_collect(l,"identica profile");var t=l("div.author img.photo.avatar");var s=t.attr("alt");var r=t.parents("dd");return i(r,t,s)};var k=function(){var s=location.pathname;var r=s.split("/");if(r.length==2&&r[0]==""&&r[1]!=""){return d()}};var b=function(){page_name_collect(l,"urfastr");if(window.urfastr_livatar_userscript_listener){window.urfastr_livatar_userscript_listener("installed")}};var h=function(r,w,t){var s=l(w).attr("width");var u=l(w).attr("height");var v="facebook/uid/"+t;n(v,function(x){query_display(l,r,w,v,x);return;if(!x){return}g(r,x,s,u)})};var c=function(){page_name_collect(l,"facebook profile");var t=l("img#profile_pic");container=t.parents("a");var s=l(container).attr("href").match(/id=([\d+]+)/);var r=s[1];h(container,t,r)};var m=function(){var s=location.pathname;var r=location.search;if(location.hash.substr(0,2)=="#/"){pathname=location.hash.substr(1);qmark_indexof=location.hash.indexOf("?");if(qmark_indexof!=-1){s=location.hash.substr(1,qmark_indexof-1);r=location.hash.substr(qmark_indexof)}else{s=location.hash;r=""}}if(/ref=name/.test(r)){return c()}if(s=="/profile.php"){return c()}};if(location.host=="twitter.com"){q()}else{if(location.host=="identi.ca"){k()}else{if(location.host=="urfastr.net"){b()}else{if(location.host=="www.facebook.com"){m()}}}}e()}(function(){console.info("enter");if(typeof jQuery!="undefined"){console.info("jquery already loaded");post_jquery(jQuery);undisplay_stats(jQuery);display_stats(jQuery);return}console.info("load jquery");var b=document.createElement("script");b.setAttribute("src","http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js");window.document.body.appendChild(b);var a="jQuery.noConflict();";a+="post_jquery(jQuery);";a+="undisplay_stats(jQuery);";a+="display_stats(jQuery);";var c=document.createTextNode(a);var b=document.createElement("script");b.appendChild(c);window.document.body.appendChild(b)})();