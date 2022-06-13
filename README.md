# Prisma Data Proxy Alternative

This is a library to alternate and self-host the [Prisma Data Proxy (cloud.prisma.io)](https://www.prisma.io/docs/concepts/data-platform/data-proxy).

In order to deploy your project to edge runtimes (such as Cloudflare Workers or Vercel Edge Functions) and use Prisma, you will need to use the Prisma Data Proxy.  
However, it is currently only available in a limited number of regions and the choice of data sources is limited. There is also the stress of latency caused by cold standby.

Therefore, I have created a server library that replaces the Prisma Data Proxy. Using it, you are free from those stressful limitations.  
You can deploy it on any platform in any region you like and use any data source you like, such as Supabase.

No changes are required to your prisma client code, just set the `DATABASE_URL` to the URL you self-hosted with this library.

### Caution 

This library is unaffiliated with the Prisma development team and is unofficial.  

Future updates to @prisma/client may make this library unavailable.

Use at your own risk.

## Set up

## Deploy 

### GCP Cloud Run

## Contribution

## LICENCE