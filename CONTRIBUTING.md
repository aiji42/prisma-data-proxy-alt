# Contributions

:crystal_ball: Thanks for considering contributing to this project! :crystal_ball:

These guidelines will help you send a pull request.

If you're submitting an issue instead, please skip this document.

If your pull request is related to a typo or the documentation being unclear, please click on the relevant page's `Edit`
button (pencil icon) and directly suggest a correction instead.

This project was made with your goodwill. The simplest way to give back is by starring and sharing it online.

Everyone is welcome regardless of personal background.

## Development process

First fork and clone the repository.

Run:

```bash
yarn install
yarn generate:pdp

docker-compose up
```

Now you can connect prisma client with `DATABASE_URL=prisma://localhost/?api_key=customtoken`.

---

Make sure everything is correctly setup with:

```bash
docker-compose up -d
docker-compose exec -T test ./wait-for-it.sh graphql:3000 --timeout=120 --strict -- yarn test:run
```

## How to write commit messages

We use [Conventional Commit messages](https://www.conventionalcommits.org/) to automate version management.

Most common commit message prefixes are:

* `fix:` which represents bug fixes, and generate a patch release.
* `feat:` which represents a new feature, and generate a minor release.
