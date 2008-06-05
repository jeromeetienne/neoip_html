<?php	/***** PHP to detect if the user-agent is able to understand HTML *****/
	/* - if not, it means it is likely not a browser and do a
	 *   plain http redirection.
	 * - javascript is required to detect neoip-oload
	 */

	// include the browser detection script
	include('browser_detection.php');
	// if the user-agent IS NOT a browser, assume it is not html, and 
	// redirect immediatly to the inner_uri
	if( browser_detection('dom') == false ){
		$inner_uri = $_GET['inner_uri'];
		// replace "http:/" with "http://"
		// - the double "//" got stripped in inner_uri as it is interpreted
		//   as the path of the URI and no more as a scheme 
		$inner_uri = preg_replace('#http:/(?!/)#iu','http://',$inner_uri);
		header('Location: '.$inner_uri);
	}
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head><title>Web4Web.tv File Booster (beta)</title></head>
<script src="/jspackmin/data/neoip_oload_redir_packmin.js"></script>
<body>

<center><h1>Web4Web.tv File Booster</h1></center>

Hello, you arrived on <a href="http://Web4Web.tv">Web4Web.tv</a> file booster!
It a new service which allow you to download files faster and help the publisher
by reducing its bandwidth cost! All that for free!<br/>

It takes advantage of <a href="http://Web4Web.tv/download">neoip-webpack</a>
technology.

<h1>TODO</h1>
<ul>
	<li>Put adsense on this page</li>
	<li>Put banner on the Web4Web pack status</li>
	<li>Put tunable timer to start downloading. even after neoip-webpack presence 
	    is detected. it allows better exposure of the download</li>
	<li>If webpack is not present, put a clear warning on installing it</li>
</ul>


<br/> 
<br/> 
<br/> 
<br/> 


<!-- This is a php link creation in case the browser doesnt support javascript -->
If the redirection takes too long, you may click <a href="
<?php
	$inner_uri = $_GET['inner_uri'];
	// replace "http:/" with "http://"
	// - the double "//" got stripped in inner_uri as it is interpreted
	//   as the path of the URI and no more as a scheme 
	$inner_uri = preg_replace('#http:/(?!/)#iu','http://',$inner_uri);
	// output the inner_uri
	echo $inner_uri
?>">here</a>. It may be due to an imcompatibility with your browser (no support 
for javascript).

<script>
	var inner_uri	= "<?php echo $_GET['inner_uri']; ?>";
	// if inner_uri start with "http:/" and not "http://", then add the missing "/"
	// - If the inner_uri has been considered as a path, then the double "/" has
	//   been removed as redondant. as it is supposed to happen.
	// - this happen in the case of 'clean uri' where the inner_uri is coded as 
	//   part of the whole uri. instead of a uri variable	
	if( /^http:\//.test(inner_uri) && ! /^http:\/\//.test(inner_uri) ){
		inner_uri= inner_uri.replace(/^http:\//, "http://");
	}
	// build the neoip.oload_redir_t IIF inner_uri is not null
	if( inner_uri ){
		var oload_redir	= new neoip.oload_redir_t();
		oload_redir.start(inner_uri);
	}
</script>


</body>
</html>
