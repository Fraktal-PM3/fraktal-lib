import {
    PackagePII,
    Status,
    Urgency,
    isPackageDetailsMessage,
    isTransferOfferMessage,
    CreatePackageEvent,
    StatusUpdatedEvent,
    DeletePackageEvent,
    ProposeTransferEvent,
    AcceptTransferEvent,
    TransferExecutedEvent,
} from "./lib/services/package/types.common"
import FireFly, { FireFlyOptionsInput } from "@hyperledger/firefly-sdk"
import { PackageService } from "./lib/services/package/PackageService"
import crypto, { randomUUID } from "crypto"
import RoleService from "./lib/services/role/RoleService"

// Exports for docs
export { PackageService } from "./lib/services/package/PackageService"
export * from "./lib/services/package/types.common"
export {
    PACKAGE_DETAILS_DT_NAME,
    PACKAGE_DETAILS_DT_VERSION,
    packageDetailsDatatypePayload,
    TRANSFER_OFFER_DT_NAME,
    TRANSFER_OFFER_DT_VERSION,
    transferOfferDatatypePayload,
} from "./lib/datatypes/package"

const log = {
    section: (title: string) => {
        console.log(`\n${"=".repeat(60)}`)
        console.log(`  ${title}`)
        console.log(`${"=".repeat(60)}\n`)
    },
    success: (message: string) => console.log(`✅ ${message}`),
    error: (message: string) => console.log(`❌ ${message}`),
    info: (message: string) => console.log(`ℹ️  ${message}`),
    data: (label: string, data: any) => {
        console.log(`\n📦 ${label}:`)
        console.log(JSON.stringify(data, null, 2))
    },
}

