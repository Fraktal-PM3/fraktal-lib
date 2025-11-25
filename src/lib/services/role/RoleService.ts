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
     */
    public initialize = async (): Promise<void> => {
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
    private getContractInterface = async (): Promise<FireFlyContractInterfaceResponse | null> => {
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
    private getContractAPI = async (): Promise<FireFlyContractAPIResponse | null> => {
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
            location: { channel: "pm3", chaincode: iface.name },
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
    public getPermissions = async (identityIdentifier?: string): Promise<Permission[]> => {
        const input: Record<string, unknown> = {}
        if (identityIdentifier) {
            input.identityIdentifier = identityIdentifier
        }

        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "getPermissions",
            { input },
            { confirm: true, publish: true },
        ) as FireFlyContractQueryResponse

        // Chaincode returns a JSON stringified Permission[]
        const raw = res as unknown as string

        if (typeof raw !== "string") {
            return []
        }

        try {
            const parsed = JSON.parse(raw) as unknown
            if (!Array.isArray(parsed)) return []
            // We trust on-chain validation for actual enum membership
            return parsed as Permission[]
        } catch {
            return []
        }
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
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "setPermissions",
            {
                input: {
                    targetIdentityIdentifier,
                    permissions: JSON.stringify(permissions),
                },
            },
            { confirm: true, publish: true },
        )

        return res
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
            "hasPermission",
            {
                input: { permission },
            },
            { confirm: true, publish: true },
        )

        return res as unknown as boolean
    }
}