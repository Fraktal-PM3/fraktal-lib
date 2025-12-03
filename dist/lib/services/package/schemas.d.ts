import { z } from "zod";
/**
 * Validates size dimensions.
 */
export declare const SizeSchema: z.ZodObject<{
    width: z.ZodNumber;
    height: z.ZodNumber;
    depth: z.ZodNumber;
}, z.core.$strict>;
/**
 * Validates a location with address and optional coordinates.
 */
export declare const LocationSchema: z.ZodObject<{
    address: z.ZodString;
    lat: z.ZodOptional<z.ZodNumber>;
    lng: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
/**
 * Validates urgency enum values.
 */
export declare const UrgencySchema: z.ZodEnum<{
    high: "high";
    medium: "medium";
    low: "low";
    none: "none";
}>;
/**
 * Validates status enum values.
 */
export declare const StatusSchema: z.ZodEnum<{
    pending: "pending";
    proposed: "proposed";
    ready_for_pickup: "ready_for_pickup";
    picked_up: "picked_up";
    in_transit: "in_transit";
    delivered: "delivered";
    succeeded: "succeeded";
    failed: "failed";
}>;
/**
 * Validates transfer status enum values.
 */
export declare const TransferStatusSchema: z.ZodEnum<{
    proposed: "proposed";
    accepted: "accepted";
    executed: "executed";
    cancelled: "cancelled";
    rejected: "rejected";
    expired: "expired";
}>;
/**
 * Validates package details (public, sharable information).
 */
export declare const PackageDetailsSchema: z.ZodObject<{
    pickupLocation: z.ZodObject<{
        address: z.ZodString;
        lat: z.ZodOptional<z.ZodNumber>;
        lng: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    dropLocation: z.ZodObject<{
        address: z.ZodString;
        lat: z.ZodOptional<z.ZodNumber>;
        lng: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    size: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        depth: z.ZodNumber;
    }, z.core.$strict>;
    weightKg: z.ZodNumber;
    urgency: z.ZodEnum<{
        high: "high";
        medium: "medium";
        low: "low";
        none: "none";
    }>;
}, z.core.$strict>;
/**
 * Validates PII data (flexible, untyped structure).
 */
export declare const PackagePIISchema: z.ZodRecord<z.ZodString, z.ZodAny>;
/**
 * Validates the complete store object for integrity verification.
 */
export declare const StoreObjectSchema: z.ZodObject<{
    salt: z.ZodString;
    pii: z.ZodRecord<z.ZodString, z.ZodAny>;
    packageDetails: z.ZodObject<{
        pickupLocation: z.ZodObject<{
            address: z.ZodString;
            lat: z.ZodOptional<z.ZodNumber>;
            lng: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        dropLocation: z.ZodObject<{
            address: z.ZodString;
            lat: z.ZodOptional<z.ZodNumber>;
            lng: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        size: z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
            depth: z.ZodNumber;
        }, z.core.$strict>;
        weightKg: z.ZodNumber;
        urgency: z.ZodEnum<{
            high: "high";
            medium: "medium";
            low: "low";
            none: "none";
        }>;
    }, z.core.$strict>;
}, z.core.$strip>;
/**
 * Validates the blockchain package representation.
 */
export declare const BlockchainPackageSchema: z.ZodObject<{
    externalId: z.ZodString;
    ownerOrgMSP: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        proposed: "proposed";
        ready_for_pickup: "ready_for_pickup";
        picked_up: "picked_up";
        in_transit: "in_transit";
        delivered: "delivered";
        succeeded: "succeeded";
        failed: "failed";
    }>;
    packageDetailsAndPIIHash: z.ZodString;
}, z.core.$strict>;
/**
 * Validates transfer terms (public).
 */
export declare const TransferTermsSchema: z.ZodObject<{
    externalPackageId: z.ZodString;
    fromMSP: z.ZodString;
    toMSP: z.ZodString;
    createdISO: z.ZodString;
    expiryISO: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strict>;
/**
 * Validates private transfer terms.
 */
export declare const PrivateTransferTermsSchema: z.ZodObject<{
    price: z.ZodNumber;
}, z.core.$strict>;
/**
 * Validates a complete transfer with terms and status.
 */
export declare const TransferSchema: z.ZodObject<{
    terms: z.ZodObject<{
        externalPackageId: z.ZodString;
        fromMSP: z.ZodString;
        toMSP: z.ZodString;
        createdISO: z.ZodString;
        expiryISO: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strict>;
    status: z.ZodEnum<{
        proposed: "proposed";
        accepted: "accepted";
        executed: "executed";
        cancelled: "cancelled";
        rejected: "rejected";
        expired: "expired";
    }>;
    transferTermsHash: z.ZodString;
}, z.core.$strict>;
/**
 * Validates input for package creation.
 * Ensures externalId matches the UUID format.
 */
export declare const CreatePackageInputSchema: z.ZodObject<{
    externalId: z.ZodString;
    packageDetails: z.ZodObject<{
        pickupLocation: z.ZodObject<{
            address: z.ZodString;
            lat: z.ZodOptional<z.ZodNumber>;
            lng: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        dropLocation: z.ZodObject<{
            address: z.ZodString;
            lat: z.ZodOptional<z.ZodNumber>;
            lng: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        size: z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
            depth: z.ZodNumber;
        }, z.core.$strict>;
        weightKg: z.ZodNumber;
        urgency: z.ZodEnum<{
            high: "high";
            medium: "medium";
            low: "low";
            none: "none";
        }>;
    }, z.core.$strict>;
    pii: z.ZodRecord<z.ZodString, z.ZodAny>;
    salt: z.ZodString;
}, z.core.$strip>;
/**
 * Type inference for all schemas.
 */
export type Size = z.infer<typeof SizeSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Urgency = z.infer<typeof UrgencySchema>;
export type Status = z.infer<typeof StatusSchema>;
export type TransferStatus = z.infer<typeof TransferStatusSchema>;
export type PackageDetails = z.infer<typeof PackageDetailsSchema>;
export type PackagePII = z.infer<typeof PackagePIISchema>;
export type StoreObject = z.infer<typeof StoreObjectSchema>;
export type BlockchainPackage = z.infer<typeof BlockchainPackageSchema>;
export type TransferTerms = z.infer<typeof TransferTermsSchema>;
export type PrivateTransferTerms = z.infer<typeof PrivateTransferTermsSchema>;
export type Transfer = z.infer<typeof TransferSchema>;
export type CreatePackageInput = z.infer<typeof CreatePackageInputSchema>;
