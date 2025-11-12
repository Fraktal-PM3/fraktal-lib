import FireFly, { FireFlyContractInvokeResponse, FireFlyContractQueryResponse, FireFlyDataResponse, FireFlyDatatypeResponse } from "@hyperledger/firefly-sdk";
import { BlockchainPackage, PackageDetails, PackageDetailsWithId, PackagePII, Status, StoreObject } from "./types.common";
/**
 * High-level API for interacting with blockchain-based package management via Hyperledger FireFly.
 *
 * Responsibilities:
 * - Create and manage FireFly datatypes and contract APIs.
 * - Invoke smart contract functions for package lifecycle.
 * - Subscribe to blockchain events and dispatch them to registered handlers.
 *
 * @example Initalizing the Service
 * ```ts
 * import FireFly from "@hyperledger/firefly-sdk"
 * import { PackageService } from "fraktal-lib"
 *
 * const ff = new FireFly(/* ... *\/)
 * const svc = new PackageService(ff)
 * await svc.initalize()
 * ```
 *
 * @example Listening for Events
 * ```ts
 * await svc.onEvent("PackageCreated", (e) => {
 *   console.log("New package:", e.output, e.txid)
 * })
 * ```
 *
 * @example Creating a Package
 * ```ts
 * const packageDetails = { /* ... *\/ }
 * const pii = { name: "Alice" }
 * const salt = crypto.randomBytes(16).toString("hex")
 * await svc.createPackage("pkg123", packageDetails, pii, salt)
 * ```
 */
