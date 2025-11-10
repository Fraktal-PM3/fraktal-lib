import {
    PackagePII,
    Status,
    Urgency,
} from "./lib/services/package/types.common"
import FabconnectService from "./lib/services/fabconnect/FabconnectService"
import FireFly, { FireFlyOptionsInput } from "@hyperledger/firefly-sdk"
import PackageService from "./lib/services/package/PackageService"
import crypto, { randomUUID } from "crypto"

const main = async () => {
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
    const org2PkgService = new PackageService(org2FF)

    await org1PkgService.initalize()
    await org2PkgService.initalize()

    const packageID = randomUUID()
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
        urgency: Urgency.NONE,
    }

    const pii: PackagePII = {
        name: "John Doe",
    }

    org2PkgService.onEvent("CreatePackage", (args: any) => {
        console.log("=================================")
        console.log(args)
        console.log("=================================")

    })

    const salt = crypto.randomBytes(16).toString("hex")
    const res1 = await org1PkgService.createPackage(
        packageID,
        packageDetails,
        pii,
        salt,
    )
    console.log(res1)

    const res2 = await org1PkgService.readBlockchainPackage(packageID)
    console.log(res2)

    const res3 = await org1PkgService.updatePackageStatus(
        packageID,
        Status.READY_FOR_PICKUP,
    )
    console.log(res3)

    const res4 = await org1PkgService.readBlockchainPackage(packageID)
    console.log(res4)

    const res5 = await org1PkgService.readPackageDetailsAndPII(packageID)
    console.log("PII", res5)

    const terms = {
        id: randomUUID(),
        price: 100,
    }

    const res6 = await org1PkgService.proposeTransfer(
        packageID,
        "Org2MSP",
        terms,
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    )
    console.log(res6)

    const res7 = await org2PkgService.acceptTransfer(
        packageID,
        terms.id,
        packageDetails,
        pii,
        salt,
        { price: terms.price },
    )
    console.log(res7)

    const res8 = await org1PkgService.executeTransfer(packageID, terms.id, {
        salt,
        pii,
        packageDetails,
    })
    console.log(res8)

    // expect error since package is not in a deletable state
    // const res5 = await org1PkgService.deletePackage(packageID)
    // console.log(res5)
}

main()
