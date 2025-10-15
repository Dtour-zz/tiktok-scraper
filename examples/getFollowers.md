# getFollowers example

This example shows how to fetch the follower and following counts for a TikTok
user using the `tiktok-scraper` library. It supports two execution modes:

1. **Online** – fetches the live profile using TikTok's web API.
2. **Offline** – reads cached profile data from disk (useful when TikTok is
   inaccessible or for testing without network access).

## Prerequisites

```bash
npm install
npm run build   # optional, but recommended for faster start-up
```

`npm run build` produces the compiled `build/index.js` bundle that the example
can load immediately. If you skip the build step, the script falls back to
`ts-node` for on-the-fly TypeScript execution – which is slower, but still
works after `npm install`.

## Online usage

```bash
node examples/getFollowers.js meliawantsutostfu
```

If you omit the username, the script uses `meliawantsutostfu` by default. The
output includes:

- the username the script looked up
- which data source was used (`TikTok API` when online)
- the following count
- the follower count

## Offline usage

```bash
node examples/getFollowers.js --from-file examples/sampleProfile.json
```

The JSON file must contain either the raw profile object returned by
`getUserProfileInfo` or just its `stats` block. The bundled
`examples/sampleProfile.json` demonstrates the expected format.

## Troubleshooting

If the script prints a message like the one below, it means it could not find
the library entry point:

```
Unable to load the TikTok scraper library. Attempt 1: ...
```

This happens when you have not yet run `npm install` or `npm run build`. Run
those commands first, then retry. Alternatively, supply `--from-file` with a
previously saved JSON profile to bypass network access entirely.
