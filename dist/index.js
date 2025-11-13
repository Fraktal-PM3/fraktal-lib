"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageService = void 0;
const types_common_1 = require("./lib/services/package/types.common");
const firefly_sdk_1 = __importDefault(require("@hyperledger/firefly-sdk"));
const PackageService_1 = require("./lib/services/package/PackageService");
const crypto_1 = __importStar(require("crypto"));
// Exports for docs
var PackageService_2 = require("./lib/services/package/PackageService");
Object.defineProperty(exports, "PackageService", { enumerable: true, get: function () { return PackageService_2.PackageService; } });
__exportStar(require("./lib/services/package/types.common"), exports);
const main = async () => {
    const org1FFOptions = {
        host: "http://localhost:8000",
        namespace: "default",
    };
    const org2FFOptions = {
        host: "http://localhost:8001",
        namespace: "default",
    };
    const org1FF = new firefly_sdk_1.default(org1FFOptions);
    const org2FF = new firefly_sdk_1.default(org2FFOptions);
    const org1PkgService = new PackageService_1.PackageService(org1FF);
    const org2PkgService = new PackageService_1.PackageService(org2FF);
    await org1PkgService.initalize();
    await org2PkgService.initalize();
    const packageID = (0, crypto_1.randomUUID)();
    const packageDetails = {
        pickupLocation: {
            address: "1234 Industrial Rd, City, Country",
            lat: 37.7749,
            lng: -122.4194,
        },
        dropLocation: {
            address: "5678 Residential St, City, Country",
            lat: 37.8044,
            lng: -122.2711,
        },
        size: {
            width: 30,
            height: 20,
            depth: 15,
        },
        weightKg: 2.5,
        urgency: types_common_1.Urgency.NONE,
    };
    const pii = {
        name: "John Doe",
    };
    org2PkgService.onEvent("CreatePackage", (args) => {
        console.log("=================================");
        console.log(args);
        console.log("=================================");
    });
    const salt = crypto_1.default.randomBytes(16).toString("hex");
    const res1 = await org1PkgService.createPackage(packageID, packageDetails, pii, salt);
    console.log(res1);
    const res2 = await org1PkgService.readBlockchainPackage(packageID);
    console.log(res2);
    // const res3 = await org1PkgService.updatePackageStatus(
    //     packageID,
    //     Status.READY_FOR_PICKUP,
    // )
    // console.log(res3)
    const res4 = await org1PkgService.readBlockchainPackage(packageID);
    console.log(res4);
    const res5 = await org1PkgService.readPackageDetailsAndPII(packageID);
    console.log("PII", res5);
    const terms = {
        id: (0, crypto_1.randomUUID)(),
        price: 100,
    };
    const res6 = await org1PkgService.proposeTransfer(packageID, "Org2MSP", terms, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    console.log(res6);
    const res7 = await org2PkgService.acceptTransfer(packageID, terms.id, packageDetails, pii, salt, { price: terms.price });
    console.log(res7);
    const res8 = await org1PkgService.executeTransfer(packageID, terms.id, {
        salt,
        pii,
        packageDetails,
    });
    console.log(res8);
    // expect error since package is not in a deletable state
    // const res5 = await org1PkgService.deletePackage(packageID)
    // console.log(res5)
};
// Only run main when this file is executed directly (not imported)
if (require.main === module) {
    main();
}
//# sourceMappingURL=index.js.map