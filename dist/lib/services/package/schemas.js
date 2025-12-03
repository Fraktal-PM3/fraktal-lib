"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePackageInputSchema = exports.TransferSchema = exports.PrivateTransferTermsSchema = exports.TransferTermsSchema = exports.BlockchainPackageSchema = exports.StoreObjectSchema = exports.PackagePIISchema = exports.PackageDetailsSchema = exports.TransferStatusSchema = exports.StatusSchema = exports.UrgencySchema = exports.LocationSchema = exports.SizeSchema = void 0;
const zod_1 = require("zod");
/**
 * Validates that a string is a valid UUID v4.
 */
const UuidSchema = zod_1.z
    .string()
    .uuid("Invalid UUID format");
/**
 * Validates size dimensions.
 */
exports.SizeSchema = zod_1.z
    .object({
    width: zod_1.z.number().positive("Width must be positive"),
    height: zod_1.z.number().positive("Height must be positive"),
    depth: zod_1.z.number().positive("Depth must be positive"),
})
    .strict();
/**
 * Validates a location with address and optional coordinates.
 */
exports.LocationSchema = zod_1.z
    .object({
    address: zod_1.z.string().min(1, "Address cannot be empty"),
    lat: zod_1.z.number().optional(),
    lng: zod_1.z.number().optional(),
})
    .strict();
/**
 * Validates urgency enum values.
 */
exports.UrgencySchema = zod_1.z.enum(["high", "medium", "low", "none"]);
/**
 * Validates status enum values.
 */
exports.StatusSchema = zod_1.z.enum([
    "pending",
    "proposed",
    "ready_for_pickup",
    "picked_up",
    "in_transit",
    "delivered",
    "succeeded",
    "failed",
]);
/**
 * Validates transfer status enum values.
 */
exports.TransferStatusSchema = zod_1.z.enum([
    "proposed",
    "accepted",
    "executed",
    "cancelled",
    "rejected",
    "expired",
]);
/**
 * Validates package details (public, sharable information).
 */
exports.PackageDetailsSchema = zod_1.z
    .object({
    pickupLocation: exports.LocationSchema,
    dropLocation: exports.LocationSchema,
    size: exports.SizeSchema,
    weightKg: zod_1.z.number().positive("Weight must be positive"),
    urgency: exports.UrgencySchema,
})
    .strict();
/**
 * Validates PII data (flexible, untyped structure).
 */
exports.PackagePIISchema = zod_1.z.record(zod_1.z.string(), zod_1.z.any());
/**
 * Validates the complete store object for integrity verification.
 */
exports.StoreObjectSchema = zod_1.z.object({
    salt: zod_1.z.string().min(1, "Salt cannot be empty"),
    pii: exports.PackagePIISchema,
    packageDetails: exports.PackageDetailsSchema,
});
/**
 * Validates the blockchain package representation.
 */
exports.BlockchainPackageSchema = zod_1.z
    .object({
    externalId: UuidSchema,
    ownerOrgMSP: zod_1.z.string().min(1, "Owner MSP cannot be empty"),
    status: exports.StatusSchema,
    packageDetailsAndPIIHash: zod_1.z.string().min(1, "Hash cannot be empty"),
})
    .strict();
/**
 * Validates transfer terms (public).
 */
exports.TransferTermsSchema = zod_1.z
    .object({
    externalPackageId: UuidSchema,
    fromMSP: zod_1.z.string().min(1, "From MSP cannot be empty"),
    toMSP: zod_1.z.string().min(1, "To MSP cannot be empty"),
    createdISO: zod_1.z.string().datetime("Invalid ISO datetime format"),
    expiryISO: zod_1.z
        .string()
        .datetime("Invalid ISO datetime format")
        .optional()
        .nullable(),
})
    .strict();
/**
 * Validates private transfer terms.
 */
exports.PrivateTransferTermsSchema = zod_1.z
    .object({
    price: zod_1.z.number().nonnegative("Price cannot be negative"),
})
    .strict();
/**
 * Validates a complete transfer with terms and status.
 */
exports.TransferSchema = zod_1.z
    .object({
    terms: exports.TransferTermsSchema,
    status: exports.TransferStatusSchema,
    transferTermsHash: zod_1.z.string().min(1, "Hash cannot be empty"),
})
    .strict();
/**
 * Validates input for package creation.
 * Ensures externalId matches the UUID format.
 */
exports.CreatePackageInputSchema = zod_1.z.object({
    externalId: UuidSchema,
    packageDetails: exports.PackageDetailsSchema,
    pii: exports.PackagePIISchema,
    salt: zod_1.z.string().min(1, "Salt cannot be empty"),
});
//# sourceMappingURL=schemas.js.map