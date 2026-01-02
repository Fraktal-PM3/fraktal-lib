/**
 * Integration Tests for PackageService
 *
 * PREREQUISITES:
 * These are integration tests that require a fully deployed Hyperledger Fabric network
 * with FireFly and the necessary chaincodes. Before running these tests, ensure:
 *
 * 1. Fabric Network & FireFly:
 *    - A running Hyperledger Fabric network (e.g., from the fraktal deployment repo)
 *    - FireFly nodes running for both Org1 and Org2
 *    - FireFly accessible at:
 *      - Org1: http://localhost:8000 (or http://127.0.0.1:8000)
 *      - Org2: http://localhost:8001 (or http://127.0.0.1:8001)
 *
 * 2. Required Chaincodes Deployed:
 *    - pm3package chaincode  (deploycc package)
 *    - roleAuth chaincode (deploycc roleauth)
 *
 * 3. Network Configuration:
 *    - Channel name: 'pm3'
 *    - Namespace: 'default'
 *    - Organizations: Org1MSP, Org2MSP
 *
 * ENVIRONMENT VARIABLES (optional):
 * - FF_HOST: FireFly host for Org1 (default: http://localhost:8000)
 * - FF_HOST_ORG2: FireFly host for Org2 (default: http://localhost:8001)
 * - FF_NAMESPACE: FireFly namespace (default: default)
 * - FABRIC_CHANNEL: Fabric channel name (default: pm3)
 *
 * To run these tests:
 * 1. Deploy the Fabric network and chaincodes using the fraktal deployment scripts
 * 2. Ensure FireFly is running and accessible
 * 3. Run: npx vitest run test/package.test.ts
 */

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
import RoleService from "../src/lib/services/role/RoleService"

const FABCONNECT_ADDRESS =
    process.env.FABCONNECT_ADDRESS || "http://localhost:5102"
const FF_HOST = process.env.FF_HOST || "http://localhost:8000"
const FF_HOST_ORG2 = process.env.FF_HOST_ORG2 || "http://localhost:8001"
const FF_NAMESPACE = process.env.FF_NAMESPACE || "default"
const FABRIC_CHANNEL = process.env.FABRIC_CHANNEL || "pm3"
const FF_IDENTITY = process.env.FF_IDENTITY || "org_f5440c"

