# very raw Makefile to compile the air application
# - to run the application, simply do
#   $ adl application.xml

APPS_FNAME=urfastr-player.air
APPS_ID=com.urfastr.player

# TODO put adt in a more regular path
AIR_SDK=~/opt/air_1.5_sdk
ADL=$(AIR_SDK)/bin/adl
ADT=$(AIR_SDK)/bin/adt


devrun:
	$(ADL) application.xml src

package:
	echo "jme the password is 'password'"
	$(ADT) -package -storetype pkcs12 -keystore cert.pfx bin/$(APPS_FNAME) application.xml -C src .

# NOTE: adobe installer MUST have a full path
install:
	Adobe\ AIR\ Application\ Installer $(PWD)/bin/$(APPS_FNAME)

uninstall:
	-sudo dpkg -r `dpkg -l | grep $(APPS_ID) | tr -s ' ' | cut -d' ' -f 2`

clean:
	rm -f bin/$(APPS_FNAME)