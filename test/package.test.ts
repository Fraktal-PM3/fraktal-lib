import { PackageService } from "../src/lib/services/package/PackageService"
import {
    Urgency,
    Status,
    PackageDetails,
    PackagePII,
} from "../src/lib/services/package/types.common"
import FireFly, { FireFlyOptionsInput } from "@hyperledger/firefly-sdk"
import { describe, it, expect, beforeAll } from "vitest"
import { randomBytes, randomUUID } from "crypto"

const FABCONNECT_ADDRESS =
    process.env.FABCONNECT_ADDRESS || "http://localhost:5102"
const FF_HOST = process.env.FF_HOST || "http://localhost:8000"
const FF_NAMESPACE = process.env.FF_NAMESPACE || "default"
const FABRIC_CHANNEL = process.env.FABRIC_CHANNEL || "pm3"
const FF_IDENTITY = process.env.FF_IDENTITY || "org_f5440c"

// wait for blockchain operations to complete
const BLOCKCHAIN_TIMEOUT = 30000

// mock invoke/query ??

describe("PackageService tests", () => {
    let org1PkgService: PackageService

    // Test data that will be reused across tests
    const testPackageId = randomUUID()
    const testSalt = randomBytes(32).toString("hex")

    const packageDetails: PackageDetails = {
        pickupLocation: { address: "A st", lat: 1.1, lng: 2.2 },
        dropLocation: { address: "B st", lat: 3.3, lng: 4.4 },
        size: { width: 10, height: 20, depth: 30 },
        weightKg: 5.5,
        urgency: Urgency.MEDIUM,
    }

    const pii: PackagePII = {
        whateverwesend: "hello",
        whatever: true,
        anything: 123,
    }

    beforeAll(async () => {
        const org1FFOptions: FireFlyOptionsInput = {
            host: FF_HOST,
            namespace: FF_NAMESPACE,
        }

        const org1FF = new FireFly(org1FFOptions)
        org1PkgService = new PackageService(org1FF)
        await org1PkgService.initalize()
    })

    it("should initialize successfully", () => {
        expect(org1PkgService.initialized()).toBe(true)
    })

    // Tests go here
    describe("createPackage", () => {
        it(
            "should create a package successfully",
            async () => {
                const response = await org1PkgService.createPackage(
                    testPackageId,
                    packageDetails,
                    pii,
                    testSalt,
                    true,
                )
                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")
                expect(response.id).toMatch(/^[a-f0-9-]+$/) //UUID check
                expect(response.namespace).toBe(FF_NAMESPACE)
            },
            BLOCKCHAIN_TIMEOUT,
        )
    })
    describe.skip("updatePackageStatus", () => {
        it("should update package status successfully", async () => {})
    })
    describe.skip("readBlockchainPackage", () => {})
    describe.skip("readPackageDetailsAndPII", () => {})
    describe.skip("deletePackage", () => {})
    describe.skip("proposeTransfer", () => {})
    describe.skip("acceptTransfer", () => {})
    describe.skip("executeTransfer", () => {})
})
