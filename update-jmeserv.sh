#!/bin/sh

# do a mirror on the current directory into jmeserv:neoip_html directory
rsync -z -v -a --rsh='ssh' --stats ~/workspace/yavipin/html/ jmeserv:neoip_html

# update the directory from dbg environment to rel one
ssh jmeserv "cd neoip_html/player; rm -f cache; ln -sf cache_rel cache"
ssh jmeserv "cd neoip_html/player/playlist_builder; rm -f config_dir; ln -sf config_dir_rel config_dir" 

# mirror the flash player debug and production
#rsync -z -v -u -a --rsh='ssh' --stats ~/workspace_flash/flash_player/bin/flash_player.swf jmeserv:workspace_flash/flash_player/bin/
#rsync -z -v -u -a --rsh='ssh' --stats ~/workspace_flash/flash_player/bin-release/flash_player.swf jmeserv:workspace_flash/flash_player/bin-release/
