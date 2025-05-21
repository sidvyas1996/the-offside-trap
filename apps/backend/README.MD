apps/backend/
├── src/
│   ├── app.ts                 ← Main application file
│   ├── server.ts              ← Server startup
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── tactics.controller.ts
│   │   └── users.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── tactics.routes.ts
│   │   └── users.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── tactics.service.ts
│   │   └── users.service.ts
│   └── utils/
│       ├── auth.utils.ts
│       └── response.utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── package.json

## Development Commands

- Start database: `npm run db:start`
- Stop database: `npm run db:stop`
- Reset database: `npm run db:reset` (this will delete all data and reseed)
- Open Prisma Studio: `npm run db:studio` (visual database editor)
- Generate Prisma client: `npm run db:generate`
- Seed database: `npm run db:seed`