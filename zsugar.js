/****************************************************************************
 **
 ** Copyright (C) 2011 Irontec SL. All rights reserved.
 **
 ** This file may be used under the terms of the GNU General Public
 ** License version 3.0 as published by the Free Software Foundation
 ** and appearing in the file LICENSE.GPL included in the packaging of
 ** this file.  Please review the following information to ensure GNU
 ** General Public Licensing requirements will be met:
 **
 ** This file is provided AS IS with NO WARRANTY OF ANY KIND, INCLUDING THE
 ** WARRANTY OF DESIGN, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
 **
 ****************************************************************************/
/***
 * com_irontec_zsugarH
 * 
 * This object works as handler for the zSugar Zimlet
 * Interaction with zimlet is divided into:
 *  - A Panel Icon where Messages or Conversations can be droped. It also
 *    has a context menu when right clicked, and options panel when single/double clicked.
 *  - A Toolbar Button. It works as dropping a Msg/Conv into the Panel Icon.
 *  - A Context Menu Button.  It works as dropping a Msg/Conv into the Panel Icon.
 *  
 * This zimlets invokes some SugarCRM methods for Importing/Exporting data. The object
 * responsible for that task is ironsugar (@see sugarestapi.js). Originally, this method
 * invokation was made via SugarCRM REST API (included in version 5.5.2 and above), proxying
 * all petitions through a jsp (@see redirect.jsp) which manages how data is sent to
 * SugarCRM server.
 * 
 *  
 */
function com_irontec_zsugarH() {
}
com_irontec_zsugarH.prototype = new DwtDialog;
com_irontec_zsugarH.prototype = new ZmZimletBase();
com_irontec_zsugarH.prototype.constructor = com_irontec_zsugarH;
com_irontec_zsugarH.prototype.singleClicked = function() {
	this.doubleClicked();
};

/***
 * com_irontec_zsugarH.prototype.menuItemSelected
 * 
 * This function works as wrapper for the Selected item in the Context
 * menu of the Zimlets Panel Icon
 * 
 * @param itemId	Selected item in the context menu of the panel zimlet
 */
com_irontec_zsugarH.prototype.menuItemSelected = function(itemId) {
	// Detect which Option in the Context Menu has been choosen
	switch (itemId) {
		/*** Show About Box ***/
		case "ISUGAR_ABOUT":
			var _view = new DwtComposite(this.getShell()); 	// Creates an empty div as a child of main shell div
			_view.setSize(350, 230); 					// Set width and height
			_view.getHtmlElement().innerHTML = this.getMessage("zsugar_aboutText");
			var _dialog = new ZmDialog({title:this.getMessage("zsugar_about"), view:_view, parent:this.getShell(), standardButtons:[DwtDialog.OK_BUTTON]});
			_dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, function() {_dialog.popdown();}));
			_dialog.popup(); 								//Show the dialog 
			break;
			
		/*** Show Status Box (Connection to SugarCRM Status) ***/			
		case "ISUGAR_STATUS":
			var _dialog = appCtxt.getMsgDialog(); 	// returns DwtMessageDialog
			if (this.iscrm.sessid === false) {
				var msg = this.getMessage("zsugar_notconnected")
				_dialog.setMessage(msg, DwtMessageDialog.CRITICAL_STYLE);
			} else {
				var msg = this.getMessage("zsugar_connected")
				_dialog.setMessage(msg, DwtMessageDialog.INFO_STYLE);
			}
			_dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, function() {_dialog.popdown();})); // listens for OK button events
			_dialog.popup();
			break;
			
		/*** Reconnect to SugarCRM ***/				
		case "ISUGAR_RELOGIN":
			this._login(new AjxCallback(this, this._checkCredentials));
			break;
	}
};

/***
 * com_irontec_zsugarH.prototype.initializeToolbar
 * 
 * This function works as hook for adding or editing main toolbar icons
 * 
 * It adds the zSugar button at the end of the bar, just after the 
 * View Icon. When this button is clicked, it will callback private
 * _addSugarMsg function.
 * 
 */
com_irontec_zsugarH.prototype.initializeToolbar =
	function(app, toolbar, controller, viewId) {

    if (viewId.slice(0, ZmId.VIEW_CONVLIST.length) == ZmId.VIEW_CONVLIST || 
	viewId.slice(0, ZmId.VIEW_TRAD.length) == ZmId.VIEW_TRAD ) {
        // Get the index of "View" menu so we can display the button after that
        var buttonIndex = 0;
        for (var i = 0; i < toolbar.opList.length; i++) 
	        if (toolbar.opList[i] == ZmOperation.VIEW_MENU || toolbar.opList[i] == ZmOperation.ACTIONS_MENU) {
	            buttonIndex = i + 1;
	            break;
	        }

        // Configure Toolbar button
        var buttonParams = {
            text: this.getMessage("zsugar_bn_addSugar"),
            tooltip: this.getMessage("zsugar_bn_addSugar_tooltip"),
            index: buttonIndex,
            image: "ISUGAR-panelIcon"
        };

        // Creates the button with an id and params containing the button details
        var button = toolbar.createOp("SEND_SUGAR_TOOLBAR", buttonParams);
        button.addSelectionListener(new AjxListener(this, this._addSugarMsg,controller));   

        /* If a context menu is available */
        if (controller.getActionMenu){
                var menu = controller.getActionMenu();

                // Find the Last Menu Position
                var buttonIndex = 0;
                for (var i = 0; i < menu.opList.length; i++)
                    if (menu.opList[i] == ZmOperation.CREATE_TASK) {
                            buttonIndex = i + 1;
                            break;
                    }

                    // Add a new button
                    var menuParams = {
                        text: this.getMessage("zsugar_bn_addSugar"),
                        tooltip: this.getMessage("zsugar_bn_addSugar_tooltip"),
                        index: buttonIndex,
                        image: "ISUGAR-panelIcon"
                };

                // When this button is clicked execute callback
                var mi = menu.createMenuItem("SEND_SUGAR_MENU", menuParams);
                mi.addSelectionListener(new AjxListener(this, this._addSugarMsg,controller));
        }
    }
};


/***
 * com_irontec_zsugarH.prototype.init
 * 
 * Init the Zimlet.
 * 
 * It adds the zSugar button at the end of context menu, just after the 
 * View Icon. When this button is clicked, it will callback private
 * _addSugarMsg function. 
 */
com_irontec_zsugarH.prototype.init = function() {
	var controller = appCtxt.getCurrentController();

        // Get Zimbra Major vesion
        this._zimbraMajorVer = appCtxt.getSettings().getInfoResponse.version.charAt(0);

	// Try to Login!
	this._login(new AjxCallback(this, this._checkCredentials));
};

/***
 * com_irontec_zsugarH.prototype._addSugarMsg
 *
 * Callback function for Toolbar and Context Menu Item
 *
 * This function works as wrapper for the non-panel icons. It just
 * get the Message info and calls _displayMSGDialog, as it will occur
 * when some Msg/Conv is droped into the Zimlet Panel Icon
 * 
 */
com_irontec_zsugarH.prototype._addSugarMsg = function(controller) {
    var msg = controller.getMsg();
    this._checkExported(msg);
};

/***
 * com_irontec_zsugarH.prototype.doDrop
 *
 * Callback function for Zimlet Panel Icon 
 *
 * This function works as wrapper for the panel icons. It just
 * get the Message info and calls _displayMSGDialog.
 * 
 */
com_irontec_zsugarH.prototype.doDrop = function(obj) {
	
	var msg = obj.srcObj;

	// What kind of object are you dropping?
	switch(msg.type) {
		case "CONV":
			// Get First message from conversation
			msg = msg.getFirstHotMsg();
			// Time to rock. Process this Message!
			this._checkExported(msg);
			break;
		case "MSG": 
			// Time to rock. Process this Message!
			this._checkExported(msg);
			break;
		case "APPT":
			// Time to Rock. Proccess this Appointment!
			this._displayAPPTDialog(msg);
			break;
		default:
			return false;
    }
};

/***
 * com_irontec_szsugarH.prototype.tag
 * 
 * Tags an Email with the proper TagLabel.
 * Used to tag Exported mails.
 *
 */
