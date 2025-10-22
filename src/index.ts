import FireFly, { FireFlyOptionsInput } from "@hyperledger/firefly-sdk"
import FabconnectService from "./lib/services/fabconnect/FabconnectService"
import { Urgency } from "./lib/services/package/types.common"
import PackageService from "./lib/services/package/PackageService"

const main = async () => {

    const ffOptions: FireFlyOptionsInput = {        
        host: "http://localhost:8000",
        namespace: "default"
    }
    
    const ffService = new FireFly(ffOptions)
    const ffStatus = await ffService.getStatus()

    const fbService = new FabconnectService("http://localhost:5102")
    const fbStatus = await fbService.getChainInfo("pm3", "admin")

    const packageService = new PackageService(ffService, fbService) 
    await packageService.initalize()

    // Set admin as signing identity
    // const res1 = await fbService.enrollIdentity("admin", "adminpw")
    // const res2 = await fbService.modifyIdentity("admin", { attributes: { role: "ombud" } })

    const identities = await fbService.getIdentities()
    
    const packageID = "test-package-006"
    const pii = {        
        pickupLocation: {
            name: "Warehouse A",
            address: "1234 Industrial Rd, City, Country",
            lat: 37.7749,
            lng: -122.4194
        },
        dropLocation: {
            name: "Customer B",
            address: "5678 Residential St, City, Country",
            lat: 37.8044,
            lng: -122.2711
        },
        address: "5678 Residential St, City, Country",
        size: {
            width: 30,
            height: 20,
            depth: 15
        },
        weightKg: 2.5,
        urgency: Urgency.NONE
    }

    // const data = await packageService.createPackage(packageID, pii, "admin", "pm3")
    // console.log(data)

    // const retrievedPackage = await packageService.readPackage(packageID, "admin", "pm3")
    // console.log(retrievedPackage)

}

main()