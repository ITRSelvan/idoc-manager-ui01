/* eslint-disable no-undef */
"use strict";
sap.ui.define([], function () {
    return {
        //This is a standalone controller for performing REST operations

        /**
         * Generic function to call backend service
         * @public
         * @param {String} sMethod - HTTP Method to be called. Can be POST, GET, PUT, PATCH and DELETE
         * @param {String} sPath - Relative URL or URL to be called
         * @param {String} requestData - Payload
         * @param {String} sContentType - Media Content Type
         * @return {Object} A promise object with the request
         */
        ajaxCall: function (sMethod, sPath, requestData, sContentType, sHeaderToken) {
            let pPromise = {};
            const oHeaders = {"x-CSRF-Token" : sHeaderToken};
            switch (sMethod) {
                case "GET":
                    pPromise = new Promise(function (resolve, reject) {
                        $.ajax({
                            url: sPath,
                            type: sMethod,
                            async: true,
            	            dataType: "json",
            	            contentType: "application/json; charset=utf-8",
                            success: function (oData) {
                                const oResponse = oData;
                                resolve(oResponse);
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                    break;
                case "POST":
                        pPromise = new Promise(function (resolve, reject) {
                            $.ajax({
                                url: sPath,
                                type: sMethod,
                                headers: oHeaders,
                                data: JSON.stringify(requestData),
                                dataType: "json",
                                contentType: "application/json; charset=utf-8",
                                success: function (oData) {
                                    const oResponse = oData;
                                    resolve(oResponse);
                                },
                                error: function (oError) {
                                    reject(oError);
                                }
                            });
                        });
                    break;
                case "DELETE":
                    pPromise = new Promise(function (resolve, reject) {
                        $.ajax({
                            url: sPath,
                            type: sMethod,
                            headers: oHeaders,
                            success: function (success, statusText, jqXHR) {
                                const oResponse = success ? success : true;
                                resolve(oResponse);
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                    break;
                case "PUT":
                    pPromise = new Promise(function (resolve, reject) {
                        $.ajax({
                            url: sPath,
                            type: sMethod,
                            headers: oHeaders,
                            data: requestData,
                            contentType: sContentType,
                            processData: false,
                            success: function (oData) {
                                const oResponse = oData;
                                resolve(oResponse);
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                    break;
                case "PATCH":
                    pPromise = new Promise(function (resolve, reject) {
                        $.ajax({
                            url: sPath,
                            type: sMethod,
                            headers: oHeaders,
                            data: JSON.stringify(requestData),
                            contentType: "application/json",
                            success: function (oData) {
                                const oResponse = oData;
                                resolve(oResponse);
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                    break;
                default:
                    break;
            }
            return pPromise;
        }
    };
});
