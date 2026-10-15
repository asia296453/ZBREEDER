sap.ui.define([
    "sap/ui/core/UIComponent",
    "zbreeder/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("zbreeder.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
            this.setModel(new sap.ui.model.json.JSONModel,"localModel");
            this.setModel(new sap.ui.model.json.JSONModel,"doc");
            this.setModel(new sap.ui.model.json.JSONModel,"planning");
            this.setModel(new sap.ui.model.json.JSONModel,"operations");
        }
    });
});