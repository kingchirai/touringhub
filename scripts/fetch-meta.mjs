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

const valueFor = (items, types) => Number(items?.find((item) => types.includes(item.action_type))?.value || 0);
const purchaseTypes = ["offsite_conversion.fb_pixel_purchase", "omni_purchase", "purchase"];
const campaigns = (body.data || []).map((row) => ({
  id: row.campaign_id,
  name: row.campaign_name,
  spend: Number(row.spend || 0),
  impressions: Number(row.impressions || 0),
  reach: Number(row.reach || 0),
  clicks: Number(row.clicks || 0),
  purchases: valueFor(row.actions, purchaseTypes),
  revenue: valueFor(row.action_values, purchaseTypes),
}));
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
