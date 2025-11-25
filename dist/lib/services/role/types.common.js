"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ROLE_PERMISSIONS = void 0;
exports.DEFAULT_ROLE_PERMISSIONS = {
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
};
//# sourceMappingURL=types.common.js.map