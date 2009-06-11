# very raw Makefile to preprocess the php
# - doc about chrome extension
#   http://dev.chromium.org/developers/design-documents/extensions/content-scripts

OUT_FNAME=urfastr_livatar_chrome.crx
SRC_NAMES=urfastr_livatar_chrome.js manifest.json

all: build

build: $(OUT_FNAME)

$(OUT_FNAME): $(SRC_NAMES)
	./chromium_extension.py --indir=. --outfile=$(OUT_FNAME)

clean:
	rm -f $(OUT_FNAME)
