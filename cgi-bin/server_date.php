<?php

// this cgi-bin echos the current_date. 
// - this is used in order to synchronize the date in all web-browser for the player

// version using time() to be precise to the second
//echo time();


// - version using microtime to be precise to the millisecond
//   - old version
// list($usec, $sec) = explode(' ', microtime());
// $usec_str	= substr( $usec, 1 );
// echo $sec.$usec_str;

printf("%f",microtime(true) );

?>