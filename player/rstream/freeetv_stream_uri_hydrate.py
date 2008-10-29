#! /usr/bin/env python

import freeetv_t
import simplejson, sys

# get the data from the input
data_str    = sys.stdin.read()
data_json   = simplejson.loads(data_str)

channels    = data_json
# hydrate the channels
freeetv     = freeetv_t.freeetv_t()
channels    = freeetv.channels_hydrate_stream_uri(channels)

# output the just-built results
print simplejson.dumps(channels, sort_keys=True, indent=4)
