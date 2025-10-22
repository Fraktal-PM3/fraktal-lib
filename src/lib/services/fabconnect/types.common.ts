export type TxHeaders = {
    signer: string
    channel: string
    chaincode: string
    type: "SendTransaction"
}

export type SendTxBody = {
    headers: TxHeaders
    func: string,
    args: string[]
    transientMap: Record<string, string>
    init: boolean
}

export type TxResponse = {
    headers: {
        id: string,
        type: string,
        timeReceived: string,
        timeElapsed: number,
        requestOffset: string,
        requestId: string
    },
    blockNumber: number,
    signerMSP: string,
    signer: string,
    transactionHash: string,
    status: string
}

export type ModfiyBody = {
    name?: string,
    type?: string,
    maxEnrollments?: number,
    attributes: Record<string, string>,
}