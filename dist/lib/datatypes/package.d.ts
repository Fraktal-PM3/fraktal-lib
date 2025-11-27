import { FireFlyDatatypeRequest } from "@hyperledger/firefly-sdk";
export declare const PACKAGE_DETAILS_DT_NAME = "PackageDetails";
export declare const PACKAGE_DETAILS_DT_VERSION = "1.0.0";
export declare const PackageDetailsSchema2020: {
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
export declare const packageDetailsDatatypePayload: (namespace?: string) => FireFlyDatatypeRequest;
export declare const TRANSFER_OFFER_DT_NAME = "TransferOffer";
export declare const TRANSFER_OFFER_DT_VERSION = "1.0.0";
export declare const TransferOfferSchema2020: {
    $schema: string;
    $id: string;
    title: string;
    type: string;
    properties: {
        externalPackageId: {
            type: string;
        };
        termsId: {
            type: string;
        };
        fromMSP: {
            type: string;
        };
        toMSP: {
            type: string;
        };
        price: {
            type: string;
        };
        createdISO: {
            type: string;
        };
        expiryISO: {
            type: string[];
        };
    };
    required: string[];
    additionalProperties: boolean;
};
export declare const transferOfferDatatypePayload: (namespace?: string) => FireFlyDatatypeRequest;