export declare class PackageService {
    private ff;
    private initalized;
    private handlers;
    constructor(ff: FireFly);
    /**
     * Initializes the service:
     * - Ensures the private package **datatype** exists (creates if missing).
     * - Ensures the **contract interface** and **contract API** exist (creates if missing).
     * - Registers blockchain **event listeners** for all interface events.
     *
     * Safe to call multiple times; subsequent calls will no-op.
     * @returns Resolves when initialization finishes.
     */
    initalize: () => Promise<void>;
    /**
     * Whether the service has completed initialization.
     * @returns `true` if initialized; otherwise `false`.
     */
    initialized: () => boolean;
    /**
     * Registers FireFly listeners for all events defined in `interface.json`,
     * and wires them to locally-registered handlers via {@link onEvent}.
     *
     * @remarks
     * Internal helper; not intended for direct use.
     */
    private registerListner;
    /**
     * Looks up the contract interface by name from FireFly.
     * @returns The interface (if found) or `null`.
     * @remarks Internal helper; not intended for direct use.
     */
    private getContractInterface;
    /**
     * Creates the contract interface in FireFly if it does not exist.
     * @remarks Internal helper; not intended for direct use.
     */
    private createContractInterface;
    /**
     * Registers a local handler for a blockchain event.
     *
     * @param eventName Name of the blockchain event (as defined in the contract interface).
     * @param handler Callback invoked for each event delivery.
     *
     * @example
     * ```ts
     * await svc.onEvent("PackageUpdated", (e) => {
     *   console.log(e.txid, e.timestamp, e.output)
     * })
     * ```
     */
    onEvent: (eventName: string, handler: (...args: any) => void) => Promise<void>;
    /**
     * Looks up the contract API by name from FireFly.
     * @returns The contract API (if found) or `null`.
     * @remarks Internal helper; not intended for direct use.
     */
    private getContractAPI;
    /**
     * Creates the contract API in FireFly if it does not exist.
     * @remarks Internal helper; not intended for direct use.
     */
    private createContractAPI;
    /**
     * Creates the private package datatype (published+confirmed).
     * @returns The created datatype object from FireFly.
     * @remarks Internal helper; not intended for direct use.
     */
    private createDataType;
    /**
     * Checks whether the private package datatype already exists.
     * @returns `true` if it exists; otherwise `false`.
     * @remarks Internal helper; not exposed if `excludePrivate` is true.
     */
    private dataTypeExists;
    /**
     * Retrieves the private package datatype from FireFly.
     * @throws If the datatype does not exist.
     * @returns The datatype object.
     */
    getDataType: () => Promise<FireFlyDatatypeResponse>;
    /**
     * Reads a locally-cached FireFly data record by ID.
     * @param id FireFly data ID.
     * @returns The data record (if found) or `null` if missing/errored.
     */
    getLocalPackage: (id: string) => Promise<FireFlyDataResponse | null>;
    uploadPackage: (pkg: PackageDetailsWithId) => Promise<Required<{
        blob?: {
            hash?: string;
            name?: string;
            path?: string;
            public?: string;
            size?: number;
        };
        created?: string;
        datatype?: {
            name?: string;
            version?: string;
        };
        hash?: string;
        id?: string;
        namespace?: string;
        public?: string;
        validator?: string;
        value?: any;
    }>>;
    /**
     * Creates a new package on-chain.
     *
     * @param externalId Unique external identifier for the package.
     * @param packageDetails Public package metadata (serialized into transient map).
     * @param pii Private identifiable information (serialized into transient map).
     * @param salt Random salt used for hashing private data elsewhere.
     * @param broadcast Whether to broadcast the transaction (default: `true`).
     * @returns FireFly invocation response (transaction submission).
     *
     * @example
     * ```ts
     * await svc.createPackage("pkg-001", details, { name: "Alice" }, saltHex);
     * ```
     */
    createPackage: (externalId: string, packageDetails: PackageDetails, pii: PackagePII, salt: string, broadcast?: boolean) => Promise<FireFlyContractInvokeResponse>;
    /**
     * Updates the **status** of an existing package.
     * @param externalId Package external ID.
     * @param status New {@link Status}.
     * @returns FireFly invocation response.
     */
    updatePackageStatus: (externalId: string, status: Status) => Promise<FireFlyContractInvokeResponse>;
    /**
     * Reads the public, on-chain package record.
     * @param externalId Package external ID.
     * @returns The {@link BlockchainPackage}.
     */
    readBlockchainPackage: (externalId: string) => Promise<BlockchainPackage>;
    /**
     * Reads the **private** package details and PII visible to the caller’s org.
     * @param externalId Package external ID.
     * @returns Implementation-specific object with details + PII.
     */
    readPackageDetailsAndPII: (externalId: string) => Promise<FireFlyContractQueryResponse>;
    /**
     * Deletes a package from the ledger. You can only delete packages that you own and that are in a deletable state.
     * @param externalId Package external ID.
     * @returns FireFly invocation response.
     */
    deletePackage: (externalId: string) => Promise<FireFlyContractInvokeResponse>;
    /**
     * Proposes a transfer to another organization.
     *
     * @param externalId Package external ID.
     * @param toMSP MSP ID of the recipient organization.
     * @param terms Proposed terms `{ id, price }`. The `price` is sent privately via `transientMap`.
     * @param expiryISO Optional ISO-8601 expiry time for the offer.
     * @returns FireFlyContractInvokeResponse.
     *
     * @example
     * ```ts
     * await svc.proposeTransfer("pkg-001", "Org2MSP", { id: "t-123", price: 42.5 });
     * ```
     */
    proposeTransfer: (externalId: string, toMSP: string, terms: {
        price: number;
        id: string;
    }, expiryISO?: string) => Promise<FireFlyContractInvokeResponse>;
    /**
     * Accepts a previously proposed transfer.
     *
     * Hashes `{ packageDetails, pii, salt }` using `sha256` (with deterministic
     * stringify and sorted keys) and submits the hash for integrity verification.
     *
     * @param externalId Package external ID.
     * @param termsId Identifier of the terms being accepted.
     * @param packageDetails Public package metadata used in integrity hash.
     * @param pii Private information used in integrity hash.
     * @param salt The same salt used/recorded off-chain for reproducible hashing.
     * @param privateTransferTerms Private fields (e.g., `price`) sent via `transientMap`.
     * @returns FireFly invocation response.
     */
    acceptTransfer: (externalId: string, termsId: string, packageDetails: PackageDetails, pii: PackagePII, salt: string, privateTransferTerms: {
        price: number;
    }) => Promise<FireFlyContractInvokeResponse>;
    /**
     * Executes a confirmed transfer (finalization step).
     *
     * @param externalId Package external ID.
     * @param termsId Transfer terms ID.
     * @param storeObject The same data passed in CreatePackage, including salt, PII, and packageDetails. For integrity verification
     * and transfer of data to the new owner.
     * @returns FireFly invocation response.
     */
    executeTransfer: (externalId: string, termsId: string, storeObject: StoreObject) => Promise<FireFlyContractInvokeResponse>;
}
