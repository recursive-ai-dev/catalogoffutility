\# Restoring Availability for Catalog of Futility Without Removing Games or Apps

\#\# Executive summary

Your GitHub repo indicates your site is a Vite \+ React (TypeScript) “catalog” that runs embedded single-file HTML apps/games from the \`public/\` directory inside an iframe-based “Chamber” viewport. fileciteturn8file0L1-L1 fileciteturn13file0L1-L1 fileciteturn19file0L1-L1 The repo also includes a \`vercel.json\` configured for a static Vite build (\`npm run build\` → \`dist/\`) and security headers. fileciteturn9file0L1-L1

The single highest-probability “it looks down, but games/apps are still there” failure mode in this codebase is \*\*missing Supabase environment variables in production deployments\*\*: \`src/lib/supabase.ts\` throws a fatal error when \`VITE\_SUPABASE\_URL\` or \`VITE\_SUPABASE\_ANON\_KEY\` is absent in production. fileciteturn16file0L1-L1 Because Vite exposes client env vars only when prefixed with \`VITE\_\` and replaces them at build time, misconfigured hosting env vars can produce a “blank page / app won’t initialize” incident even if the hosting platform is healthy. citeturn4search6

For fastest recovery without removing games/apps, the most effective pattern is:

1\. \*\*Classify the outage\*\* (DNS vs TLS vs HTTP vs “client runtime crash”) using a short, non-destructive triage script and browser console checks. citeturn4search3turn4search6    
2\. \*\*If on Vercel (likely):\*\* immediately restore service with \*\*instant rollback\*\* (\`vercel rollback\`) if a recent deploy broke production, then fix root cause (often env vars) and re-deploy. citeturn9search1turn9search5    
3\. \*\*If self-hosted (VPS/Docker):\*\* verify system health (disk/RAM), web server status, logs, and certificate renewals; apply safe reload steps (e.g., Nginx config test → reload). citeturn2search2turn3search0

The rest of this report provides a diagnostic checklist, a step-by-step recovery plan with rollback points, a prioritized timeline, and concrete scripts/config snippets to bring the site back up while preserving your HTML games/apps intact.

\#\# Repository-derived context that shapes troubleshooting

The repo’s architecture strongly suggests you can restore availability without deleting any apps by focusing on \*\*hosting configuration, build artifacts, and environment variables\*\* rather than content removal:

Your site is a static Vite build that outputs to \`dist/\`, with React 19 \+ Vite \+ TypeScript and test tooling (Vitest). fileciteturn8file0L1-L1 fileciteturn10file0L1-L1 The Vercel configuration explicitly sets \`buildCommand\`, \`outputDirectory: "dist"\`, and global security headers. fileciteturn9file0L1-L1 Vercel documents \`vercel.json\` as the standard way to configure build commands, output directory, headers, rewrites, etc. citeturn0search5

Your games/apps are hosted as static HTML files in \`public/\` (and referenced via \`url\` values in \`src/data.ts\`), not uploaded by users at runtime. fileciteturn8file0L1-L1 fileciteturn13file0L1-L1 That means “keep games/apps” practically translates to:

\- Preserve the \`public/\` tree (source of truth) and ensure it gets copied into the served artifact (\`dist/\`) during build (Vite’s standard behavior for \`public/\`). fileciteturn8file0L1-L1 citeturn0search4    
\- Preserve the \`src/data.ts\` registry entries that point to those HTML files. fileciteturn13file0L1-L1    
\- Ensure hosting serves the built site and those static HTML files correctly.

Your “Chamber” uses an iframe with a restrictive-default sandbox (for file-based apps: \`allow-scripts allow-forms allow-same-origin\`; for inline \`srcDoc\`: \`allow-scripts\`). fileciteturn19file0L1-L1 This matters operationally because a misconfigured CSP/headers or a broken static path often shows up as \*\*iframe load failures\*\* or “assets blocked” rather than traditional server 500s.

Supabase authentication is a hard dependency in production: \`src/lib/supabase.ts\` throws when credentials are missing in \`PROD\`. fileciteturn16file0L1-L1 Supabase’s JS client requires a project URL and key to initialize. citeturn4search8 Vite only exposes variables prefixed with \`VITE\_\` to client code, and those values are statically embedded at build time. citeturn4search6 This combination creates a common incident pattern on static hosts: “deployment succeeded, but production page is blank” after env vars were removed/renamed or only set for Preview but not Production.

Vercel platform limits can also cause apparent downtime if deployments start failing (source file upload size, file count, build time ceiling). Vercel documents static upload and file-count limits and a 45-minute build limit. citeturn0search0

\#\# Diagnostic checklist for downtime without removing games/apps

This section is designed as a “fail-fast” classifier. Do these checks in order; each step narrows the problem domain without modifying or deleting your games/apps.

\#\#\# Quick symptom-to-cause map

| What you observe | High-probability cause category | Fast confirmation checks | “No-removal” fix direction |  
|---|---|---|---|  
| Domain does not resolve (\`ERR\_NAME\_NOT\_RESOLVED\`, \`NXDOMAIN\`) | DNS records missing, nameservers wrong, DNSSEC issue, expired domain | \`dig \+short A yourdomain\`, \`dig NS yourdomain\`, check DNSSEC/\`SERVFAIL\` patterns citeturn4search3turn4search1 | Restore correct NS \+ A/AAAA/CNAME; fix DNSSEC DS records if applicable citeturn4search1turn4search3 |  
| Domain resolves but HTTPS fails (browser “certificate” warnings, TLS handshake errors) | Certificate expired/misissued, wrong cert on the endpoint, CDN SSL mode mismatch | \`openssl s\_client \-servername yourdomain \-connect yourdomain:443\` (inspect cert dates); check platform-managed cert status | Renew/replace cert; on self-host run \`certbot renew \--dry-run\` citeturn3search4turn3search1 |  
| HTTPS works but you get \`404\` everywhere | Wrong host routing, missing build output, incorrect root or rewrites, wrong deployment promoted | \`curl \-I https://yourdomain/\` and check headers/body; confirm deploy served is correct | Promote correct deploy / fix routing rules; restore correct \`dist/\` |  
| HTTPS works but you get \`502/503/504\` | Origin down (VPS/app crash), reverse proxy upstream failure, resource exhaustion, provider incident | If VPS: \`systemctl status\`, \`journalctl \-u\`, \`docker ps\` citeturn2search2turn7search1 | Restart services safely, fix config, scale resources |  
| Page loads HTML but goes blank / console shows crash early | \*\*Client runtime error\*\* (very likely: missing Supabase env vars in PROD) | Browser console: error thrown from \`supabase.ts\`; view-source returns HTML but JS fails | Restore \`VITE\_SUPABASE\_URL\`/\`VITE\_SUPABASE\_ANON\_KEY\` and redeploy; optionally harden code to degrade gracefully fileciteturn16file0L1-L1 citeturn4search6turn0search2 |  
| Deployments suddenly failing | Build/deploy pipeline and/or platform limits | Check build logs; measure repo size/file count; compare against Vercel limits citeturn0search0turn9search1 | Adjust pipeline, split artifacts, move heavy static to object storage/CDN (apps still accessible) |

\#\#\# DNS and domain checks

1\. Confirm the resolver sees your records:  
   \`\`\`bash  
   dig \+short A yourdomain.com  
   dig \+short AAAA yourdomain.com  
   dig \+short CNAME www.yourdomain.com  
   dig NS yourdomain.com  
   \`\`\`  
   Cloudflare’s troubleshooting docs explicitly call out missing DNS records and nameserver mismatches as common causes of DNS resolution errors. citeturn4search3

2\. If you see \`SERVFAIL\`, test whether DNSSEC is the culprit:  
   \`\`\`bash  
   dig A yourdomain.com @1.1.1.1 \+dnssec  
   dig A yourdomain.com @1.1.1.1 \+dnssec \+cd \+short  
   \`\`\`  
   A “works with \`+cd\` but fails without it” pattern is consistent with a DNSSEC validation failure (often stale DS records after DNS provider changes). citeturn4search1

3\. Confirm the domain hasn’t slipped into an expiration lifecycle (website/email can stop when the domain is disabled at the registry). ICANN’s ERRP describes required renewal notices and post-expiration restoration notice requirements, and many registrars implement grace/redemption windows. citeturn5search8turn5search4

\#\#\# TLS/SSL checks

If you self-host (not a managed host like Vercel), certificate renewal issues are a classic “site is down” cause. Certbot provides a safe renewal test:  
\`\`\`bash  
sudo certbot renew \--dry-run  
\`\`\`  
Certbot’s official instructions recommend \`certbot renew \--dry-run\` to test automatic renewal. citeturn3search4turn3search1

Also note: Let’s Encrypt is moving toward shorter certificate lifetimes over the next two years (from 90 days to 64, then 45), which increases the importance of automation and monitoring renewals. citeturn2search0turn2search3

\#\#\# Hosting/build/deploy checks (Vercel-likely path)

If you’re on Vercel, classify the incident in terms of “bad deployment” vs “platform config / env var change”:

\- Does the last successful deployment coincide with the outage start?  
\- Are production env vars set correctly, and were they recently changed?

Vercel documents that environment variable changes apply only to \*\*new\*\* deployments (previous deployments aren’t retroactively changed). citeturn0search2 This interacts critically with Vite’s build-time env embedding. citeturn4search6

Vercel also documents operational limits (build time, source upload size, file counts) that can cause deployments to fail even when your code is fine. citeturn0search0

\#\#\# Server/process/container checks (VPS/Docker path)

If you’re not on Vercel (or you have an additional origin behind a proxy), use these non-destructive checks:

\- systemd service status \+ logs:  
  \`\`\`bash  
  systemctl status nginx  
  systemctl status your-app.service  
  journalctl \-u nginx \-n 200 \--no-pager  
  journalctl \-u your-app.service \-n 200 \--no-pager  
  \`\`\`  
  \`journalctl\` is the standard tool to query the systemd journal and can filter by unit (\`-u\`). citeturn2search2

\- Nginx config safety check \+ reload:  
  \`\`\`bash  
  nginx \-t  
  nginx \-s reload  
  \`\`\`  
  NGINX documents runtime control via signals and \`nginx \-s reload\` for configuration reload. citeturn3search0

\- Docker basics:  
  \`\`\`bash  
  docker ps  
  docker logs \--tail=200 your\_container  
  docker compose ps  
  docker compose logs \--tail=200  
  \`\`\`

\#\# Step-by-step recovery plan with rollback points, commands, scripts, and time/risk estimates

This plan is written to preserve your games/apps \*\*as-is\*\* (no deletion), while adding safe rollback points at every stage.

\#\#\# Recovery principle: lock in safety before touching production

The “no regrets” ordering is:

1\) capture evidence \+ backups → 2\) restore service (rollback) → 3\) fix root cause → 4\) redeploy safely → 5\) harden so it doesn’t recur.

\#\#\# Step plan (with rollback points)

| Step | Goal | Commands / actions | Safe rollback point | Est. time | Risk |  
|---|---|---|---|---:|---|  
| Stabilize | Avoid making it worse | Freeze merges; note outage start time; capture current DNS answers and HTTP response headers | N/A | 10–20m | Low |  
| Preserve content integrity | Ensure games/apps aren’t altered while debugging | Generate checksum manifest for \`public/\` and \`src/data.ts\` (script below) | Manifest serves as integrity baseline | 10–30m | Low |  
| Classify outage | DNS vs TLS vs HTTP vs client crash | Run triage script (below) \+ browser devtools console | N/A | 15–30m | Low |  
| Restore service fast (Vercel) | Get site back up immediately | \`vercel rollback\` if a bad prod deploy; verify logs | Previous prod deployment | 2–10m | Low |  
| Fix env/config root cause (Vercel \+ Vite) | Resolve the most common “blank app” failure | Ensure \`VITE\_SUPABASE\_URL\` \+ \`VITE\_SUPABASE\_ANON\_KEY\` exist for \*\*Production\*\*; redeploy | If redeploy fails, re-rollback | 15–60m | Medium |  
| Fix server stack (VPS) | Restore web server/app processes | \`systemctl\`/\`journalctl\` diagnosis; \`nginx \-t\` then reload; restart app; check resources | Previous config backup; \`nginx \-t\` prevents bad reload | 30–120m | Medium |  
| Validate \+ smoke test | Confirm apps run, iframe loads, auth works | Automated curl checks \+ manual “open 3–5 apps” | If failing, revert deploy/restore config | 20–60m | Low–Medium |  
| Post-incident hardening | Prevent recurrence | Monitoring \+ backups \+ CI gates | N/A | 1–4w | Low |

\#\#\# Bash triage script (DNS → TLS → HTTP)

This script is read-only and safe to run from your laptop:

\`\`\`bash  
\#\!/usr/bin/env bash  
set \-euo pipefail

DOMAIN="${1:-}"  
if \[\[ \-z "$DOMAIN" \]\]; then  
  echo "Usage: $0 yourdomain.com"  
  exit 2  
fi

echo "== DNS \=="  
command \-v dig \>/dev/null 2\>&1 || { echo "dig not found"; exit 1; }  
echo "A:    $(dig \+short A "$DOMAIN" | tr '\\n' ' ')"  
echo "AAAA: $(dig \+short AAAA "$DOMAIN" | tr '\\n' ' ')"  
echo "NS:   $(dig \+short NS "$DOMAIN" | tr '\\n' ' ')"  
echo "CNAME www: $(dig \+short CNAME "www.$DOMAIN" || true)"

echo  
echo "== HTTP(S) headers \=="  
command \-v curl \>/dev/null 2\>&1 || { echo "curl not found"; exit 1; }  
curl \-sS \-D \- "https://$DOMAIN/" \-o /dev/null | sed \-n '1,20p' || true

echo  
echo "== Render check (HTML present?) \=="  
curl \-sS "https://$DOMAIN/" | head \-n 20 || true

echo  
echo "== TLS certificate dates (best effort) \=="  
if command \-v openssl \>/dev/null 2\>&1; then  
  echo | openssl s\_client \-servername "$DOMAIN" \-connect "$DOMAIN:443" 2\>/dev/null \\  
    | openssl x509 \-noout \-issuer \-subject \-dates || true  
else  
  echo "openssl not found; skipping TLS inspection"  
fi

echo  
echo "Done. Next: if DNS/TLS/HTTP look ok but the site is blank, check browser console for JS runtime crash."  
\`\`\`

DNS triage is grounded in standard \`dig\` usage; Cloudflare’s docs explicitly demonstrate using \`dig\` to query DNS answers. citeturn4search1turn4search3

\#\#\# Integrity baseline script for “games/apps remain intact”

Because your apps are static HTML files in \`public/\` and referenced from \`src/data.ts\`, a lightweight integrity baseline is a checksum manifest of those files. fileciteturn8file0L1-L1 fileciteturn13file0L1-L1

\`\`\`bash  
\#\!/usr/bin/env bash  
set \-euo pipefail

OUT\_DIR="${1:-integrity}"  
mkdir \-p "$OUT\_DIR"

\# Hash the app registry \+ all shipped HTML apps/assets  
sha256sum src/data.ts \> "$OUT\_DIR/sha256.data.ts.txt"  
find public \-type f \-print0 \\  
  | sort \-z \\  
  | xargs \-0 sha256sum \> "$OUT\_DIR/sha256.public.txt"

echo "Wrote:"  
echo " \- $OUT\_DIR/sha256.data.ts.txt"  
echo " \- $OUT\_DIR/sha256.public.txt"  
\`\`\`

You can later verify with:  
\`\`\`bash  
sha256sum \-c integrity/sha256.data.ts.txt  
sha256sum \-c integrity/sha256.public.txt  
\`\`\`

\#\#\# Vercel-first recovery path (likely given repo)

Your repo includes \`vercel.json\` and Vercel-specific configuration. fileciteturn9file0L1-L1 Vercel provides two operationally distinct safety levers:

\- \*\*Rollback (routing-layer revert to previous production)\*\*: fast restore without rebuild. citeturn9search1turn9search5    
\- \*\*Promote/Deploy\*\*: rebuild and publish a fixed artifact (and pick up environment variable changes). citeturn9search0turn9search4

\#\#\#\# Immediate restore: rollback

If production broke after a deploy, Vercel documents a direct rollback workflow:

\`\`\`bash  
\# confirm the problem via logs (example from Vercel docs)  
vercel logs \--environment production \--status-code 5xx \--since 30m

\# restore service  
vercel rollback  
vercel rollback status  
\`\`\`

Vercel’s rollback guide describes \`vercel rollback\` as an instant reroute to the previous production deployment (seconds) and provides exactly this style of command flow. citeturn9search1

\#\#\#\# Fix the most likely root cause: missing Supabase env vars in production

Your production build will crash if Supabase credentials are missing. fileciteturn16file0L1-L1 Because Vite only exposes \`VITE\_\`-prefixed variables to client code (and embeds them at build time), you must ensure the host’s production environment has:

\- \`VITE\_SUPABASE\_URL\`  
\- \`VITE\_SUPABASE\_ANON\_KEY\` citeturn4search6turn4search8

And then trigger a \*\*new\*\* production deployment, because Vercel notes env var changes apply only to future deployments. citeturn0search2

Operationally safe sequence:

1\. Set env vars in Vercel Project → Environment Variables (Production scope).  
2\. Redeploy with:  
   \`\`\`bash  
   vercel deploy \--prod  
   \`\`\`  
3\. Validate.  
4\. If validation fails, rollback again:  
   \`\`\`bash  
   vercel rollback  
   \`\`\`

If you need to reproduce exactly what Production sees locally (including env vars), Vercel documents \`vercel env pull\` for Development env downloads (useful to sync values). citeturn0search2

\#\#\#\# Watch for deployment limit failures (especially with many static files)

If deploys are failing (or succeed but with missing files), compare your source and artifact characteristics to Vercel’s published limits (build time ceiling, file count, static upload limits). citeturn0search0 A content-preserving mitigation is to keep games/apps accessible while restructuring delivery (examples in the migration/scaling section).

\#\#\# VPS/self-host recovery path (Nginx \+ static build)

If you’re serving \`dist/\` from a Linux host, a robust “do no harm” Nginx procedure is:

1\. Back up config:  
   \`\`\`bash  
   sudo cp \-a /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak.$(date \+%F-%H%M%S)  
   sudo cp \-a /etc/nginx/sites-enabled /etc/nginx/sites-enabled.bak.$(date \+%F-%H%M%S)  
   \`\`\`  
2\. Validate config:  
   \`\`\`bash  
   sudo nginx \-t  
   \`\`\`  
3\. Reload:  
   \`\`\`bash  
   sudo nginx \-s reload  
   \`\`\`  
NGINX’s docs describe signaling the master process, including \`nginx \-s reload\`, for config reloads. citeturn3search0

Then read logs via systemd journal:  
\`\`\`bash  
journalctl \-u nginx \-n 200 \--no-pager  
\`\`\`  
\`journalctl\` is the standard tool for querying systemd-journald logs and supports filtering by unit (\`-u\`). citeturn2search2

\#\#\# Mermaid deployment flow diagram (Vercel-oriented, with env var risk)

\`\`\`mermaid  
flowchart TD  
  Dev\[Developer commits to GitHub\] \--\> CI\[Optional CI: npm test \+ build\]  
  CI \--\> VercelBuild\[Vercel build: npm install && npm run build\]  
  VercelBuild \--\> Dist\[dist/ static artifact\]  
  Dist \--\> Deploy\[Deployment routed to preview/prod domains\]

  subgraph BuildTimeEnv\["Build-time environment variables (critical for Vite)"\]  
    Env\[VITE\_SUPABASE\_URL / VITE\_SUPABASE\_ANON\_KEY\] \--\> ViteEmbed\[Vite embeds into JS bundle\]  
  end

  Env \--\> VercelBuild  
  ViteEmbed \--\> Deploy

  Deploy \--\> User\[Browser loads app\]  
  User \--\> Iframe\[Chamber iframe loads /public HTML apps copied into dist\]  
\`\`\`

This diagram reflects that Vite statically embeds \`import.meta.env\` values at build time and only exposes \`VITE\_\`-prefixed vars. citeturn4search6 It also reflects your repo’s \`public/\`-hosted HTML apps approach. fileciteturn8file0L1-L1

\#\#\# Mermaid rollback plan diagram (multi-environment)

\`\`\`mermaid  
flowchart TD  
  A\[Production incident detected\] \--\> B{Outage class?}

  B \--\>|DNS NXDOMAIN/SERVFAIL| DNS\[Fix registrar/NS/DNS records\]  
  B \--\>|TLS/cert errors| TLS\[Renew/replace certificate\]  
  B \--\>|HTTP 5xx/502| HTTP\[Restore origin/app process\]  
  B \--\>|Blank page / JS crash| JS\[Fix client runtime config (env vars)\]

  HTTP \--\> H1{Hosting type?}  
  JS \--\> H1

  H1 \--\>|Vercel| V1\[Immediate: vercel rollback\]  
  V1 \--\> V2\[Fix root cause (env vars / code) \+ vercel deploy \--prod\]  
  V2 \--\> V3{Pass smoke tests?}  
  V3 \--\>|No| V1  
  V3 \--\>|Yes| Done\[Close incident \+ harden\]

  H1 \--\>|VPS/systemd| S1\[Check systemctl \+ journalctl, disk/RAM\]  
  S1 \--\> S2\[nginx \-t then nginx \-s reload; restart app\]  
  S2 \--\> S3{Pass smoke tests?}  
  S3 \--\>|No| S4\[Rollback via config backup / previous release symlink\]  
  S3 \--\>|Yes| Done  
\`\`\`

Vercel’s docs explicitly support fast rollback (\`vercel rollback\`) and promotion workflows. citeturn9search1turn9search5turn9search0

\#\# Prioritized action timeline

All dates/timing are relative to \*\*today (2026-03-27, America/Halifax)\*\*.

| Priority window | Actions (ordered) | Why this is highest value | Expected outcome |  
|---|---|---|---|  
| Immediate | Run read-only triage (DNS/TLS/HTTP) \+ check browser console for JS runtime crash; generate integrity checksum manifest | Prevents guesswork; quickly separates “platform broken” from “client config broken”; establishes proof games/apps unchanged citeturn4search3turn4search6 | Clear root-cause category; integrity baseline |  
| Immediate | If on Vercel and last deploy likely broke prod: \`vercel rollback\` | Restores service within minutes without deleting content citeturn9search1turn9search5 | Site serving again (even if temporarily older) |  
| 0–24h | Verify Production env vars include Vite+Supabase keys; redeploy to pick up changes | Your code throws in production if Supabase creds missing; env changes apply only to new deploys fileciteturn16file0L1-L1 citeturn0search2turn4search6 | The “blank page” class of outages eliminated |  
| 0–24h | If DNS-related: correct NS/A/CNAME; verify DNSSEC state | Missing records or DNSSEC misconfig are common resolution failures citeturn4search3turn4search1 | Domain resolves reliably again |  
| 24–72h | Add automated smoke tests \+ CI gate (test \+ build artifact check) | Prevents shipping a deployment that breaks iframe loads or app init | Fewer regressions |  
| 24–72h | Add monitoring/alerts (uptime \+ error tracking \+ deploy notifications) | Detects outages quickly; improves mean time to recovery | Faster detection, lower downtime |  
| 1–4 weeks | Content-preserving scaling/migration if deploy limits are the pain point (split static assets to object storage/CDN, or containerize) | Keeps games/apps accessible while avoiding platform limitations citeturn0search0turn6search5 | More resilient, scalable delivery |

\#\# Backup and monitoring strategy

This strategy focuses on \*recoverability without removing games/apps\*, which practically means safeguarding \`public/\`, \`src/data.ts\`, and the deployment config \+ secrets.

\#\#\# What to back up (and why)

Source code and apps/games: Your apps are stored as static files under \`public/\` and registered in \`src/data.ts\`. fileciteturn8file0L1-L1 fileciteturn13file0L1-L1 Backing up the Git repo (and/or mirroring it) is the primary “don’t lose games/apps” control.

Deployment configuration: \`vercel.json\` and any hosting-specific config determine headers, output directory, and security posture. fileciteturn9file0L1-L1 Vercel documents \`vercel.json\` as the official static configuration mechanism. citeturn0search5

Environment variables/secrets: Vercel env vars are encrypted and configurable per environment, but changes apply only to new deployments—so you should treat them as backup-worthy configuration. citeturn0search2 For local sync, Vercel documents \`vercel env pull\`. citeturn0search2

Database (if applicable): Your authentication/profile logic uses Supabase tables (e.g., \`profiles\`). fileciteturn15file0L1-L1 If you have any user data, you need database backups. For Postgres restores, PostgreSQL documents \`pg\_restore\` for archives produced by \`pg\_dump\`. citeturn1search0

\#\#\# Suggested retention policy (practical default)

| Asset | Backup method | Retention | Notes |  
|---|---|---:|---|  
| Git repo | Mirror to a second remote; protect \`main\` | Indefinite | Keeps every app/game in history |  
| “Release artifact” (\`dist/\`) | Store a zipped \`dist/\` per release | 10–30 releases | Speeds rollback even off-platform |  
| Env vars | Export/snapshot values out-of-band | Every change \+ weekly | Focus on \`VITE\_SUPABASE\_\*\` since production depends on them fileciteturn16file0L1-L1 |  
| DB | Nightly \`pg\_dump\` \+ weekly full snapshot | 7–30 days \+ 3–6 months | Adjust to data criticality |

\#\#\# Monitoring and alerting (minimum viable set)

Uptime checks: Run external HTTP checks against:

\- \`/\` (main shell loads)  
\- One representative static app (\`/when-the-sun-died.html\` or any known stable file) to ensure \`public/\` files are being served correctly. fileciteturn13file0L1-L1

Runtime error tracking: Because the “site down” symptom can be a client-side crash (e.g., missing env vars), add front-end error monitoring and alerting. This specifically reduces time-to-diagnose for failures like the Supabase initialization throw. fileciteturn16file0L1-L1

Log retention awareness (Vercel): If you depend on platform logs, know retention policies. Vercel documents different retention behavior for build logs vs runtime logs and lists log retention windows by plan. citeturn0search0

\#\# Security and integrity checks that preserve games/apps intact

Because your platform embeds third-party-like HTML “artifacts” (even if you authored them), your security model should prove (a) the artifacts weren’t tampered with and (b) they remain safely sandboxed.

\#\#\# File integrity controls

Checksum manifests: Use the checksum baseline script earlier for \`public/\` \+ \`src/data.ts\`. These two elements define the content and the catalog pointer map. fileciteturn13file0L1-L1

Build reproducibility check: Since Vite embeds environment values at build time, include a CI step that fails fast if required env vars are absent for a production build (or modify the code to degrade gracefully if you prefer availability over hard failure). Vite explicitly documents build-time replacement of env constants and exposure only for \`VITE\_\`-prefixed vars. citeturn4search6

\#\#\# Sandbox and containment validation

Your Chamber iframe defaults to sandbox attributes that allow scripts/forms and (for URL-based apps) same-origin, while inline apps (\`srcDoc\`) are restricted to \`allow-scripts\`. fileciteturn19file0L1-L1 As a security regression test, validate that:

\- Each app loads under the expected sandbox (no accidental broadening).  
\- The iframe still rejects unsafe \`postMessage\` origins (your code checks same-origin or \`null\`, and checks the message source). fileciteturn19file0L1-L1

\#\#\# Supabase key handling sanity check

Supabase documents that the \`anon\` key is intended to be usable in a browser when Row Level Security (RLS) is enabled (and warns that service-role keys must not be used client-side). citeturn0search3 Operationally: confirm you are using only the anon key (\`VITE\_SUPABASE\_ANON\_KEY\`) in the Vite client, consistent with Supabase JS initialization requirements. citeturn4search8turn4search6

\#\# Migration and scaling options that preserve apps plus remediation comparison table

\#\#\# Content-preserving deployment patterns

Vercel-style blue/green via promotions: Vercel supports promoting deployments and instant rollback (domain reassignment to an earlier deployment). citeturn9search0turn9search5 This functions similarly to blue/green for static sites: keep multiple builds available and switch traffic at the routing layer.

Kubernetes rolling updates \+ undo (for containerized hosting): Kubernetes Deployments provide controlled rollouts and rollbacks; \`kubectl rollout undo\` is the documented rollback mechanism. citeturn6search5turn6search1 This preserves your static apps by packaging \`dist/\` (and its copied \`public/\` files) into an image or mounted volume.

Docker Compose restart \+ health checks: For a small VPS stack, Docker Compose supports restart policies and healthcheck definitions. Docker’s Compose reference documents healthcheck fields and durations (interval/timeout/retries/start\_period) and describes dependency waiting on healthy services. citeturn8search0turn6search0

\#\#\# Sample docker-compose for “static dist served by Nginx” (apps preserved)

This assumes you build \`dist/\` on the host (or in CI) and mount it read-only into Nginx:

\`\`\`yaml  
services:  
  web:  
    image: nginx:alpine  
    ports:  
      \- "80:80"  
      \- "443:443"  
    volumes:  
      \# dist contains the built app \+ copied public/ HTML games  
      \- ./dist:/usr/share/nginx/html:ro  
      \- ./nginx/conf.d:/etc/nginx/conf.d:ro  
      \# TLS cert paths if self-managing (optional)  
      \- ./certs:/etc/ssl/private:ro  
    restart: unless-stopped  
    healthcheck:  
      test: \["CMD-SHELL", "wget \-qO- http://127.0.0.1/ \>/dev/null 2\>&1 || exit 1"\]  
      interval: 30s  
      timeout: 5s  
      retries: 3  
      start\_period: 15s  
\`\`\`

Healthcheck semantics and fields are documented in Docker’s Compose file reference. citeturn8search0 Restart policy behavior is documented in Docker’s Compose deploy specification. citeturn6search0

\#\#\# Sample systemd unit for a Node-based static server (fallback approach)

If you choose to run any Node service under systemd, systemd documents \`Restart=\` semantics and recommends \`on-failure\` for long-running services. citeturn7search1 Example:

\`\`\`ini  
\# /etc/systemd/system/catalogofutility.service  
\[Unit\]  
Description=Catalog of Futility (Vite preview fallback)  
After=network-online.target  
Wants=network-online.target

\[Service\]  
Type=simple  
WorkingDirectory=/opt/catalogoffutility  
Environment=NODE\_ENV=production  
ExecStart=/usr/bin/npm run preview \-- \--host 0.0.0.0 \--port 3000  
Restart=on-failure  
RestartSec=3

\[Install\]  
WantedBy=multi-user.target  
\`\`\`

\#\#\# Sample Nginx config for static \`dist/\` (with safe reload workflow)

\`\`\`nginx  
server {  
  listen 80;  
  server\_name yourdomain.com;

  root /var/www/catalog/dist;  
  index index.html;

  \# Main app shell  
  location / {  
    try\_files $uri $uri/ /index.html;  
  }

  \# Optional: ensure ACME challenge path works for certbot webroot  
  location ^\~ /.well-known/acme-challenge/ {  
    root /var/www/acme;  
    default\_type "text/plain";  
  }

  \# Basic security headers (adjust to match your vercel.json intent)  
  add\_header X-Content-Type-Options nosniff always;  
  add\_header Referrer-Policy strict-origin-when-cross-origin always;  
}  
\`\`\`

If you edit Nginx config, NGINX documents signal-based reload (\`nginx \-s reload\`) and you should use \`nginx \-t\` before reload to avoid taking the server down with a bad config. citeturn3search0

\#\#\# Remediation options comparison table

Costs are given as relative bands because exact pricing changes frequently; this table is optimized for \*downtime risk\* and \*preserving your apps intact\*.

| Option | What you do | Est. cost | Complexity | Downtime risk | Best when |  
|---|---|---|---|---|---|  
| Vercel instant rollback \+ fix \+ redeploy | Roll back immediately, correct env/config, redeploy | Low–Med | Low | Very low | A deploy broke production; you need fastest restore citeturn9search1turn9search5 |  
| Vercel config/env repair only | Set missing env vars, redeploy | Low–Med | Low | Low | “Blank page” due to Vite/Supabase env vars fileciteturn16file0L1-L1 citeturn0search2turn4search6 |  
| DNS repair (NS/A/CNAME/DNSSEC) | Correct DNS records and DNSSEC DS | Low | Medium | Medium (propagation) | Domain doesn’t resolve / SERVFAIL citeturn4search3turn4search1 |  
| Self-host static dist on VPS \+ Nginx | Build \`dist/\`, serve via Nginx, manage TLS | Medium | Medium | Medium | Platform limits or you want full control citeturn3search0turn2search0 |  
| Docker Compose on VPS | Containerize Nginx/static; add healthchecks and restart policies | Medium | Medium | Medium–Low | You want reproducibility and easier rollbacks citeturn8search0turn6search0 |  
| Kubernetes (blue/green/canary) | Deploy containers \+ rollout/rollback tooling | High | High | Low (if done well) | Higher traffic, need strong rollout controls citeturn6search5turn6search1 |  
| Hybrid: keep catalog on Vercel, move heavy assets to object storage/CDN | Preserve app URLs while offloading size limits | Medium | Medium | Low–Medium | Deployments failing due to file/size limits citeturn0search0turn9search0 |

\#\# Sources used

Primary and official references were prioritized:

\- Catalog of Futility repository files: architecture, Vercel config, Supabase hard dependency, iframe sandbox defaults. fileciteturn8file0L1-L1 fileciteturn9file0L1-L1 fileciteturn16file0L1-L1 fileciteturn19file0L1-L1    
\- Vercel documentation: limits, environment variables, Vite framework, \`vercel.json\`, promotion and rollback workflows. citeturn0search0turn0search2turn0search4turn0search5turn9search1turn9search5turn9search0    
\- Vite documentation: env variable exposure rules and build-time replacement. citeturn4search6    
\- Supabase documentation: JS client initialization requirements; environment variable guidance about anon key safety. citeturn4search8turn0search3    
\- Cloudflare DNS documentation: common DNS failure causes and DNSSEC troubleshooting using \`dig\`. citeturn4search3turn4search1    
\- NGINX documentation: runtime control and reload signaling. citeturn3search0    
\- Certbot documentation: renewal dry-run and automation guidance. citeturn3search4turn3search1    
\- systemd documentation: \`journalctl\` usage and \`Restart=\` semantics for service reliability. citeturn2search2turn7search1    
\- PostgreSQL documentation: \`pg\_restore\` restore mechanics and cautions. citeturn1search0    
\- Docker documentation: Compose restart policy and healthcheck fields. citeturn6search0turn8search0    
\- Kubernetes documentation: deployment rollouts and rollback (\`kubectl rollout undo\`). citeturn6search5turn6search1    
\- ICANN documentation: expired registration recovery policy concepts and required notices. citeturn5search8