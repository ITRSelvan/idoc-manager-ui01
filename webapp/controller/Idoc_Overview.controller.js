sap.ui.define(
  [
    "com/idocmanagerui01/controller/BaseController",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/model/json/JSONModel",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/m/IconTabFilter",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/m/MessageBox",
    "com/idocmanagerui01/lib/RestService",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/model/Filter",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/model/FilterOperator",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/core/util/Export",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/core/util/ExportTypeCSV",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/core/Fragment",
  ],
  /**
   *
   * @param {com.idocmanagerui01.controller.BaseController} BaseController Base Controller
   * @param {sap.ui.model.json.JSONModel} JSONModel JSON Model
   * @param {sap.m.IconTabFilter} IconTabFilter Icon Tab Filter
   * @param {sap.m.MessageBox} MessageBox Message Box
   * @param {com.idocmanagerui01.lib.RestService} Rest Rest Service
   * @param {sap.m.Filter} Filter Filter
   * @param {sap.m.FilterOperator} FilterOperator FilterOperator
   * @param {sap.m.Export} Export Export
   * @param {sap.m.ExportTypeCSV} ExportTypeCSV ExportTypeCSV
   * @param {sap.m.Fragment} Fragment Fragment
   * @returns {com.idocmanagerui01.controller.BaseController} Controller
   */
  function (
    BaseController,
    JSONModel,
    IconTabFilter,
    MessageBox,
    Rest,
    Filter,
    FilterOperator,
    Export,
    ExportTypeCSV,
    Fragment
  ) {
    "use strict";

    return BaseController.extend(
      "com.idocmanagerui01.controller.Idoc_Overview",
      {
        onInit: function () {
          this._oTable = this.byId("toTable");

          // Model used to manipulate control states
          const oViewModel = new JSONModel({
            worklistTableTitle: this.getI18n("worklistTableTitle"),
            shareOnJamTitle: this.getI18n("worklistTitle"),
            shareSendEmailSubject: this.getI18n(
              "shareSendEmailWorklistSubject"
            ),
            shareSendEmailMessage: this.getI18n(
              "shareSendEmailWorklistMessage",
              [location.href]
            ),
            tableNoDataText: this.getI18n("tableNoDataText"),
            tableBusyDelay: 0,
            inError: 0,
            inProcess: 0,
            inProcessed: 0,
            countAll: 0,
          });
          this.setModel(oViewModel, "worklistView");
          this._mFilters = {
            inError: [
              new Filter(
                "Idoc_status",
                sap.ui.model.FilterOperator.EQ,
                "Error"
              ),
            ],
            inProcess: [
              new Filter(
                "Idoc_status",
                sap.ui.model.FilterOperator.EQ,
                "In Process"
              ),
            ],
            inProcessed: [
              new Filter(
                "Idoc_status",
                sap.ui.model.FilterOperator.EQ,
                "Processed"
              ),
            ],
            all: [],
          };

          //Set table to multiselect
          let oTable = this.getView().byId("toTable");
          oTable.setMode("MultiSelect");
          oTable.attachSelectionChange(this.onTableSelection, this);

          //********************************************************
          //Workflow Dialog
          this._richTxtValue = "";
          this._dpValue = "";
          this._rbgValue = "";
          this._mIdocNumber = [];
          this._mDescription = [];
          this._mResponse = [];
          this._mIdocIndex = 0;
          this._oRfModel = new JSONModel();
          //Workflow Dialog
          //***********************************************************
        },
        onBeforeRendering: function () {
          this.getView().setBusy(true);

          //Get Overview data from backend by passing with empty filter value to get all overivew data.
          this.GetIDocOverview("");
        },
        GetIDocOverview: function () {
          const that = this;
          //const sGetIdocStatusUrl = this.getAJAXUrlPrefix() + "/Total_idocsSet?Idoc_status=' '";
          const sGetIdocStatusUrl =
            '/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/Total_idocsSet?Idoc_status=" "';
          const oWhenCallReadIsDone = Rest.ajaxCall("GET", sGetIdocStatusUrl);
          oWhenCallReadIsDone.then(
            (resolvedData) => {
              const _idocModel = new JSONModel();
              const _aIdocResult = [];
              _aIdocResult.push(resolvedData.d.results);
              _idocModel.setData(_aIdocResult[0]);
              this.setModel(_idocModel, "idocOverviewModel");
              this.getView().setBusy(false);
            },
            (rejectedData) => {
              MessageBox.error(rejectedData.error.message);
              this.getView().setBusy(false);
            }
          );
        },
        getModelCount: function (oView, sInputValue) {
          var promise = jQuery.Deferred();
          var oFilterFields = oView.getFilterFields();
          var property = "";
          var _inpVal = 0;
          for (property in oFilterFields) {
            _inpVal = property;
            break;
          }
          for (var i = 0; i < Object.keys(oFilterFields).length; i++) {
            oFilterFields[_inpVal] = sInputValue;
          }
          var oWhenOdataCall =
            this._ODataModelInterface.filterCountModelPopulate(oView, "");
          oWhenOdataCall.done(function (oResult) {
            promise.resolve(oResult);
          });
          return promise;
        },
        onUpdateFinished: function (oEvent) {
          var sTitle,
            oTable = oEvent.getSource(),
            iTotalItems = oEvent.getParameter("total");
          ///sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/Total_idocsSet/$count?&$filter=Idoc_status eq 'Error'
          // only update the counter if the length is final and
          // the table is not empty
          if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
            sTitle = this.getI18n("worklistTableTitleCount", [iTotalItems]);
            if (!this._CountCal || !this._rowPress) {
              this._getFilterCount("Error", "inError");
              this._getFilterCount("In Process", "inProcess");
              this._getFilterCount("Processed", "inProcessed");
              this._getFilterCount("", "countAll");
              this._CountCal = true;
            }
          } else {
            sTitle = this.getI18n("worklistTableTitle");
          }
          this.getModel("worklistView").setProperty(
            "/worklistTableTitle",
            sTitle
          );
        },
        _getFilterCount: function (sIdocStatus, sFilterValues) {
          const oItems = this.getModelData("idocOverviewModel"),
            oViewModel = this.getModel("worklistView");
          let mLength = 0;

          if (sIdocStatus !== "") {
            for (let i = 0; i < oItems.length; i++) {
              if (oItems[i].Idoc_status === sIdocStatus) {
                mLength++;
              }
            }
          } else {
            mLength = oItems.length;
          }

          oViewModel.setProperty("/" + sFilterValues, mLength);
        },
        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress: function (oEvent) {
          this._rowPress = true;
          // The source is the list item that got pressed
          this._showObject(oEvent.getSource());
        },
        onTableSelection: function () {
          var aSelectedItems = [],
            mCells;
          aSelectedItems = this.getView().byId("toTable").getSelectedItems();
          //Enable Mass Edit button if any of the item is selected
          this.getView()
            .byId("btnMultiEdit")
            .setEnabled(aSelectedItems.length > 0);
          this.getView()
            .byId("btnProcess")
            .setEnabled(aSelectedItems.length > 0);
          this.getView()
            .byId("btnWorkflow")
            .setEnabled(aSelectedItems.length > 0);

          if (aSelectedItems.length > 0) {
            for (var mRow = 0; mRow < aSelectedItems.length; mRow++) {
              mCells = aSelectedItems[mRow].getCells();
              this._mIdocNumber[mRow] = mCells[0].getText();
              this._mDescription[mRow] = mCells[5].getText();
            }
          }
          //Set selected idoc number to global model to access from other views
          this.getOwnerComponent()
            .getModel("globalProperties")
            .setProperty("/selIdocs", this._mIdocNumber);
        },
        onSearch: function (oEvent) {
          if (oEvent.getParameters().refreshButtonPressed) {
            // Search field's 'refresh' button has been pressed.
            // This is visible if you select any master list item.
            // In this case no new search is triggered, we only
            // refresh the list binding.
            this.onRefresh();
          } else {
            var aTableSearchState = [];
            var sQuery = oEvent.getParameter("query");

            if (sQuery && sQuery.length > 0) {
              aTableSearchState = [
                new Filter("Customer_name", FilterOperator.Contains, sQuery),
              ];
            }
            this._applySearch(aTableSearchState);
          }
        },
        onBeforeRebindTable: function (oEvent) {
          var mBindingParams = oEvent.getParameter("bindingParams");
          mBindingParams.parameters["custom"] = {
            "search-focus": "PO_number", //  the name of the search field
            search: "", //  the search text itself!
          };
        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh: function () {
          var oTable = this.byId("table");
          oTable.getBinding("items").refresh();
        },
        _disableToolbarBtn: function () {
          //Disable Toolbar buttons and remove selection tick marks
          this.getView().byId("btnMultiEdit").setEnabled(false);
          this.getView().byId("btnProcess").setEnabled(false);
          this.getView().byId("btnWorkflow").setEnabled(false);
          this.getView().byId("toTable").removeSelections(true);
        },
        /**
         * Event handler for create workflow, to open dialog window
         * get input values and send to backend for further process
         * @public
         */
        //*******************************************************************************
        //Workflow Process
        //*********************************************************************************

        onWorkflowButtonClick: function () {
          var that = this;
          sap.ui.core.BusyIndicator.show(0);
          // create dialog lazily
          if (!this.byId("processDialog")) {
            var oFragmentController = {
              onCloseDialog: function () {
                //Rest Dialog Controls
                that.byId("processRichTextEditor").setValue("");
                that.byId("DPProcess").setValue("");
                that.byId("rbg1").setSelectedIndex(0);
                //Rest End
                that.byId("processDialog").close();
              },
              onDialogSaveButton: function () {
                that._richTxtValue = that
                  .byId("processRichTextEditor")
                  .getValue();
                that._dpValue = that.byId("rbg1").getSelectedButton().getText();
                that._rbgValue = that.byId("DPProcess").getValue();
                //Rest Dialog Controls
                that.byId("processRichTextEditor").setValue("");
                that.byId("DPProcess").setValue("");
                that.byId("rbg1").setSelectedIndex(0);
                //Rest End
                //Close the Dialog
                that.byId("processDialog").close();
                //Call Workflow request
                that.onSendMailClick();
              },
            };
            // load asynchronous XML fragment
            Fragment.load({
              id: that.getView().getId(),
              name: "com.idocmanagerui01.view.fragment.Workflow",
              controller: oFragmentController,
            }).then(function (oDialog) {
              // connect dialog to the root view of this component (models, lifecycle)
              that.getView().addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this.byId("processDialog").open();
          }
          //Disable toolbar buttons and remove table selection
          this._disableToolbarBtn();
          sap.ui.core.BusyIndicator.hide();
        },
        onSendMailClick: function () {
          var that = this;
          this.getView().byId("toTable").removeSelections(true);
          //console.log("idoc no", this._mIdocNumber);
          var workflowCreate = {};
          for (var mIdoc = 0; mIdoc < this._mIdocNumber.length; mIdoc++) {
            workflowCreate = {};
            workflowCreate.Idoc_Number = that._mIdocNumber[mIdoc];
            workflowCreate.Description = that._mDescription[mIdoc];
            workflowCreate.Department = that._dpValue;
            workflowCreate.Need_By_Date = that._rbgValue;
            workflowCreate.WF_Description = that._richTxtValue;
            this.createWorkflow(workflowCreate, mIdoc);
          }
        },
        createWorkflow: function (mWorkflowPara, mIdocIndex) {
          //Fetch Token
          const that = this;
          that.getView().setBusy(true);
          $.ajax({
            url: "/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/Total_idocsSet",
            type: "GET",
            headers: { "x-CSRF-Token": "Fetch" },
          }).always(function (data, status, response) {
            that.csrfToken = response.getResponseHeader("x-CSRF-Token");
            const sPostWorkflowUrl =
              "/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/WorkflowSet";
            const oWhenCallReadIsDone = Rest.ajaxCall(
              "POST",
              sPostWorkflowUrl,
              mWorkflowPara,
              "",
              that.csrfToken
            );
            oWhenCallReadIsDone.then(
              (resolvedData) => {
                that._mResponse[that._mIdocIndex] = resolvedData.d;
                if (that._mIdocNumber.length == that._mIdocIndex + 1) {
                  const _wroklistModel = new JSONModel();
                  _wroklistModel.setData(that._mResponse);
                  that.setModel(_wroklistModel, "workRsltModel");
                  that.showWorkflowResultDialog();
                } else {
                  that._mIdocIndex = that._mIdocIndex + 1;
                }
                that.getView().setBusy(false);
              },
              (rejectedData) => {
                that.getView().setBusy(false);
                MessageBox.error(rejectedData.error.message);
              }
            );
          });
        },
        showWorkflowResultDialog: function () {
          const that = this;
          sap.ui.core.BusyIndicator.show(0);
          // create dialog lazily
          if (!this.byId("workflowRsltDialog")) {
            const oFragmentController = {
              onCloseDialog: function () {
                that.byId("workflowRsltDialog").close();
              },
            };
            // load asynchronous XML fragment
            Fragment.load({
              id: that.getView().getId(),
              name: "com.idocmanagerui01.view.fragment.WorkflowResult",
              controller: oFragmentController,
            }).then(function (oDialog) {
              // connect dialog to the root view of this component (models, lifecycle)
              that.getView().addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this.byId("workflowRsltDialog").open();
          }
          sap.ui.core.BusyIndicator.hide();
        },
        //*******************************************************************************
        //Workflow process End
        //*********************************************************************************

        //*******************************************************************************
        //Mass Edit
        //*********************************************************************************
        onOpenMultiEdit: function (oEvent) {
          // The source is the list item that got pressed
          this._showMassEdit(oEvent.getSource());
          this._disableToolbarBtn();
        },

        //*******************************************************************************
        //Mass Edit End
        //*********************************************************************************
        //*******************************************************************************
        //Process idocs
        //*********************************************************************************
        onOpenProcess: function () {
          var that = this;

          //console.log("idoc no", this._mIdocNumber);
          var processPara = {};
          for (var mIdoc = 0; mIdoc < this._mIdocNumber.length; mIdoc++) {
            processPara = {};
            processPara.Idoc_Number = that._mIdocNumber[mIdoc];
            //console.log("processPara", processPara);
            this.processCreation(processPara, mIdoc);
          }
          //Disable toolbar buttons and remove table selection
          this._disableToolbarBtn();
        },
        processCreation: function (mProcessPara, mIdocIndex) {
          //Fetch Token
          const that = this;
          $.ajax({
            url: "/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/Total_idocsSet",
            type: "GET",
            headers: { "x-CSRF-Token": "Fetch" },
          }).always(function (data, status, response) {
            that.csrfToken = response.getResponseHeader("x-CSRF-Token");
            const sPostProcessUrl =
              "/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/Process_IdocsSet";
            const oWhenCallReadIsDone = Rest.ajaxCall(
              "POST",
              sPostProcessUrl,
              mProcessPara,
              "",
              that.csrfToken
            );
            oWhenCallReadIsDone.then(
              (resolvedData) => {
                that._mResponse[that._mIdocIndex] = resolvedData.d;
                if (that._mIdocNumber.length == that._mIdocIndex + 1) {
                  const _processModel = new JSONModel();
                  // const _aProcessResult = [];
                  // _aProcessResult.push(resolvedData.d.results);
                  _processModel.setData(that._mResponse);
                  that.setModel(_processModel, "processRespModel");
                  that.showProcessResultDialog();
                } else {
                  that._mIdocIndex = that._mIdocIndex + 1;
                }
                that.getView().setBusy(false);
              },
              (rejectedData) => {
                that.getView().setBusy(false);
                MessageBox.error(rejectedData.error.message);
              }
            );
          });
          //End
        },
        showProcessResultDialog: function () {
          const that = this;
          sap.ui.core.BusyIndicator.show(0);
          // create dialog lazily
          if (!this.byId("processRsltDialog")) {
            const oFragmentController = {
              onCloseDialog: function () {
                that.byId("processRsltDialog").close();
              },
            };
            // load asynchronous XML fragment
            Fragment.load({
              id: that.getView().getId(),
              name: "com.idocmanagerui01.view.fragment.ProcessResult",
              controller: oFragmentController,
            }).then(function (oDialog) {
              // connect dialog to the root view of this component (models, lifecycle)
              that.getView().addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this.byId("processRsltDialog").open();
          }
          sap.ui.core.BusyIndicator.hide();
        },

        //
        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * On phones a additional history entry is created
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject: function (oItem) {
          //this.getGlobalModel().setProperty("/currentScreen", "idocitems");
          this.getRouter().navTo("idocitems", {
            //objectId: "0000000000528173"
            objectId: oItem
              .getBindingContext("idocOverviewModel")
              .getProperty("Idoc_number"),
          });
        },

        _showMassEdit: function (oItem) {
          this.getRouter().navTo("idocmassedit", {
            objectId: "",
          });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function (aTableSearchState) {
          var oTable = this.byId("toTable"),
            oViewModel = this.getModel("worklistView");
          oTable.getBinding("items").filter(aTableSearchState, "Application");
          // changes the noDataText of the list in case there are no filter results
          if (aTableSearchState.length !== 0) {
            oViewModel.setProperty(
              "/tableNoDataText",
              this.getResourceBundle().getText("worklistNoDataWithSearchText")
            );
          }
        },

        /**
         * Displays an error message dialog. The displayed dialog is content density aware.
         * @param {string} sMsg The error message to be displayed
         * @private
         */
        // _showErrorMessage: function (sMsg) {
        // 	MessageBox.error(sMsg, {
        // 		styleClass: this.getOwnerComponent().getContentDensityClass()
        // 	});
        // },

        /**
         * Event handler when a filter tab gets pressed
         * @param {sap.ui.base.Event} oEvent the filter tab event
         * @public
         */
        onQuickFilter: function (oEvent) {
          var oBinding = this._oTable.getBinding("items"),
            sKey = oEvent.getParameter("selectedKey");
          oBinding.filter(this._mFilters[sKey]);
        },

        onDisplayNotFound: function () {
          //this.getGlobalModel().setProperty("/currentScreen", "idocitems");
          //display the "notFound" target without changing the hash
          this.getRouter().getTargets().display("notFound", {
            fromTarget: "TargetIdoc_Overview",
          });
        },
        onBeforeExport: function (oEvt) {
          var mExcelSettings = oEvt.getParameter("exportSettings");
          // Disable Worker as Mockserver is used in Demokit sample
          mExcelSettings.worker = false;
        },
        //*******************************************************************************
        onDataExport:
          sap.m.Table.prototype.exportData ||
          function () {
            var oModel = this.getOwnerComponent().getModel();

            var oExport = new Export({
              exportType: new ExportTypeCSV({
                fileExtension: "xls",
                separatorChar: "\t",
              }),

              models: oModel,

              rows: {
                path: "/Total_idocsSet",
                parameters: {
                  select: "Idoc_number",
                },
              },
              columns: [
                {
                  name: "IDoc Number",
                  template: {
                    content: "{Idoc_number}",
                  },
                },
                {
                  name: "Customer Name",
                  template: {
                    content: "{Customer_name}",
                  },
                },
                {
                  name: "Status",
                  template: {
                    content: "{Idoc_status}",
                  },
                },
                {
                  name: "PO Number",
                  template: {
                    content: "{PO_number}",
                  },
                },
                {
                  name: "Creation Date",
                  template: {
                    content: "{Creation_Date}",
                  },
                },
                {
                  name: "Description",
                  template: {
                    content: "{Description}",
                  },
                },
                {
                  name: "WF Status",
                  template: {
                    content: "{WF_status}",
                  },
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
      }
    );
  }
);