com_irontec_zsugarH.prototype.tag = function (msg, tagName) {
	// Get Requested tag
        var tagObj = appCtxt.getActiveAccount().trees.TAG.getByName(tagName);

	// No tag found with that name
       	if(!tagObj) {
		// Create tag
		this.createTag(tagName);
		// Get created Tag
		tagObj = appCtxt.getActiveAccount().trees.TAG.getByName(tagName);
	}

	// Get Tag Command
	var tagId = tagObj.id;
	var axnType = "tag"; 
	var soapCmd = ZmItem.SOAP_CMD[msg.type] + "Request";

	var itemActionRequest = {};
	itemActionRequest[soapCmd] = {_jsns:"urn:zimbraMail"};
	var request = itemActionRequest[soapCmd];

	var action = request.action = {};
	action.id = msg.id;
	action.op = axnType;
        if (this._zimbraMajorVer >= "8") {
                action.tn = tagName;
        } else {
                action.tag = tagId;
        }

	var params = {asyncMode: true, callback: null, jsonObj:itemActionRequest};
	appCtxt.getAppController().sendRequest(params);

};


com_irontec_zsugarH.prototype.createTag = function (tagName){
	// Tag Creation Command
        var soapCmd = "CreateTagRequest";

	// Get Tag Request Structure
        var itemActionRequest = {};
        itemActionRequest[soapCmd] = {_jsns:"urn:zimbraMail"};
        var request = itemActionRequest[soapCmd];

	// Fill Tag Structure
        var tag = request.tag = {};
	tag.name = tagName;
	tag.color = 1;		// Blue by default

	// Request Creation
        var params = {asyncMode: false, callback: null, jsonObj:itemActionRequest};
        appCtxt.getAppController().sendRequest(params);
}

	
/***
 * com_irontec_zsugarH.prototype._login
 *
 * Login Function. Tries to init a session in SugarCRM with the
 * data provided in the zimlet configuration panel (single/double
 * click in the zimplet panel icon).
 * 
 */
com_irontec_zsugarH.prototype._login = function(callback) {
	var RESTprefix = '/service/v2/rest.php';
	var Password;

	if ( (this.getUserPropertyInfo("my_zsugar_url").value == "") || (this.getUserPropertyInfo("my_zsugar_username").value == "") || (this.getUserPropertyInfo("my_zsugar_pass")=="") ) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("noOptsSelected"));
		return;
	}
        if (this.getUserPropertyInfo("my_zsugar_pass").value === undefined) this.getUserPropertyInfo("my_zsugar_pass").value = "";

	if ( this.getUserPropertyInfo("my_zsugar_cleanpass").value == "false" ) 
		Password = hex_md5(this.getUserPropertyInfo("my_zsugar_pass").value);	
	else
		Password = this.getUserPropertyInfo("my_zsugar_pass").value;

	this.iscrm = new ironsugar(this.getUserPropertyInfo("my_zsugar_url").value + RESTprefix,this.getUserPropertyInfo("my_zsugar_username").value, Password ,this);
	this.iscrm.login(callback);
	
}

/***
 * com_irontec_zsugarH.prototype.checkLoggedIn
 *
 * Check our actual connection status with SugarCRM and displays
 * a Zimbra message.
 * 
 * @TODO This only checks if we are logged in, but gives no feedback if not logged in ;-(
 * 
 */
com_irontec_zsugarH.prototype._checkCredentials = function(responsetxt) {
    if (this.iscrm.sessid !== false) {
        appCtxt.getAppController().setStatusMsg(
            this.getMessage("zsugar_loggedin") + "<br /><small>" +
            this.getMessage("zsugar_name") + " " + this.getMessage("zsugar_version") + "</small>");
    } else {
        appCtxt.getAppController().setStatusMsg(
            this.getMessage("zsugar_notValidAuth") + "<br /><small>" +
            this.getMessage("zsugar_name") + " " + this.getMessage("zsugar_version") + "<br />" +
            responsetxt.substr(0, 30) + "</small>");
    }
}

/***
 * com_irontec_zsugarH.prototype._checkAtt
 *
 * Shows an awesome Zimbra Message while processing Attachments.
 * This task may take some large minutes with big attachments, so we must give some kind of
 * feedback. 
 * 
 */
com_irontec_zsugarH.prototype._checkAtt = function() {
	if (this.attproc == true ) 
		appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_att_processing")); // Processing Attachments, please wait
}

/***
 * com_irontec_zsugarH.prototype._checkAuth
 *
 * This function checks we are properly logged in into SugarCRM. 
 * It is called before doing any other tasks. 
 * 
 */
com_irontec_zsugarH.prototype._execIfLogged = function(callback) {
    if (this.iscrm.sessid == false) {
        appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_notValidAuth")+"<br /><small>"+this.getMessage("zsugar_name")+" "+this.getMessage("zsugar_version")+"</small>");
    } else {
            if (callback !== undefined )
                callback.run();
    }
}

/***************************************************************************
 **
 **                         Messages Process
 **
 **************************************************************************/

/**
 * com_irontec_zsugarH.prototype._checkExported
 *
 *
 */
com_irontec_zsugarH.prototype._checkExported = function(msg) {
        //  Load the message. This is required when the message is not 
        //  predisplayed in any subpanel
        this.msg = msg.load( {forceLoad: true, noTruncate: true, getHtml: true });

        // Get Exported tag
        var tagName = this.getUserPropertyInfo("my_zsugar_tag").value;
        if ( tagName != "" ){
                // Get Requested tag
                var tagObj = appCtxt.getActiveAccount().trees.TAG.getByName(tagName);
                // If Tag exists
                if (tagObj){
                        // Check if message is tagged with this tag
                        if (msg.tagHash[tagObj.id] !== undefined){
				this._dialog = appCtxt.getYesNoMsgDialog(); // returns DwtMessageDialog
				var dstyle = DwtMessageDialog.INFO_STYLE; //show info status by default
				var dmsg = this.getMessage("zsugar_confirmExport"); 
				var dtit = this.getMessage("zsugar_confirmExportTitle");

				// set the button listeners
				this._dialog.setButtonListener(DwtDialog.YES_BUTTON, new AjxListener(this, this._confirmExport,msg)); // listens for YES button events
				
				this._dialog.reset(); // reset dialog
				this._dialog.setMessage(dmsg, dstyle);
				this._dialog.setTitle(dtit);
				this._dialog.popup();
				return;
                        }
                }
        	
        }

	// Login and Display Dialog ;-)
    this._login(new AjxCallback(this, this._displayMSGDialog, msg));
}

com_irontec_zsugarH.prototype._confirmExport = function(msg) {

	this._dialog.popdown();
    this._login(new AjxCallback(this, this._displayMSGDialog, msg));
}

/*** 
 * com_irontec_zsugarH.prototype._trimDialogTitle
 * 
 * Prevents the Dialog Title to resize the DialogBox
 * Fix for large subjects #0016451
 * 
 * @param title			Original Title
 * @return finalTitle	Title with updated length (if required)
 */
com_irontec_zsugarH.prototype._trimDialogTitle = function(title){
	
	var finalTitle = title;
	// Avoid "undefined" title
	if (!finalTitle) finalTitle = "";
	// If we have to trim the title length
	if (finalTitle.length > 85 ) finalTitle = finalTitle.substr(0, 82) + "...";
	// Return the title, updated or not
	return finalTitle;
}

/***
 * com_irontec_zsugarH.prototype._displayMSGDialog
 *
 * This function displays a Dialog with the following Sections 
 *  - Main Tab: Show selected address related Info from SugarCRM
 *   		* Contact Info
 *   		  * Opportunities
 *   		  * Projects
 *   		  * Accounts
 *   		  * Leads
 *		  * Cases
 *   
 *  - Address Selector: A combobox with Email Address retrieved
 *  					from the selected mail.
 *  
 *  - Attachments Panel: A group of checkboxes to select which 
 *  					attachments will be exported to sCRM
 * 
 * Pressing OK button will send us to _ArchiveEmail
 * Pressing Cancel button will send us to _cancelDialog
 * Pressing Change Subject button will send us to _changeSubject
 * 
 * 
 * @param msg	Message from which data will be displayed
 * 
 * @TODO It's not necesary to create the Dialog each time a message
 * it's dropped. It should only be created once, then update it's content
 * and show it. 
 */
