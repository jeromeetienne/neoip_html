<?php
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
		echo('Location: '.$inner_uri);
	}
?>

may use JS