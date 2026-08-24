import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createYoga, createSchema } from "graphql-yoga";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { resolvers } from "../../src/graphql/resolvers";
import { prisma } from "../../src/lib/prisma";

const schemaPath = join(
    import.meta.dir,
    "../../src/graphql/schema.graphql",
);

const typeDefs = await readFile(schemaPath, "utf8");

const yoga = createYoga({
    schema: createSchema({
        typeDefs,
        resolvers,
    }),
});

let collectionId: string;

beforeAll(async () => {
    const collection = await prisma.collection.create({
        data: {
            name: "Integration Test Collection",
            slug: `integration-test-${Date.now()}`,
        },
    });

    collectionId = collection.id;
});

afterAll(async () => {
    await prisma.document.deleteMany({
        where: {
            collectionId,
        },
    });

    await prisma.collection.delete({
        where: {
            id: collectionId,
        },
    });

    await prisma.$disconnect();
});

describe("Document Vault GraphQL integration", () => {
    test("creates and fetches a document through GraphQL", async () => {
        const createDocumentMutation = `
            mutation CreateDocument(
                $input: CreateDocumentInput!
            ) {
                createDocument(input: $input) {
                    id
                    title
                    content
                    tags
                    collectionId
                    isArchived
                }
            }
        `;

        const createResponse = await yoga.fetch(
            "http://localhost/graphql",
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    query: createDocumentMutation,
                    variables: {
                        input: {
                            title: "Integration Document",
                            content: "Created through GraphQL integration testing",
                            tags: ["integration", "test"],
                            collectionId,
                        },
                    },
                }),
            },
        );

        expect(createResponse.status).toBe(200);

        const createResult = (await createResponse.json()) as {
            data?: {
                createDocument?: {
                    id: string;
                    title: string;
                    content: string;
                    tags: string[];
                    collectionId: string;
                    isArchived: boolean;
                };
            };
            errors?: Array<{
                message: string;
            }>;
        };

        expect(createResult.errors).toBeUndefined();
        expect(createResult.data?.createDocument?.title).toBe(
            "Integration Document",
        );
        expect(createResult.data?.createDocument?.collectionId).toBe(
            collectionId,
        );

        const documentsQuery = `
            query Documents($collectionId: ID) {
                documents(collectionId: $collectionId) {
                    nodes {
                        id
                        title
                        content
                        tags
                        collectionId
                        isArchived
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
        `;

        const documentsResponse = await yoga.fetch(
            "http://localhost/graphql",
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    query: documentsQuery,
                    variables: {
                        collectionId,
                    },
                }),
            },
        );

        expect(documentsResponse.status).toBe(200);

        const documentsResult = (await documentsResponse.json()) as {
            data?: {
                documents?: {
                    nodes: Array<{
                        id: string;
                        title: string;
                        collectionId: string;
                    }>;
                    pageInfo: {
                        hasNextPage: boolean;
                        endCursor: string | null;
                    };
                };
            };
            errors?: Array<{
                message: string;
            }>;
        };

        expect(documentsResult.errors).toBeUndefined();

        const nodes = documentsResult.data?.documents?.nodes ?? [];

        expect(
            nodes.some(
                (document) =>
                    document.title === "Integration Document" &&
                    document.collectionId === collectionId,
            ),
        ).toBe(true);
    });
});