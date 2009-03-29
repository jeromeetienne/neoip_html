#!/bin/sh

# do a mirror on the current directory into jmeserv:neoip_html directory
rsync -z -v -a --exclude .git --rsh='ssh' --stats ~/webwork/neoip_html/ dedixl:neoip_html

# update the directory from dbg environment to rel one
ssh dedixl "cd neoip_html/player; rm -f cache; ln -sf cache_rel cache"
ssh dedixl "cd neoip_html/player/playlist_builder; rm -f config_dir; ln -sf config_dir_rel config_dir" 
