"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageDetailsDatatypePayload = exports.PackageDetailsSchema2020 = exports.PACKAGE_DETAILS_DT_VERSION = exports.PACKAGE_DETAILS_DT_NAME = void 0;
exports.PACKAGE_DETAILS_DT_NAME = "PackageDetails";
exports.PACKAGE_DETAILS_DT_VERSION = "1.0.0";
exports.PackageDetailsSchema2020 = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `ff://default/${exports.PACKAGE_DETAILS_DT_NAME}/${exports.PACKAGE_DETAILS_DT_VERSION}`,
    title: "PackageDetails",
    type: "object",
    properties: {
        id: { type: "string" },
        pickupLocation: { $ref: "#/definitions/Location" },
        dropLocation: { $ref: "#/definitions/Location" },
        size: { $ref: "#/definitions/Size" },
        weightKg: { type: "number" },
        urgency: { $ref: "#/definitions/Urgency" },
    },
    required: [
        "id",
        "pickupLocation",
        "dropLocation",
        "size",
        "weightKg",
        "urgency",
    ],
    additionalProperties: false,
    definitions: {
        Location: {
            type: "object",
            properties: {
                address: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
            },
            required: ["address", "lat", "lng"],
            additionalProperties: false,
        },
        Size: {
            type: "object",
            properties: {
                width: { type: "number" },
                height: { type: "number" },
                depth: { type: "number" },
            },
            required: ["width", "height", "depth"],
            additionalProperties: false,
        },
        Urgency: {
            type: "string",
            enum: ["high", "medium", "low", "none"],
        },
    },
};
const packageDetailsDatatypePayload = (namespace = "default") => ({
    name: exports.PACKAGE_DETAILS_DT_NAME,
    version: exports.PACKAGE_DETAILS_DT_VERSION,
    validator: "json",
    value: {
        ...exports.PackageDetailsSchema2020,
        $id: `ff://${namespace}/${exports.PACKAGE_DETAILS_DT_NAME}/${exports.PACKAGE_DETAILS_DT_VERSION}`,
    },
});
exports.packageDetailsDatatypePayload = packageDetailsDatatypePayload;
//# sourceMappingURL=package.js.map