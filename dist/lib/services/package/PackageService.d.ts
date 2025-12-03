import FireFly, { FireFlyContractInvokeResponse, FireFlyContractQueryResponse, FireFlyDataResponse, FireFlyDatatypeResponse } from "@hyperledger/firefly-sdk";
import { AcceptTransferEvent, BlockchainPackage, CreatePackageEvent, DeletePackageEvent, PackageDetails, PackageDetailsWithId, PackagePII, ProposeTransferEvent, Status, StatusUpdatedEvent, StoreObject, TransferExecutedEvent, TransferToPM3Event, FireFlyDatatypeMessage, BlockchainEventDelivery } from "./types.common";
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
 * await svc.onEvent("CreatePackage", (e) => {
 *   console.log("New package:", e.output.externalId, e.txid)
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
     * - Ensures the **transfer offer datatype** exists (creates if missing).
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
     * Registers a local handler for a blockchain event with type-safe casting.
     * Provides specific event types for known events, and a generic fallback for others.
     *
     * @param eventName Name of the blockchain event (as defined in the contract interface).
     * @param handler Callback invoked for each event delivery with properly typed event data.
     *
     * @example
     * ```ts
     * // Type-safe listener for CreatePackage event
     * await svc.onEvent("CreatePackage", (e) => {
     *   console.log(e.output.externalId, e.output.ownerOrgMSP)
     * })
     *
     * // Type-safe listener for StatusUpdated event
     * await svc.onEvent("StatusUpdated", (e) => {
     *   console.log(e.output.externalId, e.output.status)
     * })
     *
     * // Type-safe listener for ProposeTransfer event
     * await svc.onEvent("ProposeTransfer", (e) => {
     *   console.log(e.output.termsId, e.output.terms.fromMSP)
     * })
     * ```
     */
    onEvent(eventName: "CreatePackage", handler: (event: BlockchainEventDelivery & {
        output: CreatePackageEvent;
    }) => void): Promise<void>;
    onEvent(eventName: "StatusUpdated", handler: (event: BlockchainEventDelivery & {
        output: StatusUpdatedEvent;
    }) => void): Promise<void>;
    onEvent(eventName: "DeletePackage", handler: (event: BlockchainEventDelivery & {
        output: DeletePackageEvent;
    }) => void): Promise<void>;
    onEvent(eventName: "ProposeTransfer", handler: (event: BlockchainEventDelivery & {
        output: ProposeTransferEvent;
    }) => void): Promise<void>;
    onEvent(eventName: "AcceptTransfer", handler: (event: BlockchainEventDelivery & {
        output: AcceptTransferEvent;
    }) => void): Promise<void>;
    onEvent(eventName: "TransferExecuted", handler: (event: BlockchainEventDelivery & {
        output: TransferExecutedEvent;
    }) => void): Promise<void>;
    onEvent(eventName: "TransferToPM3", handler: (event: BlockchainEventDelivery & {
        output: TransferToPM3Event;
    }) => void): Promise<void>;
    onEvent(eventName: "message", handler: (event: FireFlyDatatypeMessage) => void): Promise<void>;
    onEvent(eventName: string, handler: (event: BlockchainEventDelivery | FireFlyDatatypeMessage) => void): Promise<void>;
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
     * Creates and registers the "transfer offer" datatype with the FireFly instance.
     *
     * This asynchronous private helper builds the datatype payload (via
     * transferOfferDatatypePayload()), then calls the FireFly client to create the
     * datatype with publishing enabled and confirmation awaited.
     *
     * @private
     * @async
     * @returns A promise that resolves to the FireFly datatype creation response
     *          (FireFlyDatatypeResponse) once the datatype has been published and
     *          confirmed.
     * @throws Will propagate any errors thrown by the payload builder or the FireFly
     *         client's createDatatype call (for example network errors or API
     *         validation failures).
     * @remarks The created datatype is published (publish: true) and the call waits
     *          for confirmation (confirm: true) before resolving.
     */
    private createTransferOfferDataType;
    /**
     * Determines whether the Transfer Offer data type (identified by TRANSFER_OFFER_DT_NAME and
     * TRANSFER_OFFER_DT_VERSION) is present in the data type registry.
     *
     * The method queries the underlying data-type service via `this.ff.getDatatypes(...)` and returns
     * true if at least one matching data type is returned.
     *
     * @returns A Promise that resolves to `true` if one or more matching data types exist, otherwise `false`.
     *
     * @throws Propagates any error thrown by `this.ff.getDatatypes`.
     */
    transferOfferDataTypeExists: () => Promise<boolean>;
    /**
     * Retrieve the Transfer Offer FireFly datatype.
     *
     * This method first verifies that the Transfer Offer datatype exists by calling
     * `transferOfferDataTypeExists()`. If the datatype is not present, it throws an Error.
     * If it exists, the method queries the FireFly client (`this.ff.getDatatypes`) for
     * datatypes matching the configured name and version and returns the first result.
     *
     * @throws {Error} If the Transfer Offer datatype does not exist.
     * @throws {Error} If the underlying FireFly client call (`this.ff.getDatatypes`) fails.
     * @returns {Promise<FireFlyDatatypeResponse>} A promise that resolves to the first matching FireFly datatype.
     */
    getTransferOfferDataType: () => Promise<FireFlyDatatypeResponse>;
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
    createPackage: (externalId: string, recipientOrgMSP: string, packageDetails: PackageDetails, pii: PackagePII, salt: string, broadcast?: boolean) => Promise<FireFlyContractInvokeResponse>;
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
     * Checks if a package exists on-chain.
     * @param externalId Package external ID.
     * @returns `true` if the package exists; otherwise `false`.
     */
    packageExists: (externalId: string) => Promise<boolean>;
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
     * Verifies that the private package details and PII hash matches the expected hash.
     * @param externalId Package external ID.
     * @param expectedHash Expected SHA256 hex hash.
     * @returns `true` if the hash matches; otherwise `false`.
     */
    checkPackageDetailsAndPIIHash: (externalId: string, expectedHash: string) => Promise<boolean>;
    /**
     * Proposes a transfer to another organization.
     *
     * @param externalId Package external ID.
     * @param toMSP MSP ID of the recipient organization.
     * @param terms Proposed terms `{ id, price, salt }`. The `price` and `salt` are sent privately via `transientMap`.
     * @param expiryISO Optional ISO-8601 expiry time for the offer.
     * @returns FireFlyContractInvokeResponse.
     *
     * @example
     * ```ts
     * const salt = crypto.randomBytes(16).toString("hex")
     * await svc.proposeTransfer("pkg-001", "Org2MSP", { id: "t-123", price: 42.5, salt });
     * ```
     */
    proposeTransfer: (externalId: string, toMSP: string, terms: {
        price: number;
        id: string;
        salt: string;
    }, expiryISO?: string) => Promise<FireFlyContractInvokeResponse>;
    /**
     * Reads the public transfer terms for a given terms ID.
     * @param termsId Transfer terms identifier.
     * @returns The transfer terms as a JSON string.
     */
    readTransferTerms: (termsId: string) => Promise<FireFlyContractQueryResponse>;
    /**
     * Reads the private transfer terms for a given terms ID.
     * Only the recipient organization (toMSP) can read their private terms.
     * @param termsId Transfer terms identifier.
     * @returns The private transfer terms as a JSON string.
     */
    readPrivateTransferTerms: (termsId: string) => Promise<FireFlyContractQueryResponse>;
    /**
     * Accepts a previously proposed transfer.
     *
     * The chaincode internally verifies the package details and PII hash
     * by calling CheckPackageDetailsAndPIIHash. The caller must provide
     * the private transfer terms via transient map for verification.
     *
     * @param externalId Package external ID.
     * @param termsId Identifier of the terms being accepted.
     * @param privateTransferTerms Private fields (e.g., `salt`, `price`) sent via `transientMap`.
     * @returns FireFly invocation response.
     */
    acceptTransfer: (externalId: string, termsId: string, privateTransferTerms: {
        salt: string;
        price: number;
    }) => Promise<Required<{
        created?: string;
        error?: string;
        id?: string;
        input?: any;
        namespace?: string;
        output?: any;
        plugin?: string;
        retry?: string;
        status?: string;
        tx?: string;
        type?: "blockchain_pin_batch" | "blockchain_network_action" | "blockchain_deploy" | "blockchain_invoke" | "sharedstorage_upload_batch" | "sharedstorage_upload_blob" | "sharedstorage_upload_value" | "sharedstorage_download_batch" | "sharedstorage_download_blob" | "dataexchange_send_batch" | "dataexchange_send_blob" | "token_create_pool" | "token_activate_pool" | "token_transfer" | "token_approval";
        updated?: string;
    }>>;
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
    /**
     * Transfers a package to PM3 (used for archiving or external transfers). The reciepient is always PM3. Additionally the package status must
     * be "Delivered" to be eligible for transfer to PM3 and the reciepint org must be the owner (and the one executing the transfer).
     * @param externalId Package external ID.
     * @returns FireFly invocation response.
     */
    transferToPM3: (externalId: string) => Promise<FireFlyContractInvokeResponse>;
}
