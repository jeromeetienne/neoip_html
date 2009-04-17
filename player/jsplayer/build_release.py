#! /usr/bin/env python
# this script is made to build all the various instance of the players

import sys

sys.path.insert(0, '../../base/python')
from html_relbuilder import *

html_path           = 'neoip_player_main.html'
javascript_paths    = javascript_paths_for(html_path)

# remove the firebug lite
fblite_path = '../../base/firebug/firebug.js'
fbnoop_path = '../../base/javascript/firebug_noop.js'
if( javascript_paths.count(fblite_path) > 0 ):
    javascript_paths.insert(javascript_paths.index(fblite_path),fbnoop_path)
    javascript_paths.remove(fblite_path)

pprint(javascript_paths)

javascript_data     = concat_data_from_paths(javascript_paths)
javascript_data     = javascript_remove_firebug(javascript_data)


#javascript_data    = javascript_warp_in_anonfct(javascript_data)

javascript_pack     = compress_javascript_data(javascript_data)
# double compress as yui-compressor keep comments.... fix elsewhere
javascript_pack     = compress_javascript_data(javascript_pack)

print(javascript_pack)
print("length of all js=%s" % len(javascript_pack))

#re.sub(r'console.*?(.*?).*?;', '', str)
