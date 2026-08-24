# 📁 Document Vault

A small Document Vault backend API built with **Bun, TypeScript, GraphQL Yoga, PostgreSQL, Prisma, Zod, and Docker Compose**.

It enables organizing documents into collections, searching and filtering documents, moving documents between collections, archiving documents, and cursor-based pagination.

---

## 🚀 Overview

Document Vault is a lightweight document management service that lets users:

- Create and organize documents into collections
- Search documents by title or content
- Filter documents by collection and archived status
- Move documents between collections
- Archive and unarchive documents
- Paginate documents using cursor-based pagination
- Validate input with clear GraphQL error responses

The API follows a **GraphQL schema-first** approach, with the schema defined in a `.graphql` file and resolvers implemented in TypeScript.

---

## ✨ Features

### Collections

- Create collections
- List collections
- Retrieve a single collection
- Fetch a collection with its nested documents
- Validate collection names
- Validate collection slugs
- Prevent duplicate collection slugs

### Documents

- Create documents
- Update documents
- Delete documents
- Move documents between collections
- Archive and unarchive documents
- Search by title or content
- Case-insensitive substring search
- Filter by collection
- Filter by archived state
- Cursor-based pagination using `take` and `cursor`

### Error Handling

The API returns GraphQL errors for:

- Empty collection names
- Invalid collection slugs
- Duplicate collection slugs
- Empty document titles
- Empty document content
- Missing collections
- Missing documents
- Invalid pagination values

---

## 🔧 Tech Stack

| Technology | Purpose |
|------------|---------|
| Bun | JavaScript/TypeScript runtime |
| TypeScript | Static typing |
| GraphQL Yoga | GraphQL server |
| GraphQL | API layer |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and migrations |
| Zod | Input validation |
| Docker Compose | Local PostgreSQL environment |
| Bun Test | Unit and integration testing |

---

## 📁 Project Structure

```text
document-vault/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── graphql/
│   │   ├── resolvers.ts
│   │   └── schema.graphql
│   │
│   ├── lib/
│   │   └── prisma.ts
│   │
│   └── server.ts
│
├── tests/
│   ├── unit/
│   │   └── resolvers.test.ts
│   │
│   └── integration/
│       └── document-vault.test.ts
│
├── docker-compose.yml
├── package.json
├── prisma.config.ts
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## 🛠️ Prerequisites

Make sure the following are installed:

- [Bun](https://bun.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

Verify the installations:

```bash
bun --version
docker --version
docker compose version
git --version
```

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/akankshapatil2015/document-vault.git
cd document-vault
```

Install dependencies:

```bash
bun install
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://vault_user:vault_password@localhost:5432/document_vault"
```

The credentials above match the local PostgreSQL configuration in `docker-compose.yml`.

The `.env` file is excluded from Git using `.gitignore`.

For other environments, configure `DATABASE_URL` with the appropriate PostgreSQL connection string.

---

## 🐘 Start PostgreSQL

The project uses Docker Compose to run PostgreSQL locally.

The Docker configuration uses:

- PostgreSQL 16
- Database: `document_vault`
- User: `vault_user`
- Port: `5432`
- Container: `document-vault-postgres`
- Persistent Docker volume: `postgres_data`

Start the database:

```bash
docker compose up -d
```

Check that the container is running:

```bash
docker ps
```

The PostgreSQL container should appear as:

```text
document-vault-postgres
```

You can verify that PostgreSQL is accepting connections:

```bash
docker exec document-vault-postgres pg_isready -U vault_user -d document_vault
```

Expected output:

```text
/var/run/postgresql:5432 - accepting connections
```

To stop PostgreSQL:

```bash
docker compose down
```

To stop PostgreSQL and remove the local database volume:

```bash
docker compose down -v
```

> The `-v` option deletes the local PostgreSQL data volume.

---

## 🗄️ Prisma Setup

Generate the Prisma Client:

```bash
bunx prisma generate
```

Apply the existing database migrations:

```bash
bunx prisma migrate dev
```

For a new schema migration:

```bash
bunx prisma migrate dev --name <migration-name>
```

For example:

```bash
bunx prisma migrate dev --name add_document_field
```

Check migration status:

```bash
bunx prisma migrate status
```

---

## ▶️ Run the API

Start the development server:

```bash
bun run dev
```

