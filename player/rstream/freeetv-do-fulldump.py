#! /usr/bin/env python

from freeetv_t import *
import simplejson
import sys

freeetv     = freeetv_t()
channels    = freeetv.channels_from_criteria()
#channels    = freeetv.channels_hydrate_stream_uri(channels)
sys.stderr.write(simplejson.dumps(channels, sort_keys=True, indent=4))