com_irontec_zsugarH.prototype._displayMSGDialog = function(msg) {
    // Check we have a valid session
    if (this.iscrm.sessid == false) {
        return appCtxt.getAppController().setStatusMsg(
                this.getMessage("zsugar_notValidAuth") + "<br /><small>" +
                this.getMessage("zsugar_name") + " " + this.getMessage("zsugar_version") + "</small>");
    }

	// Set Message object
	this.msg = msg;
	// Set Message Subject (Full, not trimmed)
	this.subject = msg.subject;
        // Clear Alternative Search Address
        this.otherAddr = ""

	// Get the Dialog Title from Message Subject
	var wTitle = this._trimDialogTitle(msg.subject);

	// Creates an empty div as a child of main shell div
	this.pView = new DwtComposite(this.getShell()); 
	this.pView.setSize(550, 430); 				// Set width and height
	
	/*** Fill the Main Tab ***/
	this.pView.getHtmlElement().innerHTML = this._loadMainView();

	this.subjectButtonId = Dwt.getNextId();
	this.moreOptsButtonId = Dwt.getNextId();
	
        // Create a button to change the email subject
        var subjectButton = new DwtDialog_ButtonDescriptor(this.subjectButtonId, this.getMessage("zsugar_subjectchange"),
                                                           DwtDialog.ALIGN_LEFT, new AjxCallback(this, this._changeSubject));
	var moreOptsButton =  new DwtDialog_ButtonDescriptor(this.moreOptsButtonId, this.getMessage("zsugar_more_options"),
                                                           DwtDialog.ALIGN_LEFT);
        
	// pass the title, view and buttons information and create dialog box
        this.pbDialog = new ZmDialog({title: wTitle, view: this.pView, parent: this.getShell(),
                                      standardButtons: [DwtDialog.DISMISS_BUTTON, DwtDialog.OK_BUTTON],
                                      extraButtons: [subjectButton, moreOptsButton]});

	// Add a menu to the More Options button
	var moreBtn = this.pbDialog.getButton(this.moreOptsButtonId);
	moreBtn.setMenu(new AjxCallback(this, this._moreOptsMenu), true);
	moreBtn.removeSelectionListeners();

	// Link The Standard Buttons
	this.pbDialog.setButtonListener(DwtDialog.DISMISS_BUTTON, new AjxListener(this, this._cancelDialog));
	this.pbDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._ArchiveEmail),msg);

	// Show the Dialog
	this.pbDialog.popup();  

	/*** Fill the Address Combobox ***/
	var addrs = [];
	if (msg.isSent ) var _addrs = ("TO,FROM,CC").split(",");
	else 	  		 var _addrs = ("FROM,TO,CC").split(",");


	this.addressList = [];
	var selected = true;
	for (var j = 0;j<_addrs.length;j++) {
	 	var list =  msg._addrs[_addrs[j]]['_array'];
		for (var k=0;k<list.length;k++) {
			this.addressList.push({ email: list[k]['address'], name: list[k]['name'], dispName : list[k]['dispName']});
			addrs.push(new DwtSelectOption(list[k]['address'], selected, _addrs[j]+": "+list[k]['address']));
			if (selected) {
				this.emailAddr = list[k]['address'];
				selected = false;
			}
		}
	}
        // Add another Fake address to let the user change the search address.
        addrs.push(new DwtSelectOption("OTHER",false,this.getMessage("zsugar_otheraddr")+": "+this.otherAddr));

	this.cbAddresses = new DwtSelect({parent:this.pbDialog, options:addrs});
	this.cbAddresses.getHtmlElement().style.width = '100%';
	this.cbAddresses.addChangeListener(new AjxListener(this, this._changeEmailAddress));
	var cap = document.getElementById("zsugar_selector");
	cap.appendChild(this.cbAddresses.getHtmlElement());


	// Create an input box for filtering
	this.ibFilter = new DwtInputField({parent:this.pbDialog, size: 30, validationStyle: DwtInputField.CONTINUAL_VALIDATION, validatorCtxtObj: this, validator: this._filterResults });
	this.ibFilter.setValue(this.getMessage("zsugar_enter_filter"));
	this.ibFilter.addListener(DwtEvent.ONMOUSEDOWN, new AjxListener(this, this._filterClear), 1);
	cap = document.getElementById("zsugar_filter");
	cap.appendChild(this.ibFilter.getHtmlElement());

	/*** Fill the Attachments Tab ***/
	var attAr =  msg.attachments;

	// Delete duplicates (Zimbra bug with some files)
        var attAr2 = [];
        for (var z = 0; z < attAr.length; z++){
            var found = false;
            for (var z2 = 0; z2 < attAr2.length; z2++){
                    if (attAr2[z2].part === attAr[z].part) found = true;
            }
            if (!found) attAr2.push(attAr[z]);
        }
        attAr = attAr2;
	
        // Create a Checkbox for each attachment
	var ulHTML = [];
	for(var k = 0;k<attAr.length;k++) {
		if (!attAr[k].filename) continue; // Prevent inline attachments...
		ulHTML.push('<li><label><input type="checkbox" checked="true" part="'+attAr[k].part+'" s="'+attAr[k].s+'" id="'+attAr[k].part+attAr[k].s+'" filename="'+attAr[k].filename+'"/>'+attAr[k].filename+'</label></li>');

	}
	document.getElementById("zsugar_atts").innerHTML = ulHTML.join("");
	
	/*** Request SugarCRM Contact Info ***/ 
	this._updateCRMValue();
};

/**
 * com_irontec_zsugarH.prototype._filterClear
 *
 * Clear the Filter message when user clicks the inputbox 
 * if its filled with the initial message.
 */
com_irontec_zsugarH.prototype._filterClear = function(ev) {
	var input = ev.dwtObj;
	if (input.getEnabled() && input.getValue() == this.getMessage("zsugar_enter_filter")) {
		input.clear();
	}
}

/**
 * com_irontec_zsugarH.prototype._filterResults 
 * 
 * Filter shown results with that match the given text
 */
com_irontec_zsugarH.prototype._filterResults = function(text) {
	// This text is a hint, not a filter text
	if (text == this.getMessage("zsugar_enter_filter"))
		return;
	
	// We search in lowercase for easier matching
	var filterTxt = text.toLowerCase();

	/* We do this in two steps.
	   First check the parent nodes: Contacts and Leads. Then their children, if some of
	   their children match, it will make the parent node visible. */

	// Check all Parent nodes
	var ULs = document.getElementById("zsugar_mainTab").getElementsByTagName("ul");
	for (var i=0; i<ULs.length; i++) {
		var label = ULs[i].getElementsByTagName("label")[0];
		var labelTxt = label.lastChild.textContent;
		if (filterTxt == "" || labelTxt.toLowerCase().search(filterTxt) > 0) {
			label.parentNode.style.display = "block";
		} else {
			label.parentNode.style.display = "none";
		}

		// Check all Child nodes
		var LIs = ULs[i].getElementsByTagName("li");
        	for (var j=0; j<LIs.length; j++) {
        	        var labelLI = LIs[j].lastChild;
        	        var labelTxtLI = labelLI.lastChild.textContent;
        	        if (filterTxt == "" || labelTxtLI.toLowerCase().search(filterTxt) > 0) {
        	                labelLI.parentNode.style.display = "block";
				label.parentNode.style.display = "block";
        	        } else {
        	                labelLI.parentNode.style.display = "none";
        	        }
        	}
	}


}

com_irontec_zsugarH.prototype._moreOptsMenu = function() {
	var button = this.pbDialog.getButton(this.moreOptsButtonId);
	var menu = new DwtSelectMenu(button);
	var createOpts = new DwtSelectMenuItem(menu);

	createOpts.setText(this.getMessage("zsugar_createLead"));
	createOpts.setImage("ISUGAR-lead");
	createOpts.addSelectionListener(new AjxListener(this, this._newLeadDialog));

	return menu;
}

