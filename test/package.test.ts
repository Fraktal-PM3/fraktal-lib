import FabconnectService from "../src/lib/services/fabconnect/FabconnectService"
import { Urgency, Status } from "../src/lib/services/package/types.common"
import PackageService from "../src/lib/services/package/PackageService"
import FireFly, { FireFlyOptionsInput } from "@hyperledger/firefly-sdk"
import { describe, it, expect, beforeAll } from "vitest"
import { randomUUID } from "crypto"

const FABCONNECT_ADDRESS = process.env.FABCONNECT_ADDRESS || "http://localhost:5102"
const FF_HOST = process.env.FF_HOST || "http://localhost:8000"
const FF_NAMESPACE = process.env.FF_NAMESPACE || "default"
const FABRIC_CHANNEL = process.env.FABRIC_CHANNEL || "pm3"
const FF_IDENTITY = process.env.FF_IDENTITY || "org_f5440c"

describe("Package Lifecycle", () => {

    let ffService: FireFly
    let fbService: FabconnectService
    let packageService: PackageService

    beforeAll(async () => {
        const ffOptions: FireFlyOptionsInput = {
            host: FF_HOST,
            namespace: FF_NAMESPACE   
        }
        ffService = new FireFly(ffOptions)
        fbService = new FabconnectService(FABCONNECT_ADDRESS)    
        packageService = new PackageService(ffService)

        await fbService.modifyIdentity(FF_IDENTITY, {
            attributes: {
                role: "ombud"
            }
        })
    
        await fbService.reenrollIdentity(FF_IDENTITY, { role: true })

        await packageService.initalize()
    })

    it("should create a package successfully", async () => {
        const packageID = randomUUID()
        const packageDetails = {
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

        const pii = { "name": "John Doe" }

        const res = await packageService.createPackage(packageID, packageDetails, pii)
        expect(res.status).toBe("Succeeded")
    })

    it("should fail to create a package with missing details", async () => {
        const packageID = randomUUID()
        const packageDetails = {
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
            // Missing address field
            size: {
                width: 30,
                height: 20,
                depth: 15
            },
            weightKg: 2.5,
            urgency: Urgency.NONE
        }

        const pii = { "name": "John Doe" }

        await expect(packageService.createPackage(packageID, packageDetails as any, pii))
            .rejects
            .toThrow()
    })

})