The GraphQL API is available at:

```text
http://localhost:4000/graphql
```

Open the endpoint in a browser to use the GraphiQL interface.

> The exact port is configured in `src/server.ts`.

---

## 🔌 GraphQL API

The API uses a **schema-first GraphQL architecture**.

The GraphQL schema is defined in:

```text
src/graphql/schema.graphql
```

Resolvers are implemented in:

```text
src/graphql/resolvers.ts
```

### Architecture

```text
GraphQL Schema
      ↓
GraphQL Yoga
      ↓
Resolvers
      ↓
Prisma Client
      ↓
PostgreSQL
```

---

## 📚 Collections

### Create a Collection

```graphql
mutation {
  createCollection(
    input: {
      name: "Work Documents"
      slug: "work-documents"
    }
  ) {
    id
    name
    slug
    createdAt
  }
}
```

### List Collections

```graphql
query {
  collections {
    id
    name
    slug
    createdAt
  }
}
```

### Get a Collection

Replace `<collection-id>` with an ID returned from `createCollection`.

```graphql
query {
  collection(id: "<collection-id>") {
    id
    name
    slug
    createdAt
    documents {
      id
      title
      content
      tags
      collectionId
      isArchived
      createdAt
    }
  }
}
```

---

## 📄 Documents

### Create a Document

Replace `<collection-id>` with an existing collection ID.

```graphql
mutation {
  createDocument(
    input: {
      title: "My First Document"
      content: "This is my first document in the vault."
      tags: ["work", "important"]
      collectionId: "<collection-id>"
    }
  ) {
    id
    title
    content
    tags
    collectionId
    isArchived
    createdAt
  }
}
```

### List Documents

