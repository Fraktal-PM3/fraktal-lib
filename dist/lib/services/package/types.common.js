"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferStatus = exports.Status = exports.Urgency = void 0;
/**
 * How urgent a delivery is.
 */
var Urgency;
(function (Urgency) {
    /** Highest priority. */
    Urgency["HIGH"] = "high";
    /** Medium priority. */
    Urgency["MEDIUM"] = "medium";
    /** Low priority. */
    Urgency["LOW"] = "low";
    /** No urgency specified. */
    Urgency["NONE"] = "none";
})(Urgency || (exports.Urgency = Urgency = {}));
/**
 * Current lifecycle status of a package.
 */
var Status;
(function (Status) {
    /** Created but not yet ready for pickup. */
    Status["PENDING"] = "pending";
    /** Ready for pickup by the courier. */
    Status["READY_FOR_PICKUP"] = "ready_for_pickup";
    /** Courier has picked up the package. */
    Status["PICKED_UP"] = "picked_up";
    /** In transit between locations. */
    Status["IN_TRANSIT"] = "in_transit";
    /** Reached the drop location. */
    Status["DELIVERED"] = "delivered";
    /** Business process completed successfully. */
    Status["SUCCEEDED"] = "succeeded";
    /** Business process failed (irrecoverable). */
    Status["FAILED"] = "failed";
})(Status || (exports.Status = Status = {}));
/**
 * Status of a transfer proposal between organizations.
 */
var TransferStatus;
(function (TransferStatus) {
    /** Transfer has been proposed by the sender. */
    TransferStatus["PROPOSED"] = "proposed";
    /** Proposal accepted by the recipient. */
    TransferStatus["ACCEPTED"] = "accepted";
    /** Transfer finalized/executed on-chain. */
    TransferStatus["EXECUTED"] = "executed";
    /** Proposal was explicitly cancelled. */
    TransferStatus["CANCELLED"] = "cancelled";
    /** Proposal was explicitly rejected. */
    TransferStatus["REJECTED"] = "rejected";
    /** Proposal expired without action. */
    TransferStatus["EXPIRED"] = "expired";
})(TransferStatus || (exports.TransferStatus = TransferStatus = {}));
