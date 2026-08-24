import { GraphQLError } from "graphql";
import { prisma } from "../lib/prisma";

type DocumentFilters = {
    collectionId?: string;
    search?: string;
    isArchived?: boolean;
    take?: number;
    cursor?: string;
};

const validateTake = (take: number): number => {
    if (!Number.isInteger(take) || take < 1 || take > 100) {
        throw new GraphQLError("take must be between 1 and 100");
    }

    return take;
};

export const resolvers = {
    Query: {
        collections: async () => {
            return prisma.collection.findMany({
                orderBy: {
                    createdAt: "desc",
                },
            });
        },

        collection: async (
            _: unknown,
            args: { id: string },
        ) => {
            return prisma.collection.findUnique({
                where: {
                    id: args.id,
                },
            });
        },

        documents: async (
            _: unknown,
            args: DocumentFilters,
        ) => {
            const take = validateTake(args.take ?? 10);

            const where = {
                ...(args.collectionId
                    ? { collectionId: args.collectionId }
                    : {}),

                ...(args.isArchived !== undefined
                    ? { isArchived: args.isArchived }
                    : {}),

                ...(args.search?.trim()
                    ? {
                        OR: [
                            {
                                title: {
                                    contains: args.search.trim(),
                                    mode: "insensitive" as const,
                                },
                            },
                            {
                                content: {
                                    contains: args.search.trim(),
                                    mode: "insensitive" as const,
                                },
                            },
                        ],
                    }
                    : {}),
            };

            const documents = await prisma.document.findMany({
                where,
                orderBy: {
                    id: "asc",
                },
                take: take + 1,
                ...(args.cursor
                    ? {
                        skip: 1,
                        cursor: {
                            id: args.cursor,
                        },
                    }
                    : {}),
            });

            const hasNextPage = documents.length > take;

            const nodes = hasNextPage
                ? documents.slice(0, take)
                : documents;

            const lastNode = nodes.at(-1);

            const endCursor = lastNode?.id ?? null;

            return {
                nodes,
                pageInfo: {
                    hasNextPage,
                    endCursor,
                },
            };
        },
    },

    Mutation: {
        createCollection: async (
            _: unknown,
            args: {
                input: {
                    name: string;
                    slug: string;
                };
            },
        ) => {
            const name = args.input.name.trim();
            const slug = args.input.slug.trim().toLowerCase();

            if (!name) {
                throw new GraphQLError("Collection name cannot be empty");
            }

            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
                throw new GraphQLError(
                    "Invalid slug. Use lowercase letters, numbers, and hyphens only.",
                );
            }

            try {
                return await prisma.collection.create({
                    data: {
                        name,
                        slug,
                    },
                });
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message.includes("Unique constraint")
                ) {
                    throw new GraphQLError("A collection with this slug already exists");
                }

                throw error;
            }
        },
        createDocument: async (
            _: unknown,
            args: {
                input: {
                    title: string;
                    content: string;
                    tags: string[];
                    collectionId: string;
                };
            },
        ) => {
            const title = args.input.title.trim();
            const content = args.input.content.trim();

            if (!title) {
                throw new GraphQLError("Document title cannot be empty");
            }

            if (!content) {
                throw new GraphQLError("Document content cannot be empty");
            }

            const collection = await prisma.collection.findUnique({
                where: {
                    id: args.input.collectionId,
                },
            });

            if (!collection) {
                throw new GraphQLError("Collection not found");
            }

            return prisma.document.create({
                data: {
                    title,
                    content,
                    tags: args.input.tags,
                    collectionId: args.input.collectionId,
                },
            });
        },
        updateDocument: async (
            _: unknown,
            args: {
                id: string;
                input: {
                    title?: string | null;
                    content?: string | null;
                    tags?: string[] | null;
                    isArchived?: boolean | null;
                };
            },
        ) => {
            const existingDocument = await prisma.document.findUnique({
                where: {
                    id: args.id,
                },
            });

            if (!existingDocument) {
                throw new GraphQLError("Document not found");
            }

            const data: {
                title?: string;
                content?: string;
                tags?: string[];
                isArchived?: boolean;
            } = {};

            if (args.input.title !== undefined && args.input.title !== null) {
                const title = args.input.title.trim();

                if (!title) {
                    throw new GraphQLError("Document title cannot be empty");
                }

                data.title = title;
            }

            if (args.input.content !== undefined && args.input.content !== null) {
                const content = args.input.content.trim();

                if (!content) {
                    throw new GraphQLError("Document content cannot be empty");
                }

                data.content = content;
            }

            if (args.input.tags !== undefined && args.input.tags !== null) {
                data.tags = args.input.tags;
            }

            if (args.input.isArchived !== undefined && args.input.isArchived !== null) {
                data.isArchived = args.input.isArchived;
            }

            return prisma.document.update({
                where: {
                    id: args.id,
                },
                data,
            });
        },
        deleteDocument: async (
            _: unknown,
            args: {
                id: string;
            },
        ) => {
            const existingDocument = await prisma.document.findUnique({
                where: {
                    id: args.id,
                },
            });

            if (!existingDocument) {
                throw new GraphQLError("Document not found");
            }

            return prisma.document.delete({
                where: {
                    id: args.id,
                },
            });
        },
        moveDocument: async (
            _: unknown,
            args: {
                id: string;
                collectionId: string;
            },
        ) => {
            const document = await prisma.document.findUnique({
                where: {
                    id: args.id,
                },
            });

            if (!document) {
                throw new GraphQLError("Document not found");
            }

            const collection = await prisma.collection.findUnique({
                where: {
                    id: args.collectionId,
                },
            });

            if (!collection) {
                throw new GraphQLError("Collection not found");
            }

            return prisma.document.update({
                where: {
                    id: args.id,
                },
                data: {
                    collectionId: args.collectionId,
                },
            });
        },
    },

    Collection: {
        documents: async (collection: { id: string }) => {
            return prisma.document.findMany({
                where: {
                    collectionId: collection.id,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        },
    },
};