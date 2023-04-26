"use strict";
sap.ui.define([
	// eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
	"sap/ui/core/mvc/Controller",
	// eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
	"sap/ui/core/routing/History",
	// eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
	"sap/ui/core/UIComponent",
	// eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
	"sap/m/library",
	// eslint-disable-next-line @sap/ui5-jsdocs/check-jsdoc-param-type
	"sap/ui/model/resource/ResourceModel"
],
/**
 * @public
 * @param {sap.ui.core.mvc.Controller} Controller Controller
 * @param {sap.ui.core.routing.History} History History
 * @param {sap.ui.core.UIComponent} UIComponent UIComponent
 * @param {sap.m.library} library library
 * @param {sap.ui.model.resource.ResourceModel} ResourceModel ResourceModel
 * @returns {sap.ui.core.mvc.Controller} Controller
 */
function (Controller, History, UIComponent, library, ResourceModel) {
	return Controller.extend("com.idocmanagerui01.controller.BaseController", {
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		getGlobalModel: function () {
			return this.getOwnerComponent().getModel("globalProperties");
		},

		onNavBack: function () {
			let oHistory = "";
			let sPreviousHash = "";
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				//this.getGlobalModel().setProperty("/currentScreen", "overview");
				window.history.go(-1);
			} else {
				//this.getGlobalModel().setProperty("/currentScreen", "overview");
				this.getRouter().navTo("TargetIdoc_Overview", {}, true /*no history*/);
			}
		},
		//*************Custom Wrappers added by us
		//*****************************************

		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
	
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
	
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
	
		
		/**
		 * Convenience method for getting data binded to the view
		 * * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @returns {object} data from the model
		 */
		getModelData: function (oModel) {
			return this.getView().getModel(oModel).getData();
		},
		/**
		 * Convenience method to access i18n translated text
		 * @public
		 * @param {String} key - i18n key
		 * @param {String} args - Text arguments
		 * @return {String} Text
		 */
		getI18n: function (key, args = []) {
			return this.getResourceBundle().getText(key, args);
		},
		/**
		 * Convenience method to get global property
		 * @public
		 * @param {String} property Property Key
		 * @return {Object} Property Value
		 */
		getGlobalProperty: function (property) {
			return this.getGlobalModel().getProperty("/" + property + "");
		},
		/**
		 * Convenience method to set global property
		 * @public
		 * @param {string} property Property Key
		 * @param {string} sValue Property Value
		 */
		setGlobalProperty: function (property, sValue) {
			this.getGlobalModel().setProperty("/" + property + "", sValue);
		},
		getAJAXUrlPrefix: function() {
            return sap.ui.require.toUrl(this.getOwnerComponent().getManifestEntry("/sap.app/id").replaceAll(".", "/"));
			// return "";
        }
	

	});
});