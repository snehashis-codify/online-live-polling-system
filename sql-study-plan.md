# SQL Study Plan

A short, focused round of practice before continuing the query-heavy part of Phase 6 (live results, per-question counts, creator dashboard). The goal is to fix specific gaps, not to pause the project.

## Why

Two bugs in the first version of `result.service.ts` were SQL bugs, not Drizzle bugs:

1. **Join fan-out.** `responses` was joined on `poll_id`, which paired every option with every response. The result had options × responses × answers rows, and the answer in a row didn't belong to the option in that row.
2. **GROUP BY rules.** `.select()` (all columns) combined with `.groupBy()` fails in Postgres, because the `answers` columns were neither grouped nor aggregated.

## Core rules to internalise

- **Joins follow relationships.** Join along a foreign key path (`answers.option_id → options.id`), not along any column two tables happen to share.
- **Before each join, ask how many rows each existing row becomes.** One-to-one keeps the count, one-to-many multiplies it, and two unrelated one-to-many joins multiply each other.
- **Under GROUP BY, select only these:** grouped columns, columns that depend on a grouped primary key, or aggregates.
- **`count(col)` vs `count(*)`.** With a LEFT JOIN, an unmatched row still exists with NULLs. `count(*)` counts it as 1 and `count(answers.id)` counts it as 0.
- **`count(distinct …)`** when the thing you're counting can appear in several rows, such as one response with two checkbox answers.
- **`WHERE` filters rows before grouping. `HAVING` filters groups after grouping.**

## Plan

### Step 1: Practice before writing more query code (2–3 days)

- [ ] pgexercises.com: the *Joins and Subqueries* and *Aggregation* sections (or SQLBolt lessons 1–12 if you prefer a gentler start)
- [ ] Seed the awkward data set (below)
- [ ] Exercises 1–4 (below), in raw SQL in `psql` or the Drizzle Studio SQL tab

### Step 2: Back to Phase 6

- [ ] Rule: write and run the raw SQL first, adding **one join at a time** and checking the row count after each, then translate it to Drizzle

### Step 3: Learn the rest when a feature needs it

- [ ] Window functions and `DISTINCT ON` (exercise 5): when building a "leading option" or leaderboard view
- [ ] Time buckets with `date_trunc` (exercise 6): when building the live votes chart
- [ ] Indexes and `EXPLAIN ANALYZE`: during the performance pass near the end
- [ ] Transactions and isolation levels: when concurrent-submission edge cases come up

## Seed data

Keep it small enough to count by hand:

- 1 poll, 2 questions: Q1 `radio`, Q2 `checkbox`
- 3 options per question
- 3 responses
- At least one Q2 response picks **two** options
- At least one option that **nobody** picks
- At least one response that skips Q2, if Q2 isn't mandatory

Before running any query, write down the result you expect. Then run it and compare.

## Exercises

Tables: `polls`, `questions`, `options`, `responses`, `answers`, `users`.

1. **Total responses for a poll.** Use only `responses`.
2. **The same number, from `answers`.** Why do you need `count(distinct response_id)`? What does plain `count(*)` give on your seed data, and why?
3. **The question with the most respondents.** Hint: count distinct responses per question, then sort and limit.
4. **Respondents who answered every mandatory question.** Hint: count distinct mandatory questions answered per response, then compare it with the total number of mandatory questions using `HAVING`.
5. **The leading option per question.** Solve it twice: once with `DISTINCT ON (question_id)`, once with `rank() over (partition by question_id order by votes desc)`. How does each one handle a tie?
6. **Votes per minute for a poll** (for a live chart). Use `date_trunc('minute', answers.created_at)` with `GROUP BY`. Minutes with no votes won't appear; look up `generate_series` to fill the gaps.

Bonus: run `EXPLAIN ANALYZE` on the results query and check whether `answers_option_idx` and `options_question_idx` are used. On a tiny seed table Postgres may choose a sequential scan anyway; find out why.

## Checkpoint: ready to move on when…

- [ ] You can look at a query with 3 joins and predict its row count before running it
- [ ] You can explain why `count(*)` and `count(answers.id)` differ after a LEFT JOIN
- [ ] You can say when to use `WHERE` and when to use `HAVING`
- [ ] Exercises 1–4 give the results you predicted on the seed data

## Resources (pick one per topic)

- **Practice:** [pgexercises.com](https://pgexercises.com) (Postgres-specific) or [sqlbolt.com](https://sqlbolt.com)
- **Indexes:** [use-the-index-luke.com](https://use-the-index-luke.com)
- **Later, for theory:** *Designing Data-Intensive Applications*, chapters 2–3 and 7
