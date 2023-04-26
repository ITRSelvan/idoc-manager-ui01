/*global QUnit*/

sap.ui.define([
	"com/idoc-manager-ui01/controller/Idoc_Overview.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Idoc_Overview Controller");

	QUnit.test("I should test the Idoc_Overview controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
