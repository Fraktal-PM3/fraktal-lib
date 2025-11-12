"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privatePackageDatatypePayload = exports.PrivatePackageSchema2020 = exports.PRIVATE_PACKAGE_DT_VERSION = exports.PRIVATE_PACKAGE_DT_NAME = void 0;
exports.PRIVATE_PACKAGE_DT_NAME = "PrivatePackage";
exports.PRIVATE_PACKAGE_DT_VERSION = "1.0.0";
exports.PrivatePackageSchema2020 = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `ff://default/${exports.PRIVATE_PACKAGE_DT_NAME}/${exports.PRIVATE_PACKAGE_DT_VERSION}`,
    title: "PrivatePackage",
    type: "object",
    properties: {
        id: { type: "string" },
        pickupLocation: { $ref: "#/definitions/Location" },
        dropLocation: { $ref: "#/definitions/Location" },
        address: { type: "string" },
        size: { $ref: "#/definitions/Size" },
        weightKg: { type: "number" },
        urgency: { $ref: "#/definitions/Urgency" },
    },
    required: [
        "id",
        "pickupLocation",
        "dropLocation",
        "address",
        "size",
        "weightKg",
        "urgency",
    ],
    additionalProperties: false,
    definitions: {
        Location: {
            type: "object",
            properties: {
                name: { type: "string" },
                address: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
            },
            required: ["name", "address", "lat", "lng"],
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
const privatePackageDatatypePayload = (namespace = "default") => ({
    name: exports.PRIVATE_PACKAGE_DT_NAME,
    version: exports.PRIVATE_PACKAGE_DT_VERSION,
    validator: "json",
    value: {
        ...exports.PrivatePackageSchema2020,
        $id: `ff://${namespace}/${exports.PRIVATE_PACKAGE_DT_NAME}/${exports.PRIVATE_PACKAGE_DT_VERSION}`,
    },
});
exports.privatePackageDatatypePayload = privatePackageDatatypePayload;
//# sourceMappingURL=package.js.map