```graphql
query {
  documents {
    nodes {
      id
      title
      content
      tags
      collectionId
      isArchived
      createdAt
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

## 🔎 Search Documents

Documents can be searched by title or content.

```graphql
query {
  documents(search: "important") {
    nodes {
      id
      title
      content
      tags
      isArchived
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Search uses case-insensitive substring matching.

---

## 🔍 Filter Documents

### Filter by Collection

```graphql
query {
  documents(collectionId: "<collection-id>") {
    nodes {
      id
      title
      collectionId
    }
  }
}
```

### Filter Archived Documents

```graphql
query {
  documents(isArchived: true) {
    nodes {
      id
      title
      isArchived
    }
  }
}
```

---

## 📑 Cursor-Based Pagination

The `documents` query supports:

- `take` — number of documents to return
- `cursor` — ID of the last document from the previous page

### First Request

```graphql
query {
  documents(take: 10) {
    nodes {
      id
      title
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Example `pageInfo`:

```json
{
  "hasNextPage": true,
  "endCursor": "<document-id>"
}
```

Use the returned `endCursor` to request the next page:

```graphql
query {
  documents(
    take: 10
    cursor: "<document-id>"
  ) {
    nodes {
      id
      title
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

The API limits `take` to a maximum of `100`.

---

## ✏️ Update a Document

Replace `<document-id>` with an existing document ID.

```graphql
mutation {
  updateDocument(
    id: "<document-id>"
    input: {
      title: "Updated Document"
      tags: ["work", "updated"]
      isArchived: true
    }
  ) {
    id
    title
    content
    tags
    isArchived
    collectionId
  }
}
```

---

## 📂 Move a Document

```graphql
mutation {
  moveDocument(
    id: "<document-id>"
    collectionId: "<target-collection-id>"
  ) {
    id
    title
    collectionId
  }
}
```

---

## 🗑️ Delete a Document

```graphql
mutation {
  deleteDocument(
    id: "<document-id>"
  ) {
    id
    title
  }
}
```

---

## 🧪 Testing

The project includes both unit and integration tests.

### Run All Tests

```bash
bun test
```

### Run Unit Tests

```bash
bun run test:unit
```

### Run Integration Tests

```bash
bun run test:integration
```

### Type Checking

```bash
bun run typecheck
```

### Run Complete Sanity Check

```bash
bun run sanity
```

The `sanity` script runs TypeScript type checking followed by the complete test suite.

---

## ✅ Test Coverage

The test suite covers:

### Collection Resolvers

- Creating collections
- Empty collection name validation
- Invalid slug validation
- Listing collections
- Fetching a collection by ID

### Document Resolvers

- Creating documents
- Empty title validation
- Empty content validation
- Searching documents
- Filtering archived documents
- Updating documents
- Moving documents
- Deleting documents

### Integration

- Creating a document through GraphQL
- Fetching a document through GraphQL

### Latest Verified Result

```text
14 pass
0 fail
28 expect() calls
```

---

# 🏗️ Architecture & Design Decisions

## Schema-First GraphQL

The GraphQL schema is maintained separately from the resolver implementation.

```text
schema.graphql
      ↓
GraphQL Yoga
      ↓
Resolvers
      ↓
Prisma
      ↓
PostgreSQL
```

This keeps the API contract explicit and separates the GraphQL API definition from the application logic.

---

## Prisma ORM

Prisma is used as the database access layer.

Benefits include:

- Type-safe database queries
- Generated TypeScript types
- Database migrations
- Relationship handling
- Safer CRUD operations

---

## PostgreSQL

PostgreSQL was selected because the application contains relational data.

```text
Collection
    │
    └── Documents
```

Each document belongs to a collection through `collectionId`.

---

## Docker Compose

PostgreSQL runs locally through Docker Compose.

```text
Application
     │
     │ localhost:5432
     ▼
Docker Container
     │
     ▼
PostgreSQL
```

This makes the local database environment reproducible without requiring PostgreSQL to be installed directly on the host machine.

---

## Cursor-Based Pagination

The documents API uses cursor-based pagination rather than offset pagination.

```text
Page 1
  ↓
endCursor
  ↓
Page 2
  ↓
endCursor
  ↓
Page 3
```

This allows clients to request subsequent pages using the ID of the last returned document.

---

## Input Validation

Input validation is performed before database operations using the application's validation layer.

Examples:

```text
Empty title
    ↓
GraphQL error

Invalid slug
    ↓
GraphQL error

Missing collection
    ↓
GraphQL error
```

This ensures invalid input is rejected before the corresponding database operation.

---

## Duplicate Collection Slugs

Collection slugs are:

1. Trimmed
2. Converted to lowercase
3. Validated against a URL-safe format
4. Protected by a database uniqueness constraint

Examples:

```text
work-documents
personal-documents
project-123
```

---

## Separation of Responsibilities

The project separates the main application layers:

```text
GraphQL Schema
      │
      ▼
Resolvers
      │
      ▼
Prisma Client
      │
      ▼
PostgreSQL
```

This makes the codebase easier to maintain and gives each layer a clear responsibility.

---

# 🛠️ Useful Commands

### Start PostgreSQL

```bash
docker compose up -d
```

### Stop PostgreSQL

```bash
docker compose down
```

### Stop PostgreSQL and Remove Local Database Volume

```bash
docker compose down -v
```

> The `-v` option deletes the local PostgreSQL data volume.

### Generate Prisma Client

```bash
bunx prisma generate
```

### Check Migration Status

```bash
bunx prisma migrate status
```

### Create a Migration

```bash
bunx prisma migrate dev --name <migration-name>
```

### Run the API

```bash
bun run dev
```

### Run All Tests

```bash
bun test
```

### Run Unit Tests

```bash
bun run test:unit
```

### Run Integration Tests

```bash
bun run test:integration
```

### Run Type Checking

```bash
bun run typecheck
```

### Run All Checks

```bash
bun run sanity
```

---

# 🔄 Development Workflow

A typical local development workflow is:

```bash
# 1. Install dependencies
bun install

# 2. Start PostgreSQL
docker compose up -d

# 3. Generate Prisma Client
bunx prisma generate

# 4. Apply database migrations
bunx prisma migrate dev

# 5. Start the API
bun run dev

# 6. Run tests
bun test

# 7. Run type checking
bun run typecheck
```

---

# 🔌 API Endpoint

GraphQL endpoint:

```text
http://localhost:4000/graphql
```

---

# 📦 Repository

GitHub repository:

https://github.com/akankshapatil2015/document-vault

The repository contains:

- Complete source code
- Prisma schema and migrations
- GraphQL schema
- GraphQL resolvers
- Docker configuration
- Unit tests
- Integration tests
- Environment setup instructions
- API examples
- Architecture and design documentation

---

# 👩‍💻 Author

**Akanksha Patil**

GitHub: https://github.com/akankshapatil2015
