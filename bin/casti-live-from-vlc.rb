#!/usr/bin/ruby
#
# \par Brief Description
# Specific script to automatize the restreaming of existing internet stream
# into neoip-casti.
# - 

# hardcoded 
channel_name	= ARGV[0];
if( channel_name == "france24" ) 
	vlc_orig_uri	= "mms://live.france24.com/france24_fr.wsx";
	httpi_uri_port	= 8080;
	cast_name	= "france24.flv";
elsif( channel_name == "weather" )
	vlc_orig_uri	= "mms://a860.l2233258859.c22332.g.lm.akamaistream.net/D/860/22332/v0001/reflector:58859";
	httpi_uri_port	= 8081;
	cast_name	= "weather.flv";
elsif( channel_name == "fox8" )
	vlc_orig_uri	= "mms://a1090.l1814050135.c18140.g.lm.akamaistream.net/D/1090/18140/v0001/reflector:50135";
	httpi_uri_port	= 8082;
	cast_name	= "fox8.flv";
else
	puts "invalid channel name #{channel_name}! aborting";
	exit
end




# Some parameters
cast_privtext	= "bonjour77";
video_bitrate	= 300
audio_bitrate	= 64
video_width	= 160
video_height	= 120
video_fps	= 15

################################################################################
#		Launch vlc in background
################################################################################
# build the vlc cmdline
cmdline	 = "vlc.svn --sout \"#transcode{vcodec=FLV1,acodec=mp3,samplerate=22050,";
cmdline	+= "vb=#{video_bitrate},ab=#{audio_bitrate},width=#{video_width},";
cmdline += "height=#{video_height},fps=#{video_fps}}";
cmdline += ":std{access=http{mime=video/x-flv},mux=ffmpeg{mux=flv},";
cmdline += "dst=127.0.0.1:#{httpi_uri_port}/stream.flv}\"  --loop -vvv ";
cmdline += "-I dummy --sout-ffmpeg-keyint #{video_fps}"
cmdline += " --sout-ffmpeg-strict-rc #{vlc_orig_uri}"
cmdline += " 2>/tmp/vlc_#{cast_name}.log"

# log to debug
puts "cmdline=#{cmdline}"

# launch the vlc in background
vlc_pid	= Process.fork { exec(cmdline) }
Process.detach(vlc_pid)

################################################################################
#		Launch casti prober
################################################################################
# build the neoip-casti probe cmdline
cmdline	 = "";
cmdline	+= "./neoip-casti-recording.rb";
cmdline += " --cast_name #{cast_name}";
cmdline += " --cast_privtext #{cast_privtext}";
cmdline += " --httpi_mod flv";
cmdline += " --mdata_srv_uri http://jmeserv.podzone.net/~jerome/neoip_html/cgi-bin/cast_mdata_echo_server.fcgi";
cmdline += " --httpi_uri http://127.0.0.1:#{httpi_uri_port}/stream.flv";

# log to debug
#puts "cmdline=#{cmdline}"

# launch the neoip-casti probe
system(cmdline);

################################################################################
#		Kill background vlc
################################################################################
# kill the vlc launched in background
Process.kill("TERM", vlc_pid) rescue Errno::ESRCH








