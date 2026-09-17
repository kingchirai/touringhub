# Teamwrk Touring - branded, tour-only PDF update

## Upload this update

1. Extract the ZIP. Upload its `docs` folder into the ROOT of your existing touringhub repository, merging/replacing matching files.
2. Do NOT delete the existing docs folder. This patch deliberately does not include docs/data: keep your existing Meta and Audience Republic JSON data.
3. Commit the upload. In Actions, select Update Meta dashboard, then Run workflow on main. Wait for the successful green result.
4. Hard-refresh the website (Mac: Cmd+Shift+R; Windows: Ctrl+Shift+R).
5. Open Brother Ali (or another tour) and click Download tour PDF. It downloads a named .pdf directly, without printing the dashboard.

## Included changes

- A standalone PDF generator receives only the selected tour's filtered campaign and communication arrays, captured at click time.
- Teamwrk Touring logo on every PDF page; consistent A4 layout, repeated table headings, automatic pagination and page numbers.
- Prominent purchase value, total ad spend, blended ROAS, email recipients and SMS recipients.
- Conversion campaigns: spend, purchase value, ROAS and purchases. Event-response campaigns: spend and responses. Engagement campaigns: reach and interactions.
- Email send-level recipients, opens and clicks; SMS recipients and clicks. Recipient totals are across sends, not unique people or confirmed deliveries.
- Separate loading of Meta and Audience Republic files, so one unavailable source does not hide the other.
- Bundled PDF library: no external CDN, new API, token or hosting service required.

## Scope and limitations

This is a presentation/export patch. It preserves existing tour aliases and imported tour assignments; it does not audit name matching, change the Meta collector, validate attribution, or change the list of active tours. Existing Meta collection and revenue calculations remain unchanged. The generator was tested with synthetic Meta data and the existing communications import, including a multi-page stress test. No live Meta API test was performed. Non-Latin characters and emoji are omitted from the PDF's standard-font text; the on-screen report retains them.

The site and its published data are NOT made private by this update. A public GitHub Pages site remains public even if its URL is not shared. Keep the Meta token only in GitHub Actions Secrets, never in site files.

## Files

docs/index.html, docs/report.css, docs/report.js, docs/export-pdf.js,
docs/assets/teamwrk-touring.png, docs/vendor/pdf-lib.min.js,
docs/vendor/pdf-lib-LICENSE.md
