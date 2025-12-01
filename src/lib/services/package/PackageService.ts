import FireFly, {
    FireFlyContractAPIResponse,
    FireFlyContractInterfaceResponse,
    FireFlyContractInvokeResponse,
    FireFlyContractQueryResponse,
    FireFlyDataResponse,
    FireFlyDatatypeResponse,
    FireFlyEventDelivery,
} from "@hyperledger/firefly-sdk"
import {
    PACKAGE_DETAILS_DT_NAME,
    PACKAGE_DETAILS_DT_VERSION,
    packageDetailsDatatypePayload,
    TRANSFER_OFFER_DT_NAME,
    TRANSFER_OFFER_DT_VERSION,
    transferOfferDatatypePayload,
} from "../../datatypes/package"
import contractInterface from "./interface.json"
import {
    AcceptTransferEvent,
    BlockchainEventDelivery,
    BlockchainPackage,
    CreatePackageEvent,
    DeletePackageEvent,
    FireFlyDatatypeMessage,
    PackageDetails,
    PackageDetailsWithId,
    PackageEventHandler,
    PackagePII,
    ProposeTransferEvent,
    Status,
    StatusUpdatedEvent,
    StoreObject,
    TransferExecutedEvent,
} from "./types.common"

/**
 * Type-safe event listener configuration mapping event names to their output types.
 * @internal
 */
type EventTypeMap = {
    CreatePackage: CreatePackageEvent
    StatusUpdated: StatusUpdatedEvent
    DeletePackage: DeletePackageEvent
    ProposeTransfer: ProposeTransferEvent
    AcceptTransfer: AcceptTransferEvent
    TransferExecuted: TransferExecutedEvent
}

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
export class PackageService {
    private ff: FireFly
    private initalized: boolean = false
    private handlers = new Map<string, PackageEventHandler[]>()

    constructor(ff: FireFly) {
        this.ff = ff
    }

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
    public initalize = async (): Promise<void> => {
        if (!(await this.dataTypeExists())) {
            await this.createDataType()
        }

        if (!(await this.transferOfferDataTypeExists())) {
            await this.createTransferOfferDataType()
        }

        await this.createContractInterface()
        await this.createContractAPI()
        await this.registerListner()

        this.initalized = true
    }

    /**
     * Whether the service has completed initialization.
     * @returns `true` if initialized; otherwise `false`.
     */
    public initialized = (): boolean => this.initalized

    /**
     * Registers FireFly listeners for all events defined in `interface.json`,
     * and wires them to locally-registered handlers via {@link onEvent}.
     *
     * @remarks
     * Internal helper; not intended for direct use.
     */
    private registerListner = async (): Promise<void> => {
        const api = await this.getContractAPI()
        if (!api) return

        contractInterface.events.forEach(async (event) => {
            const existing = await this.ff.getContractAPIListeners(
                contractInterface.name,
                event.name,
            )
            if (existing.length) return
            await this.ff.createContractAPIListener(
                contractInterface.name,
                event.name,
                {
                    event: { name: event.name },
                    name: `listen_${event.name}_events`,
                    topic: `ff_contractapi_${api.id}_events`,
                },
                {
                    publish: true,
                    confirm: true,
                },
            )
        })

        this.ff.listen(
            {
                filter: { events: "message_confirmed" },
                options: { withData: true },
            },
            async (_socket, event) => {
                // @ts-ignore
                const msg = event.message
                for (const d of msg.data) {
                    const full = await this.ff.getData(d.id)
                    if (full?.validator == "json") {
                        const messageData = {
                            ...full,
                            signingKey: msg.header.key,
                            author: msg.header.author,
                            header: msg.header,
                        }
                        // Dispatch to generic "message" handlers
                        this.handlers
                            .get("message")
                            ?.forEach((handler) => handler(messageData))
                        // Also attempt to dispatch to datatype-specific handlers
                        // by checking value structure to match registered datatype names
                    }
                }
            },
        )

        this.ff.listen(
            {
                filter: { events: "blockchain_event" },
                options: { withData: true },
            },
            async (_socket, event) => {
                const { blockchainEvent } = event as FireFlyEventDelivery
                if (!blockchainEvent?.name) return

                const handlers = this.handlers.get(blockchainEvent.name)
                if (!handlers || handlers.length === 0) return
                handlers.forEach((handler) => {
                    handler({
                        output: blockchainEvent.output,
                        timestamp: blockchainEvent.timestamp,
                        txid: blockchainEvent.tx.blockchainId,
                        header: {
                            key: "",
                            author: "",
                        },
                    })
                })
            },
        )
    }

