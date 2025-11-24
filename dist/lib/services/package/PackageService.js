"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageService = void 0;
const package_1 = require("../../datatypes/package");
const json_stringify_deterministic_1 = __importDefault(require("json-stringify-deterministic"));
const sort_keys_recursive_1 = __importDefault(require("sort-keys-recursive"));
const interface_json_1 = __importDefault(require("./interface.json"));
const crypto_1 = __importDefault(require("crypto"));
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
class PackageService {
    constructor(ff) {
        this.initalized = false;
        this.handlers = new Map();
        /**
         * Initializes the service:
         * - Ensures the private package **datatype** exists (creates if missing).
         * - Ensures the **contract interface** and **contract API** exist (creates if missing).
         * - Registers blockchain **event listeners** for all interface events.
         *
         * Safe to call multiple times; subsequent calls will no-op.
         * @returns Resolves when initialization finishes.
         */
        this.initalize = async () => {
            if (!(await this.dataTypeExists())) {
                await this.createDataType();
            }
            await this.createContractInterface();
            await this.createContractAPI();
            await this.registerListner();
            this.initalized = true;
        };
        /**
         * Whether the service has completed initialization.
         * @returns `true` if initialized; otherwise `false`.
         */
        this.initialized = () => this.initalized;
        /**
         * Registers FireFly listeners for all events defined in `interface.json`,
         * and wires them to locally-registered handlers via {@link onEvent}.
         *
         * @remarks
         * Internal helper; not intended for direct use.
         */
        this.registerListner = async () => {
            const api = await this.getContractAPI();
            if (!api)
                return;
            interface_json_1.default.events.forEach(async (event) => {
                const existing = await this.ff.getContractAPIListeners(interface_json_1.default.name, event.name);
                if (existing.length)
                    return;
                await this.ff.createContractAPIListener(interface_json_1.default.name, event.name, {
                    event: { name: event.name },
                    name: `listen_${event.name}_events`,
                    topic: `ff_contractapi_${api.id}_events`,
                }, {
                    publish: true,
                    confirm: true,
                });
            });
            this.ff.listen({
                filter: { events: "blockchain_event" },
                options: { withData: true },
            }, async (_socket, event) => {
                const { blockchainEvent } = event;
                if (!blockchainEvent?.name)
                    return;
                const handlers = this.handlers.get(blockchainEvent.name);
                if (!handlers || handlers.length === 0)
                    return;
                handlers.forEach((handler) => {
                    handler({
                        output: blockchainEvent.output,
                        timestamp: blockchainEvent.timestamp,
                        txid: blockchainEvent.tx.blockchainId,
                    });
                });
            });
        };
        /**
         * Looks up the contract interface by name from FireFly.
         * @returns The interface (if found) or `null`.
         * @remarks Internal helper; not intended for direct use.
         */
        this.getContractInterface = async () => {
            const interfaces = await this.ff.getContractInterfaces({
                name: interface_json_1.default.name,
            });
            return interfaces[0] || null;
        };
        /**
         * Creates the contract interface in FireFly if it does not exist.
         * @remarks Internal helper; not intended for direct use.
         */
        this.createContractInterface = async () => {
            const exists = await this.ff.getContractInterfaces({
                name: interface_json_1.default.name,
            });
            if (exists.length)
                return;
            await this.ff.createContractInterface(interface_json_1.default, {
                publish: true,
                confirm: true,
            });
        };
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
        this.onEvent = async (eventName, handler) => {
            if (!this.handlers.has(eventName)) {
                this.handlers.set(eventName, []);
            }
            this.handlers.get(eventName)?.push(handler);
        };
        /**
         * Looks up the contract API by name from FireFly.
         * @returns The contract API (if found) or `null`.
         * @remarks Internal helper; not intended for direct use.
         */
        this.getContractAPI = async () => {
            const apis = await this.ff.getContractAPIs({
                name: interface_json_1.default.name,
            });
            return apis[0] || null;
        };
        /**
         * Creates the contract API in FireFly if it does not exist.
         * @remarks Internal helper; not intended for direct use.
         */
        this.createContractAPI = async () => {
            const contractInterface = await this.getContractInterface();
            const contractAPI = await this.getContractAPI();
            if (!contractInterface || contractAPI)
                return;
            this.ff.createContractAPI({
                interface: { id: contractInterface.id },
                location: { channel: "pm3", chaincode: contractInterface.name },
                name: contractInterface.name,
            });
        };
        /**
         * Creates the private package datatype (published+confirmed).
         * @returns The created datatype object from FireFly.
         * @remarks Internal helper; not intended for direct use.
         */
        this.createDataType = async () => {
            const payload = (0, package_1.packageDetailsDatatypePayload)();
            const dataType = await this.ff.createDatatype(payload, {
                publish: true,
                confirm: true,
            });
            return dataType;
        };
        /**
         * Checks whether the private package datatype already exists.
         * @returns `true` if it exists; otherwise `false`.
         * @remarks Internal helper; not exposed if `excludePrivate` is true.
         */
        this.dataTypeExists = async () => {
            const payload = (0, package_1.packageDetailsDatatypePayload)();
            const dataTypes = await this.ff.getDatatypes({
                name: payload.name,
                version: payload.version,
            });
            return dataTypes.length > 0;
        };
        /**
         * Retrieves the private package datatype from FireFly.
         * @throws If the datatype does not exist.
         * @returns The datatype object.
         */
        this.getDataType = async () => {
            if (!this.dataTypeExists()) {
                throw new Error("Data type does not exist");
            }
            const payload = (0, package_1.packageDetailsDatatypePayload)();
            const dataTypes = await this.ff.getDatatypes({
                name: payload.name,
                version: payload.version,
            });
            return dataTypes[0];
        };
        // -------------------------
        // Blockchain Queries
        // -------------------------
        /**
         * Reads a locally-cached FireFly data record by ID.
         * @param id FireFly data ID.
         * @returns The data record (if found) or `null` if missing/errored.
         */
        this.getLocalPackage = async (id) => {
            const res = await this.ff.getData(id);
            return res || null;
        };
        this.uploadPackage = async (pkg) => {
            const res = await this.ff.uploadData({
                datatype: {
                    name: package_1.PACKAGE_DETAILS_DT_NAME,
                    version: package_1.PACKAGE_DETAILS_DT_VERSION,
                },
                id: pkg.id,
                value: pkg,
            });
            return res;
        };
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
        this.createPackage = async (externalId, packageDetails, pii, salt, broadcast = true) => {
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "CreatePackage", {
                input: {
                    externalId,
                    salt,
                },
                options: {
                    transientMap: {
                        pii: JSON.stringify(pii),
                        packageDetails: JSON.stringify(packageDetails),
                    },
                },
            }, {
                publish: true,
                confirm: true,
            });
            if (!res.error && broadcast) {
                this.uploadPackage({ ...packageDetails, id: externalId });
            }
            return res;
        };
        /**
         * Updates the **status** of an existing package.
         * @param externalId Package external ID.
         * @param status New {@link Status}.
         * @returns FireFly invocation response.
         */
        this.updatePackageStatus = async (externalId, status) => {
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "UpdatePackageStatus", {
                input: { externalId, status },
            }, { confirm: true, publish: true });
            return res;
        };
        /**
         * Reads the public, on-chain package record.
         * @param externalId Package external ID.
         * @returns The {@link BlockchainPackage}.
         */
        this.readBlockchainPackage = async (externalId) => {
            const res = await this.ff.queryContractAPI(interface_json_1.default.name, "ReadBlockchainPackage", {
                input: { externalId },
            }, { confirm: true, publish: true });
            return res;
        };
        /**
         * Reads the **private** package details and PII visible to the caller’s org.
         * @param externalId Package external ID.
         * @returns Implementation-specific object with details + PII.
         */
        this.readPackageDetailsAndPII = async (externalId) => {
            const res = await this.ff.queryContractAPI(interface_json_1.default.name, "ReadPackageDetailsAndPII", {
                input: { externalId },
            }, { confirm: true, publish: true });
            return res;
        };
        /**
         * Deletes a package from the ledger. You can only delete packages that you own and that are in a deletable state.
         * @param externalId Package external ID.
         * @returns FireFly invocation response.
         */
        this.deletePackage = async (externalId) => {
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "DeletePackage", {
                input: { externalId },
            }, { confirm: true, publish: true });
            return res;
        };
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
        this.proposeTransfer = async (externalId, toMSP, terms, expiryISO) => {
            const createdISO = new Date().toISOString();
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "ProposeTransfer", {
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
            }, { confirm: true, publish: true });
            return res;
        };
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
        this.acceptTransfer = async (externalId, termsId, packageDetails, pii, salt, privateTransferTerms) => {
            // hash the package details and PII to ensure integrity
            const packageDetailsAndPIIHash = crypto_1.default
                .createHash("sha256")
                .update((0, json_stringify_deterministic_1.default)((0, sort_keys_recursive_1.default)({ packageDetails, pii, salt })))
                .digest("hex");
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "AcceptTransfer", {
                input: { externalId, termsId, packageDetailsAndPIIHash },
                options: {
                    transientMap: {
                        privateTransferTerms: JSON.stringify(privateTransferTerms),
                    },
                },
            }, { confirm: true, publish: true });
            return res;
        };
        /**
         * Executes a confirmed transfer (finalization step).
         *
         * @param externalId Package external ID.
         * @param termsId Transfer terms ID.
         * @param storeObject The same data passed in CreatePackage, including salt, PII, and packageDetails. For integrity verification
         * and transfer of data to the new owner.
         * @returns FireFly invocation response.
         */
        this.executeTransfer = async (externalId, termsId, storeObject) => {
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "ExecuteTransfer", {
                input: { externalId, termsId },
                options: {
                    transientMap: {
                        storeObject: JSON.stringify(storeObject),
                    },
                },
            }, { confirm: true, publish: true });
            return res;
        };
        this.ff = ff;
    }
}
exports.PackageService = PackageService;
//# sourceMappingURL=PackageService.js.map