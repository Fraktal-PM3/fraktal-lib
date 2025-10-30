import { ModfiyBody, SendTxBody, TxResponse } from "./types.common"

export default class FabconnectService {
    private address: string

    constructor(address: string) {
        this.address = address
    }

    public getChainInfo = async (channel: string, signer: string) => {
        const res = await fetch(`${this.address}/chaininfo?fly-channel=${channel}&fly-signer=${signer}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })

        if (!res.ok) {
            throw new Error(
                `Failed to get status: ${res.status} ${res.statusText}`,
            )
        }

        const data = await res.json()

        return data.result
    }

    public getIdentities = async () => {
        const res = await fetch(`${this.address}/identities`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!res.ok) {
            throw new Error(`Failed to get identities: ${res.status} ${res.statusText}`)
        }

        return res.json()
    }

    public enrollIdentity = async (username: string, secret: string, attributes?: Record<string, string>) => {
        const url = `${this.address}/identities/${encodeURIComponent(username)}/enroll`
        const res = await fetch(url,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify({ secret, attributes: attributes?.length ? attributes : {} }),
            },
        )
        if (!res.ok) {
            throw new Error(`Failed to enroll identity: ${res.status} ${res.statusText}`)
        }

        return res.json()
    }

    public reenrollIdentity = async (username: string, attributes?: Record<string, boolean>) => {
        const url = `${this.address}/identities/${encodeURIComponent(username)}/reenroll`
        const res = await fetch(url,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify({ attributes: attributes?.length ? attributes : {} }),
            },
        )

        if (!res.ok) {
            throw new Error(`Failed to reenroll identity: ${res.status} ${res.statusText}`)
        }

        return res.json()
    }

    public modifyIdentity = async (username: string, payload: ModfiyBody) => {
        const res = await fetch(`${this.address}/identities/${encodeURIComponent(username)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          throw new Error(`Failed to modify identity: ${res.status} ${res.statusText}`)
        }

        return res.json()
    }

    public submitTx = async (body: SendTxBody): Promise<TxResponse> => {
        const res = await fetch(`${this.address}/transactions?fly-sync=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json", accept: "application/json" },
            body: JSON.stringify(body),
        })

        if (!res.ok) {
            console.log(res)
            throw new Error(`Failed to submit transaction: ${res.status} ${res.statusText}`)
        }
        return res.json()
    }

    public query = async (body: {
        headers: { signer: string; channel: string; chaincode: string }
        func: string
        args?: string[]
        strongread?: boolean
    }) => {
        const res = await fetch(`${this.address}/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json", accept: "application/json" },
            body: JSON.stringify(body),
        })

        if (!res.ok) {
            throw new Error(`Failed to query: ${res.status} ${res.statusText}`)
        }

        return res.json()
    }

}
