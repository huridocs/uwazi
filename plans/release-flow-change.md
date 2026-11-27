# Plan: Change the Uwazi release flow (middle ground first)

## Assessment (current state)

Long-lived branches and what a push to them does:

| Branch | Workflow | Script | GitHub artifact | Tarball | Docker image |
| --- | --- | --- | --- | --- | --- |
| `development` | — (integration base) | — | — | — | built, tested, pushed as `tree-<sha>` |
| `staging` | `create_pre_release.yml` ("Deploy staging") | `scripts/pre-release.sh` | pre-release (tag from `yarn version prerelease`) | yes (vestigial) | not promoted |
| `production` | `create_release.yml` ("Deploy production") | `scripts/release.sh` | full release (tag = `package.json` version) | yes (vestigial) | promoted to `latest` + `<version>` by `publish` job |
| `testing` | `create_testing_release.yml` | `scripts/testing-release.sh` | pre-release (tag `-testing<epoch>`) | yes (vestigial) | not promoted |

Deployment consumes the **docker image** (`ghcr.io/huridocs/uwazi:<version>` / `:latest`),
not the tarball. The tarball attachments are dead weight and can be removed now.

Supporting pieces:

- `scripts/merge_and_bump_staging.sh` — `development` → `staging`, `yarn version prerelease`.
- `scripts/merge_and_bump_production.sh` — `staging` → `production`, `yarn version patch`.
- `scripts/merge_to_prod_and_back_merge_branches.sh` — squash-merge the PR to
  `production`, then back-merge to `staging` (bumping the rc) and `development`.
- `.github/workflows/auto_version_bump.yml` — on a PR targeting `production`,
  bumps `package.json` when the version is not ahead of the max of (a) the latest
  GitHub release and (b) GHCR image tags. This is why the merged production tree is
  always a fresh, unreleased version.
- `.github/workflows/ci_docker_build_test_publish.yml` — builds test/runtime
  images tagged `tree-<sha>`; on a push to `production`, the `publish` job promotes
  `tree-<sha>` → `latest` + `<version>`.

Two immutability guards keep versions unique and are both checked by
`auto_version_bump.yml`:

1. GHCR image tags cannot be overwritten (`publish` refuses an existing `<version>` tag).
2. GitHub releases cannot be re-created for an existing tag (`gh release create` fails on duplicates).

Version semantics with the current Yarn 4 toolchain:

- `yarn version patch` on `1.229.349` → `1.229.350`.
- `yarn version prerelease` on `1.229.350` → `1.229.351-0` (note: `-0` suffix, not `-rc`).
- `yarn version patch` on `1.229.350-0` → `1.229.350` (drops the prerelease suffix).

## Target end state

- `staging` and `development` branches are gone (and, in the same cleanup, `testing`).
  PRs target `production` directly.
- A merge to `production` produces a **pre-release**, not a release.
- No tarball publication anywhere; the release/pre-release notes carry only the
  promoted docker image (`ghcr.io/huridocs/uwazi:<version>`).
- Actual (full) releases are **promoted/created manually** from a pre-release.

## Migration roadmap

- **Phase 1 — middle ground (this change).** All branches stay. A push to
  `production` produces **both** a full release and a transitional **pre-release**,
  and `staging` stops publishing pre-releases (pre-releases now belong to
  production). Tarball creation is dropped from the production release; both
  artifacts carry docker-image-only notes. Deployment is unaffected because it
  already consumes the docker image.
- **Phase 2 — production emits only a pre-release + manual promotion.** Add a
  `workflow_dispatch` (or documented `gh` command) that promotes a pre-release to a
  full release (flip `prerelease` → false, set `make_latest`). Switch the production
  workflow to create only the pre-release (`<version>`, `--prerelease`, docker notes).
  Update `auto_version_bump.yml` to key off **all** GitHub release tags + GHCR tags
  instead of only the latest release.
- **Phase 3 — remove the extra branches.** Delete `staging`, `development` (and
  `testing`), their workflows and merge scripts; simplify the PR→production flow.
  Remove tarball creation from the remaining scripts (staging/testing, if any remain
  until then) and update `SELF_HOSTED_INSTRUCTIONS.md` away from `uwazi.tgz`.

---

## Phase 1 — middle ground (detailed)

Two GitHub releases cannot share a tag, so the transitional pre-release uses a
distinct tag. Staging already owns `<version>-0` (Yarn 4 prerelease) and testing owns
`<version>-testing<epoch>`, so the transitional production pre-release uses
`<version>-pre`. This tag is temporary and disappears in Phase 2.

### Step 1: New script for the transitional production pre-release

**File:** `scripts/pre-release-production.sh` (new)

**Skeleton:**

```bash
#!/usr/bin/env bash
set -euo pipefail

# server=${1}
# ssh_user=${2}
gh_token=${3}

release_version="$(node -p "require('./package.json').version")"
previous_tag="$(git tag -l | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n1)"
release_notes="$(git log --oneline "$previous_tag".. | grep -v Merge | grep "(.*)" | cut -d" " -f2- | awk '{print "* " $0}')"

repo="${GITHUB_REPOSITORY:-huridocs/uwazi}"

cat > pre_release_notes.txt <<EOF
## What's changed

$release_notes

**Full Changelog**: https://github.com/$repo/compare/$previous_tag...$release_version

## Docker image

- \`ghcr.io/$repo:$release_version\`
EOF

GITHUB_TOKEN="$gh_token" gh release create "$release_version-pre" \
  --title "$release_version (pre-release)" \
  --notes-file pre_release_notes.txt \
  --prerelease \
  --target production
```

