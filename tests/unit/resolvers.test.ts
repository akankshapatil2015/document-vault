import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { resolvers } from "../../src/graphql/resolvers";
import { prisma } from "../../src/lib/prisma";

const queryResolvers = resolvers.Query;
const mutationResolvers = resolvers.Mutation;

let collectionId: string;
let secondCollectionId: string;
let documentId: string;

beforeAll(async () => {
    const firstCollection = await prisma.collection.create({
        data: {
            name: "Unit Test Collection",
            slug: `unit-test-${Date.now()}`,
        },
    });

    const secondCollection = await prisma.collection.create({
        data: {
            name: "Second Unit Test Collection",
            slug: `unit-test-second-${Date.now()}`,
        },
    });

    collectionId = firstCollection.id;
    secondCollectionId = secondCollection.id;
});

afterAll(async () => {
    await prisma.document.deleteMany({
        where: {
            OR: [
                { collectionId },
                { collectionId: secondCollectionId },
            ],
        },
    });

    await prisma.collection.deleteMany({
        where: {
            id: {
                in: [collectionId, secondCollectionId],
            },
        },
    });

    await prisma.$disconnect();
});

describe("Collection resolvers", () => {
    test("createCollection creates a collection", async () => {
        const result = await mutationResolvers.createCollection(
            {},
            {
                input: {
                    name: "Created By Test",
                    slug: `created-by-test-${Date.now()}`,
                },
            },
        );

        expect(result.name).toBe("Created By Test");

        await prisma.collection.delete({
            where: {
                id: result.id,
            },
        });
    });

    test("createCollection rejects an empty name", async () => {
        expect(
            mutationResolvers.createCollection(
                {},
                {
                    input: {
                        name: "   ",
                        slug: "valid-slug",
                    },
                },
            ),
        ).rejects.toThrow("Collection name cannot be empty");
    });

    test("createCollection rejects an invalid slug", async () => {
        expect(
            mutationResolvers.createCollection(
                {},
                {
                    input: {
                        name: "Invalid Slug",
                        slug: "Invalid Slug!",
                    },
                },
            ),
        ).rejects.toThrow(
            "Invalid slug. Use lowercase letters, numbers, and hyphens only.",
        );
    });

    test("collections returns collections", async () => {
        const result = await queryResolvers.collections();

        expect(Array.isArray(result)).toBe(true);
        expect(
            result.some((collection) => collection.id === collectionId),
        ).toBe(true);
    });

    test("collection returns a collection by id", async () => {
        const result = await queryResolvers.collection(
            {},
            {
                id: collectionId,
            },
        );

        expect(result?.id).toBe(collectionId);
    });
});

describe("Document resolvers", () => {
    test("createDocument creates a document", async () => {
        const result = await mutationResolvers.createDocument(
            {},
            {
                input: {
                    title: "Unit Test Document",
                    content: "Content used for resolver testing",
                    tags: ["test", "unit"],
                    collectionId,
                },
            },
        );

        documentId = result.id;

        expect(result.title).toBe("Unit Test Document");
        expect(result.content).toBe(
            "Content used for resolver testing",
        );
        expect(result.tags).toEqual(["test", "unit"]);
        expect(result.collectionId).toBe(collectionId);
    });

    test("createDocument rejects empty title", async () => {
        expect(
            mutationResolvers.createDocument(
                {},
                {
                    input: {
                        title: "   ",
                        content: "Valid content",
                        tags: [],
                        collectionId,
                    },
                },
            ),
        ).rejects.toThrow("Document title cannot be empty");
    });

    test("createDocument rejects empty content", async () => {
        expect(
            mutationResolvers.createDocument(
                {},
                {
                    input: {
                        title: "Valid title",
                        content: "   ",
                        tags: [],
                        collectionId,
                    },
                },
            ),
        ).rejects.toThrow("Document content cannot be empty");
    });

    test("documents returns documents with search", async () => {
        const result = await queryResolvers.documents(
            {},
            {
                collectionId,
                search: "resolver testing",
                take: 10,
            },
        );

        expect(result.nodes.length).toBeGreaterThan(0);
        expect(result.nodes[0]?.id).toBe(documentId);
    });

    test("documents filters by archived state", async () => {
        await mutationResolvers.updateDocument(
            {},
            {
                id: documentId,
                input: {
                    isArchived: true,
                },
            },
        );

        const archivedResult = await queryResolvers.documents(
            {},
            {
                collectionId,
                isArchived: true,
                take: 10,
            },
        );

        expect(
            archivedResult.nodes.some(
                (document) => document.id === documentId,
            ),
        ).toBe(true);
    });

    test("updateDocument updates the document", async () => {
        const result = await mutationResolvers.updateDocument(
            {},
            {
                id: documentId,
                input: {
                    title: "Updated Unit Test Document",
                    tags: ["updated"],
                    isArchived: false,
                },
            },
        );

        expect(result.title).toBe("Updated Unit Test Document");
        expect(result.tags).toEqual(["updated"]);
        expect(result.isArchived).toBe(false);
    });

    test("moveDocument moves the document to another collection", async () => {
        const result = await mutationResolvers.moveDocument(
            {},
            {
                id: documentId,
                collectionId: secondCollectionId,
            },
        );

        expect(result.collectionId).toBe(secondCollectionId);
    });

    test("deleteDocument deletes the document", async () => {
        const result = await mutationResolvers.deleteDocument(
            {},
            {
                id: documentId,
            },
        );

        expect(result.id).toBe(documentId);

        const deleted = await prisma.document.findUnique({
            where: {
                id: documentId,
            },
        });

        expect(deleted).toBeNull();
    });
});