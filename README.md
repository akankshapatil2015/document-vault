# Document Vault

A small Document Vault backend API built with Bun, TypeScript, GraphQL Yoga, PostgreSQL, and Prisma.

The API allows users to organize documents into collections, search documents, filter by collection and archived state, move documents between collections, and paginate documents using cursor-based pagination.

## Tech Stack

- Bun
- TypeScript (strict mode)
- GraphQL Yoga
- GraphQL schema-first development
- PostgreSQL
- Prisma ORM
- Docker Compose
- Bun Test

## Features

### Collections

- Create collections
- List collections
- Fetch a single collection
- Fetch a collection with its nested documents
- Validate collection names
- Validate collection slugs
- Prevent duplicate collection slugs

### Documents

- Create documents
- Update documents
- Delete documents
- Move documents between collections
- Search by substring match on title or content
- Filter by collection
- Filter by archived state
- Cursor-based pagination using `take` and `cursor`

### Validation

The API returns GraphQL errors for:

- Empty collection names
- Invalid collection slugs
- Empty document titles
- Empty document content
- Missing collections
- Missing documents
- Invalid pagination values
- Duplicate collection slugs

## Project Structure

```text
document-vault/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── graphql/
│   │   ├── resolvers.ts
│   │   └── schema.graphql
│   ├── lib/
│   │   └── prisma.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   │   └── resolvers.test.ts
│   └── integration/
│       └── document-vault.test.ts
├── docker-compose.yml
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── README.md