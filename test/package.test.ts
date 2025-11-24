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
import { read } from "fs"

const FABCONNECT_ADDRESS =
    process.env.FABCONNECT_ADDRESS || "http://localhost:5102"
const FF_HOST = process.env.FF_HOST || "http://localhost:8000"
const FF_HOST_ORG2 = process.env.FF_HOST_ORG2 || "http://localhost:8001"
const FF_NAMESPACE = process.env.FF_NAMESPACE || "default"
const FABRIC_CHANNEL = process.env.FABRIC_CHANNEL || "pm3"
const FF_IDENTITY = process.env.FF_IDENTITY || "org_f5440c"

// wait for blockchain operations to complete
const BLOCKCHAIN_TIMEOUT = 30000

// mock invoke/query ??

describe("PackageService tests", () => {
    let org1PkgService: PackageService
    let org2PkgService: PackageService

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
        const org2FFOptions: FireFlyOptionsInput = {
            host: FF_HOST_ORG2,
            namespace: FF_NAMESPACE,
        }

        const org1FF = new FireFly(org1FFOptions)
        org1PkgService = new PackageService(org1FF)
        await org1PkgService.initalize()

        const org2FF = new FireFly(org2FFOptions)
        org2PkgService = new PackageService(org2FF)
        await org2PkgService.initalize()
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
        ) // Maybe add off-chain data verification here? Or verify on chain data in other tests instead
    })
    describe("updatePackageStatus", () => {
        it(
            "should update package status from PENDING to READY_FOR_PICKUP",
            async () => {
                const updateTestPackageId = randomUUID()
                const updateTestSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    updateTestPackageId,
                    packageDetails,
                    pii,
                    updateTestSalt,
                    true,
                )

                // Update from PENDING to READY_FOR_PICKUP (valid transition)
                const response = await org1PkgService.updatePackageStatus(
                    updateTestPackageId,
                    Status.READY_FOR_PICKUP,
                )
                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")
                expect(response.id).toMatch(/^[a-f0-9-]+$/)
                expect(response.namespace).toBe(FF_NAMESPACE)

                const pkg =
                    await org1PkgService.readBlockchainPackage(
                        updateTestPackageId,
                    )
                expect(pkg.status).toBe(Status.READY_FOR_PICKUP)
            },
            BLOCKCHAIN_TIMEOUT,
        )
    })
    describe("readBlockchainPackage", () => {
        it(
            "should read package from blockchain",
            async () => {
                const readTestPackageId = randomUUID()
                const readTestSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    readTestPackageId,
                    packageDetails,
                    pii,
                    readTestSalt,
                    true,
                )

                const pkg =
                    await org1PkgService.readBlockchainPackage(
                        readTestPackageId,
                    )

                expect(pkg).toBeDefined()
                expect(pkg.externalId).toBe(readTestPackageId)
                expect(pkg.status).toBe(Status.PENDING)
                expect(pkg.ownerOrgMSP).toBeDefined()
                expect(pkg.packageDetailsHash).toBeDefined()
                expect(pkg.packageDetailsHash).toMatch(/^[a-f0-9]+$/) // hash should be hex string
            },
            BLOCKCHAIN_TIMEOUT,
        )
    })
    describe("readPackageDetailsAndPII", () => {
        it(
            "should read private package details and PII",
            async () => {
                const privateTestPackageId = randomUUID()
                const privateTestSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    privateTestPackageId,
                    packageDetails,
                    pii,
                    privateTestSalt,
                    true,
                )

                const result =
                    await org1PkgService.readPackageDetailsAndPII(
                        privateTestPackageId,
                    )

                expect(result).toBeDefined()

                expect(result.salt).toBe(privateTestSalt)
                expect(result.pii).toEqual(pii)
                expect(result.packageDetails).toEqual(packageDetails)
            },
            BLOCKCHAIN_TIMEOUT,
        )

        it(
            "should fail when reading private data from non-owner org",
            async () => {
                const privateTestFailPackageId = randomUUID()
                const privateTestFailSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    privateTestFailPackageId,
                    packageDetails,
                    pii,
                    privateTestFailSalt,
                    true,
                )

                await expect(
                    org2PkgService.readPackageDetailsAndPII(
                        privateTestFailPackageId,
                    ),
                ).rejects.toThrow(/not authorized to read the private details/)
            },
            BLOCKCHAIN_TIMEOUT,
        )
    })
    describe("deletePackage", () => {
        it(
            "should successfully delete a package in PENDING state",
            async () => {
                const deleteTestPackageId = randomUUID()
                const deleteTestSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    deleteTestPackageId,
                    packageDetails,
                    pii,
                    deleteTestSalt,
                    true,
                )

                const response =
                    await org1PkgService.deletePackage(deleteTestPackageId)

                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")

                await expect(
                    org1PkgService.readBlockchainPackage(deleteTestPackageId),
                ).rejects.toThrow()
            },
            BLOCKCHAIN_TIMEOUT,
        )
    })
    describe("proposeTransfer", () => {
        it(
            "should propose a transfer successfully",
            async () => {
                const proposeTestPackageId = randomUUID()
                const proposeTestSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    proposeTestPackageId,
                    packageDetails,
                    pii,
                    proposeTestSalt,
                    true,
                )

                const terms = {
                    id: randomUUID(),
                    price: 100,
                }
                const response = await org1PkgService.proposeTransfer(
                    proposeTestPackageId,
                    "Org2MSP",
                    terms,
                    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // expiryISO
                )

                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")
                expect(response.id).toMatch(/^[a-f0-9-]+$/) //UUID check
                expect(response.namespace).toBe(FF_NAMESPACE)

                const pkg =
                    await org1PkgService.readBlockchainPackage(
                        proposeTestPackageId,
                    )
                expect(pkg.status).toBe(Status.PROPOSED)
            },
            BLOCKCHAIN_TIMEOUT,
        )
    })
    describe("acceptTransfer", () => {
        it(
            "should accept a transfer successfully",
            async () => {
                const acceptTestPackageId = randomUUID()
                const acceptTestSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    acceptTestPackageId,
                    packageDetails,
                    pii,
                    acceptTestSalt,
                    true,
                )

                const terms = {
                    id: randomUUID(),
                    price: 100,
                }
                await org1PkgService.proposeTransfer(
                    acceptTestPackageId,
                    "Org2MSP",
                    terms,
                    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // expiryISO
                )

                const privateTransferTerms = {
                    price: 100,
                }

                const response = await org2PkgService.acceptTransfer(
                    acceptTestPackageId,
                    terms.id,
                    packageDetails,
                    pii,
                    acceptTestSalt,
                    privateTransferTerms,
                )

                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")
                expect(response.id).toMatch(/^[a-f0-9-]+$/)
                expect(response.namespace).toBe(FF_NAMESPACE)

                const pkg =
                    await org2PkgService.readBlockchainPackage(
                        acceptTestPackageId,
                    )
                expect(pkg.status).toBe(Status.READY_FOR_PICKUP)
                expect(pkg.ownerOrgMSP).toBe("Org1MSP")
            },
            BLOCKCHAIN_TIMEOUT,
        )
    })
    describe("executeTransfer", () => {
        it(
            "should execute a transfer successfully",
            async () => {
                const executeTestPackageId = randomUUID()
                const executeTestSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    executeTestPackageId,
                    packageDetails,
                    pii,
                    executeTestSalt,
                    true,
                )

                const terms = {
                    id: randomUUID(),
                    price: 100,
                }
                await org1PkgService.proposeTransfer(
                    executeTestPackageId,
                    "Org2MSP",
                    terms,
                    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // expiryISO
                )

                const privateTransferTerms = {
                    price: 100,
                }

                await org2PkgService.acceptTransfer(
                    executeTestPackageId,
                    terms.id,
                    packageDetails,
                    pii,
                    executeTestSalt,
                    privateTransferTerms,
                )

                const storeObject = {
                    salt: executeTestSalt,
                    pii: pii,
                    packageDetails: packageDetails,
                }

                const response = await org1PkgService.executeTransfer(
                    executeTestPackageId,
                    terms.id,
                    storeObject,
                )

                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")
                expect(response.id).toMatch(/^[a-f0-9-]+$/)
                expect(response.namespace).toBe(FF_NAMESPACE)

                const pkg =
                    await org2PkgService.readBlockchainPackage(
                        executeTestPackageId,
                    )
                expect(pkg.ownerOrgMSP).toBe("Org2MSP")
            },
            BLOCKCHAIN_TIMEOUT,
        )
    })
})
