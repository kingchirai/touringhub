import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const fields = ["campaign_id","campaign_name","spend","impressions","reach","frequency","clicks","cpc","cpm","ctr","actions","action_values","date_start","date_stop"].join(",");
export async function GET() {
  const token=process.env.META_ACCESS_TOKEN, accountId=process.env.META_AD_ACCOUNT_ID, version=process.env.META_API_VERSION ?? "v24.0";
  if (!token || !accountId) return NextResponse.json({mode:"demo",message:"Add META_ACCESS_TOKEN and META_AD_ACCOUNT_ID to enable live data."});
  const url=new URL("https://graph.facebook.com/"+version+"/act_"+accountId+"/insights");
  url.searchParams.set("access_token",token); url.searchParams.set("fields",fields); url.searchParams.set("level","campaign"); url.searchParams.set("date_preset","last_30d"); url.searchParams.set("time_increment","1");
  const response=await fetch(url,{next:{revalidate:3600}}); const payload=await response.json();
  if (!response.ok) return NextResponse.json({mode:"error",error:payload.error?.message ?? "Meta request failed"},{status:response.status});
  return NextResponse.json({mode:"live",data:payload.data ?? []});
}
