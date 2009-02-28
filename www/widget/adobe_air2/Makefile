# very raw Makefile to compile the air application
# - to run the application, simply do
#   $ adl application.xml

APPS_FNAME=urfastr-player.air
APPS_ID=com.urfastr.player

# TODO put adt in a more regular path
AIR_SDK=~/opt/air_1.5_sdk
ADL=$(AIR_SDK)/bin/adl
ADT=$(AIR_SDK)/bin/adt

REL_DIRNAME	= /tmp/adobe_air2_reldir.tmp
REL_VERSION	= 0.8.11
REL_DESCRIPTION	= Super version 0.8.11 mieux \\nque la 10

devrun:
	$(ADL) application.xml src

package:
	./build_release_dir.py src $(REL_DIRNAME)
	echo "jme the password is 'password'"
	$(ADT) -package -storetype pkcs12 -keystore cert.pfx bin/$(APPS_FNAME) application.xml -C $(REL_DIRNAME) .
	# rm -rf $(REL_DIRNAME)

build_release_files:
	sed -e "s/##VERSION##/$(REL_VERSION)/" -e "s/##DESCRIPTION##/$(REL_DESCRIPTION)/" < tmpl.update.xml > bin/update.xml
	sed s/##VERSION##/$(REL_VERSION)/ < tmpl.application.xml > application.xml

release: build_release_files package

# NOTE: adobe installer MUST have a full path
install:
	Adobe\ AIR\ Application\ Installer $(PWD)/bin/$(APPS_FNAME)

uninstall:
	-sudo dpkg -r `dpkg -l | grep $(APPS_ID) | tr -s ' ' | cut -d' ' -f 2`

clean:
	rm -f bin/$(APPS_FNAME)