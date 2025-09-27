# 🚀 Sequelize Advanced Query Builder

**Powerful, type-safe query builder for Sequelize with pagination, filtering, sorting, and performance monitoring.**

> **SEO Keywords**: Advanced Sequelize query builder, TypeScript ORM, database pagination, SQL filtering, query optimization, performance monitoring, Node.js database layer, enterprise-ready ORM, scalable database queries, production-ready query builder

[![npm version](https://badge.fury.io/js/@prathammahajan%2Fsequelize-query-builder.svg)](https://badge.fury.io/js/@prathammahajan%2Fsequelize-query-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

[![GitHub stars](https://img.shields.io/github/stars/prathammahajan13/sequelize-query-builder.svg?style=social&label=Star)](https://github.com/prathammahajan13/sequelize-query-builder)
[![GitHub forks](https://img.shields.io/github/forks/prathammahajan13/sequelize-query-builder.svg?style=social&label=Fork)](https://github.com/prathammahajan13/sequelize-query-builder/fork)
[![GitHub watchers](https://img.shields.io/github/watchers/prathammahajan13/sequelize-query-builder.svg?style=social&label=Watch)](https://github.com/prathammahajan13/sequelize-query-builder)

## ✨ Features

- 🔍 **Advanced Filtering** - Complex queries with operators
- 📄 **Smart Pagination** - Page-based and offset-based pagination
- 🔄 **Flexible Sorting** - Multi-column sorting with null handling
- 🔗 **Easy Joins** - Simple join operations
- ⚡ **Performance Monitoring** - Built-in query performance tracking
- 🛡️ **Type Safety** - Full TypeScript support
- 🎯 **Error Handling** - Custom error classes for better debugging

## 🎯 Why Choose This Query Builder?

**Perfect for developers who need:**
- **Enterprise-grade database operations** with advanced query building capabilities
- **TypeScript-first development** with full type safety and IntelliSense support
- **Performance optimization** with built-in monitoring and caching
- **Scalable architecture** for large-scale applications
- **Production-ready solutions** with comprehensive error handling
- **Developer-friendly APIs** with intuitive method chaining
- **Extensible middleware system** for custom functionality
- **Cross-database compatibility** supporting MySQL, PostgreSQL, SQLite, and MariaDB

## 📦 Installation

```bash
npm install @prathammahajan/sequelize-query-builder
```

## 🚀 Quick Start

```javascript
const { createQueryBuilder } = require('@prathammahajan/sequelize-query-builder');

// Create query builder
const userBuilder = createQueryBuilder(User, {
  defaultPageSize: 10,
  enablePerformanceMonitoring: true
});

// Advanced query with pagination, filtering, and sorting
const result = await userBuilder
  .withPagination({ page: 1, pageSize: 10 })
  .withFilters({ isActive: true, name: 'John' })
  .withSorting({ column: 'createdAt', order: 'DESC' })
  .execute();

console.log(result.data);        // Array of users
console.log(result.pagination);  // Pagination info
console.log(result.performance); // Performance metrics
```

## 📋 Basic Usage

### Simple Queries
```javascript
// Find all active users
const users = await userBuilder.findAll({ isActive: true });

// Find one user
const user = await userBuilder.findOne({ email: 'john@example.com' });

// Count users
const count = await userBuilder.count({ isActive: true });
```

### Pagination
```javascript
const result = await userBuilder
  .withPagination({ page: 2, pageSize: 20 })
  .execute();

// Result includes:
// - data: Array of results
// - pagination: { page, pageSize, total, totalPages, hasNext, hasPrev }
```

### Filtering
```javascript
const result = await userBuilder
  .withFilters({
    isActive: true,
    age: { $gte: 18 },
    name: { $like: '%john%' }
  })
  .execute();
```

### Sorting
```javascript
const result = await userBuilder
  .withSorting([
    { column: 'createdAt', order: 'DESC' },
    { column: 'name', order: 'ASC' }
  ])
  .execute();
```

### Joins
```javascript
const result = await userBuilder
  .withJoins(['profile', 'orders'])
  .execute();
```

## 🔧 Configuration

```javascript
const userBuilder = createQueryBuilder(User, {
  defaultPageSize: 10,           // Default page size
  maxPageSize: 100,              // Maximum page size
  enableQueryLogging: true,      // Log queries
  enablePerformanceMonitoring: true, // Track performance
  allowedSortColumns: ['name', 'email', 'createdAt'],
  allowedJoinModels: ['Profile', 'Orders']
});
```

## 🎯 Advanced Examples

### Complex Query
```javascript
const result = await userBuilder
  .withPagination({ page: 1, pageSize: 25 })
  .withFilters({
    isActive: true,
    age: { $between: [18, 65] },
    $or: [
      { name: { $like: '%john%' } },
      { email: { $like: '%john%' } }
    ]
  })
  .withSorting({ column: 'createdAt', order: 'DESC' })
  .withJoins(['profile'])
  .execute();
```

### CRUD Operations
```javascript
// Create
const newUser = await userBuilder.create({
  name: 'John Doe',
  email: 'john@example.com'
});

// Update
const updated = await userBuilder.updateByPk(1, {
  name: 'John Updated'
});

// Delete
await userBuilder.destroyByPk(1);
```

## 📊 Performance Monitoring

```javascript
const result = await userBuilder
  .withPerformanceMonitoring()
  .execute();

console.log(result.performance);
// {
//   executionTime: 45,
//   queryCount: 2,
//   cacheHit: false
// }
```

## 🛠️ TypeScript Support

```typescript
import { createQueryBuilder, QueryBuilderConfig } from '@prathammahajan/sequelize-query-builder';

const userBuilder = createQueryBuilder(User, {
  defaultPageSize: 10
} as QueryBuilderConfig);

// Full type safety and IntelliSense support
```

## 🔍 Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal | `{ age: { $eq: 25 } }` |
| `$ne` | Not equal | `{ status: { $ne: 'inactive' } }` |
| `$gt` | Greater than | `{ age: { $gt: 18 } }` |
| `$gte` | Greater than or equal | `{ age: { $gte: 18 } }` |
| `$lt` | Less than | `{ age: { $lt: 65 } }` |
| `$lte` | Less than or equal | `{ age: { $lte: 65 } }` |
| `$like` | Like pattern | `{ name: { $like: '%john%' } }` |
| `$in` | In array | `{ status: { $in: ['active', 'pending'] } }` |
| `$between` | Between values | `{ age: { $between: [18, 65] } }` |
| `$and` | Logical AND | `{ $and: [{ age: { $gte: 18 } }, { status: 'active' }] }` |
| `$or` | Logical OR | `{ $or: [{ name: 'John' }, { email: 'john@example.com' }] }` |

## 📝 API Reference

### QueryBuilder Methods

| Method | Description |
|--------|-------------|
| `findAll(where?)` | Find all records |
| `findOne(where)` | Find one record |
| `findByPk(id)` | Find by primary key |
| `count(where?)` | Count records |
| `create(data)` | Create new record |
| `updateByPk(id, data)` | Update by primary key |
| `destroyByPk(id)` | Delete by primary key |
| `withPagination(options)` | Add pagination |
| `withFilters(filters)` | Add filters |
| `withSorting(sorting)` | Add sorting |
| `withJoins(joins)` | Add joins |
| `execute()` | Execute query |
| `executeWithCount()` | Execute with count |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Use Cases & Applications

**Ideal for:**
- **E-commerce platforms** requiring complex product filtering and pagination
- **Content management systems** with advanced search and sorting capabilities
- **Analytics dashboards** needing efficient data aggregation and reporting
- **API development** with RESTful endpoints requiring flexible querying
- **Microservices architecture** with database abstraction layers
- **Real-time applications** requiring optimized database performance
- **Enterprise software** with complex business logic and data relationships
- **Startup MVPs** needing rapid development with production-ready database operations

## 🔍 SEO & Discoverability

**Search Terms**: Sequelize query builder, TypeScript ORM, Node.js database layer, advanced SQL queries, database pagination, query optimization, performance monitoring, enterprise ORM, scalable database operations, production-ready query builder, MySQL query builder, PostgreSQL query builder, database abstraction layer, repository pattern implementation, data access layer, query performance optimization, database middleware, SQL query optimization, TypeScript database library, Node.js ORM extension

## 🙏 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/prathammahajan13/sequelize-query-builder/issues)
- 📖 **Documentation**: [GitHub Wiki](https://github.com/prathammahajan13/sequelize-query-builder/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/prathammahajan13/sequelize-query-builder/discussions)

---

**Made with ❤️ by [Pratham Mahajan](https://github.com/prathammahajan13)**