import { FireFlyDatatypeRequest } from "@hyperledger/firefly-sdk"

export const PACKAGE_DETAILS_DT_NAME = "PackageDetails"
export const PACKAGE_DETAILS_DT_VERSION = "1.0.0"

export const PackageDetailsSchema2020 = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `ff://default/${PACKAGE_DETAILS_DT_NAME}/${PACKAGE_DETAILS_DT_VERSION}`,
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
            required: ["address"],
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

export const packageDetailsDatatypePayload =(namespace = "default") : FireFlyDatatypeRequest => ({
    name: PACKAGE_DETAILS_DT_NAME,
    version: PACKAGE_DETAILS_DT_VERSION,
    validator: "json",
    value: {
        ...PackageDetailsSchema2020,
        $id: `ff://${namespace}/${PACKAGE_DETAILS_DT_NAME}/${PACKAGE_DETAILS_DT_VERSION}`,
    },
})
