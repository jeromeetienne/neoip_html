# very raw Makefile to compile the air application
# - to run the application, simply do
#   $ adl application.xml

APPS_FNAME=urfastr-player.air
APPS_ID=com.urfastr.player

# put adt/adl in the shell path (e.g. ~/bin)
ADL=adl
ADT=adt

REL_DIRNAME	= /tmp/adobe_air2_reldir.tmp
REL_VERSION	= 0.9.10
# to put a \n in the description, do a \\n
REL_DESCRIPTION	= New version with new stuff\\nEnjoy it hot!
# attempt to make it automatic
#REL_DESCRIPTION = $(shell cat ChangeLog | sed 's/$/\\\\n/' | tr -d '\n')
#REL_DESCRIPTION = $(shell awk "{printf '%s\\\\n', $0}" ChangeLog)

devrun:
	$(ADL) application.xml src

pkgrun:
	./build_release_dir.py src $(REL_DIRNAME)
	$(ADL) application.xml $(REL_DIRNAME)
	# rm -rf $(REL_DIRNAME)

package:
	./build_release_dir.py src $(REL_DIRNAME)
	echo "jme the password is 'password'"
	$(ADT) -package -storetype pkcs12 -keystore cert.pfx bin/$(APPS_FNAME) application.xml -C $(REL_DIRNAME) .
	# rm -rf $(REL_DIRNAME)

build_release_files:
	sed -e "s/##VERSION##/$(REL_VERSION)/" -e "s/##DESCRIPTION##/$(REL_DESCRIPTION)/" < tmpl.update.xml > bin/update.xml
	sed s/##VERSION##/$(REL_VERSION)/ < tmpl.application.xml > application.xml

copy2pbeta:
	cp bin/$(APPS_FNAME) ../adobe_air_pbeta/bin
	cp bin/update.xml ../adobe_air_pbeta/bin

release: build_release_files package copy2pbeta

# NOTE: adobe installer MUST have a full path
install:
	Adobe\ AIR\ Application\ Installer $(PWD)/bin/$(APPS_FNAME)

uninstall:
	-sudo dpkg -r `dpkg -l | grep $(APPS_ID) | tr -s ' ' | cut -d' ' -f 2`

clean:
	rm -f bin/$(APPS_FNAME)