/***
 * com_irontec_zsugarH.prototype._loadMainView
 * 
 * Dialog Container HTML Content.
 * @see _displayMSGDialog for a short description of each section
 */
com_irontec_zsugarH.prototype._loadMainView = function() {
	var html = [], i=0;
	html[i++] = "<div id='zsugar_container' style='overflow:auto'>";
	html[i++] = "<ul id='zsugar_mainTab'>";
	html[i++] = this._getLiLoading();
	html[i++] = "</ul></div>";
	html[i++] = "<div id='zsugar_selector' style='float:left'></div>";
	html[i++] = "<div id='zsugar_filter' align='right'></div>";
	html[i++] = "<div id='zsugar_atts' style='overflow:auto'></div> ";
    html[i++] = "   <div id='zsugar_powered_logo'><a href='"+this.getMessage("zsugar_powered")+"' target='_blank'>";
	html[i++] = "   <img src='"+this.getResource("resources/Poweredby.png")+"' border='0' align='right'/></a></div>";
	return html.join("");
		
};

/***
 *	com_irontec_zsugarH.prototype._changeEmailAddress
 * 
 *  Callback function for Address Combobox change. 
 *  If address has changed, updates Main Tab information with SugarCRM
 *  data from the new email address 
 */
com_irontec_zsugarH.prototype._changeEmailAddress = function(ev) {
	if (this.emailAddr != ev._args.newValue) {
                // Check if other address option has been selected 
                if (  ev._args.newValue != "OTHER" ){
                    // FROM, TO, or CC address has been selected
		    this.emailAddr = ev._args.newValue;
                    this._updateCRMValue();
                }else{
                    // Other address has ben selected, show a popup to request a new address
                        if (!this.pOtherAddressView){
                                var sDialogTitle = this.getMessage("zsugar_addrchange"); // Get i18n resource string
        
                                this.pOtherAddressView = new DwtComposite(this.getShell());      // Creates an empty div as a child of main shell div
                                this.pOtherAddressView.setSize(250, 30);                                     // Set width and height
                
                                var html = [], i=0;
                                html[i++] = "<div id='zsugar_otheraddr' style='overflow:auto'>";
                                html[i++] = this.getMessage("zsugar_otheraddr")+": ";
                                html[i++] = "<input ' type='text' value='' size='30' maxlength='50' />";
                                html[i++] = "</div>";
                
                                this.pOtherAddressView.getHtmlElement().innerHTML = html.join("");
        
                                // pass the title, view & buttons information to create dialog box
                                this.pbOtherAddressDialog = new ZmDialog({title:sDialogTitle, view:this.pOtherAddressView, parent: this.getShell(),
                                                                     standardButtons:[DwtDialog.CANCEL_BUTTON, DwtDialog.OK_BUTTON]});
        
                                this.pbOtherAddressDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._changeAddressOK));
                        }
                        var input = document.getElementById("zsugar_otheraddr").getElementsByTagName("input");
                        input[0].value = this.otherAddr;
                        this.pbOtherAddressDialog.popup(); //show the dialog

               }
	}
};

/***
 * com_irontec_zsugarH.prototype._changeAddressOK
 * 
 * This function will be called when User confirms the 
 * address update. 
 * 
 */
com_irontec_zsugarH.prototype._changeAddressOK = function(){

        // Get User input data
	var input = document.getElementById("zsugar_otheraddr").getElementsByTagName("input");
	this.otherAddr =  input[0].value;
	this.pbOtherAddressDialog.popdown();
   
        // Update this value in Combobox FIXME
        this.cbAddresses.rename("OTHER", this.getMessage("zsugar_otheraddr")+": "+this.otherAddr);
        this.cbAddresses.setSelected(1);        // Update selected value... Ugly hack
        this.cbAddresses.setSelectedValue("OTHER");
        // Search this email in SugarCRM
        this.emailAddr = this.otherAddr;
        this._updateCRMValue();
}

/***
 *  com_irontec_zsugarH.prototype._getLiLoading
 * 
 *  Shows an awesome nice looking gif animation of a progress bar
 *  in the Main Tab when we are fetching data from SugarCRM
 *   
 */
com_irontec_zsugarH.prototype._getLiLoading = function() {
	return "<li id='zsugar_loading' class='center marTop'>"+this.getMessage("zsugar_loading")+"<br /><br /><img src='"+this.getResource("resources/loadingbar.gif")+"' /></li>";
};

/***
 * com_irontec_zsugarH.prototype._checkBeforePOST
 * 
 * This function will check before doing any request to SugarCRM
 * that we are properly logged in and no other petition is in 
 * progess. Otherwise, a Zimbra message will be shown informing the 
 * is still another petition in course.
 */
com_irontec_zsugarH.prototype._checkBeforePOST = function() {
	if (this.updating) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_peddingTransaction"));	
		return false;
	}
	return true;
};

/***
 * com_irontec_zsugarH.prototype._updateCRMValue
 * 
 * This the main function used to request Contact info from selected
 * email address to SugarCRM. SugarCRM response will be proccessed in
 * _fetchRelationships callback
 * 
 * @see com_irontec_zsugarH.prototype._fetchRelationships
 */
com_irontec_zsugarH.prototype._updateCRMValue = function() {
	// Check we can request data to SugarCRM
	if (!this._checkBeforePOST()) return;

	// Show our awesome progress bar in the Main Tab! 
	document.getElementById("zsugar_mainTab").innerHTML = this._getLiLoading();
	
	// Mark us as fetching data
	this.updating = true;
	this.cbAddresses.disable();
	this.ibFilter.setEnabled(false);
	this.ibFilter.setValue(this.getMessage("zsugar_enter_filter"));
        
        // This will determine the modules we fetch data and the display order
        this.modules = [];
        if (this.getUserPropertyInfo("my_zsugar_opportunities").value == "true")
                this.modules.push("opportunities");
        if (this.getUserPropertyInfo("my_zsugar_project").value == "true")
                this.modules.push("project");
        if (this.getUserPropertyInfo("my_zsugar_accounts").value == "true")
                this.modules.push("accounts");
        if (this.getUserPropertyInfo("my_zsugar_leads").value == "true")
                this.modules.push("leads");
        if (this.getUserPropertyInfo("my_zsugar_cases").value == "true")
                this.modules.push("cases");
        this.modulesCnt = this.modules.length;


        /** This represents the fetched data. Contacts + Leads **/
        this.data = undefined;


        var callback;
        if (this.getUserPropertyInfo("my_zsugar_leads").value == "true"){
            callback = this._fetchLeadsData;
        }else{
            callback = this._fetchRelationships;
        }


	/** 
	 * Support multiple contacts. 
 	 * In version 10107 and below, we get all relationships from one query to sCRM using email address
	 * Since 10200, well request first ID's for contacts with that email address
	 * then, we requests relationships from that Contact ID, and treat them separately
	 **/
	if ( this.iscrm.getContactsFromMail(this.emailAddr,callback) === false) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_noOptsSelected"));
		this.updating = false;
		this.cbAddresses.enable();
		this.ibFilter.setEnabled(true);
                return false;
	}
};


com_irontec_zsugarH.prototype._fetchLeadsData = function(data){

        this.data = data;

        /**
         * Support for Leads as RootRelation
         * From zSugar 1.4.1 we treat Leads as a Contact too
         **/
	if ( this.iscrm.getLeadsFromMail(this.emailAddr,this._fetchRelationships) === false) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_noOptsSelected"));
		this.updating = false;
		this.cbAddresses.enable();
		this.ibFilter.setEnabled(true);
                return false;
	}

};

/** 
 * com_irontec_zsugarH.prototype._fetchRelationships 
 * 
 * This function gets as parameter sCRM response with Contacts Info 
 * and fetch relationships for each contact using ironsugar.getInfoFromContact
 *
 * @param data	Callback data 
 */
