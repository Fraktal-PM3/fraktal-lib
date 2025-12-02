/**
 * Physical size of a package.
 */
export type Size = {
    /** Width in meters. */
    width: number
    /** Height in meters. */
    height: number
    /** Depth/length in meters. */
    depth: number
}

/**
 * A real-world location.
 */
export type Location = {
    /** Human-readable street address. */
    address: string
    /** Latitude in decimal degrees (WGS84). */
    lat?: number
    /** Longitude in decimal degrees (WGS84). */
    lng?: number
}

/**
 * How urgent a delivery is.
 */
export enum Urgency {
    /** Highest priority. */
    HIGH = "high",
    /** Medium priority. */
    MEDIUM = "medium",
    /** Low priority. */
    LOW = "low",
    /** No urgency specified. */
    NONE = "none",
}

/**
 * Current lifecycle status of a package.
 */
export enum Status {
    /** Created but not yet ready for pickup. */
    PENDING = "pending",
    /** Transfer has been proposed to another organization. */
    PROPOSED = "proposed",
    /** Ready for pickup by the courier. */
    READY_FOR_PICKUP = "ready_for_pickup",
    /** Courier has picked up the package. */
    PICKED_UP = "picked_up",
    /** In transit between locations. */
    IN_TRANSIT = "in_transit",
    /** Reached the drop location. */
    DELIVERED = "delivered",
    /** Business process completed successfully. */
    SUCCEEDED = "succeeded",
    /** Business process failed (irrecoverable). */
    FAILED = "failed",
}

/**
 * Status of a transfer proposal between organizations.
 */
export enum TransferStatus {
    /** Transfer has been proposed by the sender. */
    PROPOSED = "proposed",
    /** Proposal accepted by the recipient. */
    ACCEPTED = "accepted",
    /** Transfer finalized/executed on-chain. */
    EXECUTED = "executed",
    /** Proposal was explicitly cancelled. */
    CANCELLED = "cancelled",
    /** Proposal was explicitly rejected. */
    REJECTED = "rejected",
    /** Proposal expired without action. */
    EXPIRED = "expired",
}

/**
 * Arbitrary personally identifiable information attached to a package.
 * @remarks
 * This data is typically passed via transient/private channels.
 */
export type PackagePII = { [key: string]: any }

/**
 * Private terms for a transfer that should not be public on-chain.
 */
export type PrivateTransferTerms = {
    /** Random salt used for hashing private transfer terms for integrity verification. */
    salt: string
    /** Price to transfer ownership (currency/context external). */
    price: number
}

/**
 * Public transfer terms that identify the package and counterparties.
 */
export type TransferTerms = {
    /** External identifier of the package being transferred. */
    externalPackageId: string
    /** MSP/organization initiating the transfer. */
    fromMSP: string
    /** MSP/organization targeted to receive the package. */
    toMSP: string
    /** ISO-8601 creation timestamp of the proposal. */
    createdISO: string
    /**
     * Optional ISO-8601 expiry timestamp.
     * If `null`/`undefined`, the proposal does not expire automatically.
     */
    expiryISO: string | null | undefined
    /**
     * SHA256 hash of the private transfer terms.
     * Used to verify integrity without revealing private data publicly.
     */
    privateTermsHash: string
}

/**
 * A transfer instance and its state.
 */
export type Transfer = {
    /** Public terms for this transfer. */
    terms: TransferTerms
    /** Current {@link TransferStatus} of the transfer. */
    status: TransferStatus
    /**
     * Integrity hash of private terms or payloads associated with the transfer.
     * @remarks
     * Used to prove consistency without revealing private data publicly.
     */
    transferTermsHash: string
}

/**
 * Public package details that are safe to share on-chain.
 */
export type PackageDetails = {
    /** Pickup location. */
    pickupLocation: Location
    /** Drop/delivery location. */
    dropLocation: Location
    /** Physical dimensions (meters). */
    size: Size
    /** Weight in kilograms. */
    weightKg: number
    /** Delivery urgency. */
    urgency: Urgency
}

/**
 * Opaque object used to store private package data with integrity.
 * Typically sent through transient/private channels.
 */
export type StoreObject = {
    /**
     * Salt used when hashing {@link PackageDetails} and {@link PackagePII}
     * for integrity verification.
     */
    salt: string
    /** Private, personally identifiable information. */
    pii: PackagePII
    /** Public package details mirrored in private context for verification. */
    packageDetails: PackageDetails
}

/**
 * The on-chain/public representation of a package.
 */
export type BlockchainPackage = {
    /** External, business-level identifier. */
    externalId: string
    /** MSP/organization that currently owns the package. */
    ownerOrgMSP: string
    /** Current {@link Status}. */
    status: Status
    /**
     * Hash of the package details (and PII + salt).
     * @remarks
     * Enables integrity checks without disclosing private content.
     */
    packageDetailsAndPIIHash: string

    /* The org MSP that is the recipient of the package transfer */
    recipientOrgMSP: string
}

/**
 * Convenience type: public package details with a system-assigned identifier.
 */
export type PackageDetailsWithId = PackageDetails & { id: string }

/**
 * FireFly message header information.
 */
export type FireFlyMessageHeader = {
    /** Signing key ID used to sign this message. */
    key: string
    /** Author identity of the message sender. */
    author: string
    /** Additional header metadata. */
    [key: string]: any
}

