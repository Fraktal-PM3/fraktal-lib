import { PackageService } from "../src/lib/services/package/PackageService"
import { Urgency, Status } from "../src/lib/services/package/types.common"
import FireFly, { FireFlyOptionsInput } from "@hyperledger/firefly-sdk"
import { describe, it, expect, beforeAll } from "vitest"
import { randomUUID } from "crypto"

const FABCONNECT_ADDRESS = process.env.FABCONNECT_ADDRESS || "http://localhost:5102"
const FF_HOST = process.env.FF_HOST || "http://localhost:8000"
const FF_NAMESPACE = process.env.FF_NAMESPACE || "default"
const FABRIC_CHANNEL = process.env.FABRIC_CHANNEL || "pm3"
const FF_IDENTITY = process.env.FF_IDENTITY || "org_f5440c"

describe("Package Lifecycle", () => {

    

})