com_irontec_zsugarH.prototype._fetchRelationships = function(data){

        // Get Main Tab HTML Unsorted List
	var oUL = document.getElementById("zsugar_mainTab");
	oUL.innerHTML = '';			// Clear Tab 
	var oLI;

        // Append Contact data to this one. This is needed because we fetch Contact and Leads
        // data in separate functions and we join them here.
        if (this.data !== undefined)
            data.entry_list = data.entry_list.concat(this.data.entry_list);

	// Error treatment
	switch (true){
		case data.entry_list === undefined:
	                oLI = document.createElement("li");
			if (data.number !== undefined) oLI.innerHTML = data.name;
			else oLI.innerHTML = this.getMessage("zsugar_unexpected_error");
			break;
		case data.entry_list.length == 0:
		    oLI = document.createElement("li");
			oLI.innerHTML =  this.getMessage("zsugar_noresultsfound");
			break;
	}
	
	// Show error if required
	if (oLI){
	    oUL.appendChild(oLI);
	    this.updating = false;
	    this.cbAddresses.enable();
	    this.ibFilter.setEnabled(true);
	    return;
	}
    
        // Get Contacts
        var Contacts = data.entry_list;
        // TODO If we want to sort the Contact list in a specific order, it should be done here
        // For each contact
        for( var i=0; i < Contacts.length; i++) {
                /** Create Contact Checkbox ***/
                Contact = new Object();
                Contact.type = Contacts[i]['module_name'];
                Contact.id   = Contacts[i]['name_value_list']['id']['value'];
                Contact.name = Contacts[i]['name_value_list']['first_name']['value']+' '+
                           Contacts[i]['name_value_list']['last_name']['value'];

                if (Contact.type == "Contacts")
                    Contact.imgtype = '<img src="'+ this.getResource('resources/Contacts.png')+'" />';
                else
                    Contact.imgtype = '<img src="'+ this.getResource('resources/Leads.png')+'" />';

                /** Create an element to show Contact info in Main Tab screen 
                 *  This Element will be another Unsorted List which items will be
                 *  Contact's Opportunities, Accounts, Leads, Cases, and so.. */
                var cUL = document.createElement("ul");
                cUL.id = Contact.id;
                cUL.innerHTML = "<input type='checkbox' iden='"+Contact.id+"' class='item_selector' stype='"+Contact.type.toLowerCase()+"' id='zsugar_item"+Contact.id+"' /><label for='zsugar_item"+Contact.id+"'>"+Contact.imgtype+" "+Contact.name+"</label>";
                oUL.appendChild(cUL);

                if (this.modulesCnt > 0)
                        this.iscrm.getModuleInfo(Contact.id, Contact.type, this.modules[0], 0, this._addContactInfo);
        }
        
        return true;
}

com_irontec_zsugarH.prototype._addContactInfo = function(contactID, contactModule, relCnt, data) {

        // We have data in this module?
        if (data.entry_list !== undefined && data.entry_list.length > 0 ){
                // Get Main Tab HTML Unsorted List
                var oUL = document.getElementById("zsugar_mainTab");

                // Get Contact UL
                var cUL = document.getElementById(contactID);
	        
	        // Merge all relationships data in one Array
	        var rels = data.entry_list;
                rels.sort(this._sortResults);

	        /*** Add Contact Relationships checkboxes ***/
	        for(var j=0;j<rels.length;j++) {
                        var module_name = rels[j].module_name;
                        var id = rels[j].name_value_list.id.value;
	        	var iType = false;

	        	// Determine the relationship type 
	        	switch(module_name){
	        		case "Opportunities": var iType = '<img src="' + this.getResource('resources/Opportunities.png')+'" />'; break;
	        		case "Project": var iType = '<img src="'+ this.getResource('resources/Project.png')+'" />';  break;
	        		case "Accounts": var iType = '<img src="'+ this.getResource('resources/Accounts.png')+'" />';  break;
	        		case "Leads": var iType = '<img src="'+ this.getResource('resources/Leads.png')+'" />'; break;
	        		case "Cases": var iType = '<img src="'+ this.getResource('resources/Cases.png')+'" />'; break;
	        	}

	        	// Just a Sanity Check
	        	if (iType == false) continue;
	        	
	        	// Add the Relationship Objects to the Contact list
	        	if (module_name == "Leads" ){
                                var first_name = rels[j].name_value_list.first_name.value;
                                var last_name = rels[j].name_value_list.last_name.value;
	        		this._newEntity(module_name.toLowerCase(),iType,id,first_name+" "+last_name, cUL);
	        	} else {
                                var name = rels[j].name_value_list.name.value;
	        		this._newEntity(module_name.toLowerCase(),iType,id, name, cUL);
                        }
	        }	

	        // Append a line break just for nicer Look&Feel
	        oUL.appendChild(document.createElement("br"));
        }

	// Procceed with the next relation
        relCnt++;
        if (relCnt < this.modulesCnt){
                this.iscrm.getModuleInfo(contactID, contactModule, this.modules[relCnt], relCnt, this._addContactInfo);
        }else{
            this.updating = false;
            this.cbAddresses.enable();
            this.ibFilter.setEnabled(true);
        }
}


/***
 *  com_irontec_zsugarH.prototype._newEntity
 * 
 *  Main Tab is a HTML Unsorted List. Each Contact, Opportunity, Account, etc data is
 *  a HTML List item.
 *  
 *  Since version 1.2, Main Tab is a HTML Unsorted Lists where each Conctact item becomes
 *  another HTML Unsorted List. Opportunities, Accounts, Leads, Cases, and so, become HTML 
 *  List Items for the Contact Lists, instead of Main Tab List.
 *  Ex:
 *  <ul> Main Tab
 *   <li><ul> Contact A 
 *       <li> Contact A - Opportunity 1 </li>
 *       <li> Contact A - Opportunity 2 </li>
 *       <li> Contact A - Account 1 </li>
 *       </ul>
 *   </li>
 *   <li><ul> Contact B 
 *       <li> Contact B - Opportunity 1 </li>
 *       <li> Contact B - Account 1 </li>
 *       <li> Contact B - Lead 1 </li>
 *	 <li> Contact B - Cases 1 </li>
 *       </ul>
 *   </li>
 *  </ul>
 *   
 */
com_irontec_zsugarH.prototype._newEntity = function(type,imgtype,id,name, cUL) {
	// v10200 Append this element to the contact UL, instead of maintab UL
	var oLI = document.createElement("li");
	oLI.innerHTML = "<input type='checkbox' iden='"+id+"' class='item_selector' stype='"+type+"' id='zsugar_item"+id+"' /><label for='zsugar_item"+id+"'>"+imgtype+" "+name+"</label>";
	cUL.appendChild(oLI);
};

com_irontec_zsugarH.prototype._sortResults = function(a, b){
    var fulldate1str = a.name_value_list.date_modified.value;
    var fulldate2str = b.name_value_list.date_modified.value;

    var date1str = fulldate1str.split(" ")[0];
    var date2str = fulldate2str.split(" ")[0];


    var date1 = new Date(date1str);
    var date2 = new Date(date2str);
       
    // This is a comparison function that will result in dates being sorted in
    // DESCENDING order.
    if (date1 > date2) return -1;
    if (date1 < date2) return 1;
    return 0;
}

/***
 * com_irontec_zsugarH.prototype._cancelDialog
 * 
 * Callback Function for Dismiss Dialog Button.
 * Clear necesary data 
 */
com_irontec_zsugarH.prototype._cancelDialog = function() {
	this.updating = false;
	this.cbAddresses.enable();
        this.ibFilter.setEnabled(true);
	this.pbDialog.popdown();		// Hide the Dialog
	this.pView.clearContent();
};


/***
 * com_irontec_zsugarH.prototype._ArchiveEmail
 * 
 * This function is called after user has selected relationships 
 * checkboxes in the Main Tab and all is ready to be exported
 * to SugarCRM.
 * 
 * To Sum Up the full proccess will be
 *  1. Create the Email in SugarCRM	(@see _ArchiveEmail)
 *  2. Link The Email with selected Relationships (@see _emailSaved)
 *  3. Create Selected Attachments in SugarCRM (@see _emailLinked)
 *  4. Link each Attachment with the Email (@see _fileAttached)
 *  
 *  This Function ONLY Request step 1. After SugarCRM confirm us
 *  everything has gone ok, we will continue with step 2 in function
 *  _emailSaved
 * 
 * @TODO This function surely can be improved a lot. It does a lot
 * of task and uses lots of attributes that possibly be just local
 * vars.
 */
