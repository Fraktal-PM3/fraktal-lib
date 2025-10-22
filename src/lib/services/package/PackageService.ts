import { PRIVATE_PACKAGE_DT_NAME, PRIVATE_PACKAGE_DT_VERSION, privatePackageDatatypePayload } from "../../datatypes/package"
import { PrivatePackage, PrivatePackageWithId, Status } from "./types.common"
import FabconnectService from "../fabconnect/FabconnectService"
import FireFly from "@hyperledger/firefly-sdk"
import { TxResponse } from "../fabconnect/types.common"

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

        this.initalized = true
    }

    public initialized = () => this.initalized

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

    public createPackage = async (packageID: string, pii: PrivatePackage, signer: string, channel: string): Promise<TxResponse> => {
        const uploadRes = await this.uploadPackage({ ...pii, id: packageID })
        
        if (!uploadRes.created) {
            throw new Error("Failed to upload package data to FireFly")
        }
        
        const transientMap = new Map<string, string>()
        transientMap.set("pii", JSON.stringify(pii))
        
        // Contract: CreatePackage(ctx, id: string)
        const res = await this.fb.submitTx({
            headers: {
                type: "SendTransaction",
                signer,
                channel,
                chaincode: "pm3package"
            },
            func: "CreatePackage",
            args: [packageID],
            transientMap: Object.fromEntries(transientMap),
            init: false
        })

        return res
    }

    public readPackage = async (packageID: string, signer: string, channel: string) => {
        // Contract: ReadPackage(ctx, id: string) => Package
        const res = await this.fb.query({
            headers: {
                signer,
                channel,
                chaincode: "pm3package",
            },
            func: "ReadPackage",
            args: [packageID],
            strongread: true
        })

        return res.result
    }

    public updatePackageStatus = async (id: string, status: Status, signer: string, channel: string): Promise<TxResponse> => {
        // Contract: UpdatePackageStatus(ctx, id: string, status: Status)
        const res = await this.fb.submitTx({
            headers: { type: "SendTransaction", signer, channel, chaincode: "pm3package" },
            func: "UpdatePackageStatus",
            args: [id, status],
            transientMap: {},
            init: false
        })

        return res
    }

    public deletePackage = async (packageID: string, signer: string, channel: string): Promise<TxResponse> => {
        // Contract: DeletePackage(ctx, id: string)
        const res = await this.fb.submitTx({
            headers: { type: "SendTransaction", signer, channel, chaincode: "pm3package" },
            func: "DeletePackage",
            args: [packageID],
            transientMap: {},
            init: false
        })

        return res
    }
}