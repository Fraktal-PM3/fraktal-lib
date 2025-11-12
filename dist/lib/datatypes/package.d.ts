import { FireFlyDatatypeRequest } from "@hyperledger/firefly-sdk";
export declare const PRIVATE_PACKAGE_DT_NAME = "PrivatePackage";
export declare const PRIVATE_PACKAGE_DT_VERSION = "1.0.0";
export declare const PrivatePackageSchema2020: {
    $schema: string;
    $id: string;
    title: string;
    type: string;
    properties: {
        id: {
            type: string;
        };
        pickupLocation: {
            $ref: string;
        };
        dropLocation: {
            $ref: string;
        };
        address: {
            type: string;
        };
        size: {
            $ref: string;
        };
        weightKg: {
            type: string;
        };
        urgency: {
            $ref: string;
        };
    };
    required: string[];
    additionalProperties: boolean;
    definitions: {
        Location: {
            type: string;
            properties: {
                name: {
                    type: string;
                };
                address: {
                    type: string;
                };
                lat: {
                    type: string;
                };
                lng: {
                    type: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
        Size: {
            type: string;
            properties: {
                width: {
                    type: string;
                };
                height: {
                    type: string;
                };
                depth: {
                    type: string;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
        Urgency: {
            type: string;
            enum: string[];
        };
    };
};
export declare const privatePackageDatatypePayload: (namespace?: string) => FireFlyDatatypeRequest;