com_irontec_zsugarH.prototype._ArchiveEmail = function() {
	if (!this._checkBeforePOST()) return;
	this.updating = true;
	this.cbAddresses.disable();
	this.ibFilter.setEnabled(false);
	this.ibFilter.setValue(this.getMessage("zsugar_enter_filter"));

	var oUL = document.getElementById("zsugar_mainTab");
	var oInputs = oUL.getElementsByTagName("input");
	this.selectedEntities = {opportunities : [], project : [] , accounts : [], contacts : [], leads : [], cases : []};
	this.ops2Link = 0;
	this.ops2LinkOK = 0;	
	this.ops2LinkTotal = 0;
	this.attDone = 0;
	this.attTotal = 0;


//	Add Treatment for rest of Modules
	for(var i=0;(i<oInputs.length);i++) {
		if (!oInputs[i].checked) continue;
		var tt = oInputs[i].getAttribute("stype");
		var id = oInputs[i].getAttribute("iden");
		if (this.selectedEntities[tt]) {
			this.ops2LinkTotal++;
			this.selectedEntities[tt].push(id);
		}				
	}
	var atts = document.getElementById("zsugar_atts").getElementsByTagName("input");
	
	var port = Number(location.port);
	var baseURL = 
	[	location.protocol,
		'//',
		location.hostname,
		(
		 (port && ((proto == ZmSetting.PROTO_HTTP && port != ZmSetting.HTTP_DEFAULT_PORT) 
		|| (proto == ZmSetting.PROTO_HTTPS && port != ZmSetting.HTTPS_DEFAULT_PORT)))?
			":"+port:''),
		"/service/home/~/"
	].join("");

	this.toDoAttachments = {};
	for (var i=0;i<atts.length;i++) {
		if (!atts[i].checked) continue;
		this.attTotal++;
		var attLink = baseURL + atts[i].getAttribute("filename") + "?id="+this.msg.id + "&part=" + atts[i].getAttribute("part");
		this.toDoAttachments[atts[i].getAttribute("part")] = {
			filename: atts[i].getAttribute("filename"),
			link : attLink,
			size : atts[i].getAttribute("s")
		};

	}
	var idMail = this.iscrm.saveEmail(this.msg, this.subject, this._emailSaved);
	
	// Hide the Dialog, feedback will be send through Zimbra Popup Messages
	this._cancelDialog();

};

/***
 * com_irontec_zsugarH.prototype._emailSaved
 * 
 * This function is called after requesting SugarCRM to create a new
 * email in its database.
 * 
 * To Sum Up the full proccess will be
 *  1. Create the Email in SugarCRM	(@see _ArchiveEmail)
 *  2. Link The Email with selected Relationships (@see _emailSaved)
 *  3. Create Selected Attachments in SugarCRM (@see _emailLinked)
 *  4. Link each Attachment with the Email (@see _fileAttached)
 *  
 *  This Function is the SugarCRM Response to step 1. 
 *  After checking everything has gone ok, we ONLY will request step 2.
 *  SugarCRM will response us in function _emailLinked 
 *
 */
com_irontec_zsugarH.prototype._emailSaved = function(r) {
	try {
		var rO = eval(r);
		this.idEmailCRM = rO.id;
	
	} catch(e) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_errorInsertingEmail"));
		this.updating = false;
		this.cbAddresses.enable();
                this.ibFilter.setEnabled(true);
		return;
	}
	
        if (this.idEmailCRM == undefined){
                appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_errorInsertingEmail"));
                this.updating = false;
                this.cbAddresses.enable();
		this.ibFilter.setEnabled(true);
                return;
        }

	this.iscrm.LinkEmail(this.idEmailCRM,this.selectedEntities,this._emailLinked);

};

/***
 * com_irontec_zsugarH.prototype._emailLinked
 * 
 * This function is called after requesting SugarCRM to link the created
 * email with user selected relationships 
 * 
 * To Sum Up the full proccess will be
 *  1. Create the Email in SugarCRM	(@see _ArchiveEmail)
 *  2. Link The Email with selected Relationships (@see _emailSaved)
 *  3. Create Selected Attachments in SugarCRM (@see _emailLinked)
 *  4. Link each Attachment with the Email (@see _fileAttached)
 *  
 *  This Function is the SugarCRM Response to step 2. 
 *  After checking everything has gone ok, we ONLY will request step 3.
 *  SugarCRM will response us for each attachment done in _fileAttached
 *
 */
com_irontec_zsugarH.prototype._emailLinked = function(r) {
	if (r.created == 1) this.ops2LinkOK++;
	this.ops2Link++;
	
	if (this.ops2Link == this.ops2LinkTotal) {
	
		if (this.ops2LinkOK == this.ops2LinkTotal) {
			appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_emailsaved")+ "("+this.ops2LinkOK+"/"+this.ops2Link+")");
		} else {
			appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_errorInsertingEmail")+ "("+this.ops2LinkOK+"/"+this.ops2Link+")");
		}
		this.updating = false;
		this.cbAddresses.enable();
		this.ibFilter.setEnabled(true);
		
		// Tag email as exported (if requested)
		var tagname = this.getUserPropertyInfo("my_zsugar_tag").value;
		if ( tagname != "" )
			this.tag(this.msg,tagname) ;
	
		// Process attachments
		if (this.attTotal > 0){	
			appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_att_processing")); // Processing Attachments, please wait	
		        for(var part in this.toDoAttachments) {
				this.attproc = true;
        	        	this.iscrm.setAttachment(this.idEmailCRM,this.toDoAttachments[part].filename,this.toDoAttachments[part].link,this._fileAttached);
		        }
		}

	}

};

/***
 * com_irontec_zsugarH.prototype._fileAttached
 * 
 * This function is called after requesting SugarCRM to link the created
 * email with user selected relationships 
 * 
 * To Sum Up the full proccess will be
 *  1. Create the Email in SugarCRM	(@see _ArchiveEmail)
 *  2. Link The Email with selected Relationships (@see _emailSaved)
 *  3. Create Selected Attachments in SugarCRM (@see _emailLinked)
 *  4. Link each Attachment with the Email (@see _fileAttached)
 *  
 *  This Function is the SugarCRM Response to step 3. 
 *  After checking everything has gone ok, we ONLY will request step 4.
 *  This function is callbacked once for each attachment and finish the process
 *
 */
com_irontec_zsugarH.prototype._fileAttached = function(fname,r) {
	try {   
        	var rO = eval(r);
                var idAttach = rO.id;
	} catch(e) {
                appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_errorAttachingFile"));
                this.updating = false;
	 	this.cbAddresses.enable();	
		this.ibFilter.setEnabled(true);
		this.attproc = false;
                return;
        }
        this.iscrm.updateAttachment(idAttach,fname);

	this.attDone++;
        if (this.attDone == this.attTotal) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_att_done")+"("+this.attDone+"/"+this.attTotal+")");
		this.attproc = false;
	}
};


/***
 * com_irontec_zsugarH.prototype._changeSubject 
 * 
 * This function will be used as callback for Change Subject button
 * It will show a new modal dialog with the current email subject
 * allowing the user to update it.
 * 
 */
com_irontec_zsugarH.prototype._changeSubject = function(){
	if (!this.pSubjectView){
		var sDialogTitle = this.getMessage("zsugar_subjectchange"); // Get i18n resource string
	
  		this.pSubjectView = new DwtComposite(this.getShell()); 	    // Creates an empty div as a child of main shell div
		this.pSubjectView.setSize(450, 50); 				    // Set width and height

		var html = [], i=0;
		html[i++] = "<div id='zsugar_subject' style='overflow:auto'>";
		html[i++] = this.getMessage("zsugar_subject")+": ";
                html[i++] = "<input type='text' value='' size='60' maxlength='85' />";
		html[i++] = "</div>";

  		this.pSubjectView.getHtmlElement().innerHTML = html.join(""); 
	
	  	// pass the title, view & buttons information to create dialog box
	  	this.pbSubjectDialog = new ZmDialog({title:sDialogTitle, view:this.pSubjectView, parent: this.getShell(), 
						     standardButtons:[DwtDialog.CANCEL_BUTTON, DwtDialog.OK_BUTTON]});

	  	this.pbSubjectDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._changeSubjectOK)); 
	}
	var input = document.getElementById("zsugar_subject").getElementsByTagName("input");
	input[0].value = this.subject;
  	this.pbSubjectDialog.popup(); //show the dialog

};