const main = async () => {
    log.section("FireFly Package Service - Comprehensive Test")

    // Initialize FireFly clients for both organizations
    const org1FFOptions: FireFlyOptionsInput = {
        host: "http://localhost:8000",
        namespace: "default",
    }
    const org2FFOptions: FireFlyOptionsInput = {
        host: "http://localhost:8001",
        namespace: "default",
    }

    const org1FF = new FireFly(org1FFOptions)
    const org2FF = new FireFly(org2FFOptions)

    const org1PkgService = new PackageService(org1FF)
    const org1RoleAuthService = new RoleService(org1FF)
    const org2PkgService = new PackageService(org2FF)

    log.info("Initializing services...")
    // Force recreate roleAuth interface to pick up parameter name changes
    await org1RoleAuthService.initialize()
    await org1PkgService.initalize()
    await org2PkgService.initalize()
    log.success("Services initialized")

    // Set up event listeners with type-safe handlers
    log.section("Setting up Event Listeners")

    // Type-safe blockchain event listeners - log full event data
    await org1PkgService.onEvent("CreatePackage", (event) => {
        log.info(`[Org1] CreatePackage event received`)
        log.data("FULL CreatePackage Event Data", event)
    })

    await org2PkgService.onEvent("CreatePackage", (event) => {
        log.info(`[Org2] CreatePackage event received`)
        log.data("FULL CreatePackage Event Data", event)
    })

    await org1PkgService.onEvent("StatusUpdated", (event) => {
        log.info(`[Org1] StatusUpdated event received`)
        log.data("FULL StatusUpdated Event Data", event)
    })

    await org2PkgService.onEvent("StatusUpdated", (event) => {
        log.info(`[Org2] StatusUpdated event received`)
        log.data("FULL StatusUpdated Event Data", event)
    })

    await org1PkgService.onEvent("DeletePackage", (event) => {
        log.info(`[Org1] DeletePackage event received`)
        log.data("FULL DeletePackage Event Data", event)
    })

    await org2PkgService.onEvent("DeletePackage", (event) => {
        log.info(`[Org2] DeletePackage event received`)
        log.data("FULL DeletePackage Event Data", event)
    })

    await org1PkgService.onEvent("ProposeTransfer", (event) => {
        log.info(`[Org1] ProposeTransfer event received`)
        log.data("FULL ProposeTransfer Event Data", event)
    })

    await org2PkgService.onEvent("ProposeTransfer", (event) => {
        log.info(`[Org2] ProposeTransfer event received`)
        log.data("FULL ProposeTransfer Event Data", event)
    })

    await org1PkgService.onEvent("AcceptTransfer", (event) => {
        log.info(`[Org1] AcceptTransfer event received`)
        log.data("FULL AcceptTransfer Event Data", event)
    })

    await org2PkgService.onEvent("AcceptTransfer", (event) => {
        log.info(`[Org2] AcceptTransfer event received`)
        log.data("FULL AcceptTransfer Event Data", event)
    })

    await org1PkgService.onEvent("TransferExecuted", (event) => {
        log.info(`[Org1] TransferExecuted event received`)
        log.data("FULL TransferExecuted Event Data", event)
    })

    await org2PkgService.onEvent("TransferExecuted", (event) => {
        log.info(`[Org2] TransferExecuted event received`)
        log.data("FULL TransferExecuted Event Data", event)
    })

    // Generic message event listener with type guards - log full event data
    await org1PkgService.onEvent("message", (event) => {
        log.info(`[Org1] Message event received`)
        if (isPackageDetailsMessage(event)) {
            log.info(`  → Identified as PackageDetails message`)
        } else if (isTransferOfferMessage(event)) {
            log.info(`  → Identified as TransferOffer message`)
        } else {
            log.info(`  → Generic/Unknown message type`)
        }
        log.data("FULL Message Event Data", event)
    })

    await org2PkgService.onEvent("message", (event) => {
        log.info(`[Org2] Message event received`)
        if (isPackageDetailsMessage(event)) {
            log.info(`  → Identified as PackageDetails message`)
        } else if (isTransferOfferMessage(event)) {
            log.info(`  → Identified as TransferOffer message`)
        } else {
            log.info(`  → Generic/Unknown message type`)
        }
        log.data("FULL Message Event Data", event)
    })

    log.success("Event listeners registered")

    // Wait for FireFly listeners to fully initialize
    log.info("Waiting for FireFly event listeners to initialize...")
    await new Promise((resolve) => setTimeout(resolve, 1500))
    log.success("FireFly listeners ready")

    // Set up permissions
    log.section("Setting up Permissions")

    // Set permissions for Org1MSP
    try {
        log.info("Setting permissions for Org1MSP...")
        const org1PermResult = await org1RoleAuthService.setPermissions(
            "Org1MSP",
            [
                "package:create",
                "package:read",
                "package:read:private",
                "package:updateStatus",
                "transfer:propose",
                "transfer:accept",
                "transfer:execute",
                "package:delete",
            ],
        )
        log.success(
            `Permissions assigned to Org1MSP - TX ID: ${org1PermResult.id}`,
        )
        log.data("setPermissions Response", org1PermResult)

        // Wait for transaction to be committed
        log.info("Waiting for transaction to be committed...")
        await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (err: any) {
        log.error(`Failed to set Org1MSP permissions: ${err.message}`)
        log.data("Error details", err)
        throw err
    }

    // Set permissions for Org2MSP
    try {
        log.info("Setting permissions for Org2MSP...")
        const org2PermResult = await org1RoleAuthService.setPermissions(
            "Org2MSP",
            [
                "package:create",
                "package:read",
                "package:read:private",
                "package:updateStatus",
                "transfer:propose",
                "transfer:accept",
                "transfer:execute",
                "package:delete",
            ],
        )
        log.success(
            `Permissions assigned to Org2MSP - TX ID: ${org2PermResult.id}`,
        )
        log.data("setPermissions Response", org2PermResult)

        // Wait for transaction to be committed
        log.info("Waiting for transaction to be committed...")
        await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (err: any) {
        log.error(`Failed to set Org2MSP permissions: ${err.message}`)
        log.data("Error details", err)
        throw err
    }

    // Verify permissions were written
    log.section("Verifying Permissions")
    const org1Perms = await org1RoleAuthService.getPermissions("Org1MSP")
    log.data("Org1MSP Permissions", org1Perms)
    if (!org1Perms || org1Perms.length === 0) {
        log.error(
            "WARNING: Org1MSP permissions are empty! setPermissions may have failed silently.",
        )
    }

    const org2Perms = await org1RoleAuthService.getPermissions("Org2MSP")
    log.data("Org2MSP Permissions", org2Perms)
    if (!org2Perms || org2Perms.length === 0) {
        log.error(
            "WARNING: Org2MSP permissions are empty! setPermissions may have failed silently.",
        )
    }

    // Test 1: Create a package
    log.section("Test 1: Create Package")
    const packageID = randomUUID()
    const salt = crypto.randomBytes(16).toString("hex")
    const packageDetails = {
        pickupLocation: {
            address: "1234 Industrial Rd, San Francisco, CA",
            lat: 37.7749,
            lng: -122.4194,
        },
        dropLocation: {
            address: "5678 Residential St, Oakland, CA",
            lat: 37.8044,
            lng: -122.2711,
        },
        size: {
            width: 1.5,
            height: 1.2,
            depth: 0.8,
        },
        weightKg: 25.5,
        urgency: Urgency.MEDIUM,
    }

    const pii: PackagePII = {
        recipientName: "Jane Smith",
        recipientPhone: "+1-555-0123",
        company: "Tech Corp",
    }

    log.data("Creating package", {
        packageID,
        pickupLocation: packageDetails.pickupLocation.address,
        dropLocation: packageDetails.dropLocation.address,
        weight: packageDetails.weightKg,
    })

    const createRes = await org1PkgService.createPackage(
        packageID,
        packageDetails,
        pii,
        salt,
    )
    log.success(`Package created: ${createRes.id}`)
    log.data("Creation Response", {
        id: createRes.id,
        status: createRes.status,
        namespace: createRes.namespace,
    })

    // Test 2: Read package from blockchain
    log.section("Test 2: Read Package from Blockchain")
    const pkgOnChain = await org1PkgService.readBlockchainPackage(packageID)
    log.data("Package on-chain", {
        externalId: pkgOnChain.externalId,
        status: pkgOnChain.status,
        ownerOrgMSP: pkgOnChain.ownerOrgMSP,
        hash: pkgOnChain.packageDetailsAndPIIHash,
    })

    // Test 3: Check if package exists
    log.section("Test 3: Check Package Existence")
    const exists = await org1PkgService.packageExists(packageID)
    log.success(`Package exists: ${exists}`)

    // Test 4: Read private details and PII
    log.section("Test 4: Read Private Package Details and PII")
    const privateData = await org1PkgService.readPackageDetailsAndPII(packageID)
    log.data("Private Data (Owner)", {
        salt: privateData.salt.substring(0, 16) + "...",
        recipientName: privateData.pii.recipientName,
        company: privateData.pii.company,
    })

    // Test 5: Verify hash
    log.section("Test 5: Verify Package Hash")
    const dataToHash = JSON.stringify({
        salt,
        pii,
        packageDetails,
    })
    const expectedHash = crypto
        .createHash("sha256")
        .update(dataToHash)
        .digest("hex")

    const hashMatches = await org1PkgService.checkPackageDetailsAndPIIHash(
        packageID,
        expectedHash,
    )
    log.success(`Hash verification: ${hashMatches}`)

    // Test 6: Update package status
    log.section("Test 6: Update Package Status")
    log.info(`Updating status from PENDING to PROPOSED...`)
    const statusRes = await org1PkgService.updatePackageStatus(
        packageID,
        Status.PROPOSED,
    )
    log.success(`Status updated: ${statusRes.status}`)

    const pkgAfterStatus = await org1PkgService.readBlockchainPackage(packageID)
    log.info(`Current status: ${pkgAfterStatus.status}`)

    // Test 7: Propose transfer
    log.section("Test 7: Propose Transfer to Org2")
    const termsId = randomUUID()
    const transferPrice = 500.0

    log.data("Transfer proposal", {
        termsId,
        packageID,
        fromOrg: "Org1MSP",
        toOrg: "Org2MSP",
        price: transferPrice,
    })

    const proposeRes = await org1PkgService.proposeTransfer(
        packageID,
        "Org2MSP",
        { id: termsId, price: transferPrice },
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    )
    log.success(`Transfer proposed: ${proposeRes.id}`)

    // Test 8: Read transfer terms
    log.section("Test 8: Read Transfer Terms")
    const publicTerms = await org1PkgService.readTransferTerms(termsId)
    log.data("Public Transfer Terms", publicTerms)

    // Test 9: Accept transfer (from Org2)
    log.section("Test 9: Accept Transfer (Org2)")
    log.info(`Org2 accepting transfer for terms: ${termsId}...`)

    const acceptRes = await org2PkgService.acceptTransfer(packageID, termsId, {
        price: transferPrice,
    })
    log.success(`Transfer accepted: ${acceptRes.id}`)

    const pkgAfterAccept = await org2PkgService.readBlockchainPackage(packageID)
    log.info(`Package status after accept: ${pkgAfterAccept.status}`)

    // Test 10: Execute transfer (from Org1)
    log.section("Test 10: Execute Transfer (Org1)")
    log.info(`Org1 executing transfer...`)

    const executeRes = await org1PkgService.executeTransfer(
        packageID,
        termsId,
        { salt, pii, packageDetails },
    )
    log.success(`Transfer executed: ${executeRes.id}`)

    const pkgAfterExecute =
        await org1PkgService.readBlockchainPackage(packageID)
    log.data("Package after transfer execution", {
        externalId: pkgAfterExecute.externalId,
        status: pkgAfterExecute.status,
        newOwner: pkgAfterExecute.ownerOrgMSP,
    })

    // // Test 11: Org2 can now read private data
    // log.section("Test 11: Org2 Reads Private Data After Transfer")
    // const org2PrivateData = await org2PkgService.readPackageDetailsAndPII(packageID)
    // log.data("Private Data (New Owner - Org2)", {
    //     recipientName: org2PrivateData.pii.recipientName,
    //     company: org2PrivateData.pii.company,
    //     pickupAddress: org2PrivateData.packageDetails.pickupLocation.address,
    // })

    // Test 12: Create another package for deletion test
    log.section("Test 12: Create Package for Deletion")
    const packageID2 = randomUUID()
    const salt2 = crypto.randomBytes(16).toString("hex")

    const createRes2 = await org1PkgService.createPackage(
        packageID2,
        packageDetails,
        pii,
        salt2,
    )
    log.success(`Package created for deletion test: ${createRes2.id}`)

    // Test 13: Delete package
    log.section("Test 13: Delete Package")
    log.info(`Deleting package: ${packageID2}...`)

    const deleteRes = await org1PkgService.deletePackage(packageID2)
    log.success(`Package deleted: ${deleteRes.id}`)

    try {
        await org1PkgService.readBlockchainPackage(packageID2)
        log.error("Package should not exist after deletion!")
    } catch (e) {
        log.success("Package confirmed deleted (read failed as expected)")
    }
    // create another package but remove permissions to delete
    const packageID3 = randomUUID()
    const salt3 = crypto.randomBytes(16).toString("hex")

    const createRes3 = await org1PkgService.createPackage(
        packageID3,
        packageDetails,
        pii,
        salt3,
    )
    log.success(
        `Package created for deletion permission test: ${createRes3.id}`,
    )

    await org1RoleAuthService.removePermissionsFromOrg("Org1MSP", [
        "package:delete",
    ])
    log.success("Removed 'package:delete' permission from Org1MSP")

    const deleteRes2 = await org1PkgService
        .deletePackage(packageID3)
        .catch((e) => {
            log.info(
                `Expected error on deletion without permission: ${e.message}`,
            )
        })

    console.log(deleteRes2)

    await org1RoleAuthService.grantPermissionsToOrg("Org1MSP", [
        "package:delete",
    ])
    log.success("Restored 'package:delete' permission to Org1MSP")

    // Verify can delete now
    const deleteRes3 = await org1PkgService.deletePackage(packageID3)
    log.success(`Package deleted after restoring permission: ${deleteRes3.id}`)

    // Test 14: Broadcast a PackageDetails message
    log.section("Test 14: Broadcast PackageDetails Message")
    log.info("Org1 broadcasting PackageDetails message...")

    const broadcastPackageData = {
        id: randomUUID(),
        pickupLocation: {
            address: "999 Warehouse Way, Portland, OR",
            lat: 45.5152,
            lng: -122.6784,
        },
        dropLocation: {
            address: "111 Delivery Dock, Seattle, WA",
            lat: 47.6062,
            lng: -122.3321,
        },
        size: {
            width: 2.0,
            height: 1.5,
            depth: 1.0,
        },
        weightKg: 45.0,
        urgency: Urgency.HIGH,
    }

    await org1FF.sendBroadcast({
        header: {},
        data: [
            {
                value: broadcastPackageData,
            },
        ],
    })
    log.success("PackageDetails message broadcasted")

    // Test 15: Send a private TransferOffer message
    log.section("Test 15: Send Private TransferOffer Message")
    log.info("Org1 sending private TransferOffer message to Org2...")

    const privateTransferOfferData = {
        externalPackageId: packageID,
        termsId: randomUUID(),
        fromMSP: "Org1MSP",
        toMSP: "Org2MSP",
        price: 750.5,
        createdISO: new Date().toISOString(),
        expiryISO: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }

    await org1FF.sendPrivateMessage({
        header: {},
        group: {
            members: [{ identity: "did:firefly:org/org_7f4361" }],
        },
        data: [
            {
                value: privateTransferOfferData,
            },
        ],
    })
    log.success("TransferOffer message sent privately")

    // Add a small delay to allow messages to be processed
    log.section("Test 16: Wait for Message Events")
    log.info("Waiting 2 seconds for message events to be received...")
    await new Promise((resolve) => setTimeout(resolve, 2000))
    log.success("Message event processing completed")

    // Test 17: Show type guard examples
    log.section("Test 17: Type Guard Examples")
    log.info("Demonstrating type guard usage:")

    // Example 1: PackageDetails type guard
    const examplePackageDetailsMsg = {
        id: "example-msg-1",
        header: { key: "key1", author: "org1" },
        validator: "json",
        namespace: "default",
        hash: "hash1",
        created: new Date().toISOString(),
        value: broadcastPackageData,
        signingKey: "key1",
        author: "org1",
    }

    if (isPackageDetailsMessage(examplePackageDetailsMsg)) {
        log.success("✓ Correctly identified as PackageDetails message")
        log.data("Extracted PackageDetails", {
            id: examplePackageDetailsMsg.value.id,
            urgency: examplePackageDetailsMsg.value.urgency,
            weightKg: examplePackageDetailsMsg.value.weightKg,
            route: `${examplePackageDetailsMsg.value.pickupLocation.address} → ${examplePackageDetailsMsg.value.dropLocation.address}`,
        })
    }

    // Example 2: TransferOffer type guard
    const exampleTransferOfferMsg = {
        id: "example-msg-2",
        header: { key: "key2", author: "org2" },
        validator: "json",
        namespace: "default",
        hash: "hash2",
        created: new Date().toISOString(),
        value: privateTransferOfferData,
        signingKey: "key2",
        author: "org2",
    }

    if (isTransferOfferMessage(exampleTransferOfferMsg)) {
        log.success("✓ Correctly identified as TransferOffer message")
        log.data("Extracted TransferOffer", {
            termsId: exampleTransferOfferMsg.value.termsId,
            packageId: exampleTransferOfferMsg.value.externalPackageId,
            price: exampleTransferOfferMsg.value.price,
            route: `${exampleTransferOfferMsg.value.fromMSP} → ${exampleTransferOfferMsg.value.toMSP}`,
            expiresIn: "3 days",
        })
    }

    // Example 3: Generic message (doesn't match any type guard)
    const exampleGenericMsg = {
        id: "example-msg-3",
        header: { key: "key3", author: "org3" },
        validator: "json",
        namespace: "default",
        hash: "hash3",
        created: new Date().toISOString(),
        value: { randomField: "some data" },
        signingKey: "key3",
        author: "org3",
    }

    if (
        !isPackageDetailsMessage(exampleGenericMsg) &&
        !isTransferOfferMessage(exampleGenericMsg)
    ) {
        log.success("✓ Correctly identified as generic/unknown message type")
        log.info(
            `Generic message content: ${JSON.stringify(exampleGenericMsg.value)}`,
        )
    }

    log.section("All Tests Completed Successfully!")
    log.success(
        "The fraktal-lib package service is working correctly with FireFly",
    )
}

// Only run main when this file is executed directly (not imported)
if (require.main === module) {
    main().catch((err) => {
        console.error("\n❌ Test failed:", err.message)
        console.error(err.stack)
        process.exit(1)
    })
}
