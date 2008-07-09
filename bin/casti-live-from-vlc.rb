#!/usr/bin/ruby
#
# \par Brief Description
# Specific script to automatize the restreaming of existing internet stream
# into neoip-casti.

require "socket"
require "vlc_restreamer_t"
require "rubygems"
require "json"

# init the rstream_arr - an array of predefined channels
rstream_arr	=JSON.parse(File.read("rstream_arr.json"))
# find in rstream_arr the first item with a 'cast_name' equal to ARGV[0]
for i in 0...rstream_arr.length
	if rstream_arr[i]['cast_name'] == ARGV[0]
		channel_idx	= i;
		break
	end
end
# if this channel cant be found,  display an error message and abort
if channel_idx.nil?
	puts "cast_name #{ARGV[0]} cant be found among the predefined list! aborting";
	exit
end

# set some variable
vlc_orig_uri	= rstream_arr[channel_idx]['stream_uri'];
cast_name	= rstream_arr[channel_idx]['cast_name'];
httpi_uri_port	= 8080 + channel_idx;


# Some parameters
cast_privtext	= "bonjour77";
# BARCAMP KLUDGE - listen on sd-14474.dedibox.fr public ip addr to allow direct read
#httpi_uri_ipaddr= "127.0.0.1";
if `hostname`.chomp == "sd-14474"
	httpi_uri_ipaddr= IPSocket::getaddress('sd-14474.dedibox.fr');
else
	httpi_uri_ipaddr= "127.0.0.1";
end

################################################################################
#		Launch vlc in background
################################################################################
# create and setup vlc restreamer
vlc_restreamer	= Neoip::Videolan_t::Restreamer_t.new()
vlc_restreamer.set_param('uri_src', vlc_orig_uri)
vlc_restreamer.set_param('uri_dst', "http://#{httpi_uri_ipaddr}:#{httpi_uri_port}/stream.flv")
vlc_restreamer.start()

# launch the vlc monitor
# - When vlccmd_pid disapears, relaunch it automatically
# - vlc crashes very often
# - TODO BUG BUG this is a fork so the vlc_restreamer is copied
#   - so when the process is relaunched, the pid is of the relaunched process
#     is changed ONLY in the fork, and in the parent
#   - as a consequence the vlc_restreamer may not be destroyed on ctrl-c
vlcmon_pid	= Process.fork {
		# define the probe delay
		# - it MUST NOT be too short or it may overload the box for no reason
		# - for example, if vlc coredump immediatly and it is relaunch immediatly
		#   it will just spend its time doing coredump
		probe_delay_sec	= 10;
		# had_streaming is true if it this process already streamed, false otherwise
		had_streaming	= false;
		while true 
			# wait before the next probe
			sleep(probe_delay_sec)
			# do the probe
			begin
				#puts "test"
				# if process_running? is false, relaunch a new one
				raise "crashed"	if not vlc_restreamer.process_running?

				# test if this process is still streaming
				is_streaming	= vlc_restreamer.is_streaming?
				#puts "is_streaming=#{is_streaming}"
				# if it had_streaming but no more is_streaming, relaunch it
				raise "no more streaming" if had_streaming and not is_streaming
				# update had_streaming if it is_streaming
				had_streaming	= true	if is_streaming
			rescue => e
				#puts "super exception #{e}"
				# if this point is reached the vlc_pid no more run
				# so relaunch it
				puts "VLC process #{e}. so relaunching it"
				vlc_restreamer.stop()
				puts "process_running?=#{vlc_restreamer.process_running?}"
				vlc_restreamer.start()
				# reset the had_streaming
				had_streaming	= false;
			end
		end
	}
Process.detach(vlcmon_pid)

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
# kill the vlc monitor launched in background
Process.kill("TERM", vlcmon_pid) rescue Errno::ESRCH

# kill the vlc launched in background
vlc_restreamer.destructor();








