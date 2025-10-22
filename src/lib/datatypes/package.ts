import { FireFlyDatatypeRequest } from "@hyperledger/firefly-sdk"

export const PRIVATE_PACKAGE_DT_NAME = "PrivatePackage"
export const PRIVATE_PACKAGE_DT_VERSION = "1.0.0"

export const PrivatePackageSchema2020 = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `ff://default/${PRIVATE_PACKAGE_DT_NAME}/${PRIVATE_PACKAGE_DT_VERSION}`,
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
}

export const privatePackageDatatypePayload =(namespace = "default") : FireFlyDatatypeRequest => ({
    name: PRIVATE_PACKAGE_DT_NAME,
    version: PRIVATE_PACKAGE_DT_VERSION,
    validator: "json",
    value: {
        ...PrivatePackageSchema2020,
        $id: `ff://${namespace}/${PRIVATE_PACKAGE_DT_NAME}/${PRIVATE_PACKAGE_DT_VERSION}`,
    },
})
