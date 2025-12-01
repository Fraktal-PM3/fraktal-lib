import { describe, it, expect } from "vitest"
import {
    FireFlyDatatypeMessage,
    BlockchainEventDelivery,
    isPackageDetailsMessage,
    isTransferOfferMessage,
    PackageDetailsWithId,
    TransferOfferData,
} from "../src/lib/services/package/types.common"
import {
    PACKAGE_DETAILS_DT_NAME,
    PACKAGE_DETAILS_DT_VERSION,
    packageDetailsDatatypePayload,
    TRANSFER_OFFER_DT_NAME,
    TRANSFER_OFFER_DT_VERSION,
    transferOfferDatatypePayload,
} from "../src/lib/datatypes/package"

describe("Event Types and Datatypes", () => {
    describe("BlockchainEventDelivery", () => {
        it("should have all required fields", () => {
            const event: BlockchainEventDelivery = {
                txid: "tx-123",
                output: { externalId: "pkg-001", status: "pending" },
                timestamp: new Date().toISOString(),
                header: {
                    key: "signing-key-1",
                    author: "org1-identity",
                },
            }

            expect(event.txid).toBe("tx-123")
            expect(event.output.externalId).toBe("pkg-001")
            expect(event.timestamp).toBeDefined()
            expect(event.header.key).toBe("signing-key-1")
            expect(event.header.author).toBe("org1-identity")
        })

        it("should allow optional txid", () => {
            const event: BlockchainEventDelivery = {
                output: { externalId: "pkg-002" },
                timestamp: new Date().toISOString(),
                header: {
                    key: "signing-key-2",
                    author: "org2-identity",
                },
            }

            expect(event.txid).toBeUndefined()
            expect(event.header).toBeDefined()
        })
    })

    describe("FireFlyDatatypeMessage", () => {
        it("should have all required message fields", () => {
            const msg: FireFlyDatatypeMessage = {
                id: "msg-123",
                header: {
                    key: "signing-key-1",
                    author: "org1-identity",
                },
                validator: "json",
                namespace: "default",
                hash: "abc123def456",
                created: new Date().toISOString(),
                value: { test: "data" },
                signingKey: "signing-key-1",
                author: "org1-identity",
            }

            expect(msg.id).toBe("msg-123")
            expect(msg.header.key).toBe("signing-key-1")
            expect(msg.validator).toBe("json")
            expect(msg.value.test).toBe("data")
        })
    })

    describe("Type Guards - isPackageDetailsMessage", () => {
        it("should identify valid PackageDetails messages", () => {
            const validMsg: FireFlyDatatypeMessage = {
                id: "msg-123",
                header: { key: "key1", author: "author1" },
                validator: "json",
                namespace: "default",
                hash: "hash123",
                created: new Date().toISOString(),
                value: {
                    id: "pkg-001",
                    pickupLocation: { address: "123 Main St" },
                    dropLocation: { address: "456 Oak Ave" },
                    size: { width: 10, height: 20, depth: 30 },
                    weightKg: 5.5,
                    urgency: "medium",
                } as PackageDetailsWithId,
                signingKey: "key1",
                author: "author1",
            }

            expect(isPackageDetailsMessage(validMsg)).toBe(true)
        })

        it("should reject messages without required properties", () => {
            const invalidMsg: FireFlyDatatypeMessage = {
                id: "msg-456",
                header: { key: "key2", author: "author2" },
                validator: "json",
                namespace: "default",
                hash: "hash456",
                created: new Date().toISOString(),
                value: {
                    id: "pkg-002",
                    // Missing required properties
                },
                signingKey: "key2",
                author: "author2",
            }

            expect(isPackageDetailsMessage(invalidMsg)).toBe(false)
        })

        it("should reject non-json validator messages", () => {
            const invalidMsg: FireFlyDatatypeMessage = {
                id: "msg-789",
                header: { key: "key3", author: "author3" },
                validator: "xml", // not json
                namespace: "default",
                hash: "hash789",
                created: new Date().toISOString(),
                value: {
                    id: "pkg-003",
                    pickupLocation: { address: "123 Main St" },
                    dropLocation: { address: "456 Oak Ave" },
                    size: { width: 10, height: 20, depth: 30 },
                    weightKg: 5.5,
                    urgency: "medium",
                },
                signingKey: "key3",
                author: "author3",
            }

            expect(isPackageDetailsMessage(invalidMsg)).toBe(false)
        })
    })

    describe("Type Guards - isTransferOfferMessage", () => {
        it("should identify valid TransferOffer messages", () => {
            const validMsg: FireFlyDatatypeMessage = {
                id: "msg-999",
                header: { key: "key4", author: "author4" },
                validator: "json",
                namespace: "default",
                hash: "hash999",
                created: new Date().toISOString(),
                value: {
                    externalPackageId: "pkg-004",
                    termsId: "terms-001",
                    fromMSP: "Org1MSP",
                    toMSP: "Org2MSP",
                    price: 100.5,
                    createdISO: new Date().toISOString(),
                    expiryISO: new Date(Date.now() + 86400000).toISOString(),
                } as TransferOfferData,
                signingKey: "key4",
                author: "author4",
            }

            expect(isTransferOfferMessage(validMsg)).toBe(true)
        })

        it("should reject messages without required TransferOffer properties", () => {
            const invalidMsg: FireFlyDatatypeMessage = {
                id: "msg-111",
                header: { key: "key5", author: "author5" },
                validator: "json",
                namespace: "default",
                hash: "hash111",
                created: new Date().toISOString(),
                value: {
                    externalPackageId: "pkg-005",
                    // Missing other required properties
                },
                signingKey: "key5",
                author: "author5",
            }

            expect(isTransferOfferMessage(invalidMsg)).toBe(false)
        })

        it("should allow null/undefined expiryISO in TransferOffer", () => {
            const validMsg: FireFlyDatatypeMessage = {
                id: "msg-222",
                header: { key: "key6", author: "author6" },
                validator: "json",
                namespace: "default",
                hash: "hash222",
                created: new Date().toISOString(),
                value: {
                    externalPackageId: "pkg-006",
                    termsId: "terms-002",
                    fromMSP: "Org1MSP",
                    toMSP: "Org2MSP",
                    price: 200.0,
                    createdISO: new Date().toISOString(),
                    expiryISO: null, // null is acceptable
                } as TransferOfferData,
                signingKey: "key6",
                author: "author6",
            }

            expect(isTransferOfferMessage(validMsg)).toBe(true)
        })
    })

    describe("PackageDetails Datatype", () => {
        it("should have correct name and version", () => {
            expect(PACKAGE_DETAILS_DT_NAME).toBe("PackageDetails")
            expect(PACKAGE_DETAILS_DT_VERSION).toBe("1.0.0")
        })

        it("should generate valid datatype payload", () => {
            const payload = packageDetailsDatatypePayload()

            expect(payload.name).toBe("PackageDetails")
            expect(payload.version).toBe("1.0.0")
            expect(payload.validator).toBe("json")
            expect(payload.value).toBeDefined()
            expect(payload.value.$schema).toBe(
                "https://json-schema.org/draft/2020-12/schema",
            )
        })

        it("should include required properties in schema", () => {
            const payload = packageDetailsDatatypePayload()

            expect(payload.value.properties).toHaveProperty("id")
            expect(payload.value.properties).toHaveProperty("pickupLocation")
            expect(payload.value.properties).toHaveProperty("dropLocation")
            expect(payload.value.properties).toHaveProperty("size")
            expect(payload.value.properties).toHaveProperty("weightKg")
            expect(payload.value.properties).toHaveProperty("urgency")

            expect(payload.value.required).toContain("id")
            expect(payload.value.required).toContain("pickupLocation")
            expect(payload.value.required).toContain("dropLocation")
            expect(payload.value.required).toContain("size")
            expect(payload.value.required).toContain("weightKg")
            expect(payload.value.required).toContain("urgency")
        })

        it("should use custom namespace in payload", () => {
            const payload = packageDetailsDatatypePayload("custom")

            expect(payload.value.$id).toContain("ff://custom/PackageDetails/1.0.0")
        })
    })

    describe("TransferOffer Datatype", () => {
        it("should have correct name and version", () => {
            expect(TRANSFER_OFFER_DT_NAME).toBe("TransferOffer")
            expect(TRANSFER_OFFER_DT_VERSION).toBe("1.0.0")
        })

        it("should generate valid datatype payload", () => {
            const payload = transferOfferDatatypePayload()

            expect(payload.name).toBe("TransferOffer")
            expect(payload.version).toBe("1.0.0")
            expect(payload.validator).toBe("json")
            expect(payload.value).toBeDefined()
            expect(payload.value.$schema).toBe(
                "https://json-schema.org/draft/2020-12/schema",
            )
        })

        it("should include required properties in schema", () => {
            const payload = transferOfferDatatypePayload()

            expect(payload.value.properties).toHaveProperty("externalPackageId")
            expect(payload.value.properties).toHaveProperty("termsId")
            expect(payload.value.properties).toHaveProperty("fromMSP")
            expect(payload.value.properties).toHaveProperty("toMSP")
            expect(payload.value.properties).toHaveProperty("price")
            expect(payload.value.properties).toHaveProperty("createdISO")
            expect(payload.value.properties).toHaveProperty("expiryISO")

            expect(payload.value.required).toContain("externalPackageId")
            expect(payload.value.required).toContain("termsId")
            expect(payload.value.required).toContain("fromMSP")
            expect(payload.value.required).toContain("toMSP")
            expect(payload.value.required).toContain("price")
            expect(payload.value.required).toContain("createdISO")
        })

        it("should use custom namespace in payload", () => {
            const payload = transferOfferDatatypePayload("production")

            expect(payload.value.$id).toContain(
                "ff://production/TransferOffer/1.0.0",
            )
        })
    })

    describe("Event Structure Consistency", () => {
        it("should have consistent header structure across all events", () => {
            const blockchainEvent: BlockchainEventDelivery = {
                output: { test: "data" },
                timestamp: new Date().toISOString(),
                header: {
                    key: "key1",
                    author: "author1",
                },
            }

            const messageEvent: FireFlyDatatypeMessage = {
                id: "msg-123",
                header: {
                    key: "key2",
                    author: "author2",
                },
                validator: "json",
                namespace: "default",
                hash: "hash123",
                created: new Date().toISOString(),
                value: {},
                signingKey: "key2",
                author: "author2",
            }

            // Both should have header with key and author
            expect(blockchainEvent.header).toHaveProperty("key")
            expect(blockchainEvent.header).toHaveProperty("author")

            expect(messageEvent.header).toHaveProperty("key")
            expect(messageEvent.header).toHaveProperty("author")
        })
    })
})
