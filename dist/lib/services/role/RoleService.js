"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const interface_json_1 = __importDefault(require("./interface.json"));
/**
 * High-level API for interacting with the RoleAuthContract via Hyperledger FireFly.
 *
 * Responsibilities:
 * - Ensure the FireFly contract **interface** and **contract API** exist.
 * - Provide convenient helpers for:
 *   - Reading permissions for an identity
 *   - Setting permissions for an identity
 *   - Checking if the caller has a specific permission
 *
 * @example Initializing the service
 * ```ts
 * import FireFly from "@hyperledger/firefly-sdk"
 * import RoleService from "fraktal-lib/dist/lib/services/role/RoleService"
 *
 * const ff = new FireFly(/* ... *\/)
 * const roleSvc = new RoleService(ff)
 * await roleSvc.initialize()
 * ```
 *
 * @example Setting permissions for an identity
 * ```ts
 * await roleSvc.setPermissions("did:example:alice", [
 *   "package:read",
 *   "transfer:propose",
 * ])
 * ```
 *
 * @example Checking caller permissions
 * ```ts
 * const canCreate = await roleSvc.hasPermission("package:create")
 * ```
 */
class RoleService {
    constructor(ff) {
        this.initializedFlag = false;
        /**
         * Initializes the service:
         * - Ensures the **contract interface** exists (creates if missing).
         * - Ensures the **contract API** exists (creates if missing).
         *
         * Safe to call multiple times; subsequent calls will no-op.
         *
         * @param forceRecreate If true, deletes and recreates the interface and API
         */
        this.initialize = async (forceRecreate = false) => {
            await this.createContractInterface();
            await this.createContractAPI();
            this.initializedFlag = true;
        };
        /**
         * Whether the service has completed initialization.
         */
        this.initialized = () => this.initializedFlag;
        // -------------------------------------------------------------------------
        // FireFly interface & API helpers
        // -------------------------------------------------------------------------
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
            const iface = await this.getContractInterface();
            const api = await this.getContractAPI();
            if (!iface || api)
                return;
            await this.ff.createContractAPI({
                interface: { id: iface.id },
                // NOTE: channel/chaincode must match your Fabric deployment
                location: { channel: "pm3", chaincode: "pm3roleauth" },
                name: iface.name,
            });
        };
        // -------------------------------------------------------------------------
        // Chaincode (contract) calls
        // -------------------------------------------------------------------------
        /**
         * Get permissions for a specific identity identifier, or for the caller
         * if `identityIdentifier` is omitted.
         *
         * @param identityIdentifier Optional stable identity identifier used by the chaincode.
         * @returns An array of {@link Permission} values.
         */
        this.getPermissions = async (identityIdentifier) => {
            const input = {};
            if (identityIdentifier) {
                input.identityIdentifier = identityIdentifier;
            }
            console.log(`[RoleService.getPermissions] Querying permissions for: ${identityIdentifier || "caller"}`);
            console.log(`[RoleService.getPermissions] Using contract API: ${interface_json_1.default.name}`);
            console.log(`[RoleService.getPermissions] Input:`, input);
            const res = (await this.ff.queryContractAPI(interface_json_1.default.name, "getPermissions", { input }, { confirm: true, publish: true }));
            console.log(`[RoleService.getPermissions] Raw response:`, res);
            console.log(`[RoleService.getPermissions] Response type:`, typeof res);
            // FireFly automatically deserializes the JSON response
            // The chaincode returns a JSON string, but FireFly parses it for us
            const raw = res;
            // If it's already an array, return it directly
            if (Array.isArray(raw)) {
                console.log(`[RoleService.getPermissions] Response is already an array:`, raw);
                return raw;
            }
            // If it's a string, try to parse it
            if (typeof raw === "string") {
                try {
                    const parsed = JSON.parse(raw);
                    console.log(`[RoleService.getPermissions] Parsed response:`, parsed);
                    if (!Array.isArray(parsed)) {
                        console.log(`[RoleService.getPermissions] Parsed response is not an array, returning empty array`);
                        return [];
                    }
                    return parsed;
                }
                catch (err) {
                    console.log(`[RoleService.getPermissions] Failed to parse response:`, err);
                    return [];
                }
            }
            console.log(`[RoleService.getPermissions] Unexpected response format, returning empty array`);
            return [];
        };
        /**
         * Set explicit permissions for a target identity.
         *
         * Only callers from the PM3 MSP may update permissions (enforced by chaincode).
         *
         * @param targetIdentityIdentifier Stable identity identifier used by the chaincode.
         * @param permissions Array of {@link Permission} values to store.
         * @returns FireFly invocation response.
         */
        this.setPermissions = async (targetIdentityIdentifier, permissions) => {
            console.log(`[RoleService.setPermissions] Setting permissions for: ${targetIdentityIdentifier}`);
            console.log(`[RoleService.setPermissions] Permissions:`, permissions);
            console.log(`[RoleService.setPermissions] Using contract API: ${interface_json_1.default.name}`);
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "setPermissions", {
                input: {
                    targetIdentityIdentifier,
                    permissionsJson: JSON.stringify(permissions),
                },
            }, { confirm: true, publish: true });
            console.log(`[RoleService.setPermissions] Response:`, res);
            return res;
        };
        /**
         * Grant specific permissions to a target organization.
         * Only callers from the PM3 MSP may grant permissions (enforced by chaincode).
         * This adds permissions to existing ones without removing any.
         *
         * @param targetMSP Target organization's MSP ID (e.g., "Org2MSP")
         * @param permissions Array of {@link Permission} values to grant (will be added to existing permissions).
         * @returns FireFly invocation response.
         *
         * @example
         * // Add package:create permission to Org2MSP
         * await roleSvc.grantPermissionsToOrg("Org2MSP", ["package:create"])
         */
        this.grantPermissionsToOrg = async (targetMSP, permissions) => {
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "grantPermissionsToOrg", {
                input: {
                    targetMSP,
                    permissionsJson: JSON.stringify(permissions),
                },
            }, { confirm: true, publish: true });
            return res;
        };
        /**
         * Revoke all permissions from a target organization.
         * Only callers from the PM3 MSP may revoke permissions (enforced by chaincode).
         *
         * @param targetMSP Target organization's MSP ID
         * @returns FireFly invocation response.
         */
        this.revokePermissionsFromOrg = async (targetMSP) => {
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "revokePermissionsFromOrg", {
                input: {
                    targetMSP,
                },
            }, { confirm: true, publish: true });
            return res;
        };
        /**
         * Remove specific permissions from a target organization.
         * Only callers from the PM3 MSP may remove permissions (enforced by chaincode).
         *
         * @param targetMSP Target organization's MSP ID
         * @param permissions Array of {@link Permission} values to remove.
         * @returns FireFly invocation response.
         */
        this.removePermissionsFromOrg = async (targetMSP, permissions) => {
            const res = await this.ff.invokeContractAPI(interface_json_1.default.name, "removePermissionsFromOrg", {
                input: {
                    targetMSP,
                    permissionsJson: JSON.stringify(permissions),
                },
            }, { confirm: true, publish: true });
            return res;
        };
        /**
         * Get the caller's permissions from the blockchain.
         *
         * @returns An array of {@link Permission} values.
         */
        this.getCallerPermissions = async () => {
            const res = (await this.ff.queryContractAPI(interface_json_1.default.name, "getCallerPermissions", { input: {} }, { confirm: true, publish: true }));
            const raw = res;
            if (!Array.isArray(raw))
                return [];
            return raw;
        };
        /**
         * Check whether the **caller** has the supplied permission.
         *
         * @param permission Permission to check.
         * @returns `true` if the caller has the permission; otherwise `false`.
         */
        this.hasPermission = async (permission) => {
            const res = await this.ff.queryContractAPI(interface_json_1.default.name, "callerHasPermission", {
                input: { permission },
            }, { confirm: true, publish: true });
            return res;
        };
        /**
         * Get the caller's identity identifier.
         *
         * @returns The caller's identity identifier in format "MSPID"
         */
        this.getCallerIdentifier = async () => {
            const res = await this.ff.queryContractAPI(interface_json_1.default.name, "getCallerIdentifier", { input: {} }, { confirm: true, publish: true });
            return res;
        };
        this.ff = ff;
    }
}
exports.default = RoleService;
//# sourceMappingURL=RoleService.js.map