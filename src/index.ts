import FabconnectService from "./lib/services/fabconnect/FabconnectService"
import FireFly, { FireFlyOptionsInput } from "@hyperledger/firefly-sdk"
import PackageService from "./lib/services/package/PackageService"
import { Status, Urgency } from "./lib/services/package/types.common"
import { randomUUID } from "crypto"

const main = async () => {
    const ffOptions: FireFlyOptionsInput = {
        host: "http://localhost:8000",
        namespace: "default",
    }

    const ffService = new FireFly(ffOptions)
    const ffStatus = await ffService.getStatus()

    const fbService = new FabconnectService("http://localhost:5102")
    const fbStatus = await fbService.getChainInfo("firefly", "admin")

    const packageService = new PackageService(ffService)
    await packageService.initalize()

    const identities = await fbService.getIdentities()
    // console.log(identities)

    fbService.modifyIdentity("org0", {
        attributes: {
            role: "ombud",
        },
    })

    fbService.reenrollIdentity("org0", { role: true })

    const packageID = randomUUID()
    const pii = {
        pickupLocation: {
            name: "Warehouse A",
            address: "1234 Industrial Rd, City, Country",
            lat: 37.7749,
            lng: -122.4194,
        },
        dropLocation: {
            name: "Customer B",
            address: "5678 Residential St, City, Country",
            lat: 37.8044,
            lng: -122.2711,
        },
        address: "5678 Residential St, City, Country",
        size: {
            width: 30,
            height: 20,
            depth: 15,
        },
        weightKg: 2.5,
        urgency: Urgency.NONE,
    }

    const res1 = await packageService.createPackage(packageID, pii)
    console.log(res1)

    const res2 = await packageService.readPackage(packageID)
    console.log(res2)

    const res3 = await packageService.updatePackageStatus(
        packageID,
        Status.READY_FOR_PICKUP,
    )
    console.log(res3)

    const res4 = await packageService.readPackage(packageID)
    console.log(res4)

    // expect error since package is not in a deletable state
    const res5 = await packageService.deletePackage(packageID)
    console.log(res5)
}

main()
