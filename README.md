### This project is not longer mantained because we don't use SugarCRM anymore.
### You can find more updated releases of this zimlet in bTactic fork
###
### https://github.com/btactic/zsugar/


# zsugar

zSugar is a zimlet for Zimbra Collaboration Suite.

This project aims for integration of received mails between Zimbra and SugarCRM.

zSugar allows to add a mail and their attachments into:
 - Accounts
 - Contacts
 - Opportunities
 - Projects
 - Cases
 - Leads
 
You can also create new Leads before exporting an email.

## Compatibility
zSugar has been tested in ZCS 6.x, 7.x and 8.x  and SugarCRM v5.5.x and 
above (At least until 6.1.x). It may or may not work properly 
with other versions.

## Installing zSugar
 - Create a folder named com_irontec_zsugar
 - Download zSugar source and uncompress into previously created folder
 - Zip the folder com_irontec_zsugar and deploy using Zimbra Administration interface
 
You can also deploy the zimlet from the server shell 

    $$ su - zimbra
    $ zmzimletctl deploy com_irontec_zsugar.zip
    $ zmmailboxdctl restart
  
## Configuring zSugar
 There is no global configuration for zSugar, each user must 
 configure it separately.

 If zSugar has been correctly deployed, after loggin in zimbra, 
 a new icon should apperar in the left panel. Just click it and 
 a configuration window should appear with the following fields:

 Username: SugarCRM username
 Password: SugarCRM password
 SugarCRM URL: SugarCRM URL direction. It should use a secure 
	       connection, so be sure that 'https' is being used.
 LDAP Authentication: Enable this to send clean password otherwise
	       MD5 encryption will be used.
 Accounts: Enable this to retrieve account informations.
 Opportunities: Enable this to retrieve Opportunitie information.
 Projects: Enable this to retrieve Project information.
 Leads: Enable this to retrieve Leads information.
 
 Mark exported with tag: Set the tag name that will be used 
	to tag exported emails. If this field is empty, emails
	won't be tagged. This feature only works from the moment
	it is "activated", so previously exported emails won't 
	be tagged.
 
 After configuring zSugar, you can validate your connection to
 SugarCRM by right-clicking the zSugar icon and choosing Force
 Authentication.
 
## Using zSugar
 There are three ways to access zSugar screen:

 - Using the Zimlet panel: 
   Just Drag a conversation or email and drop in the zSugar icon.

 - Using Toolbar Button:
   Select a conversation or email and click 'Send to SugarCRM'
   toolbar button.

 - Using the context menu option:
   Rigth click a conversation or email and click 'Send to SugarCRM' 
   option.

 After this, a new screen will appear with following sections:
 - Result Section:
    This section shows SugarCRM response results. By default, 
    zSugar will search the FROM: contact of the email. It will show
    Accounts, Opportunities and Projects as configured (see 5.- 
    Configuring zSugar)

 - Contacts Dropbox
    We can request CRM information of other contact in the selected
    email

 - Attachments list
    If email has any attachment, a list will appear. Checked attachments
    will be also imported into SugarCRM 

## Authors

 This zimlet has been developed by Irontec S.L.
    http://www.irontec.com

 Base64 Library has been developed by Christian d'Heureuse.
    http://www.source-code.biz/base64coder/java/

## License
This is a extremelly experimental plugin.
Use it at your own risk.

Stay tunned for new and improved versions.
(c) Irontec S.L. 2010
Released under GPL v3.0

This library is free software; you can redistribute it and/or modify it under the 
terms of the GNU Lesser General Public License as published by the Free Software 
Foundation; either version 2.1 of the License, or (at your option) any later 
version. 
 
This library is distributed in the hope that it will be useful, but WITHOUT ANY 
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A 
PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along 
with this library; if not, write to the Free Software Foundation, Inc., 
59 Temple Place, Suite 330, Boston, MA 02111-1307 USA 