/***
 * com_irontec_zsugarH.prototype._changeSubjectOK
 * 
 * This function will be called when User confirms the 
 * subject update. It will change the main dialog title for a 
 * nicer feedback.
 * 
 */
com_irontec_zsugarH.prototype._changeSubjectOK = function(){
	
	var input = document.getElementById("zsugar_subject").getElementsByTagName("input");
	this.subject =  input[0].value;
	this.pbDialog.setTitle(this._trimDialogTitle(this.subject));
	this.pbSubjectDialog.popdown();
};

com_irontec_zsugarH.prototype._moreOptionsDialog = function() {

        if (!this.pMoreOptionsView){
                var sDialogTitle = this.getMessage("zsugar_more_options"); // Get i18n resource string

                this.pMoreOptionsView = new DwtComposite(this.getShell());      // Creates an empty div as a child of main shell div
                this.pMoreOptionsView.setSize(250, 150);                                     // Set width and height

		// Configure Help button
		var buttonParams = {
			parent: this.pMoreOptionsView,
                	style : DwtLabel.IMAGE_LEFT,
                	posStyle : DwtControl.RELATIVE_STYLE,
		        className : "MoreButtons",
		};

	        // Create Button and add Listeners
        	var newLeadButton = new DwtButton(buttonParams);
		newLeadButton.setText(this.getMessage("zsugar_createLead"));
		newLeadButton.setImage("ISUGAR-lead");	
		newLeadButton.getHtmlElement().getElementsByTagName("table")[0].style.width = "180px";
		newLeadButton.getHtmlElement().getElementsByTagName("table")[0].style.height = "30px";
        	newLeadButton.addSelectionListener(new AjxListener(this, this._newLeadDialog));

                // pass the title, view & buttons information to create dialog box
                this.pbMoreOptionsDialog = new ZmDialog({title:sDialogTitle, view:this.pMoreOptionsView, parent: this.getShell(),
                                                     standardButtons:[DwtDialog.CANCEL_BUTTON]});
        }
        this.pbMoreOptionsDialog.popup(); //show the dialog
};

com_irontec_zsugarH.prototype._newLeadDialog = function() {
	//this.pbMoreOptionsDialog.popdown(); //Hide menu dialog

	if (!this.pNewLeadView) {
		var sDialogTitle = this.getMessage("zsugar_createLead"); // Get i18n resource string
		this.pNewLeadView = new DwtComposite(this.getShell());    // Creates an empty div as a child of main shell div
		this.pNewLeadView.setSize(450, 250);                      // Set width and height
		
		var html = [], i=0;
		html[i++] = "<table>";
		html[i++] =     "<tr><td>"+this.getMessage("zsugar_lead_firstname")+":</td><td id='zsugar_lead_firstname'></td></tr>";
		html[i++] =     "<tr><td>"+this.getMessage("zsugar_lead_lastname")+":</td><td id='zsugar_lead_lastname'></td></tr>";
		html[i++] =     "<tr><td>"+this.getMessage("zsugar_lead_email")+":</td><td id='zsugar_lead_email'></td></tr>";
		html[i++] =     "<tr><td>"+this.getMessage("zsugar_lead_account")+":</td><td id='zsugar_lead_account'></td></tr>";
		html[i++] =     "<tr><td>"+this.getMessage("zsugar_lead_desc")+":</td><td id='zsugar_lead_desc'></td></tr>";
		html[i++] =     "<tr><td colspan='2'><input type='checkbox' id='zsugar_lead_assigned' checked>"+this.getMessage("zsugar_lead_assigned")+"</input></td></tr>";
		html[i++] = "<table>";
		
		this.pNewLeadView.getHtmlElement().innerHTML = html.join("");
		
		// pass the title, view & buttons information to create dialog box
		this.pNewLeadDialog = new ZmDialog({title:sDialogTitle, view: this.pNewLeadView, parent: this.getShell(),
		                                     standardButtons:[DwtDialog.CANCEL_BUTTON, DwtDialog.OK_BUTTON]});
		this.pNewLeadDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._createNewLead));

		this.inLeadFirstNameBox = new DwtInputField({parent: this.pNewLeadView, size: 30});
        	document.getElementById("zsugar_lead_firstname").appendChild(this.inLeadFirstNameBox.getHtmlElement());
		this.inLeadLastNameBox = new DwtInputField({parent: this.pNewLeadView, size: 30});
        	document.getElementById("zsugar_lead_lastname").appendChild(this.inLeadLastNameBox.getHtmlElement());
		this.inLeadEmailBox = new DwtInputField({parent: this.pNewLeadView, size: 30});
        	document.getElementById("zsugar_lead_email").appendChild(this.inLeadEmailBox.getHtmlElement());
		this.inLeadAccBox = new DwtInputField({parent: this.pNewLeadView, size: 30});
        	document.getElementById("zsugar_lead_account").appendChild(this.inLeadAccBox.getHtmlElement());
        if (typeof DwtHtmlEditor === "function")
            this.taLeadDescription = new ZmHtmlEditor(this.pNewLeadView);
        else
            this.taLeadDescription = new ZmHtmlEditor({parent: this.pNewLeadView});
        this.taLeadDescription.setMode("text/plain");
		this.taLeadDescription.setSize(300, 70);
		document.getElementById("zsugar_lead_desc").appendChild(this.taLeadDescription.getHtmlElement());
	} 

	// Initialize fields
	this.taLeadDescription.setContent("");
	this.inLeadFirstNameBox.setValue("");
	this.inLeadLastNameBox.setValue("");
	this.inLeadEmailBox.setValue("");
	this.inLeadAccBox.setValue("");

	// Set values if any
	if(this.emailAddr) {
		this.inLeadEmailBox.setValue(this.emailAddr);
		for (i=0;i<this.addressList.length; i++){
			if (this.addressList[i].email == this.emailAddr) {
				var name = "";
				if (this.addressList[i].dispName.length) {
					name = this.addressList[i].dispName;
				}
				if (this.addressList[i].name.length) {
					name = this.addressList[i].name;
				}
				if (name.length) {
					var name = name.split(" ");
					this.inLeadFirstNameBox.setValue(name.shift());
					this.inLeadLastNameBox.setValue(name.join(" "));
				}
				break;
			}
		}
	}
        this.pNewLeadDialog.popup(); //show the dialog
};

com_irontec_zsugarH.prototype._createNewLead = function () {
	// TODO verify required data

	var firstname = this.inLeadFirstNameBox.getValue();
	var lastname = this.inLeadLastNameBox.getValue();
	var email = this.inLeadEmailBox.getValue();
	var acc = this.inLeadAccBox.getValue();
	var assigned = document.getElementById("zsugar_lead_assigned").checked;
	var desc = this.taLeadDescription.getContent();

	// Hide the dialog
	this.pNewLeadDialog.popdown();

	// Request CRM to create the Lead 
	this.iscrm.createLead(firstname, lastname, email, acc, desc, assigned, this._leadCreated);

}

com_irontec_zsugarH.prototype._leadCreated = function(response){
	if (response.id) {
		var url =  this.getUserPropertyInfo("my_zsugar_url").value+"/index.php?module=Leads&action=DetailView&record="+response.id;
		var msg = this.getMessage("zsugar_leadCreated")+"<br><a target='_blank' href='"+url+"'>"+this.inLeadFirstNameBox.getValue()+"</a>";
		appCtxt.getAppController().setStatusMsg(msg);
		return this._updateCRMValue();
	} else {
		return appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_leadError"));
	}
}

/***************************************************************************
 **
 ** 		            Appointments Process
 **
 **************************************************************************/