/**
 * Generic FireFly datatype message event.
 * Represents a message that was confirmed on-chain with datatype information.
 */
export type FireFlyDatatypeMessage = {
    /** Unique message identifier. */
    id: string
    /** Message header with signing and author information. */
    header: FireFlyMessageHeader
    /** Validator type (typically "json"). */
    validator: string
    /** Namespace the message belongs to. */
    namespace: string
    /** Hash of the message content. */
    hash: string
    /** ISO-8601 timestamp when created. */
    created: string
    /** The parsed message value/payload. */
    value: any
    /** Signing key used for this message. */
    signingKey: string
    /** Author identity. */
    author: string
}

/**
 * Blockchain-emitted event with typed output.
 */
export type BlockchainEventDelivery = {
    /** Blockchain transaction ID. */
    txid?: string
    /** Event output/payload from the contract. */
    output: any
    /** ISO-8601 timestamp when the event was recorded. */
    timestamp: string
    /** Message header (always included). */
    header: FireFlyMessageHeader
}

/**
 * Callback signature for package-related blockchain events.
 */
export type PackageEventHandler = (
    res: BlockchainEventDelivery | FireFlyDatatypeMessage,
) => void

/**
 * Event emitted when a package is created.
 */
export type CreatePackageEvent = {
    /** External identifier of the created package. */
    externalId: string
    /** MSP/organization that owns the package. */
    ownerOrgMSP: string
    /** Initial status of the package. */
    status: Status
    /** Integrity hash of the package details and PII. */
    packageDetailsAndPIIHash: string
    /** Identity of the caller who created the package. */
    caller: string
}

/**
 * Event emitted when a package status changes.
 */
export type StatusUpdatedEvent = {
    /** External identifier of the package. */
    externalId: string
    /** New status of the package. */
    status: Status
    /** Identity of the caller who updated the status. */
    caller: string
}

/**
 * Event emitted when a package is deleted.
 */
export type DeletePackageEvent = {
    /** External identifier of the deleted package. */
    externalId: string
    /** Status of the package at deletion. */
    status: Status
    /** Identity of the caller who deleted the package. */
    caller: string
}

/**
 * Event emitted when a transfer is proposed.
 */
export type ProposeTransferEvent = {
    /** External identifier of the package being transferred. */
    externalId: string
    /** Identifier for this transfer proposal. */
    termsId: string
    /** Public transfer terms. */
    terms: {
        /** External identifier of the package (in transfer context). */
        extenalPackageId?: string
        /** MSP initiating the transfer. */
        fromMSP: string
        /** ISO-8601 creation timestamp. */
        createdISO: string
        /** MSP targeted to receive the package. */
        toMSP: string
        /** Optional ISO-8601 expiry timestamp. */
        expiryISO: string | null | undefined
    }
    /** Identity of the caller who proposed the transfer. */
    caller: string
}

/**
 * Event emitted when a transfer is accepted.
 */
export type AcceptTransferEvent = {
    /** External identifier of the package. */
    externalId: string
    /** Identifier for the accepted transfer proposal. */
    termsId: string
    /** Identity of the caller who accepted the transfer. */
    caller: string
}

/**
 * Event emitted when a transfer is executed (ownership transferred).
 */
export type TransferExecutedEvent = {
    /** External identifier of the package. */
    externalId: string
    /** Identifier for the executed transfer. */
    termsId: string
    /** MSP that is now the new owner of the package. */
    newOwner: string
    /** Identity of the caller who executed the transfer. */
    caller: string
}

/**
 * Type guard to check if a message is a PackageDetails datatype message.
 * @param msg The message to check.
 * @returns true if the message contains PackageDetails data.
 */
export function isPackageDetailsMessage(
    msg: FireFlyDatatypeMessage,
): msg is FireFlyDatatypeMessage & {
    value: PackageDetailsWithId
} {
    return (
        msg.validator === "json" &&
        typeof msg.value === "object" &&
        msg.value !== null &&
        "id" in msg.value &&
        "pickupLocation" in msg.value &&
        "dropLocation" in msg.value &&
        "size" in msg.value &&
        "weightKg" in msg.value &&
        "urgency" in msg.value
    )
}

/**
 * Transfer offer data structure for FireFly datatype messages.
 */
export type TransferOfferData = {
    /** External identifier of the package being transferred. */
    externalPackageId: string
    /** Identifier for this transfer proposal. */
    termsId: string
    /** MSP initiating the transfer. */
    fromMSP: string
    /** MSP targeted to receive the package. */
    toMSP: string
    /** Price for the transfer. */
    price: number
    /** ISO-8601 creation timestamp. */
    createdISO: string
    /** Optional ISO-8601 expiry timestamp. */
    expiryISO: string | null | undefined
}

/**
 * Type guard to check if a message is a TransferOffer datatype message.
 * @param msg The message to check.
 * @returns true if the message contains TransferOffer data.
 */
export function isTransferOfferMessage(
    msg: FireFlyDatatypeMessage,
): msg is FireFlyDatatypeMessage & {
    value: TransferOfferData
} {
    return (
        msg.validator === "json" &&
        typeof msg.value === "object" &&
        msg.value !== null &&
        "externalPackageId" in msg.value &&
        "termsId" in msg.value &&
        "fromMSP" in msg.value &&
        "toMSP" in msg.value &&
        "price" in msg.value &&
        "createdISO" in msg.value
    )
}
