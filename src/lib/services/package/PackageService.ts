import {
    PRIVATE_PACKAGE_DT_NAME,
    PRIVATE_PACKAGE_DT_VERSION,
    privatePackageDatatypePayload,
} from "../../datatypes/package"
import {
    PrivatePackage,
    PrivatePackageWithId,
    PublicPackage,
    Status,
} from "./types.common"
import contractInterface from "./interface.json"
import FireFly from "@hyperledger/firefly-sdk"

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

        this.initalized = true
    }

    public initialized = () => this.initalized

    private getContractInterface = async () => {
        const interfaces = await this.ff.getContractInterfaces({
            name: contractInterface.name,
        })
        return interfaces[0] || null
    }

    private createContractInterface = async () => {
        const exists = await this.ff.getContractInterfaces({
            name: contractInterface.name,
        })

        if (exists.length) return

        await this.ff.createContractInterface(contractInterface, {
            publish: true,
            confirm: true,
        })
    }

    private getContractAPI = async () => {
        const apis = await this.ff.getContractAPIs({
            name: contractInterface.name,
        })
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
        const dataType = await this.ff.createDatatype(payload, {
            publish: true,
            confirm: true,
        })
        return dataType
    }

    private dataTypeExists = async () => {
        const payload = privatePackageDatatypePayload()
        const dataTypes = await this.ff.getDatatypes({
            name: payload.name,
            version: payload.version,
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
            version: payload.version,
        })
        return dataTypes[0]
    }

    /* Blockchain Queries */

    public uploadPackage = async (pkg: PrivatePackageWithId) => {
        const res = await this.ff.uploadData({
            datatype: {
                name: PRIVATE_PACKAGE_DT_NAME,
                version: PRIVATE_PACKAGE_DT_VERSION,
            },
            value: pkg,
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
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "CreatePackage",
            {
                input: {
                    packageID,
                },
                options: {
                    transientMap: { pii: JSON.stringify(pii) },
                },
            },
            {
                publish: true,
                confirm: true,
            },
        )
        return res
    }

    public updatePackageStatus = async (packageID: string, status: Status) => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "UpdatePackageStatus",
            {
                input: { id: packageID, status },
            },
            { confirm: true, publish: true },
        )

        return res
    }

    public readPackage = async (packageID: string): Promise<PublicPackage> => {
        const res = await this.ff.queryContractAPI(
            contractInterface.name,
            "ReadPackage",
            {
                input: { id: packageID },
            },
            { confirm: true, publish: true },
        )

        return res as PublicPackage
    }

    public deletePackage = async (packageID: string) => {
        const res = await this.ff.invokeContractAPI(
            contractInterface.name,
            "DeletePackage",
            {
                input: { id: packageID },
            },
            { confirm: true, publish: true },
        )

        return res
    }
}

