export type Role = "pm3" | "ombud" | "transporter";
export type Permission = "package:create" | "package:read" | "package:read:private" | "package:updateStatus" | "package:delete" | "transfer:propose" | "transfer:accept" | "transfer:execute";
export type RolePermissions = {
    [R in Role]: Permission[];
};
export declare const DEFAULT_ROLE_PERMISSIONS: RolePermissions;
