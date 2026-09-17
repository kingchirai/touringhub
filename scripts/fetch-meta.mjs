import { mkdir, writeFile } from "node:fs/promises";

const account = process.env.META_AD_ACCOUNT_ID;
const token = process.env.META_ACCESS_TOKEN;
if (!account || !token) throw new Error("META_AD_ACCOUNT_ID and META_ACCESS_TOKEN are required.");

const url = new URL("https://graph.facebook.com/v24.0/act_" + account + "/insights");
url.searchParams.set("access_token", token);
url.searchParams.set("fields", "campaign_id,campaign_name,spend,impressions,reach,clicks,actions,action_values");
url.searchParams.set("level", "campaign");
url.searchParams.set("date_preset", "maximum");
url.searchParams.set("limit", "500");

const response = await fetch(url);
const body = await response.json();
if (!response.ok) throw new Error(body.error?.message || "Meta request failed");

const valueFor = (items, types) => Number(items?.filter((item) => types.some((type) => item.action_type.toLowerCase().includes(type))).reduce((sum, item) => sum + Number(item.value || 0), 0) || 0);

// Meta may return the same purchase under multiple overlapping action types
// (for example omni_purchase and offsite_conversion.fb_pixel_purchase).
// Choose one canonical value by priority; never sum them.
const firstExactMetric = (items, types) => {
  const normalised = new Map((items || []).map((item) => [String(item.action_type || "").toLowerCase(), Number(item.value || 0)]));
  for (const type of types) {
    if (normalised.has(type)) return { type, value: normalised.get(type) };
  }
  return { type: null, value: 0 };
};
const purchaseTypes = ["omni_purchase", "offsite_conversion.fb_pixel_purchase", "onsite_conversion.purchase", "purchase"];
const campaigns = (body.data || []).map((row) => {
  const name = row.campaign_name;
  const lower = name.toLowerCase();
  const kind = /event\s*(response|resp)|eventresp|event_resp/.test(lower) ? "event" : /post\s*eng|post_eng|engagement/.test(lower) ? "engagement" : "conversion";
  const purchaseCount = firstExactMetric(row.actions, purchaseTypes);
  const purchaseValue = firstExactMetric(row.action_values, purchaseTypes);
  return {
    id: row.campaign_id, name, kind,
    spend: Number(row.spend || 0), impressions: Number(row.impressions || 0), reach: Number(row.reach || 0), clicks: Number(row.clicks || 0),
    // Exactly one metric per field. Do not add the overlapping purchase types.
    purchases: purchaseCount.value, revenue: purchaseValue.value,
    purchaseMetric: purchaseValue.type || purchaseCount.type,
    eventResponses: valueFor(row.actions, ["event_response", "event response", "rsvp"]),
    interactions: valueFor(row.actions, ["post_engagement", "post engagement", "page_engagement"]),
  };
});
const totals = campaigns.reduce((sum, campaign) => ({
  spend: sum.spend + campaign.spend,
  revenue: sum.revenue + campaign.revenue,
  purchases: sum.purchases + campaign.purchases,
  impressions: sum.impressions + campaign.impressions,
  reach: sum.reach + campaign.reach,
  clicks: sum.clicks + campaign.clicks,
}), { spend: 0, revenue: 0, purchases: 0, impressions: 0, reach: 0, clicks: 0 });

await mkdir("docs/data", { recursive: true });
await writeFile("docs/data/meta-insights.json", JSON.stringify({
  updatedAt: new Date().toISOString(), dateRange: "All time", totals, campaigns,
}, null, 2));
