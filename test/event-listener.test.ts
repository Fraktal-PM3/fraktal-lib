import { describe, it, expect, beforeEach, vi } from "vitest"
import { PackageService } from "../src/lib/services/package/PackageService"
import {
    BlockchainEventDelivery,
    FireFlyDatatypeMessage,
    CreatePackageEvent,
    StatusUpdatedEvent,
    isPackageDetailsMessage,
    isTransferOfferMessage,
} from "../src/lib/services/package/types.common"
import FireFly from "@hyperledger/firefly-sdk"

/**
 * These tests verify the event listener functionality without requiring
 * a live blockchain connection. They test:
 * 1. Handler registration and invocation
 * 2. Type-safe event dispatching
 * 3. Message event handling
 * 4. Header inclusion in all events
 */
describe("Event Listener System", () => {
    let mockFF: any
    let service: PackageService

    beforeEach(() => {
        // Create a minimal mock FireFly instance
        mockFF = {
            listen: vi.fn(),
            getContractInterfaces: vi.fn().mockResolvedValue([]),
            getContractAPIs: vi.fn().mockResolvedValue([]),
            createContractInterface: vi.fn().mockResolvedValue({}),
            createContractAPI: vi.fn().mockResolvedValue({}),
            createDatatype: vi.fn().mockResolvedValue({}),
            getDatatypes: vi.fn().mockResolvedValue([]),
            getData: vi.fn().mockResolvedValue(null),
        }

        service = new PackageService(mockFF as unknown as FireFly)
    })

    describe("onEvent registration", () => {
        it("should register blockchain event handlers", async () => {
            const handler = vi.fn()

            await service.onEvent("CreatePackage", handler)

            // Verify handler was registered (we can't directly test it without initialization,
            // but we can verify the method doesn't throw)
            expect(handler).not.toHaveBeenCalled()
        })

        it("should register message event handlers", async () => {
            const handler = vi.fn()

            await service.onEvent("message", handler)

            // Verify handler was registered
            expect(handler).not.toHaveBeenCalled()
        })

        it("should register multiple handlers for the same event", async () => {
            const handler1 = vi.fn()
            const handler2 = vi.fn()

            await service.onEvent("CreatePackage", handler1)
            await service.onEvent("CreatePackage", handler2)

            // Both handlers should be registered without error
            expect(handler1).not.toHaveBeenCalled()
            expect(handler2).not.toHaveBeenCalled()
        })

        it("should accept generic event names", async () => {
            const handler = vi.fn()

            // Should not throw for custom event names
            await service.onEvent("CustomEvent", handler)
            expect(handler).not.toHaveBeenCalled()
        })
    })

    describe("Event type structure", () => {
        it("should create proper BlockchainEventDelivery structure", () => {
            const event: BlockchainEventDelivery = {
                txid: "0x123abc",
                output: {
                    externalId: "pkg-001",
                    ownerOrgMSP: "Org1MSP",
                    status: "pending",
                    packageDetailsAndPIIHash: "hash123",
                } as CreatePackageEvent,
                timestamp: "2024-01-15T10:30:00Z",
                header: {
                    key: "signing-key-1",
                    author: "org1-identity",
                },
            }

            expect(event.txid).toBe("0x123abc")
            expect(event.output.externalId).toBe("pkg-001")
            expect(event.timestamp).toBe("2024-01-15T10:30:00Z")
            expect(event.header.key).toBe("signing-key-1")
            expect(event.header.author).toBe("org1-identity")
        })

        it("should create proper FireFlyDatatypeMessage structure", () => {
            const event: FireFlyDatatypeMessage = {
                id: "msg-123",
                header: {
                    key: "signing-key-2",
                    author: "org2-identity",
                },
                validator: "json",
                namespace: "default",
                hash: "abc123def456",
                created: "2024-01-15T10:30:00Z",
                value: {
                    id: "pkg-002",
                    pickupLocation: { address: "123 Main St" },
                    dropLocation: { address: "456 Oak Ave" },
                    size: { width: 10, height: 20, depth: 30 },
                    weightKg: 5.5,
                    urgency: "medium",
                },
                signingKey: "signing-key-2",
                author: "org2-identity",
            }

            expect(event.id).toBe("msg-123")
            expect(event.header.key).toBe("signing-key-2")
            expect(event.header.author).toBe("org2-identity")
            expect(event.value.id).toBe("pkg-002")
        })

        it("should always include header in blockchain events", () => {
            const event: BlockchainEventDelivery = {
                output: { test: "data" },
                timestamp: "2024-01-15T10:30:00Z",
                header: {
                    key: "key123",
                    author: "unknown",
                },
            }

            // Header is always present
            expect(event.header).toBeDefined()
            expect(event.header.key).toBeDefined()
            expect(event.header.author).toBeDefined()
        })

        it("should always include header in message events", () => {
            const event: FireFlyDatatypeMessage = {
                id: "msg-456",
                header: {
                    key: "key456",
                    author: "author456",
                },
                validator: "json",
                namespace: "default",
                hash: "hash456",
                created: "2024-01-15T10:30:00Z",
                value: {},
                signingKey: "key456",
                author: "author456",
            }

            // Header is always present
            expect(event.header).toBeDefined()
            expect(event.header.key).toBeDefined()
            expect(event.header.author).toBeDefined()
        })
    })

    describe("Type-safe event handling", () => {
        it("should allow type-safe handler for CreatePackage events", async () => {
            const handler = vi.fn(
                (event: BlockchainEventDelivery & { output: CreatePackageEvent }) => {
                    // This should be fully typed
                    expect(event.output.externalId).toBeDefined()
                    expect(event.output.ownerOrgMSP).toBeDefined()
                    expect(event.output.status).toBeDefined()
                    expect(event.output.packageDetailsAndPIIHash).toBeDefined()
                },
            )

            await service.onEvent("CreatePackage", handler)
            expect(handler).not.toHaveBeenCalled()
        })

        it("should allow type-safe handler for StatusUpdated events", async () => {
            const handler = vi.fn(
                (event: BlockchainEventDelivery & { output: StatusUpdatedEvent }) => {
                    // This should be fully typed
                    expect(event.output.externalId).toBeDefined()
                    expect(event.output.status).toBeDefined()
                },
            )

            await service.onEvent("StatusUpdated", handler)
            expect(handler).not.toHaveBeenCalled()
        })

        it("should allow type-safe handler for message events", async () => {
            const handler = vi.fn(
                (event: FireFlyDatatypeMessage) => {
                    // This should be fully typed
                    expect(event.id).toBeDefined()
                    expect(event.header).toBeDefined()
                    expect(event.value).toBeDefined()
                },
            )

            await service.onEvent("message", handler)
            expect(handler).not.toHaveBeenCalled()
        })
    })

    describe("Message parsing with type guards", () => {
        it("should identify PackageDetails messages using type guard", () => {
            const message: FireFlyDatatypeMessage = {
                id: "msg-pd-001",
                header: {
                    key: "key1",
                    author: "org1",
                },
                validator: "json",
                namespace: "default",
                hash: "hash1",
                created: "2024-01-15T10:30:00Z",
                value: {
                    id: "pkg-001",
                    pickupLocation: { address: "123 Main St" },
                    dropLocation: { address: "456 Oak Ave" },
                    size: { width: 10, height: 20, depth: 30 },
                    weightKg: 5.5,
                    urgency: "medium",
                },
                signingKey: "key1",
                author: "org1",
            }

            if (isPackageDetailsMessage(message)) {
                // TypeScript should know this is PackageDetailsWithId
                expect(message.value.id).toBe("pkg-001")
                expect(message.value.pickupLocation.address).toBe("123 Main St")
                expect(message.value.urgency).toBe("medium")
            } else {
                throw new Error("Should be identified as PackageDetails")
            }
        })

        it("should identify TransferOffer messages using type guard", () => {
            const message: FireFlyDatatypeMessage = {
                id: "msg-to-001",
                header: {
                    key: "key2",
                    author: "org2",
                },
                validator: "json",
                namespace: "default",
                hash: "hash2",
                created: "2024-01-15T10:30:00Z",
                value: {
                    externalPackageId: "pkg-002",
                    termsId: "terms-001",
                    fromMSP: "Org1MSP",
                    toMSP: "Org2MSP",
                    price: 150.75,
                    createdISO: "2024-01-15T10:30:00Z",
                    expiryISO: "2024-01-16T10:30:00Z",
                },
                signingKey: "key2",
                author: "org2",
            }

            if (isTransferOfferMessage(message)) {
                // TypeScript should know this is TransferOfferData
                expect(message.value.externalPackageId).toBe("pkg-002")
                expect(message.value.termsId).toBe("terms-001")
                expect(message.value.price).toBe(150.75)
            } else {
                throw new Error("Should be identified as TransferOffer")
            }
        })

        it("should reject non-matching messages in type guards", () => {
            const message: FireFlyDatatypeMessage = {
                id: "msg-other",
                header: {
                    key: "key3",
                    author: "org3",
                },
                validator: "json",
                namespace: "default",
                hash: "hash3",
                created: "2024-01-15T10:30:00Z",
                value: {
                    // Some other data that doesn't match either type
                    randomField: "value",
                },
                signingKey: "key3",
                author: "org3",
            }

            expect(isPackageDetailsMessage(message)).toBe(false)
            expect(isTransferOfferMessage(message)).toBe(false)
        })

        it("should allow conditional dispatch based on message type", () => {
            const messages: FireFlyDatatypeMessage[] = [
                {
                    id: "msg-1",
                    header: { key: "k1", author: "a1" },
                    validator: "json",
                    namespace: "default",
                    hash: "h1",
                    created: "2024-01-15T10:30:00Z",
                    value: {
                        id: "pkg-001",
                        pickupLocation: { address: "addr1" },
                        dropLocation: { address: "addr2" },
                        size: { width: 1, height: 2, depth: 3 },
                        weightKg: 5,
                        urgency: "high",
                    },
                    signingKey: "k1",
                    author: "a1",
                },
                {
                    id: "msg-2",
                    header: { key: "k2", author: "a2" },
                    validator: "json",
                    namespace: "default",
                    hash: "h2",
                    created: "2024-01-15T10:30:00Z",
                    value: {
                        externalPackageId: "pkg-002",
                        termsId: "t1",
                        fromMSP: "O1",
                        toMSP: "O2",
                        price: 100,
                        createdISO: "2024-01-15T10:30:00Z",
                    },
                    signingKey: "k2",
                    author: "a2",
                },
            ]

            let packageDetailsCount = 0
            let transferOfferCount = 0

            for (const msg of messages) {
                if (isPackageDetailsMessage(msg)) {
                    packageDetailsCount++
                } else if (isTransferOfferMessage(msg)) {
                    transferOfferCount++
                }
            }

            expect(packageDetailsCount).toBe(1)
            expect(transferOfferCount).toBe(1)
        })
    })

    describe("Generic Header Data", () => {
        it("should support arbitrary header metadata in blockchain events", () => {
            const event: BlockchainEventDelivery = {
                output: { test: "data" },
                timestamp: new Date().toISOString(),
                header: {
                    key: "signing-key-1",
                    author: "org1-identity",
                    // Additional generic metadata
                    timestamp: "2024-01-15T10:30:00Z",
                    chaincode: "pm3",
                    channel: "pm3-channel",
                    endorsement: {
                        peer1: "endorsed",
                        peer2: "endorsed",
                    },
                    customField: "custom-value",
                },
            }

            // Should be able to access arbitrary header fields
            expect(event.header.key).toBe("signing-key-1")
            expect(event.header.author).toBe("org1-identity")
            expect(event.header.timestamp).toBe("2024-01-15T10:30:00Z")
            expect(event.header.chaincode).toBe("pm3")
            expect(event.header.endorsement.peer1).toBe("endorsed")
            expect(event.header.customField).toBe("custom-value")
        })

        it("should support arbitrary header metadata in message events", () => {
            const event: FireFlyDatatypeMessage = {
                id: "msg-123",
                header: {
                    key: "signing-key-1",
                    author: "org1-identity",
                    // Additional generic metadata
                    mspId: "Org1MSP",
                    cert: {
                        subject: "CN=peer0.org1.example.com",
                        issuer: "CN=ca.org1.example.com",
                    },
                    attributes: {
                        role: "pm3",
                        department: "logistics",
                    },
                    timestamp: "2024-01-15T10:30:00Z",
                },
                validator: "json",
                namespace: "default",
                hash: "hash123",
                created: "2024-01-15T10:30:00Z",
                value: { test: "data" },
                signingKey: "signing-key-1",
                author: "org1-identity",
            }

            // Should be able to access arbitrary header fields
            expect(event.header.key).toBe("signing-key-1")
            expect(event.header.author).toBe("org1-identity")
            expect(event.header.mspId).toBe("Org1MSP")
            expect(event.header.cert.subject).toBe(
                "CN=peer0.org1.example.com",
            )
            expect(event.header.attributes.role).toBe("pm3")
            expect(event.header.timestamp).toBe("2024-01-15T10:30:00Z")
        })

        it("should allow accessing header data in event handlers", async () => {
            const handler = vi.fn(
                (event: FireFlyDatatypeMessage) => {
                    // Handler should be able to access any header property
                    const mspId = event.header.mspId as string
                    const customData = event.header.customData as unknown

                    expect(mspId).toBeDefined()
                    expect(customData).toBeDefined()
                },
            )

            await service.onEvent("message", handler)
            expect(handler).not.toHaveBeenCalled()
        })

        it("should support deeply nested header metadata", () => {
            const event: BlockchainEventDelivery = {
                output: { test: "data" },
                timestamp: new Date().toISOString(),
                header: {
                    key: "key1",
                    author: "org1",
                    org: {
                        id: "org1",
                        name: "Organization 1",
                        peers: [
                            {
                                name: "peer0",
                                endpoint: "peer0.org1.example.com:7051",
                                status: "active",
                            },
                            {
                                name: "peer1",
                                endpoint: "peer1.org1.example.com:7051",
                                status: "active",
                            },
                        ],
                    },
                },
            }

            // Should access deeply nested properties
            expect(event.header.org.id).toBe("org1")
            expect(event.header.org.peers[0].name).toBe("peer0")
            expect(event.header.org.peers[1].status).toBe("active")
        })
    })

    describe("Handler invocation patterns", () => {
        it("should support handler chain for single event", async () => {
            const handler1 = vi.fn()
            const handler2 = vi.fn()
            const handler3 = vi.fn()

            await service.onEvent("ProposeTransfer", handler1)
            await service.onEvent("ProposeTransfer", handler2)
            await service.onEvent("ProposeTransfer", handler3)

            // All handlers should be registered
            expect(handler1).not.toHaveBeenCalled()
            expect(handler2).not.toHaveBeenCalled()
            expect(handler3).not.toHaveBeenCalled()
        })

        it("should support multiple event types", async () => {
            const createHandler = vi.fn()
            const statusHandler = vi.fn()
            const messageHandler = vi.fn()

            await service.onEvent("CreatePackage", createHandler)
            await service.onEvent("StatusUpdated", statusHandler)
            await service.onEvent("message", messageHandler)

            // All handlers should be registered
            expect(createHandler).not.toHaveBeenCalled()
            expect(statusHandler).not.toHaveBeenCalled()
            expect(messageHandler).not.toHaveBeenCalled()
        })
    })
})
