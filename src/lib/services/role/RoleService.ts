import FireFly, {
    FireFlyContractAPIResponse,
    FireFlyContractInterfaceResponse,
    FireFlyContractInvokeResponse,
    FireFlyContractQueryResponse,
} from "@hyperledger/firefly-sdk"
import contractInterface from "./interface.json"
import { Permission } from "./types.common"

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
    private ff: FireFly
    private initializedFlag = false

    constructor(ff: FireFly) {
        this.ff = ff
    }

    /**
     * Initializes the service:
     * - Ensures the **contract interface** exists (creates if missing).
     * - Ensures the **contract API** exists (creates if missing).
     *
     * Safe to call multiple times; subsequent calls will no-op.
     *
     * @param forceRecreate If true, deletes and recreates the interface and API
     */
    public initialize = async (
        forceRecreate: boolean = false,
    ): Promise<void> => {
        await this.createContractInterface()
        await this.createContractAPI()
        this.initializedFlag = true
    }

    /**
     * Whether the service has completed initialization.
     */
    public initialized = (): boolean => this.initializedFlag

    // -------------------------------------------------------------------------
    // FireFly interface & API helpers
    // -------------------------------------------------------------------------

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
        const iface = await this.getContractInterface()
        const api = await this.getContractAPI()

        if (!iface || api) return

        await this.ff.createContractAPI({
            interface: { id: iface.id },
            // NOTE: channel/chaincode must match your Fabric deployment
            location: { channel: "pm3", chaincode: "pm3roleauth" },
            name: iface.name,
        })
    }

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
    public getPermissions = async (
        identityIdentifier?: string,
    ): Promise<Permission[]> => {
        const input: Record<string, unknown> = {}
        if (identityIdentifier) {
            input.identityIdentifier = identityIdentifier
        }

        console.log(
            `[RoleService.getPermissions] Querying permissions for: ${identityIdentifier || "caller"}`,
        )
        console.log(
            `[RoleService.getPermissions] Using contract API: ${contractInterface.name}`,
        )
        console.log(`[RoleService.getPermissions] Input:`, input)

        const res = (await this.ff.queryContractAPI(
            contractInterface.name,
            "getPermissions",
            { input },
            { confirm: true, publish: true },
        )) as FireFlyContractQueryResponse

        console.log(`[RoleService.getPermissions] Raw response:`, res)
        console.log(`[RoleService.getPermissions] Response type:`, typeof res)

        // FireFly automatically deserializes the JSON response
        // The chaincode returns a JSON string, but FireFly parses it for us
        const raw = res as unknown

        // If it's already an array, return it directly
        if (Array.isArray(raw)) {
            console.log(
                `[RoleService.getPermissions] Response is already an array:`,
                raw,
            )
            return raw as Permission[]
        }

        // If it's a string, try to parse it
        if (typeof raw === "string") {
            try {
                const parsed = JSON.parse(raw) as unknown
                console.log(
                    `[RoleService.getPermissions] Parsed response:`,
                    parsed,
                )
                if (!Array.isArray(parsed)) {
                    console.log(
                        `[RoleService.getPermissions] Parsed response is not an array, returning empty array`,
                    )
                    return []
                }
                return parsed as Permission[]
            } catch (err) {
                console.log(
                    `[RoleService.getPermissions] Failed to parse response:`,
                    err,
                )
                return []
            }
        }

        console.log(
            `[RoleService.getPermissions] Unexpected response format, returning empty array`,
        )
        return []
    }

    /**
     * Set explicit permissions for a target identity.
     *
     * Only callers from the PM3 MSP may update permissions (enforced by chaincode).
     *
     * @param targetIdentityIdentifier Stable identity identifier used by the chaincode.
     * @param permissions Array of {@link Permission} values to store.
     * @returns FireFly invocation response.
     */
    public setPermissions = async (
        targetIdentityIdentifier: string,
        permissions: Permission[],
    ): Promise<FireFlyContractInvokeResponse> => {
        console.log(
            `[RoleService.setPermissions] Setting permissions for: ${targetIdentityIdentifier}`,
        )
        console.log(`[RoleService.setPermissions] Permissions:`, permissions)
        console.log(
            `[RoleService.setPermissions] Using contract API: ${contractInterface.name}`,
        )

        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "setPermissions",
            {
                input: {
                    targetIdentityIdentifier,
                    permissionsJson: JSON.stringify(permissions),
                },
            },
            { confirm: true, publish: true },
        )

        console.log(`[RoleService.setPermissions] Response:`, res)
        return res
    }

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
    public grantPermissionsToOrg = async (
        targetMSP: string,
        permissions: Permission[],
    ): Promise<FireFlyContractInvokeResponse> => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "grantPermissionsToOrg",
            {
                input: {
                    targetMSP,
                    permissionsJson: JSON.stringify(permissions),
                },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Revoke all permissions from a target organization.
     * Only callers from the PM3 MSP may revoke permissions (enforced by chaincode).
     *
     * @param targetMSP Target organization's MSP ID
     * @returns FireFly invocation response.
     */
    public revokePermissionsFromOrg = async (
        targetMSP: string,
    ): Promise<FireFlyContractInvokeResponse> => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "revokePermissionsFromOrg",
            {
                input: {
                    targetMSP,
                },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Remove specific permissions from a target organization.
     * Only callers from the PM3 MSP may remove permissions (enforced by chaincode).
     *
     * @param targetMSP Target organization's MSP ID
     * @param permissions Array of {@link Permission} values to remove.
     * @returns FireFly invocation response.
     */
    public removePermissionsFromOrg = async (
        targetMSP: string,
        permissions: Permission[],
    ): Promise<FireFlyContractInvokeResponse> => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "removePermissionsFromOrg",
            {
                input: {
                    targetMSP,
                    permissionsJson: JSON.stringify(permissions),
                },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    /**
     * Get the caller's permissions from the blockchain.
     *
     * @returns An array of {@link Permission} values.
     */
    public getCallerPermissions = async (): Promise<Permission[]> => {
        const res = (await this.ff.queryContractAPI(
            contractInterface.name,
            "getCallerPermissions",
            { input: {} },
            { confirm: true, publish: true },
        )) as FireFlyContractQueryResponse

        const raw = res as unknown
        if (!Array.isArray(raw)) return []

        return raw as Permission[]
    }

    /**
     * Check whether the **caller** has the supplied permission.
     *
     * @param permission Permission to check.
     * @returns `true` if the caller has the permission; otherwise `false`.
     */
    public hasPermission = async (permission: Permission): Promise<boolean> => {
        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "callerHasPermission",
            {
                input: { permission },
            },
            { confirm: true, publish: true },
        )

        return res as unknown as boolean
    }

    /**
     * Get the caller's identity identifier.
     *
     * @returns The caller's identity identifier in format "MSPID"
     */
    public getCallerIdentifier = async (): Promise<string> => {
        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "getCallerIdentifier",
            { input: {} },
            { confirm: true, publish: true },
        )

        return res as unknown as string
    }
}
