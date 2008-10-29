#! /usr/bin/env python

import freeetv_t
import simplejson, sys

freeetv     = freeetv_t.freeetv_t()
#channels    = freeetv.channels_from_criteria()
#channels    = freeetv.channels_from_criteria("france et francophones")
# keep only the "Window Media Player" ones

channels    = simplejson.loads(open('freeetv_fulldump.json').read())

# - i dunno how to parse something else for now
channels    = [channel for channel in channels if channel['stream_type'] == "Windows Media Player"]
# put a cast_name is there is none
for channel in channels :
    if( channel.has_key('cast_name') ):  continue;
    channel['cast_name']    = channel['human_name'].encode('ascii', 'replace').replace(' ', '_') + '.flv'

channels    = freeetv.channels_hydrate_stream_uri(channels)
sys.stderr.write(simplejson.dumps(channels, sort_keys=True, indent=4))
