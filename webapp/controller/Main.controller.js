sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageBox) => {
    "use strict";

    return Controller.extend("zbreeder.controller.Main", {
        onInit: function () {

            var sLocalModel = {
                Plant: "",
                Process: "",
                Description: ""
            };

            this.getOwnerComponent().getModel("localModel").setProperty("/", sLocalModel);

        },
        ongo: function (oEvent) {
            var slocal = this.getView().getModel("localModel").getData();
            if (slocal.Process === "") {
                MessageBox.error("Please enter process");
            } else {
                var aInitialFilters = [];
                aInitialFilters.push(new sap.ui.model.Filter("Brepro", sap.ui.model.FilterOperator.EQ, slocal.Process));
                this.onReadOData("/BREDEFSet", aInitialFilters, "doc").then((oresponse) => {
                });
            }
        },

        onCreate: function (oEvent) {
            var olocal = this.getOwnerComponent().getModel("localModel").getData();
            var oTable = this.byId("itemtable");
            var aSelectedItems = oTable.getSelectedItems();
            var opayload = {};
            if (aSelectedItems.length === 0) {
                sap.m.MessageToast.show("Please select at least one row.");
                return;
            }

            aSelectedItems.forEach(function (oItem) {
                var odoc = oItem.getBindingContext("doc").getObject();
                    opayload.Verid = odoc.Verid,
                    opayload.Aufnr = "",
                    opayload.Sttxt = "CRT",
                    opayload.Werks = olocal.Plant,
                    opayload.Auart = odoc.Auart,
                    opayload.Ktext = "Breeder Cleaning",
                    opayload.Brepro = "",
                    opayload.Matnr = odoc.Hmatnr,
                    // opayload.Matxt = odoc.,
                    opayload.Gamng = odoc.Gamng,
                    opayload.Gmein = odoc.Gmein,
                    opayload.Gstrp = odoc.Gstrp,//\/Date(1789516800000)\/,
                    opayload.Gltrp = odoc.Gltrp// "\/Date(1794268800000)\/
            });
            debugger;
            if (opayload !== "") {
                this.getView().getModel().create("/BREORDSet", opayload, {
                    success: function (oData) {
                        debugger;
                        var oarr = [];
                        oarr.push(oData);
                        this.getModel("planning").setProperty("/results",oarr);
                    }.bind(this),
                    error: function (oError) {
                        console.error(oError);
                    }.bind(this)
                });
            }
        },

        onGetOrders: function (oEvent) {
            var oTable = this.byId("itemtable");
            var aSelectedItems = oTable.getSelectedItems();
            var ofilter = [];
            if (aSelectedItems.length === 0) {
                sap.m.MessageToast.show("Please select at least one row.");
                return;
            }

            aSelectedItems.forEach(function (oItem) {
                var odoc = oItem.getBindingContext("doc").getObject();
                debugger;
                ofilter.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, odoc.Hmatnr));
                ofilter.push(new sap.ui.model.Filter("Auart", sap.ui.model.FilterOperator.EQ, odoc.Auart));
                ofilter.push(new sap.ui.model.Filter("Brepro", sap.ui.model.FilterOperator.EQ, odoc.Brepro));
                ofilter.push(new sap.ui.model.Filter("Verid", sap.ui.model.FilterOperator.EQ, odoc.Verid));
                ofilter.push(new sap.ui.model.Filter("Gstrp", sap.ui.model.FilterOperator.EQ, odoc.Gstrp));
                // ofilter.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, odoc.Hmatnr));
                // ofilter.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, odoc.Hmatnr));
            });
            if (ofilter.length > 0) {
                this.onReadOData("/BREORDSet", ofilter, "planning").then((oresponse) => {
                    if (oresponse.length === 0) {
                        sap.m.MessageToast.show("No Orders found");
                        return;
                    }
                });
            }
        },
        onTabSelect: function (oEvent) {

            var sKey = oEvent.getParameter("key");

            switch (sKey) {

                case "ALL":
                    // Show all records
                    break;

                case "OPEN":
                    // Show open records
                    break;

                case "COMPLETED":
                    // Show completed records
                    break;

                case "CANCELLED":
                    // Show cancelled records
                    break;
            }
        },
        onValueHelpRequest: function (oEvent) {
            var oInput = oEvent.getSource();
            var sBindingPath = oInput.getBindingPath("value");
            var sFieldName = sBindingPath.substring(1);

            // Fully updated F4 Mapping based on Excel Search Helps
            var oF4Mapping = {
                "Plant": { set: "/PlantsSet", key: "Werks", returnproperty: "Name1" },
                "Process": { set: "/BreprocSet", key: "Brepro", returnproperty: "Typname" }

            };

            var oConfig = oF4Mapping[sFieldName];
            if (!oConfig) {
                sap.m.MessageToast.show("Value help not mapped for field: " + sFieldName);
                return;
            }

            var oModel = this.getOwnerComponent().getModel();
            var oMetaModel = oModel.getMetaModel();

            // Briefly show a busy indicator on the input field while building the table
            oInput.setBusy(true);

            oMetaModel.loaded().then(function () {
                oInput.setBusy(false);

                // 1. Fetch metadata for this specific backend Entity Set
                var sEntitySetName = oConfig.set.substring(1);
                var oEntitySet = oMetaModel.getODataEntitySet(sEntitySetName);
                if (!oEntitySet) {
                    sap.m.MessageToast.show("No backend metadata found for " + sEntitySetName);
                    return;
                }

                var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
                var aColumns = [];
                var aCells = [];

                // 2. Dynamically create a Column and Cell for EVERY field Pravalika sends!
                oEntityType.property.forEach(function (oProp) {
                    // Uses the sap:label from ABAP if available, otherwise uses the raw property name
                    var sLabel = oProp["sap:label"] || oProp.name;
                    aColumns.push(new sap.m.Column({
                        header: new sap.m.Label({ text: sLabel })
                    }));
                    aCells.push(new sap.m.Text({ text: "{" + oProp.name + "}" }));
                });

                // 3. Create the robust Table Dialog
                var oTableSelectDialog = new sap.m.TableSelectDialog({
                    title: "Select " + sFieldName,
                    columns: aColumns,
                    search: function (oEvt) {
                        var sValue = oEvt.getParameter("value");
                        var oBinding = oEvt.getSource().getBinding("items");

                        // If search is cleared, remove all filters to show all data
                        if (!sValue) {
                            oBinding.filter([]);
                            return;
                        }

                        var aFilters = [];

                        // Dynamically build a "Contains" filter for EVERY String column
                        oEntityType.property.forEach(function (oProp) {
                            if (oProp.type === "Edm.String") {
                                aFilters.push(new sap.ui.model.Filter({
                                    path: oProp.name,
                                    operator: sap.ui.model.FilterOperator.Contains,
                                    value1: sValue
                                }));
                            }
                        });

                        // Combine all column filters with an "OR" condition
                        var oCombinedFilter = new sap.ui.model.Filter({
                            filters: aFilters,
                            and: false
                        });

                        oBinding.filter([oCombinedFilter]);
                    },
                    // --------------------------------

                    confirm: function (oEvt) {

                        var oSelectedItem = oEvt.getParameter("selectedItem");

                        if (oSelectedItem) {

                            var oObject = oSelectedItem.getBindingContext().getObject();
                            var sSelectedValue = oObject[oConfig.key];
                            var sSelectedValuedesc = oObject[oConfig.returnproperty];
                            this.getView().getModel("localModel").setProperty(sBindingPath, sSelectedValue);
                            this.getView().getModel("localModel").setProperty(sBindingPath + "Desc", sSelectedValuedesc);
                        }

                    }.bind(this)
                });

                oTableSelectDialog.setModel(oModel);

                var oTemplate = new sap.m.ColumnListItem({
                    cells: aCells
                });

                oTableSelectDialog.bindAggregation("items", {
                    path: oConfig.set,
                    template: oTemplate
                });

                this.getView().addDependent(oTableSelectDialog);
                oTableSelectDialog.open();

            }.bind(this)).catch(function () {
                oInput.setBusy(false);
                sap.m.MessageToast.show("Failed to load OData metadata.");
            });
        },

        onReadOData: function (sPath, oFilters, smodel) {
            var sPath = sPath;
            var oFilters = oFilters;

            return new Promise(function (resolve, reject) {
                var oModel = this.getOwnerComponent().getModel();
                oModel.read(sPath, {
                    filters: oFilters || [],
                    // urlParameters: {
                    //     "$expand": sexpand
                    // },
                    success: function (oData) {
                        this.getModel(smodel).setProperty("/results", oData.results);
                        resolve(oData.results);
                    }.bind(this),
                    error: function (oError) {
                        var oMsg = JSON.parse(oError.responseText);
                        resolve("E-" + oMsg.error.message.value);
                    }.bind(this)
                });
            }.bind(this));
        },
        getModel: function (e) {
            return this.getView().getModel(e)
        },
        setModel: function (e, t) {
            return this.getView().setModel(e, t)
        },
        showBusy: function (bBusy) {
            if (bBusy) {
                sap.ui.core.BusyIndicator.show(0);
            } else {
                sap.ui.core.BusyIndicator.hide();
            }
        },
        getText: function (sProperty, aArgs) {
            if (!this._oResourceBundle) {
                this._oResourceBundle = this.getModel("i18n").getResourceBundle();
            }
            return this._oResourceBundle.getText(sProperty, aArgs);
        },

        getResourceBundle: function (sText) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle()
        },

    });
});