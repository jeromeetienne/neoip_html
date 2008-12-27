/*! \file
    \brief Definition of the package
*/

package {
// list of all import for this package
import flash.net.NetStream;
import flash.net.NetConnection;
import flash.net.ObjectEncoding;
	
import flash.media.Video;
import flash.media.Camera;
import flash.media.Microphone;
	
import flash.display.Sprite;
import flash.events.NetStatusEvent;

import neoip.debug.console;
import neoip.recorder.*;

/** \brief Class to contain the main() of the swf
 */
public class readwebcam extends Sprite
{

public var vid:Video;
public var cam:Camera;
public var mic:Microphone;
	
public var ns	:NetStream;
public var nc	:NetConnection;

public function readwebcam()
{
if(true){
	var recorder	:cam_recorder_t;
	recorder	= new cam_recorder_t(this.stage);
	console.info("enter");	
}else{
	vid	= new Video( );
	cam	= Camera.getCamera( );
	//cam.setMode( 320 , 240 , 30 );
	//cam.setMode(320, 240, 15);
	//cam.setQuality( 60*1024 , 0 );
	//camera.setKeyFrameInterval(CAMERA_KEY_FRAME_INTERVAL); /* Comment this out */
	//camera.setQuality(0, 0);
	addChild( vid );
	vid.attachCamera( cam );	

	nc	= new NetConnection();
	nc.objectEncoding = flash.net.ObjectEncoding.AMF0;
	nc.addEventListener( NetStatusEvent.NET_STATUS , onNetConnectionStatus );
	nc.connect("rtmp://127.0.0.1/live");
}
}

public function onNetConnectionStatus( event : NetStatusEvent ) : void
{
	console.info("event=" + event.info.code);
	ns	= new NetStream( nc );
	ns.attachCamera( cam );
	nc.addEventListener( NetStatusEvent.NET_STATUS , onNetStreamStatus );
	ns.publish("test" , "record");
}

public function onNetStreamStatus( event : NetStatusEvent ) : void
{
	console.info("event=" + event.info.code);
}

}	// end of class 
} // end of package
