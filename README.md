# loop-demo

**A self-healing repo built with gateproof + deja.**

This repo heals itself. Push triggers the loop. The loop runs until all gates pass.

## How it works

1. `prd.ts` defines what should exist (stories + gates)
2. Push to main triggers `.github/workflows/loop.yml`
3. Loop runs gates, agent fixes failures, repeats until green
4. Memory from [deja](https://deja.coey.dev) informs each iteration

## The loop

```bash
bun run loop              # runs until complete
touch .gateproof/PAUSED   # stop
rm .gateproof/PAUSED      # resume
```

## The meta

This repo was built using the loop. We used gateproof to build gateproof's demo.

The loop IS failure. Each iteration heals toward completion. There's no "max tries" - 
it runs until all gates pass. `PAUSED` is your kill switch.

## Built with

- [gateproof](https://github.com/acoyfellow/gateproof) - PRD-first development with gates
- [deja](https://deja.coey.dev) - Memory for agents

## Blog post

Read how we built this: [coey.dev/loop-demo](https://coey.dev/loop-demo) (coming soon)
