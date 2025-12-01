import FireFly, { FireFlyContractInvokeResponse } from "@hyperledger/firefly-sdk";
import { Permission } from "./types.common";
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
export default class RoleService {
    private ff;
    private initializedFlag;
    constructor(ff: FireFly);
    /**
     * Initializes the service:
     * - Ensures the **contract interface** exists (creates if missing).
     * - Ensures the **contract API** exists (creates if missing).
     *
     * Safe to call multiple times; subsequent calls will no-op.
     *
     * @param forceRecreate If true, deletes and recreates the interface and API
     */
    initialize: (forceRecreate?: boolean) => Promise<void>;
    /**
     * Whether the service has completed initialization.
     */
    initialized: () => boolean;
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
     * Get permissions for a specific identity identifier, or for the caller
     * if `identityIdentifier` is omitted.
     *
     * @param identityIdentifier Optional stable identity identifier used by the chaincode.
     * @returns An array of {@link Permission} values.
     */
    getPermissions: (identityIdentifier?: string) => Promise<Permission[]>;
    /**
     * Set explicit permissions for a target identity.
     *
     * Only callers from the PM3 MSP may update permissions (enforced by chaincode).
     *
     * @param targetIdentityIdentifier Stable identity identifier used by the chaincode.
     * @param permissions Array of {@link Permission} values to store.
     * @returns FireFly invocation response.
     */
    setPermissions: (targetIdentityIdentifier: string, permissions: Permission[]) => Promise<FireFlyContractInvokeResponse>;
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
    grantPermissionsToOrg: (targetMSP: string, permissions: Permission[]) => Promise<FireFlyContractInvokeResponse>;
    /**
     * Revoke all permissions from a target organization.
     * Only callers from the PM3 MSP may revoke permissions (enforced by chaincode).
     *
     * @param targetMSP Target organization's MSP ID
     * @returns FireFly invocation response.
     */
    revokePermissionsFromOrg: (targetMSP: string) => Promise<FireFlyContractInvokeResponse>;
    /**
     * Remove specific permissions from a target organization.
     * Only callers from the PM3 MSP may remove permissions (enforced by chaincode).
     *
     * @param targetMSP Target organization's MSP ID
     * @param permissions Array of {@link Permission} values to remove.
     * @returns FireFly invocation response.
     */
    removePermissionsFromOrg: (targetMSP: string, permissions: Permission[]) => Promise<FireFlyContractInvokeResponse>;
    /**
     * Get the caller's permissions from the blockchain.
     *
     * @returns An array of {@link Permission} values.
     */
    getCallerPermissions: () => Promise<Permission[]>;
    /**
     * Check whether the **caller** has the supplied permission.
     *
     * @param permission Permission to check.
     * @returns `true` if the caller has the permission; otherwise `false`.
     */
    hasPermission: (permission: Permission) => Promise<boolean>;
    /**
     * Get the caller's identity identifier.
     *
     * @returns The caller's identity identifier in format "MSPID"
     */
    getCallerIdentifier: () => Promise<string>;
}
