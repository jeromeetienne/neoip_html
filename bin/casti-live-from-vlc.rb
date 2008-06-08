#!/usr/bin/ruby
#
# \par Brief Description
# Specific script to automatize the restreaming of existing internet stream
# into neoip-casti.

require "socket"

# init the channel_arr - an array of predefined channels
channel_arr	= [];
channel_arr	<< {	"channel_name"	=> "france24_fr",
			"vlc_orig_uri"	=> "mms://live.france24.com/france24_fr.wsx",
			"cast_name"	=> "france24_fr.flv",
		};
channel_arr	<< {	"channel_name"	=> "france24_en",
			"vlc_orig_uri"	=> "mms://live.france24.com/france24_en.wsx",
			"cast_name"	=> "france24_en.flv",
		};
channel_arr	<< {	"channel_name"	=> "weather",
			"vlc_orig_uri"	=> "mms://a860.l2233258859.c22332.g.lm.akamaistream.net/D/860/22332/v0001/reflector:58859",
			"cast_name"	=> "weather.flv",
		};
channel_arr	<< {	"channel_name"	=> "fox8",
			"vlc_orig_uri"	=> "mms://a1090.l1814050135.c18140.g.lm.akamaistream.net/D/1090/18140/v0001/reflector:50135",
			"cast_name"	=> "fox8.flv",
		};
channel_arr	<< {	"channel_name"	=> "perpignantv",
			"vlc_orig_uri"	=> "mms://88.191.39.73/perpignantvstream",
			"cast_name"	=> "perpignantv.flv",
		};
channel_arr	<< {	"channel_name"	=> "labelletv",
			"vlc_orig_uri"	=> "http://www.labelletv.net/labelletv.asx",
			"cast_name"	=> "labelletv.flv",
		};
channel_arr	<< {	"channel_name"	=> "tva",
			"vlc_orig_uri"	=> "http://207.253.121.82/TVAStream",
			"cast_name"	=> "tva.flv",
		};
channel_arr	<< {	"channel_name"	=> "andore_tv",
			"vlc_orig_uri"	=> "mms://194.158.91.91/Atv",
			"cast_name"	=> "andore_tv.flv",
		};
channel_arr	<< {	"channel_name"	=> "boardriderstv",
			"vlc_orig_uri"	=> "mms://quik4.impek.tv/brtv",
			"cast_name"	=> "boardriderstv.flv",
		};
channel_arr	<< {	"channel_name"	=> "bfm",
			"vlc_orig_uri"	=> "mms://vipmms9.yacast.net/bfm_bfmtv",
			"cast_name"	=> "BFMtv.flv",
		};
channel_arr	<< {	"channel_name"	=> "lcn",
			"vlc_orig_uri"	=> "http://207.253.121.82/LCN",
			"cast_name"	=> "LCN.flv",
		};
channel_arr	<< {	"channel_name"	=> "visjonnorg",
			"vlc_orig_uri"	=> "mms://wm-live.crossnet.net/Visjonnorge",
			"cast_name"	=> "visjonnorg.flv",
		};
channel_arr	<< {	"channel_name"	=> "wmty",
			"vlc_orig_uri"	=> "http://prog.videorelay.com/wmty35570/live.asx",
			"cast_name"	=> "WMTY.flv",
		};
channel_arr	<< {	"channel_name"	=> "krnv",
			"vlc_orig_uri"	=> "mms://a305.l1621143063.c16211.g.lm.akamaistream.net/D/305/16211/v0001/reflector:43063",
			"cast_name"	=> "krnv.flv",
		};			
channel_arr	<< {	"channel_name"	=> "bonobotv",
			"vlc_orig_uri"	=> "mms://stream00.prostream.co.uk/bonobotv",
			"cast_name"	=> "bonoboTV.flv",
		};
channel_arr	<< {	"channel_name"	=> "channel5",
			"vlc_orig_uri"	=> "mms://200.32.198.94/channel5",
			"cast_name"	=> "channel5.flv",
		};

# find in channel_arr the first item with a 'channel_name' equal to ARGV[0]
for i in 0...channel_arr.length
	if channel_arr[i]['channel_name'] == ARGV[0]
		channel_idx	= i;
		break
	end
end
# if this channel cant be found,  display an error message and abort
if channel_idx.nil?
	puts "channel_name #{ARGV[0]} cant be found among the prdefined list! aborting";
	exit
end

# set some variable
vlc_orig_uri	= channel_arr[channel_idx]['vlc_orig_uri'];
cast_name	= channel_arr[channel_idx]['cast_name'];
httpi_uri_port	= 8080 + channel_idx;


# Some parameters
cast_privtext	= "bonjour77";
# BARCAMP KLUDGE - listen on sd-14474.dedibox.fr public ip addr to allow direct read
# httpi_uri_ipaddr= "127.0.0.1";
# httpi_uri_ipaddr= "88.191.76.230";
httpi_uri_ipaddr= IPSocket::getaddress('sd-14474.dedibox.fr');
video_bitrate	= 416
audio_bitrate	= 64
video_width	= 320
video_height	= 240
video_fps	= 15

################################################################################
#		Launch vlc in background
################################################################################
# build the vlc cmdline
cmdline	 = "vlc --sout \"#transcode{vcodec=FLV1,acodec=mp3,samplerate=44100,";
cmdline	+= "vb=#{video_bitrate},ab=#{audio_bitrate},width=#{video_width},";
cmdline += "height=#{video_height},fps=#{video_fps}}";
cmdline += ":std{access=http{mime=video/x-flv},mux=ffmpeg{mux=flv},";
cmdline += "dst=#{httpi_uri_ipaddr}:#{httpi_uri_port}/stream.flv}\" --loop -vvv ";
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
cmdline += " --httpi_uri http://#{httpi_uri_ipaddr}:#{httpi_uri_port}/stream.flv";

# log to debug
#puts "cmdline=#{cmdline}"

# launch the neoip-casti probe
system(cmdline);

################################################################################
#		Kill background vlc
################################################################################
# kill the vlc launched in background
Process.kill("TERM", vlc_pid) rescue Errno::ESRCH








