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

    const res4 = await org1PkgService.readBlockchainPackage(packageID)
    console.log(res4)

    const res5 = await org1PkgService.readPackageDetailsAndPII(packageID)
    console.log("PII", res5)

    const transferSalt = crypto.randomBytes(16).toString("hex")

    const terms = {
        id: randomUUID(),
        price: 100,
        salt: transferSalt,
    }

    const res6 = await org1PkgService.proposeTransfer(
        packageID,
        "Org2MSP",
        terms,
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    )
    console.log("ProposeTransfer result:", res6)

    const res7 = await org2PkgService.acceptTransfer(
        packageID,
        terms.id,
        packageDetails,
        pii,
        salt,
        { price: terms.price, salt: terms.salt },
    )
    console.log("AcceptTransfer result:", res7)

    const res8 = await org2PkgService.readPrivateTransferTerms(terms.id)
    console.log(res8)

    const res9 = await org1PkgService.deletePackage(packageID)
    console.log(res9)

    const res10 = await org1PkgService.readPackageDetailsAndPII(packageID)
    console.log(res10)

    const res11 = await org1PkgService.readBlockchainPackage(packageID)
    console.log(res11)

    const res12 = await org2PkgService.readPrivateTransferTerms(terms.id)
    console.log(res12)
}

main()