    /**
     * Looks up the contract interface by name from FireFly.
     * @returns The interface (if found) or `null`.
     * @remarks Internal helper; not intended for direct use.
     */
    private getContractInterface =
        async (): Promise<FireFlyContractInterfaceResponse | null> => {
            const interfaces = await this.ff.getContractInterfaces({
                name: contractInterface.name,
            })
            return interfaces[0] || null
        }

    /**
     * Creates the contract interface in FireFly if it does not exist.
     * @remarks Internal helper; not intended for direct use.
     */
    private createContractInterface = async (): Promise<void> => {
        const exists = await this.ff.getContractInterfaces({
            name: contractInterface.name,
        })

        if (exists.length) return

        await this.ff.createContractInterface(contractInterface, {
            publish: true,
            confirm: true,
        })
    }

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

    // Overloads for type-safe blockchain event listeners
    public onEvent(
        eventName: "CreatePackage",
        handler: (
            event: BlockchainEventDelivery & { output: CreatePackageEvent },
        ) => void,
    ): Promise<void>

    public onEvent(
        eventName: "StatusUpdated",
        handler: (
            event: BlockchainEventDelivery & { output: StatusUpdatedEvent },
        ) => void,
    ): Promise<void>

    public onEvent(
        eventName: "DeletePackage",
        handler: (
            event: BlockchainEventDelivery & { output: DeletePackageEvent },
        ) => void,
    ): Promise<void>

    public onEvent(
        eventName: "ProposeTransfer",
        handler: (
            event: BlockchainEventDelivery & { output: ProposeTransferEvent },
        ) => void,
    ): Promise<void>

    public onEvent(
        eventName: "AcceptTransfer",
        handler: (
            event: BlockchainEventDelivery & { output: AcceptTransferEvent },
        ) => void,
    ): Promise<void>

    public onEvent(
        eventName: "TransferExecuted",
        handler: (
            event: BlockchainEventDelivery & { output: TransferExecutedEvent },
        ) => void,
    ): Promise<void>

    // Generic message event listener for FireFly datatype messages
    public onEvent(
        eventName: "message",
        handler: (event: FireFlyDatatypeMessage) => void,
    ): Promise<void>

    // Generic fallback for other event names
    public onEvent(
        eventName: string,
        handler: (
            event: BlockchainEventDelivery | FireFlyDatatypeMessage,
        ) => void,
    ): Promise<void>

