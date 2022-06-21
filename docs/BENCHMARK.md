## Performance Measurement

### Prerequisite

The database is Planetscale and is located in the same region as each PDP instance.

1. Official PDP provided by cloud.prisma.io (Northern Virginia) + Planetscale (Northern Virginia)
2. Alternative PDP deployed on Cloud Run (Tokyo) + Planetscale (Tokyo)
3. Alternative PDP deployed on Cloud Run (Northern Virginia) + Planetscale (Northern Virginia)

Measurements are performed by connecting from Nagoya, Japan.

100 records (ids) are retrieved from the table and measured.

```js
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const hrstart = process.hrtime();
await db.link.findMany({ select: { id: true }, take: 100 });
const hrend = process.hrtime(hrstart);
console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000_000);
```

### Result

|         | 1. Official PDP N.Virginia | 2. Self-hosted PDP Tokyo | 3. Self-hosted PDP N.Virginia |
|---------|----------------------------|--------------------------|-------------------------------|
|         | 669.824264ms               | 98.33391ms               | 243.413536ms                  |
|         | 685.022400ms               | 110.355187ms             | 235.073404ms                  |
|         | 747.648396ms               | 95.039208ms              | 242.249807ms                  |
|         | 639.583797ms               | 91.521624ms              | 242.825970ms                  |
|         | 634.054569ms               | 106.338754ms             | 254.642930ms                  |
| **Avg** | **675.226685ms**           | **100.317736ms**         | **243.641129ms**              |
|         | 🥉                         | 🥇                       | 🥈                            |

We can see that the latency of the official PDP is quite large.
What is surprising is that not only the self-hosted PDP installed in the Tokyo region is faster, but also the PDP installed in Northern Virginia, the same region as the official one, has a much smaller latency.