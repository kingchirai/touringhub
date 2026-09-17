# Teamwrk Touring — Paid Media Hub

Private dashboard for Teamwrk Touring's Meta paid-media pacing and ROAS.

## Included

- Teamwrk Touring ad account preconfigured: `1450765939036003`
- Daily pacing, purchase value, ROAS and cost-per-purchase dashboard
- Campaign-level view for all touring campaigns
- Scheduled GitHub Action that securely pulls Meta Insights data
- Demo data until the connection is completed

## GitHub Pages deployment

1. Create a **private** GitHub repository named `touringhub`.
2. Upload the ZIP contents into the repository root.
3. In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. In **Settings → Secrets and variables → Actions**, create:
   - Variable: `META_AD_ACCOUNT_ID` = `1450765939036003`
   - Secret: `META_ACCESS_TOKEN` = your system-user token
5. Open **Actions → Update Meta dashboard** and select **Run workflow**. GitHub publishes the dashboard and refreshes its data every six hours.

## Connect Meta securely

Create a Meta developer app and a system user with read-only access to the Teamwrk Touring ad account. Generate a system-user token with the required ads read permission and add it only as a GitHub Action secret.

Never place the token in repository files, browser JavaScript, screenshots, or email. GitHub Action secrets are safe; the published site never receives the token.

## Current data-source inventory

The dashboard recognises the active touring data sources shown in Events Manager, including The Black Seeds, Will Sparks, harrykirby, VSPY VSPY, Shapeshifter 2026 and Less Than Jake. Meta campaign insights are pulled at the ad-account level, so individual pixel IDs are not embedded.