    // Implementation - compatible with all overloads
    public async onEvent(
        eventName: string,
        handler: (event: any) => void,
    ): Promise<void> {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, [])
        }
        // Cast the handler to PackageEventHandler since it's compatible with both event types
        this.handlers
            .get(eventName)
            ?.push(handler as unknown as PackageEventHandler)
    }

    /**
     * Looks up the contract API by name from FireFly.
     * @returns The contract API (if found) or `null`.
     * @remarks Internal helper; not intended for direct use.
     */
    private getContractAPI =
        async (): Promise<FireFlyContractAPIResponse | null> => {
            const apis = await this.ff.getContractAPIs({
                name: contractInterface.name,
            })
            return apis[0] || null
        }

    /**
     * Creates the contract API in FireFly if it does not exist.
     * @remarks Internal helper; not intended for direct use.
     */
    private createContractAPI = async (): Promise<void> => {
        const contractInterface = await this.getContractInterface()
        const contractAPI = await this.getContractAPI()

        if (!contractInterface || contractAPI) return

        this.ff.createContractAPI({
            interface: { id: contractInterface.id },
            location: { channel: "pm3", chaincode: contractInterface.name },
            name: contractInterface.name,
        })
    }

    /**
     * Creates the private package datatype (published+confirmed).
     * @returns The created datatype object from FireFly.
     * @remarks Internal helper; not intended for direct use.
     */
    private createDataType = async (): Promise<FireFlyDatatypeResponse> => {
        const payload = packageDetailsDatatypePayload()
        const dataType = await this.ff.createDatatype(payload, {
            publish: true,
            confirm: true,
        })
        return dataType
    }

    /**
     * Checks whether the private package datatype already exists.
     * @returns `true` if it exists; otherwise `false`.
     * @remarks Internal helper; not exposed if `excludePrivate` is true.
     */
    private dataTypeExists = async (): Promise<boolean> => {
        const payload = packageDetailsDatatypePayload()
        const dataTypes = await this.ff.getDatatypes({
            name: payload.name,
            version: payload.version,
        })
        return dataTypes.length > 0
    }

    /**
     * Retrieves the private package datatype from FireFly.
     * @throws If the datatype does not exist.
     * @returns The datatype object.
     */
    public getDataType = async (): Promise<FireFlyDatatypeResponse> => {
        if (!this.dataTypeExists()) {
            throw new Error("Data type does not exist")
        }

        const payload = packageDetailsDatatypePayload()
        const dataTypes = await this.ff.getDatatypes({
            name: payload.name,
            version: payload.version,
        })
        return dataTypes[0]
    }

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
    private createTransferOfferDataType =
        async (): Promise<FireFlyDatatypeResponse> => {
            const payload = transferOfferDatatypePayload()
            const dataType = await this.ff.createDatatype(payload, {
                publish: true,
                confirm: true,
            })
            return dataType
        }
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
    public transferOfferDataTypeExists = async (): Promise<boolean> => {
        const dataTypes = await this.ff.getDatatypes({
            name: TRANSFER_OFFER_DT_NAME,
            version: TRANSFER_OFFER_DT_VERSION,
        })
        return dataTypes.length > 0
    }

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
    public getTransferOfferDataType =
        async (): Promise<FireFlyDatatypeResponse> => {
            if (!(await this.transferOfferDataTypeExists())) {
                throw new Error("Transfer Offer Data type does not exist")
            }

            const dataTypes = await this.ff.getDatatypes({
                name: TRANSFER_OFFER_DT_NAME,
                version: TRANSFER_OFFER_DT_VERSION,
            })
            return dataTypes[0]
        }

    // -------------------------
    // Blockchain Queries
    // -------------------------

    /**
     * Reads a locally-cached FireFly data record by ID.
     * @param id FireFly data ID.
     * @returns The data record (if found) or `null` if missing/errored.
     */
    public getLocalPackage = async (
        id: string,
    ): Promise<FireFlyDataResponse | null> => {
        const res = await this.ff.getData(id)
        return res || null
    }

    public uploadPackage = async (pkg: PackageDetailsWithId) => {
        const res = await this.ff.uploadData({
            datatype: {
                name: PACKAGE_DETAILS_DT_NAME,
                version: PACKAGE_DETAILS_DT_VERSION,
            },
            id: pkg.id,
            value: pkg,
        })
        return res
    }

    // -------------------------
    // Chaincode (contract) calls
    // -------------------------

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
    public createPackage = async (
        externalId: string,
        recipientOrgMSP: string,
        packageDetails: PackageDetails,
        pii: PackagePII,
        salt: string,
        broadcast = true,
    ): Promise<FireFlyContractInvokeResponse> => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "CreatePackage",
            {
                input: {
                    externalId,
                    recipientOrgMSP,
                },
                options: {
                    transientMap: {
                        pii: JSON.stringify(pii),
                        packageDetails: JSON.stringify(packageDetails),
                        salt: salt.toString(),
                    },
                },
            },
            {
                publish: true,
                confirm: true,
            },
        )

        if (!res.error && broadcast) {
            this.uploadPackage({ ...packageDetails, id: externalId })
        }

        return res
    }

    /**
     * Updates the **status** of an existing package.
     * @param externalId Package external ID.
     * @param status New {@link Status}.
     * @returns FireFly invocation response.
     */
    public updatePackageStatus = async (
        externalId: string,
        status: Status,
    ): Promise<FireFlyContractInvokeResponse> => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "UpdatePackageStatus",
            {
                input: { externalId, status },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Reads the public, on-chain package record.
     * @param externalId Package external ID.
     * @returns The {@link BlockchainPackage}.
     */
    public readBlockchainPackage = async (
        externalId: string,
    ): Promise<BlockchainPackage> => {
        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "ReadBlockchainPackage",
            {
                input: { externalId },
            },
            { confirm: true, publish: true },
        )

        return res as BlockchainPackage
    }

    /**
     * Checks if a package exists on-chain.
     * @param externalId Package external ID.
     * @returns `true` if the package exists; otherwise `false`.
     */
    public packageExists = async (externalId: string): Promise<boolean> => {
        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "PackageExists",
            {
                input: { externalId },
            },
            { confirm: true, publish: true },
        )

        return res as unknown as boolean
    }

    /**
     * Reads the **private** package details and PII visible to the caller’s org.
     * @param externalId Package external ID.
     * @returns Implementation-specific object with details + PII.
     */
    public readPackageDetailsAndPII = async (
        externalId: string,
    ): Promise<FireFlyContractQueryResponse> => {
        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "ReadPackageDetailsAndPII",
            {
                input: { externalId },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Deletes a package from the ledger. You can only delete packages that you own and that are in a deletable state.
     * @param externalId Package external ID.
     * @returns FireFly invocation response.
     */
    public deletePackage = async (
        externalId: string,
    ): Promise<FireFlyContractInvokeResponse> => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "DeletePackage",
            {
                input: { externalId },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Verifies that the private package details and PII hash matches the expected hash.
     * @param externalId Package external ID.
     * @param expectedHash Expected SHA256 hex hash.
     * @returns `true` if the hash matches; otherwise `false`.
     */
    public checkPackageDetailsAndPIIHash = async (
        externalId: string,
        expectedHash: string,
    ): Promise<boolean> => {
        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "CheckPackageDetailsAndPIIHash",
            {
                input: { externalId, expectedHash },
            },
            { confirm: true, publish: true },
        )

        return res as unknown as boolean
    }

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
    public proposeTransfer = async (
        externalId: string,
        toMSP: string,
        terms: { price: number; id: string },
        expiryISO?: string,
    ): Promise<FireFlyContractInvokeResponse> => {
        const createdISO = new Date().toISOString()

        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "ProposeTransfer",
            {
                input: {
                    externalId,
                    termsId: terms.id,
                    toMSP,
                    createdISO,
                    expiryISO,
                },
                options: {
                    transientMap: {
                        privateTransferTerms: JSON.stringify({
                            price: terms.price,
                        }),
                    },
                },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Reads the public transfer terms for a given terms ID.
     * @param termsId Transfer terms identifier.
     * @returns The transfer terms as a JSON string.
     */
    public readTransferTerms = async (
        termsId: string,
    ): Promise<FireFlyContractQueryResponse> => {
        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "ReadTransferTerms",
            {
                input: { termsId },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Reads the private transfer terms for a given terms ID.
     * Only the recipient organization (toMSP) can read their private terms.
     * @param termsId Transfer terms identifier.
     * @returns The private transfer terms as a JSON string.
     */
    public readPrivateTransferTerms = async (
        termsId: string,
    ): Promise<FireFlyContractQueryResponse> => {
        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "ReadPrivateTransferTerms",
            {
                input: { termsId },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Accepts a previously proposed transfer.
     *
     * The chaincode internally verifies the package details and PII hash
     * by calling CheckPackageDetailsAndPIIHash. The caller must provide
     * the private transfer terms via transient map for verification.
     *
     * @param externalId Package external ID.
     * @param termsId Identifier of the terms being accepted.
     * @param privateTransferTerms Private fields (e.g., `price`) sent via `transientMap`.
     * @returns FireFly invocation response.
     */
    public acceptTransfer = async (
        externalId: string,
        termsId: string,
        privateTransferTerms: { price: number },
    ) => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "AcceptTransfer",
            {
                input: { externalId, termsId },
                options: {
                    transientMap: {
                        privateTransferTerms:
                            JSON.stringify(privateTransferTerms),
                    },
                },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Executes a confirmed transfer (finalization step).
     *
     * @param externalId Package external ID.
     * @param termsId Transfer terms ID.
     * @param storeObject The same data passed in CreatePackage, including salt, PII, and packageDetails. For integrity verification
     * and transfer of data to the new owner.
     * @returns FireFly invocation response.
     */
    public executeTransfer = async (
        externalId: string,
        termsId: string,
        storeObject: StoreObject,
    ): Promise<FireFlyContractInvokeResponse> => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "ExecuteTransfer",
            {
                input: { externalId, termsId },
                options: {
                    transientMap: {
                        storeObject: JSON.stringify(storeObject),
                    },
                },
            },
            { confirm: true, publish: true },
        )
        return res
    }
}
