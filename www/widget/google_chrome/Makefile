# very raw Makefile to compile the chromium extension
# - getstarted info: see http://code.google.com/chrome/extensions/getstarted.html


PACKAGE_NAME=urfastr_live.crx

all: build

build:
	./buildex.rb --pack-extension=. --extension-output=$(PACKAGE_NAME)

clean:
	rm -f $(PACKAGE_NAME)