/***
 * com_irontec_zsugarH.prototype._displayAPPTDialog
 *
 * This function displays a Dialog with the following Sections 
 *  - Main Tab: Show selected address related Info from SugarCRM
 *   		* Contact Info
 *   		  * Opportunities
 *   		  * Projects
 *   		  * Accounts
 *   		  * Leads
 *		  * Cases
 *   
 *  - Address Selector: A combobox with Email Address retrieved
 *  					from the selected mail.
 *  
 *  - Attachments Panel: A group of checkboxes to select which 
 *  					attachments will be exported to sCRM
 * 
 * Pressing OK button will send us to _ArchiveEmail
 * Pressing Cancel button will send us to _cancelDialog
 * Pressing Change Subject button will send us to _changeSubject
 * 
 * 
 * @param msg	Message from which data will be displayed
 * 
 * @TODO It's not necesary to create the Dialog each time a message
 * it's dropped. It should only be created once, then update it's content
 * and show it. 
 */
com_irontec_zsugarH.prototype._displayAPPTDialog = function(appt) {
	
	// Set Appointment object
	this.appt = appt;
	// Set Appointment Subject (Full, not trimmed)
	this.name = appt.name;
	
	// Get the Dialog Title from Message Subject
	var wTitle = this._trimDialogTitle(appt.name);

	// Creates an empty div as a child of main shell div
	this.pView = new DwtComposite(this.getShell()); 
	this.pView.setSize(550, 430); 				// Set width and height
	
	/*** Fill the Main Tab ***/
	this.pView.getHtmlElement().innerHTML = this._loadAPPTMainView();
	
        // pass the title, view and buttons information and create dialog box
        this.pbDialog = new ZmDialog({title: wTitle, view:this.pView, parent:this.getShell(),
                                      standardButtons:[DwtDialog.DISMISS_BUTTON, DwtDialog.OK_BUTTON]});

	// Link The Standard Buttons
	this.pbDialog.setButtonListener(DwtDialog.DISMISS_BUTTON, new AjxListener(this, this._cancelDialog));
	this.pbDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._ArchiveAppointment), appt);

	// Show the Dialog
	this.pbDialog.popup();  

	/*** Fill the Appointment Type Combobox ***/
	var aTypes = [this.getMessage("zsugar_calling"), 
		      this.getMessage("zsugar_meeting")];

	this.cbAPPTType = new DwtSelect({parent:this.pbDialog, options:aTypes});
	this.cbAPPTType.getHtmlElement().style.width = '100%';
	var cap = document.getElementById("zsugar_appttype");
	cap.appendChild(this.cbAPPTType.getHtmlElement());

	/*** Fill the Appointment Status Combobox ***/
	var aStatus = [this.getMessage("zsugar_sched"), 
		       this.getMessage("zsugar_done"),
		       this.getMessage("zsugar_undone")];
	this.cbAPPTStatus = new DwtSelect({parent:this.pbDialog, options:aStatus});
        this.cbAPPTStatus.getHtmlElement().style.width = '100%';
        cap = document.getElementById("zsugar_apptstatus");
        cap.appendChild(this.cbAPPTStatus.getHtmlElement());

	/*** Fill the Address Combobox ***/
	var addrs = [];

	var selected = true;
	for (var j = 0;j< appt.origAttendees.length;j++) {
		var email = appt.origAttendees[j].getAttr("email");
		addrs.push(new DwtSelectOption(email, selected, email ));
		if (selected) {
			this.emailAddr = email;
			selected = false;
		}
	}
	this.cbAddresses = new DwtSelect({parent:this.pbDialog, options:addrs});
	this.cbAddresses.getHtmlElement().style.width = '100%';
	this.cbAddresses.addChangeListener(new AjxListener(this, this._changeEmailAddress));
	var cap = document.getElementById("zsugar_apptaddress");
	cap.appendChild(this.cbAddresses.getHtmlElement());


        /*** Request SugarCRM Contact Info ***/
        this._updateCRMValue();
};

/***
 * com_irontec_zsugarH.prototype._loadAPPTMainView
 * 
 * Dialog Container HTML Content.
 * @see _displayAPPTDialog for a short description of each section
 */
com_irontec_zsugarH.prototype._loadAPPTMainView = function() {
	var html = [], i=0;
	html[i++] = "<div id='zsugar_container' style='overflow:auto'>";
	html[i++] = "<ul id='zsugar_mainTab'>";
	html[i++] = this._getLiLoading();
	html[i++] = "</ul></div>";
	html[i++] = "<div id='zsugar_apptaddress'></div>";
        html[i++] = "<div id='zsugar_appttype'></div>";
        html[i++] = "<div id='zsugar_apptstatus'></div>";
	html[i++] = "   <a href='"+this.getMessage("zsugar_powered")+"' target='_blank'>";
	html[i++] = "   <img src='"+this.getResource("resources/Poweredby.png")+"' border='0' align='right'/></a>";
	return html.join("");
};


/***
 * com_irontec_zsugarH.prototype._ArchiveAppointment
 * 
 * This function is called after user has selected relationships 
 * checkboxes in the Main Tab and all is ready to be exported
 * to SugarCRM.
 * 
 * To Sum Up the full proccess will be
 *  1. Create the Appoint in SugarCRM	(@see _ArchiveAppointment)
 *  2. Link The Email with selected Relationships (@see _apptSaved)
 *  
 *  This Function ONLY Request step 1. After SugarCRM confirm us
 *  everything has gone ok, we will continue with step 2 in function
 *  _apptSaved
 * 
 * @TODO This function surely can be improved a lot. It does a lot
 * of task and uses lots of attributes that possibly be just local
 * vars.
 */
com_irontec_zsugarH.prototype._ArchiveAppointment = function() {
	if (!this._checkBeforePOST()) return;
	this.updating = true;
	this.cbAddresses.disable();
	this.ibFilter.setEnabled(false);
	this.ibFilter.setValue(this.getMessage("zsugar_enter_filter"));

	var oUL = document.getElementById("zsugar_mainTab");
	var oInputs = oUL.getElementsByTagName("input");
	this.selectedEntities = {opportunities : [], project : [] , accounts : [], contacts : [], leads : [], cases : []};
	this.ops2Link = 0;
	this.ops2LinkOK = 0;	
	this.ops2LinkTotal = 0;
	this.attDone = 0;
	this.attTotal = 0;


//	Add Treatment for rest of Modules
	for(var i=0;(i<oInputs.length);i++) {
		if (!oInputs[i].checked) continue;
		var tt = oInputs[i].getAttribute("stype");
		var id = oInputs[i].getAttribute("iden");
		if (this.selectedEntities[tt]) {
			this.ops2LinkTotal++;
			this.selectedEntities[tt].push(id);
		}				
	}

	var idMail = this.iscrm.saveAppointment(this.appt, this.name, this._apptSaved);

	// Hide the Dialog, feedback will be send through Zimbra Popup Messages
	this._cancelDialog();

};


com_irontec_zsugarH.prototype._apptSaved = function(r) {
	try {
		var rO = eval(r);
		this.idApptCRM = rO.id;
	
	} catch(e) {
		appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_errorInsertingAppt"));
		this.updating = false;
		this.cbAddresses.enable();
		this.ibFilter.setEnabled(true);
		return;
	}
	
	this.iscrm.LinkAppt(this.idApptCRM,this.selectedEntities,this._apptLinked);

};


com_irontec_zsugarH.prototype._apptLinked = function(r) {
	if (r.created == 1) this.ops2LinkOK++;
	this.ops2Link++;
	
	if (this.ops2Link == this.ops2LinkTotal) {
	
		if (this.ops2LinkOK == this.ops2LinkTotal) {
			appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_apptsaved")+ "("+this.ops2LinkOK+"/"+this.ops2Link+")");
		} else {
			appCtxt.getAppController().setStatusMsg(this.getMessage("zsugar_errorInsertingAppt")+ "("+this.ops2LinkOK+"/"+this.ops2Link+")");
		}
		this.updating = false;
		this.cbAddresses.enable();
		this.ibFilter.setEnabled(true);
	}
};
