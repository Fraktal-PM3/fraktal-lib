export type Size = {
    width: number
    height: number
    depth: number
}

export type Location = {
    name: string
    address: string
    lat: number
    lng: number
}

export enum Urgency {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    NONE = "none",
}

export enum Status {
    PENDING = "pending",
    READY_FOR_PICKUP = "ready_for_pickup",
    PICKED_UP = "picked_up",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
}

export enum TransferStatus {
    PROPOSED = "proposed",
    ACCEPTED = "accepted",
    EXECUTED = "executed",
    CANCELLED = "cancelled",
    REJECTED = "rejected",
    EXPIRED = "expired",
}

export type Transfer = {
    terms: {
        proposalId: string
        pkgId: string
        fromMSP: string
        toMSP: string
        createdISO: string
        expiryISO: string | null | undefined
    }
    status: TransferStatus
    hash: string
}

export type PublicPackage = {
    id: string,
    status: Status,
    ownerOrgMSP: string,
    dataHash: string,
}

export type PrivatePackage = {
    pickupLocation: Location
    dropLocation: Location
    address: string
    size: Size
    weightKg: number
    urgency: Urgency
}

export type PrivatePackageWithId = PrivatePackage & { id: string }