// wait for blockchain operations to complete
const BLOCKCHAIN_TIMEOUT = 30000

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

        const org1RoleService = new RoleService(org1FF)
        await org1RoleService.initialize()
        await org1RoleService.setPermissions("Org2MSP", [
            "package:create",
            "package:read",
            "package:delete",
            "transfer:propose",
            "transfer:accept",
            "transfer:execute",
        ])

        await org1RoleService.setPermissions("Org1MSP", [
            "package:create",
            "package:read",
            "package:delete",
            "transfer:propose",
            "transfer:accept",
            "transfer:execute",
        ])
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
                    "Org2MSP",
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
            "should fail to update package status from PENDING to READY_FOR_PICKUP",
            async () => {
                const invalidUpdateTestPackageId = randomUUID()
                const invalidUpdateTestSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    invalidUpdateTestPackageId,
                    "Org2MSP",
                    packageDetails,
                    pii,
                    invalidUpdateTestSalt,
                    true,
                )

                await expect(
                    org1PkgService.updatePackageStatus(
                        invalidUpdateTestPackageId,
                        Status.READY_FOR_PICKUP,
                    ),
                ).rejects.toThrow(/The status transition from/)
            },
            BLOCKCHAIN_TIMEOUT,
        )

        it(
            "should succeed to update package status from PENDING to PROPOSED",
            async () => {
                const updateTestPackageId = randomUUID()
                const updateTestSalt = randomBytes(32).toString("hex")
                const termsId = randomUUID()
                await org1PkgService.createPackage(
                    updateTestPackageId,
                    "Org2MSP",
                    packageDetails,
                    pii,
                    updateTestSalt,
                    true,
                )

                const transferTerms = {
                    externalPackageId: updateTestPackageId,
                    fromMSP: "Org1MSP",
                    toMSP: "Org2MSP",
                    expiryISO: new Date(
                        Date.now() + 24 * 60 * 60 * 1000,
                    ).toISOString(),
                    price: 100,
                    salt: updateTestSalt,
                }

                await org1PkgService.proposeTransfer(
                    updateTestPackageId,
                    termsId,
                    transferTerms,
                )

                const response = await org1PkgService.updateStatusAfterPropose(
                    updateTestPackageId,
                    termsId,
                    "Org2MSP",
                    transferTerms.expiryISO,
                )
                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")
                expect(response.id).toMatch(/^[a-f0-9-]+$/)
                expect(response.namespace).toBe(FF_NAMESPACE)
                expect(response.status).toBe("Succeeded")

                const pkg =
                    await org1PkgService.readBlockchainPackage(
                        updateTestPackageId,
                    )
                expect(pkg.status).toBe(Status.PROPOSED)
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
                    "Org2MSP",
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
                expect(pkg.packageDetailsAndPIIHash).toBeDefined()
                expect(pkg.packageDetailsAndPIIHash).toMatch(/^[a-f0-9]+$/) // hash should be hex string
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
                    "Org2MSP",
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
                    "Org2MSP",
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
                    "Org2MSP",
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
                    "Org2MSP",
                    packageDetails,
                    pii,
                    proposeTestSalt,
                    true,
                )

                const termsId = randomUUID()
                const transferTerms = {
                    externalPackageId: proposeTestPackageId,
                    fromMSP: "Org1MSP",
                    toMSP: "Org2MSP",
                    expiryISO: new Date(
                        Date.now() + 24 * 60 * 60 * 1000,
                    ).toISOString(),
                    price: 100,
                    salt: proposeTestSalt,
                }

                const response = await org1PkgService.proposeTransfer(
                    proposeTestPackageId,
                    termsId,
                    transferTerms,
                )

                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")
                expect(response.id).toMatch(/^[a-f0-9-]+$/) //UUID check
                expect(response.namespace).toBe(FF_NAMESPACE)

                await org1PkgService.updateStatusAfterPropose(
                    proposeTestPackageId,
                    termsId,
                    "Org2MSP",
                    transferTerms.expiryISO,
                )

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
                    "Org2MSP",
                    packageDetails,
                    pii,
                    acceptTestSalt,
                    true,
                )

                const termsId = randomUUID()
                const transferTerms = {
                    externalPackageId: acceptTestPackageId,
                    fromMSP: "Org1MSP",
                    toMSP: "Org2MSP",
                    expiryISO: new Date(
                        Date.now() + 24 * 60 * 60 * 1000,
                    ).toISOString(),
                    price: 100,
                    salt: acceptTestSalt,
                }

                await org1PkgService.proposeTransfer(
                    acceptTestPackageId,
                    termsId,
                    transferTerms,
                )

                await org1PkgService.updateStatusAfterPropose(
                    acceptTestPackageId,
                    termsId,
                    "Org2MSP",
                    transferTerms.expiryISO,
                )

                const response = await org2PkgService.acceptTransfer(
                    acceptTestPackageId,
                    termsId,
                    transferTerms,
                )

                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")
                expect(response.id).toMatch(/^[a-f0-9-]+$/)
                expect(response.namespace).toBe(FF_NAMESPACE)

                await org2PkgService.updateStatusAfterAccept(
                    acceptTestPackageId,
                    termsId,
                )

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
                    "Org2MSP",
                    packageDetails,
                    pii,
                    executeTestSalt,
                    true,
                )

                const termsId = randomUUID()
                const transferTerms = {
                    externalPackageId: executeTestPackageId,
                    fromMSP: "Org1MSP",
                    toMSP: "Org2MSP",
                    expiryISO: new Date(
                        Date.now() + 24 * 60 * 60 * 1000,
                    ).toISOString(),
                    price: 100,
                    salt: executeTestSalt,
                }

                await org1PkgService.proposeTransfer(
                    executeTestPackageId,
                    termsId,
                    transferTerms,
                )

                await org1PkgService.updateStatusAfterPropose(
                    executeTestPackageId,
                    termsId,
                    "Org2MSP",
                    transferTerms.expiryISO,
                )

                await org2PkgService.acceptTransfer(
                    executeTestPackageId,
                    termsId,
                    transferTerms,
                )

                await org2PkgService.updateStatusAfterAccept(
                    executeTestPackageId,
                    termsId,
                )

                const storeObject = {
                    salt: executeTestSalt,
                    pii: pii,
                    packageDetails: packageDetails,
                }

                const response = await org1PkgService.executeTransfer(
                    executeTestPackageId,
                    termsId,
                    "Org2MSP",
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
    describe("transferToPM3", () => {
        it(
            "should transfer a delivered package to PM3 successfully",
            async () => {
                const pm3TestPackageId = randomUUID()
                const pm3TestSalt = randomBytes(32).toString("hex")

                await org1PkgService.createPackage(
                    pm3TestPackageId,
                    "Org2MSP",
                    packageDetails,
                    pii,
                    pm3TestSalt,
                    true,
                )

                const termsId = randomUUID()
                const transferTerms = {
                    externalPackageId: pm3TestPackageId,
                    fromMSP: "Org1MSP",
                    toMSP: "Org2MSP",
                    expiryISO: new Date(
                        Date.now() + 24 * 60 * 60 * 1000,
                    ).toISOString(),
                    price: 100,
                    salt: pm3TestSalt,
                }

                await org1PkgService.proposeTransfer(
                    pm3TestPackageId,
                    termsId,
                    transferTerms,
                )

                await org1PkgService.updateStatusAfterPropose(
                    pm3TestPackageId,
                    termsId,
                    "Org2MSP",
                    transferTerms.expiryISO,
                )

                await org2PkgService.acceptTransfer(
                    pm3TestPackageId,
                    termsId,
                    transferTerms,
                )

                await org2PkgService.updateStatusAfterAccept(
                    pm3TestPackageId,
                    termsId,
                )

                const storeObject = {
                    salt: pm3TestSalt,
                    pii: pii,
                    packageDetails: packageDetails,
                }

                await org1PkgService.executeTransfer(
                    pm3TestPackageId,
                    termsId,
                    "Org2MSP",
                    storeObject,
                )

                const pkgBeforeTransfer =
                    await org2PkgService.readBlockchainPackage(pm3TestPackageId)
                expect(pkgBeforeTransfer.status).toBe(Status.DELIVERED)
                expect(pkgBeforeTransfer.ownerOrgMSP).toBe("Org2MSP")

                const response =
                    await org2PkgService.transferToPM3(pm3TestPackageId)

                expect(response).toBeDefined()
                expect(response.error).toBeUndefined()
                expect(response.status).toBe("Succeeded")
                expect(response.id).toMatch(/^[a-f0-9-]+$/)
                expect(response.namespace).toBe(FF_NAMESPACE)

                const pkgAfterTransfer =
                    await org2PkgService.readBlockchainPackage(pm3TestPackageId)
                expect(pkgAfterTransfer).toBeDefined()
                expect(pkgAfterTransfer.externalId).toBe(pm3TestPackageId)
            },
            BLOCKCHAIN_TIMEOUT,
        )
    })
})