**Do:**

- Mirror the changelog logic of `scripts/release.sh`, but publish a `--prerelease`
  tagged `<version>-pre`, target `production`, and attach **no tarball**.
- Put only the promoted image (`ghcr.io/<repo>:<version>`) in the notes — this is the
  note format the end state requires, exercised now on the side.
- Use a plain-semver whitelist for `previous_tag` (`^[0-9]+\.[0-9]+\.[0-9]+$`,
  `sort -V`) so the new `-pre` tag, staging `-0` tags and testing `-testing<epoch>`
  tags are all excluded from the changelog baseline.

**Verify:** running the script against a fork (or with a `DRY_RUN` guard that prints
the `gh release create` command instead of executing it) produces a prerelease for
`<version>-pre` with no asset and a single `ghcr.io/...:<version>` image line.

### Step 2: Drop the tarball and harden `previous_tag` in `release.sh`

**File:** `scripts/release.sh`

**Do:**

1. Remove the tarball build and attachment:
   - delete `tar -czf uwazi.tgz ./prod`
   - drop the trailing `uwazi.tgz` argument from `gh release create`.
2. Replace the "## Docker images" section (tree SHA + friendly tag) with a single
   promoted-image line, matching the pre-release notes:

   ```bash
   repo="${GITHUB_REPOSITORY:-huridocs/uwazi}"

   cat > release_notes.txt <<EOF
   ## What's changed

   $release_notes

   **Full Changelog**: https://github.com/$repo/compare/$previous_tag...$release_version

   ## Docker image

   - \`ghcr.io/$repo:$release_version\`
   EOF
   ```

3. Replace the blacklist baseline

   ```bash
   previous_tag="$(git tag -l --sort=committerdate | grep -v "\-rc"| grep -v "\-testing" | tail -n1)"
   ```

   with the plain-semver whitelist:

   ```bash
   previous_tag="$(git tag -l | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n1)"
   ```

   This stops the new `-pre` tag (and any future non-plain tag) from being chosen as
   the "previous" tag for the changelog.

**Verify:** `release.sh` now creates a full release tagged `<version>` with no asset
and a single `ghcr.io/...:<version>` image line; changelog baseline is the previous
plain `x.y.z` tag.

### Step 3: Run both on a production push

**File:** `.github/workflows/create_release.yml`

**Do:** add a step after the existing `Release` step:

```yaml
      - name: Pre release (transitional)
        run: ./scripts/pre-release-production.sh ${{ secrets.DEPLOY_SERVER }} ${{ secrets.DEPLOY_USER }} ${{ secrets.GH_TOKEN }}
```

Leave the `Release` step, the Sentry step, and everything else as-is. The two scripts
run sequentially in the same job and write different note files
(`release_notes.txt` vs `pre_release_notes.txt`), so there is no conflict.

**Verify:** the workflow now produces, for one production push:

- a full release tagged `<version>` with docker-image-only notes and no asset, and
- a pre-release tagged `<version>-pre` with docker-image-only notes and no asset.

### Step 4: Confirm the version-bump guard is unaffected

**File:** `.github/workflows/auto_version_bump.yml` (read-only, no edit)

**Do:** confirm the transitional pre-release cannot change bump behaviour. The bump
reads only the latest **full** release (`select(.isLatest == true)`) and GHCR tags;
`<version>-pre` is a prerelease and is therefore ignored, and it adds no GHCR tag.

**Verify:** no edit required in this phase. Note for Phase 2: this guard must start
keying off all release tags, because production will stop emitting full releases and
`isLatest` will no longer be a reliable record.

### Step 5: Stop staging from publishing a pre-release

**Files:** `.github/workflows/create_pre_release.yml`, `scripts/pre-release.sh`
(left unused)

Pre-releases now belong to production, so the staging branch must stop publishing
GitHub pre-releases while the branch itself still exists.

**Do:**

- In `create_pre_release.yml`, remove the step that runs
  `./scripts/pre-release.sh ...` so a push to `staging` no longer creates a GitHub
  pre-release.
- Keep the production build and the staging Sentry release (`environment: staging`)
  steps unless we confirm those are no longer wanted either.
- Leave `scripts/pre-release.sh` on disk but unused; it is deleted in Phase 3 with
  the staging branch.

**Open question to confirm before shipping:** what currently triggers the staging
*deploy*? The only deployable artifact `create_pre_release.yml` produces today is the
pre-release (its tarball). If the staging deploy is triggered by that pre-release,
removing the step also removes the deploy signal and a replacement is needed first.
If the staging deploy is already docker-driven, this step is safe as written.

## Phase 1 verification (whole change)

- `bash -n scripts/release.sh scripts/pre-release-production.sh`
- Manual/fork run of the two scripts to confirm both releases are created with the
  expected tags, docker-image-only notes, and no tarball.
- Confirm `create_release.yml` still creates the Sentry release once per production push.
- Confirm a push to `staging` no longer creates a GitHub pre-release (after the
  staging-deploy-signal question in Step 5 is resolved).
- Confirm the `publish` job in `ci_docker_build_test_publish.yml` still promotes
  `tree-<sha>` → `latest` + `<version>` (unchanged), which is the image both new
  notes reference.

Follow-up flag: `SELF_HOSTED_INSTRUCTIONS.md` still downloads `uwazi.tgz`. Since
tarball publication is being dropped, that document needs a docker-based install/upgrade
path (Phase 3), unless self-hosted release downloads are intentionally out of scope.

Not covered here (deliberately, to keep the middle ground small): manual promotion,
production emitting only a pre-release, and removing `staging`/`development`/`testing`.