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
    /** Transfer has been proposed. */
    PROPOSED = "proposed",
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
     * Hash of the package details (and possibly PII+salt, per implementation).
     * @remarks
     * Enables integrity checks without disclosing private content.
     */
    packageDetailsAndPIIHash: string
}

/**
 * Convenience type: public package details with a system-assigned identifier.
 */
export type PackageDetailsWithId = PackageDetails & { id: string }

/**
 * Callback signature for package-related blockchain events.
 */
export type PackageEventHandler = (
    /**
     * Event payload supplied by the listener layer.
     * - `txid`: Blockchain transaction identifier, if available.
     * - `output`: Contract-defined event output/payload.
     * - `timestamp`: ISO-8601 time the event was recorded.
     */
    res: { txid: string | undefined; output: any; timestamp: string },
) => void  