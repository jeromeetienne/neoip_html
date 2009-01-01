# very raw Makefile to pack and compress the javascript

all: jsplayer_packmin oload_redir_packmin casti_recording_flv_packmin casti_recording_vlc_packmin webpack_badge_packmin

jsplayer_packmin:
	./neoip-jspackmin-build.rb ../player/jsplayer/neoip_player_demo.html data/neoip_jsplayer_packmin.js

oload_redir_packmin:
	./neoip-jspackmin-build.rb ../oload_redir/neoip_oload_redir_dev.html data/neoip_oload_redir_packmin.js

casti_recording_vlc_packmin:
	./neoip-jspackmin-build.rb ../bt_cast/casti/casti_recording_dev_vlc.html data/neoip_casti_recording_vlc_packmin.js

casti_recording_flv_packmin:
	./neoip-jspackmin-build.rb ../bt_cast/casti/casti_recording_dev_flv.html data/neoip_casti_recording_flv_packmin.js

webpack_badge_packmin:
	./neoip-jspackmin-build.rb ../www/widget/webpack_badge/neoip_webpack_badge.html data/neoip_webpack_badge_packmin.js

#


