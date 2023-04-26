sap.ui.define(
  [
    "com/idocmanagerui01/controller/BaseController",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/model/json/JSONModel",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/core/routing/History",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/m/MessageBox",
    "com/idocmanagerui01/lib/RestService",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/core/format/DateFormat",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/m/MessagePopover",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/m/MessagePopoverItem",
    "com/idocmanagerui01/model/formatter",

  ],
  /**
         * @param {com.idocmanagerui01.controller.BaseController} BaseController Base Controller
         * @param {sap.ui.model.json.JSONModel} JSONModel JSON Model
         * @param {sap.ui.core.routing.History} History History
         * @param {sap.m.MessageBox} MessageBox Message Box
         * @param {com.idocmanagerui01.lib.RestService} Rest Rest Service
         *@param {sap.ui.core.format.DateFormat} DateFormat Date Format
         *@param {sap.m.MessagePopover} MessagePopover Message Popover
         *@param {sap.m.MessagePopoverItem} MessagePopoverItem Message Popover Item
         *@param {com.idocmanagerui01.model.formatter} formatter formatter
         
         
         * @returns {com.idocmanagerui01.controller.BaseController} Controller
         */
  function (
    BaseController,
    JSONModel,
    History,
    MessageBox,
    Rest,
    DateFormat,
    MessagePopover,
    MessagePopoverItem,
    formatter
  ) {
    "use strict";
    return BaseController.extend("com.idocmanagerui01.controller.Idoc_Items", {
      formatter: formatter,
      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        this.getRouter()
          .getRoute("idocitems")
          .attachPatternMatched(this._onObjectMatched, this);
       },

      iGetInput: function (mObjectId) {
        const that = this;
        this.getView().setBusy(true);
        const sGetIdocItemsUrl = "/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/IDoc_detailsSet?&$expand=Nav_matnr_details&$filter=IDoc_Number eq '" + mObjectId + "'";
          //'/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/IDoc_detailsSet?IDoc_Number eq "'+mObjectId+'"&$expand=Nav_matnr_details';
        const oWhenCallReadIsDone = Rest.ajaxCall("GET", sGetIdocItemsUrl);
        oWhenCallReadIsDone.then(
          (resolvedData) => {
            const _idocItemModel = new JSONModel();
            const _aIdocResult = [];
            if(resolvedData.d.results.length !== 0) {
            _aIdocResult.push(resolvedData.d.results);
            _idocItemModel.setData(_aIdocResult[0]);
            console.log("Item Model", _idocItemModel);
            this.setModel(_idocItemModel, "IdocItemModel");
            }
            this.getView().setBusy(false);

            // var sPath = "IdocItemModel>/0";
            // sPath = "/IDoc_detailsSet('" + mObjectId + "')";
            // this.getView().bindElement({
            //   path: sPath,
            //   // events: {
            //   // 	change: this._onBindingChange.bind(this)
            //   // }
            // });
            // this.oItemHeader = this.byId("itemHeader");
            // this.oItemHeader.bindElement({
            //   path: sPath,
            // });
           // // this._bindView(sPath);
          },
          (rejectedData) => {
            MessageBox.error(rejectedData.error.message);
            this.getView().setBusy(false);
          }
        );
    
        
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Event handler  for navigating back.
       * It there is a history entry we go one step back in the browser history
       * If not, it will replace the current entry of the browser history with the worklist route.
       * @public
       */
      // onNavBack: function () {
      // 	var sPreviousHash = History.getInstance().getPreviousHash();
      // 	this.getGlobalModel().setProperty("/currentScreen", "mainview");
      // 	if (sPreviousHash !== undefined) {
      // 		window.history.go(-1);
      // 	} else {
      // 		this.getRouter().navTo("worklist", {}, true);
      // 	}
      // },

      /* =========================================================== */
      /* internal methods                                            */
      /* =========================================================== */

      /**
       * Binds the view to the object path.
       * @function
       * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
       * @private
       */
      _onObjectMatched: function (oEvent) {
        var sObjectId = oEvent.getParameter("arguments").objectId;
        this.iGetInput(sObjectId);
      },
       /**
       * Binds the view to the object path.
       * @function
       * @param {string} sObjectPath path to the object to be bound
       * @private
       */
      _bindView: function (sObjectPath) {
        var oViewModel = this.getModel("objectView"),
          oDataModel = this.getModel();

        this.getView().bindElement({
          path: sObjectPath,
          events: {
            change: this._onBindingChange.bind(this),
            dataRequested: function () {
              oDataModel.metadataLoaded().then(function () {
                // Busy indicator on view should only be set if metadata is loaded,
                // otherwise there may be two busy indications next to each other on the
                // screen. This happens because route matched handler already calls '_bindView'
                // while metadata is loaded.
                oViewModel.setProperty("/busy", true);
              });
            },
            dataReceived: function () {
              oViewModel.setProperty("/busy", false);
            },
          },
        });
      },

      _onBindingChange: function () {
        var oView = this.getView(),
          oViewModel = this.getModel("objectView"),
          oElementBinding = oView.getElementBinding();

        // No data for the binding
        if (!oElementBinding.getBoundContext()) {
          this.getRouter().getTargets().display("objectNotFound");
          return;
        }
        //commented by selvan
        // var oResourceBundle = this.getResourceBundle(),
        // 	oObject = oView.getBindingContext().getObject(),
        // 	sObjectId = oObject.ProductID,
        // 	sObjectName = oObject.ProductName;

        // oViewModel.setProperty("/busy", false);
        // oViewModel.setProperty("/shareSendEmailSubject",
        // 	oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
        // oViewModel.setProperty("/shareSendEmailMessage",
        // 	oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));

        // // Update the comments in the list
        // var oList = this.byId("idCommentsList");
        // var oBinding = oList.getBinding("items");
        // oBinding.filter(new Filter("productID", FilterOperator.EQ, sObjectId));
      },

      /**
       * Updates the model with the user comments on Products.
       * @function
       * @param {sap.ui.base.Event} oEvent object of the user input
       */
      onPost: function (oEvent) {
        var oFormat = DateFormat.getDateTimeInstance({
          style: "medium",
        });
        var sDate = oFormat.format(new Date());
        var oObject = this.getView().getBindingContext().getObject();
        var sValue = oEvent.getParameter("value");
        var oEntry = {
          productID: oObject.ProductID,
          type: "Comment",
          date: sDate,
          comment: sValue,
        };
        // update model
        var oFeedbackModel = this.getModel("productFeedback");
        var aEntries = oFeedbackModel.getData().productComments;
        aEntries.push(oEntry);
        oFeedbackModel.setData({
          productComments: aEntries,
        });
      },
      onDataExport:
        sap.m.Table.prototype.exportData ||
        function () {
          //this.GetExportServerData("0000000000528172");
          var oModel = this.getOwnerComponent().getModel();
          console.log("exporttttt", oModel);
          var oExport = new Export({
            exportType: new ExportTypeCSV({
              fileExtension: "xls",
              separatorChar: "\t",
            }),

            models: oModel,

            rows: {
              path: "/IDoc_detailsSet('0000000000528173')",
              //path: "/Total_idocsSet"
            },

            columns: [
              {
                name: "IDoc Number",
                template: {
                  content: "{Purchase_Order}",
                },
                // }, {
                // 	name: "Tech Name",
                // 	template: {
                // 		content: "{TECHNAME}"
                // 	}
                // }, {
                // 	name: "VALUE",
                // 	template: {
                // 		content: "{VALUE}"
                // 	}
              },
            ],
          });
          console.log("export", oExport);
          oExport
            .saveFile()
            .catch(function (oError) {})
            .then(function () {
              oExport.destroy();
            });
        },
    });
  }
);
