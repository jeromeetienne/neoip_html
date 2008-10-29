#!/usr/bin/ruby
#
# \par Brief Description
# to handle a videolan restreamer from an external stream in any format
# to a http/flv one


require "uri"

module	Neoip
module	Videolan_t
class	Restreamer_t


################################################################################
################################################################################
#			constructor
################################################################################
################################################################################
def initialize()
	# define a bunch of default parameter
	@param			= {}
	@param['video_w']	= 320
	@param['video_h']	= 240
	@param['video_fps']	= 15
	@param['video_bitrate']	= 52*8
	@param['audio_bitrate']	=  8*8
	@param['ffmpeg_keyint']	= 15
	@param['log_filename']	= "/dev/null"
end

def destructor()
	stop()
end


################################################################################
################################################################################
#			setup function
################################################################################
################################################################################

def set_param(key, value)
	@param[key]	= value
	return self
end

def get_param(key)
	return @param[key]
end

def start()
	# TODO to remove - only there to debug
	#self.set_param('uri_src', 'mms://194.158.91.91/Atv')
	#self.set_param('uri_dst', 'http://localhost:9999/stream.flv');
	
	# sanity check - some parameters can not be 
	raise "uri_src MUST be specified" if @param['uri_src'].nil?
	raise "uri_dst MUST be specified" if @param['uri_dst'].nil?
	
	# parse the uri_dst
	uri_dst		= URI.parse(@param['uri_dst'])
	# build the vlc cmdline
	vlccmd_txt	 = "vlc --sout \"#transcode{vcodec=FLV1,acodec=mp3,samplerate=44100,";
	vlccmd_txt	+= "vb=#{@param['video_bitrate']},ab=#{@param['audio_bitrate']}";
	vlccmd_txt	+= ",width=#{@param['video_w']}, height=#{@param['video_h']},fps=#{@param['video_fps']}}";
	vlccmd_txt	+= ":std{access=http{mime=video/x-flv},mux=ffmpeg{mux=flv},";
	vlccmd_txt	+= "dst=#{uri_dst.host}:#{uri_dst.port}#{uri_dst.path}}\" --loop -vvv ";
	vlccmd_txt	+= "-I dummy --sout-ffmpeg-keyint #{@param['ffmpeg_keyint']}"
	vlccmd_txt	+= " --sout-ffmpeg-strict-rc \"#{@param['uri_src']}\""
	vlccmd_txt	+= " 2> #{@param['log_filename']}"

	# log to debug
	#puts "vlccmd_txt=#{vlccmd_txt}"

	# launch the vlc in background
	# - small "exec " trick to keep the same pid
	@vlccmd_pid	= Process.fork { exec("exec " + vlccmd_txt) }
	Process.detach(@vlccmd_pid)
	
	# log to debug
	#puts "@vlccmd_pid=#{@vlccmd_pid}"
end

def stop()
	# if the process is not running, do nothing
	return if not process_running?
	# kill the vlc monitor launched in background
	Process.kill("KILL", @vlccmd_pid) rescue Errno::ESRCH
	# mark the process as killed
	@vlccmd_pid	= nil
end

################################################################################
################################################################################
#			query function
################################################################################
################################################################################

def process_running?()
	# if @vlccmd_pid is nil, return false
	return false if @vlccmd_pid.nil?
	# test if the process is still running with a kill 0
	begin
		Process.kill(0, @vlccmd_pid)
		return true		
	rescue => e
		return false
	end
end

def is_streaming?(timeout_sec=2.0)
	# if the process itself is not running, return now
	return false if not process_running?
	
	# build the cmdline to execute
	# - NOTE: the timeout MUST be in the wget because IO.popen got trouble closing otherwise
	cmdline	= "wget --quiet --read-timeout=#{timeout_sec} --tries=1 -O - #{@param['uri_dst']} | neoip-flv2xml"
	# display to debug
	#puts "timeout_sec=#{timeout_sec} cmdline=#{cmdline}"

	begin
		IO.popen(cmdline, "r+") { |io|
			tagaudio_counter	= 0
			while true
				# if it is the end of the file, return false now
				#puts "io.eof?=#{io.eof?}"
				return false if io.eof?
				line	= io.gets
				# log to debug
				#puts "line=#{line}"
				
				# if a keyframe has been read, return it is streaming
				return true if line =~ /keyframe/
				# if at least 20 taghd_audio has been see, return true
				# - in case of pure audio, there is no keyframe
				tagaudio_counter += 1 if line =~ /<taghd_audio>/
				return true if tagaudio_counter > 20
			end
		}
	rescue => e
		puts "exception #{e}"
		return false
	end
	#puts "end of cmd"
	return false
end

end # end of class restreamer_t


def self.may_restream?(vlc_uri_src, nb_try=5)
	# create and setup vlc restreamer
	vlc_restreamer	= Neoip::Videolan_t::Restreamer_t.new
	vlc_restreamer.set_param('uri_src', vlc_uri_src)
	# TODO this listening address should be dynamic
	vlc_restreamer.set_param('uri_dst', "http://127.0.0.1:9999/stream.flv")
	vlc_restreamer.start()
	
	# display to debug
	#puts "vlc launched..."

	# set may_stream to false by default
	may_restream	= false;	
	
	# NOTE: test every X sec
	# - stop when it exceed a max
	# - when it succeed
	
	(0..nb_try).each { |i|
		# if the vlc_restreamer process is no more running, exit now
		break if not vlc_restreamer.process_running?
		
		if vlc_restreamer.is_streaming?
			#puts "try #{i} #{vlc_uri_src} is streaming ok"
			may_restream	= true;
			break;
		end

		#puts "try #{i} #{vlc_uri_src} is not streaming ok"
		# wait a bit
		sleep(1)
	}

	# stop the restreamer process
	vlc_restreamer.stop()
	# return the result
	return may_restream
end # end of def

end # end of module Videolan_t	
end # end of module Neoip