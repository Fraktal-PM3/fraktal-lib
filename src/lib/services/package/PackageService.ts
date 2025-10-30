import { PRIVATE_PACKAGE_DT_NAME, PRIVATE_PACKAGE_DT_VERSION, privatePackageDatatypePayload } from "../../datatypes/package"
import { PrivatePackage, PrivatePackageWithId, Status } from "./types.common"
import FabconnectService from "../fabconnect/FabconnectService"
import { TxResponse } from "../fabconnect/types.common"
import contractInterface from "./interface.json"
import FireFly from "@hyperledger/firefly-sdk"

export default class PackageService {

    private ff: FireFly
    private fb: FabconnectService
    private initalized: boolean = false

    constructor(ff: FireFly, fb: FabconnectService) {
        this.ff = ff
        this.fb = fb
    }

    public initalize = async () => {
        if (!(await this.dataTypeExists())) {
            await this.createDataType()
        }

        await this.createContractInterface()
        await this.createContractAPI()

        this.initalized = true
    }

    public initialized = () => this.initalized

    private getContractInterface = async () => {
        const interfaces = await this.ff.getContractInterfaces({ name: "pm3package" })
        return interfaces[0] || null
    }

    private createContractInterface = async () => {

        const exists = await this.ff.getContractInterfaces({ name: "pm3package" })

        if (exists.length) return

        await this.ff.createContractInterface(
            contractInterface, 
            { 
                publish: true, 
                confirm: true 
            }
        )
    }

    private getContractAPI = async () => {
        const apis = await this.ff.getContractAPIs({ name: "pm3package" })
        return apis[0] || null
    }

    private createContractAPI = async () => {
        
        const contractInterface = await this.getContractInterface()
        const contractAPI = await this.getContractAPI()

        if (!contractInterface || contractAPI) return

        this.ff.createContractAPI({
            interface: { id: contractInterface.id },
            location: { channel: "pm3", chaincode: "pm3package" },
            name: "pm3package",
        })
    }


    /* Define Package Datatype */
    private createDataType = async () => {
        const payload = privatePackageDatatypePayload()
        const dataType = await this.ff.createDatatype(
            payload, 
            { 
                publish: true, 
                confirm: true 
            }
        )
        return dataType
    }

    private dataTypeExists = async () => {
        const payload = privatePackageDatatypePayload()
        const dataTypes = await this.ff.getDatatypes({ 
            name: payload.name, 
            version: payload.version 
        })
        return dataTypes.length > 0
    }
    
    public getDataType = async () => {
        if (!this.dataTypeExists()) {
            throw new Error("Data type does not exist")
        }

        const payload = privatePackageDatatypePayload()
        const dataTypes = await this.ff.getDatatypes({ 
            name: payload.name, 
            version: payload.version 
        })
        return dataTypes[0]
    }

    /* Blockchain Queries */

    public uploadPackage = async (pkg: PrivatePackageWithId) => {
        const res = await this.ff.uploadData({
            datatype: { 
                name: PRIVATE_PACKAGE_DT_NAME, 
                version: PRIVATE_PACKAGE_DT_VERSION 
            },
            value: pkg
        })
        return res
    }

    public getLocalPackage = async (id: string) => {
        try {
            const res = await this.ff.getData(id)
            return res || null
        } catch {
            return null
        }
    }

    /* Chaincode Queries */

    public createPackage = async (packageID: string, pii: PrivatePackage) => {

        const res = await this.ff.invokeContractAPI("pm3package", "CreatePackage", 
            {
                input: {
                    packageID
                },
                options: {
                    transientMap: { pii: JSON.stringify(pii) }
                }
            }, 
            { 
                publish: true, 
                confirm: true 
            }
        )

        return res

    }
}