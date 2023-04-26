sap.ui.define(
  [
    "com/idocmanagerui01/controller/BaseController",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/model/json/JSONModel",
    "com/idocmanagerui01/lib/RestService",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/model/Filter",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/model/FilterOperator",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/ui/core/Fragment",
    // eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
    "sap/m/MessageBox",
  ],
  /**
   * @param {com.idocmanagerui01.controller.BaseController} BaseController Base Controller
   * @param {sap.ui.model.json.JSONModel} JSONModel JSON Model
   * @param {com.idocmanagerui01.lib.RestService} Rest Rest Service
   * @param {sap.m.Filter} Filter Filter
   * @param {sap.m.FilterOperator} FilterOperator FilterOperator
   * @param {sap.m.Fragment} Fragment Fragment
   * @param {sap.m.MessageBox} MessageBox Message Box
   * @returns {com.idocmanagerui01.controller.BaseController} Controller
   */
  function (
    BaseController,
    JSONModel,
    Rest,
    Filter,
    FilterOperator,
    Fragment,
    MessageBox
  ) {
    "use strict";

    return BaseController.extend(
      "com.idocmanagerui01.controller.Idoc_MassEdit",
      {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * @memberOf itr.poc2020.Idoc_Manager_01.view.Idoc_MassEdit
         */
        onInit: function () {
          this.segKey = "";
          this.subSegKey = "";
          this._mResponse = [];
          this._mIdocIndex = 0;
          this._mMassIndex = 0;
          this._mRespCnt = 0;
          this._mTotalReqst = 0;
          this._oRfModel = new JSONModel();
        },

        onBeforeRendering: function () {
          this.GetServerData();
        },

        GetServerData: function () {
          const that = this;
          this.getView().setBusy(true);
          const sGetIdocStatusUrl =
            '/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/Idoc_massSet?IDoc_Number=" "';
          const oWhenCallReadIsDone = Rest.ajaxCall("GET", sGetIdocStatusUrl);
          oWhenCallReadIsDone.then(
            (resolvedData) => {
              const _idocMassModel = new JSONModel();
              const _aIdocResult = [];
              _aIdocResult.push(resolvedData.d.results);
              _idocMassModel.setData(_aIdocResult[0]);
              this.setModel(_idocMassModel, "massEditModel");
              this.getView().setBusy(false);
              const segmentTable = [],
                subSegmentTable = [],
                fieldTable = [],
                tempObjTable = [],
                tempMasEdtDta = [];
              this._massEditData = [];
              let segCnt = 0,
                subSegCnt = 0,
                fieldCnt = 0;
              for (let inx = 0; inx <= _aIdocResult[0].length - 1; inx++) {
                tempObjTable[inx] = _aIdocResult[0][inx]; //sap.ui.getCore().getModel("massEditModel").getProperty(itemPath);
                if (
                  tempObjTable[inx].Segment !== "" &&
                  tempObjTable[inx].Sub_Segment === ""
                ) {
                  segmentTable[segCnt] = tempObjTable[inx]; //sap.ui.getCore().getModel("massEditModel").getProperty(itemPath);
                  segCnt++;
                } else if (
                  tempObjTable[inx].Segment !== "" &&
                  tempObjTable[inx].Sub_Segment !== "" &&
                  tempObjTable[inx].Field_values === ""
                ) {
                  subSegmentTable[subSegCnt] = tempObjTable[inx];
                  subSegCnt++;
                } else if (
                  tempObjTable[inx].Segment !== "" &&
                  tempObjTable[inx].Sub_Segment !== "" &&
                  tempObjTable[inx].Field_values !== ""
                ) {
                  fieldTable[fieldCnt] = tempObjTable[inx];
                  fieldCnt++;
                }
              }
              tempMasEdtDta.push({
                Field_values: "",
                Segment: "",
                Segment_desc: "",
                Sub_Segment: "",
                Sub_seg_desc: "",
                Segment_num: false,
              });
              this.getModel("massEditModel").setProperty(
                "/segment",
                segmentTable
              );
              this.getModel("massEditModel").setProperty(
                "/subsegment",
                subSegmentTable
              );
              this.getModel("massEditModel").setProperty(
                "/fieldvalue",
                fieldTable
              );
              this.getModel("massEditModel").setProperty(
                "/massEditRqst",
                tempMasEdtDta
              );
              //sap.ui.core.BusyIndicator.hide();
            },
            (rejectedData) => {
              MessageBox.error(rejectedData.error.message);
              this.getView().setBusy(false);
            }
          );
        },

        _newMassEditItem: function () {
          const tempMasEdtDta = [];
          tempMasEdtDta.push({
            Field_values: "",
            Segment: "",
            Segment_desc: "",
            Sub_Segment: "",
            Sub_seg_desc: "",
            Segment_num: false,
          });
          return tempMasEdtDta[0];
        },
        ///*
        //Events
        //*/
        onSegmentChange: function (oEvent) {
          sap.ui.core.BusyIndicator.show(0);

          const oTable = this.byId("tblMassEdit");
          //Get Table Index
          const iIndex = oEvent.getSource().getParent().getIndex(); //oTable.getSelectedIndex();
          const oBinding = oEvent
            .getSource()
            .getParent()
            .getCells()[1]
            .getBinding("items");
          const _oSelectValue = oTable
            .getContextByIndex(iIndex)
            .getModel()
            .getData().massEditRqst[iIndex];
          this.segKey = _oSelectValue["Segment"];

          //Filter for second dropdown based on first dropdown selected
          this._mComboFilters = {
            subSegment: [
              new Filter(
                "Segment",
                sap.ui.model.FilterOperator.EQ,
                this.segKey
              ),
            ],
          };

          oBinding.filter(this._mComboFilters["subSegment"]);
          sap.ui.core.BusyIndicator.hide();
        },
        onComSegmentChange: function (oEvent) {
          sap.ui.core.BusyIndicator.show(0);

          const oTable = this.byId("tblMassEdit");
          //Get Table Index
          const iIndex = oEvent.getSource().getParent().getIndex(); //oTable.getSelectedIndex();
          const oBinding = oEvent
            .getSource()
            .getParent()
            .getCells()[2]
            .getAggregation("content")[0]
            .getBinding("items");
          const _oSelectValue = oTable
            .getContextByIndex(iIndex)
            .getModel()
            .getData().massEditRqst[iIndex];
          this.subSegKey = _oSelectValue["Sub_Segment"];

          //Filter for second dropdown based on first dropdown selected
          this._mComboFilters = {
            subSegment: [
              new Filter(
                "Sub_Segment",
                sap.ui.model.FilterOperator.EQ,
                this.subSegKey
              ),
              new Filter(
                "Segment",
                sap.ui.model.FilterOperator.EQ,
                this.segKey
              ),
            ],
          };

          oBinding.filter(this._mComboFilters["subSegment"]);
          // var nameColumnTemplate;
          if (oBinding.aIndices.length === 0) {
            oEvent
              .getSource()
              .getParent()
              .getCells()[2]
              .getAggregation("content")[0]
              .setVisible(false);
            oEvent
              .getSource()
              .getParent()
              .getCells()[2]
              .getAggregation("content")[1]
              .setVisible(true);
          } else {
            oEvent
              .getSource()
              .getParent()
              .getCells()[2]
              .getAggregation("content")[0]
              .setVisible(true);
            oEvent
              .getSource()
              .getParent()
              .getCells()[2]
              .getAggregation("content")[1]
              .setVisible(false);
          }
          console.log("binding", oBinding);

          sap.ui.core.BusyIndicator.hide();
        },
        onAddNewClick: function (oEvent) {
          sap.ui.core.BusyIndicator.show(0);
          let _tempMassEdit = [];
          const len =
            this.getModel("massEditModel").getData().massEditRqst.length;
          _tempMassEdit.push({
            Field_values: "",
            Segment: "",
            Segment_desc: "",
            Sub_Segment: "",
            Sub_seg_desc: "",
            Segment_num: false,
          });
          this.getModel("massEditModel").setProperty(
            "/massEditRqst/" + len,
            _tempMassEdit[0]
          );
          const oTable = this.byId("tblMassEdit");
          //refresh table model to take effect
          //oTable.getContextByIndex(0).getModel().refresh(true);
          sap.ui.core.BusyIndicator.hide();
        },
        onDeleteRowClick: function (oEvent) {
          sap.ui.core.BusyIndicator.show(0);

          const oTable = this.byId("tblMassEdit");
          const iIndex = oEvent.getSource().getParent().getIndex(); //oTable.getSelectedIndex();
          if (iIndex !== 0) {
            this.getModel("massEditModel")
              .getData()
              .massEditRqst.splice(iIndex, 1); // just 1 entry to remove
            oTable.getContextByIndex(iIndex).getModel().refresh(true);
          } else {
            alert("This row can not be deleted!");
          }

          sap.ui.core.BusyIndicator.hide();
        },
        onCancelClick: function () {
          sap.ui.core.BusyIndicator.show(0);

          const oTable = this.byId("tblMassEdit");
          const oModel = this.getModel("massEditModel");
          for (let inx = 0; inx <= oModel.getData().length - 1; inx++) {
            oModel.getData().massEditRqst.splice(inx); // just 1 entry to remove
          }
          //Add one empty row
          this.onAddNewClick();
          //refresh table model to take effect
          //oTable.getContextByIndex(0).getModel().refresh(true);
        },
        onSaveClick: function () {
          let mGrpId = 0,
            mQualChk = "",
            mFields = "",
            mPreFields = "",
            mSegment = "",
            mField_value = "",
            mPreField_value = "",
            mSegment_num = "",
            mPreSegment_num = "";
          this._mIdocNumber = [];
          this._mMassEditModel =
            this.getModel("massEditModel").getData().massEditRqst;
          //get selected idoc number from global models
          this._mIdocNumber = this.getOwnerComponent()
            .getModel("globalProperties")
            .getProperty("/selIdocs");

          //Get total count for request
          this._mTotalReqst =
            this._mIdocNumber.length * this._mMassEditModel.length;

          //Create create parameter
          let mass_Upload = {};
          for (let mIdoc = 0; mIdoc < this._mIdocNumber.length; mIdoc++) {
            for (
              let mSegCnt = 0;
              mSegCnt < this._mMassEditModel.length;
              mSegCnt++
            ) {
              //Store table values to local variable
              mFields = this._mMassEditModel[mSegCnt]["Sub_Segment"];
              mSegment = this._mMassEditModel[mSegCnt]["Segment"];
              mField_value = this._mMassEditModel[mSegCnt]["Field_values"];
              //mSegment_num = this._mMassEditModel[mSegCnt]["Segment_num"];
              if (this._mMassEditModel[mSegCnt]["Segment_num"]) {
                mSegment_num = "X";
              } else {
                mSegment_num = "";
              }
              //Create Input Value
              mass_Upload = {};
              mass_Upload.Idoc_Number = this._mIdocNumber[mIdoc];
              mass_Upload.Idoc_type = "ORDERS05";
              mass_Upload.Segment = mSegment;
              //-------------------
              if (mQualChk === "") {
                mGrpId = mGrpId + 1;
                mass_Upload.Segment_num = mSegment_num;
                mass_Upload.Fields = mFields;
                mass_Upload.Field_values = mField_value;
              } else {
                mass_Upload.Segment_num = mPreSegment_num;
                mass_Upload.Fields = mPreFields + "," + mFields;
                mass_Upload.Field_values = mPreField_value + "," + mField_value;
              }
              // if (mFields !== "QUALF") {
              if (mSegment_num !== "X") {
                this.massUpload(mass_Upload, mGrpId);
                mQualChk = "";
                mSegment_num = "";
              } else {
                mQualChk = "Yes";
                mPreSegment_num = "X";
                mPreField_value = mField_value;
                mPreFields = mFields;
                //Less total request count
                this._mTotalReqst = this._mTotalReqst - 1;
              }
            }
          }
        },
        massUpload: function (mMass_Upload_Para, mIdocIndex) {
          //Fetch Token
          const that = this;
          that.getView().setBusy(true);
          $.ajax({
            url: "/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/Total_idocsSet",
            type: "GET",
            headers: { "x-CSRF-Token": "Fetch" },
          }).always(function (data, status, response) {
            that.csrfToken = response.getResponseHeader("x-CSRF-Token");
            const sPostMassUploadUrl =
              "/sap/opu/odata/sap/ZITR_IDM_GW_IDOC_SRV/mass_uploadSet";
            const oWhenCallReadIsDone = Rest.ajaxCall(
              "POST",
              sPostMassUploadUrl,
              mMass_Upload_Para,
              "",
              that.csrfToken
            );
            oWhenCallReadIsDone.then(
              (resolvedData) => {
                that._mResponse[that._mIdocIndex] = resolvedData.d;
                if (that._mIdocNumber.length == that._mIdocIndex + 1) {
                  const _massModel = new JSONModel();
                  _massModel.setData(that._mResponse);
                  that.setModel(_massModel, "massUploadRsltModel");
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
        },
        showWorkflowResultDialog: function () {
          const that = this;
          sap.ui.core.BusyIndicator.show(0);
          // create dialog lazily
          if (!this.byId("masseditRsltDialog")) {
            let oFragmentController = {
              onCloseDialog: function () {
                that.byId("masseditRsltDialog").close();
                that.onNavBack();
              },
            };
            // load asynchronous XML fragment
            Fragment.load({
              id: that.getView().getId(),
              name: "com.idocmanagerui01.view.fragment.MassEditResult",
              controller: oFragmentController,
            }).then(function (oDialog) {
              // connect dialog to the root view of this component (models, lifecycle)
              that.getView().addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this.byId("masseditRsltDialog").open();
          }
          sap.ui.core.BusyIndicator.hide();
        },
      }
    );
  }
);
