import FireFly from "@hyperledger/firefly-sdk"
import { privatePackageDatatypePayload } from "../../datatypes/package"
import contractInterface from "./interface.json"
import { BlockchainPackage, PackageDetails, PackagePII, Status } from "./types.common"

export default class PackageService {

    private ff: FireFly
    private initalized: boolean = false

    constructor(ff: FireFly) {
        this.ff = ff
    }

    public initalize = async () => {
        if (!(await this.dataTypeExists())) {
            await this.createDataType()
        }

        await this.createContractInterface()
        await this.createContractAPI()
        await this.registerListner()

        this.initalized = true
    }


    public initialized = () => this.initalized

    private registerListner = async () => {
        const api = await this.getContractAPI()
        if (!api) return

        contractInterface.events.forEach(async (event) => {
            const existing = await this.ff.getContractAPIListeners(contractInterface.name, event.name)
            if (existing.length) return
            await this.ff.createContractAPIListener(contractInterface.name, event.name,
                {
                    event: { name: event.name },
                    name: `listen_${event.name}_events`,
                    topic: `ff_contractapi_${api.id}_events`,
                },
                {
                    publish: true,
                    confirm: true
                }
            )
        })
    }

    private getContractInterface = async () => {
        const interfaces = await this.ff.getContractInterfaces({ name: contractInterface.name })
        return interfaces[0] || null
    }

    private createContractInterface = async () => {

        const exists = await this.ff.getContractInterfaces({ name: contractInterface.name })

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
        const apis = await this.ff.getContractAPIs({ name: contractInterface.name })
        return apis[0] || null
    }

    private createContractAPI = async () => {

        const contractInterface = await this.getContractInterface()
        const contractAPI = await this.getContractAPI()

        if (!contractInterface || contractAPI) return

        this.ff.createContractAPI({
            interface: { id: contractInterface.id },
            location: { channel: "firefly", chaincode: contractInterface.name },
            name: contractInterface.name,
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


    public getLocalPackage = async (id: string) => {
        try {
            const res = await this.ff.getData(id)
            return res || null
        } catch {
            return null
        }
    }

    /* Chaincode Queries */

    public createPackage = async (externalId: string, packageDetails: PackageDetails, pii: PackagePII) => {
        const res = await this.ff.invokeContractAPI(contractInterface.name, "CreatePackage",
            {
                input: {
                    externalId,
                },
                options: {
                    transientMap: {
                        pii: JSON.stringify(pii),
                        packageDetails: JSON.stringify(packageDetails)
                    }
                }
            },
            {
                publish: true,
                confirm: true
            }
        )
        return res
    }

    public updatePackageStatus = async (externalId: string, status: Status) => {
        const res = await this.ff.invokeContractAPI(contractInterface.name, "UpdatePackageStatus", {
            input: { externalId, status }
        }, { confirm: true, publish: true })

        return res
    }

    public readBlockchainPackage = async (externalId: string): Promise<BlockchainPackage> => {
        const res = await this.ff.queryContractAPI(contractInterface.name, "ReadBlockchainPackage", {
            input: { externalId }
        }, { confirm: true, publish: true })

        return res as BlockchainPackage
    }

    public readPackageDetailsAndPII = async (externalId: string): Promise<any> => {
        const res = await this.ff.queryContractAPI(contractInterface.name, "ReadPackageDetailsAndPII", {
            input: { externalId }
        }, { confirm: true, publish: true })

        return res 
    }

    public deletePackage = async (externalId: string) => {
        const res = await this.ff.invokeContractAPI(contractInterface.name, "DeletePackage", {
            input: { externalId }
        }, { confirm: true, publish: true })

        return res
    }
}