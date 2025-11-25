export type Role = "pm3" | "ombud" | "transporter"
export type Permission =
    | "package:create"
    | "package:read"
    | "package:read:private"
    | "package:updateStatus"
    | "package:delete"
    | "transfer:propose"
    | "transfer:accept"
    | "transfer:execute"

export type RolePermissions = {
    [R in Role]: Permission[]
}

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
    pm3: [
        "package:create",
        "package:read",
        "package:read:private",
        "package:updateStatus",
        "package:delete",
        "transfer:propose",
        "transfer:accept",
        "transfer:execute",
    ],
    ombud: [
        "package:read",
        "package:read:private",
        "package:delete",
    ],
    transporter: [
        "package:read",
        "package:read:private",
        "transfer:propose",
        "transfer:accept",
    ],
}
