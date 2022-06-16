## Performance Measurement

### Prerequisite

#### Destinations
1. Prisma Data Proxy (PDP) in Virginia
2. Alternative Prisma Data Proxy (APDP) in Cloud Run Tokoy region

Both data sources are postgres on Supabase in the Tokyo region.

#### Source
Measured from Nagoya, Japan.

#### Measurement Commands

100 records (ids) are retrieved from the table and measured.

```js
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const hrstart = process.hrtime();
await db.product.findMany({ select: { id: true }, take: 100 });
const hrend = process.hrtime(hrstart);
console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000_000);
```

### Result

|     | PDP Virginia   | APDP Tokyo     |
|-----| -------------- |----------------|
|     | 918.641523ms   | 159.938201ms ● |
|     | 977.883531ms ● | 119.533758ms   |
|     | 803.163555ms ○ | 133.574260ms   |
|     | 914.233327ms   | 117.942565ms   |
|     | 823.160129ms   | 125.399713ms   |
|     | 857.897536ms   | 117.825723ms ○ |
| Avg | 882.496600ms   | 129.035703ms   |

- ●: Max
- ○: Min