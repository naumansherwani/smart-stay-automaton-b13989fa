---
name: Revenue Intelligence API contract
description: Exact Replit API contract for Revenue Intelligence section — endpoints, JSON keys, SSE events, button actions
type: feature
---
## Endpoints (Replit, founder-only, envelope { ok,data,error,trace_id }, header X-HostFlow-Surface: dashboard)

- GET  /api/intelligence-reports/latest
- GET  /api/intelligence-reports/:id
- GET  /api/intelligence-reports
- POST /api/intelligence-reports/generate          body: { sendEmail: false } → { id, status:"generating", period }; poll :id every 5s until status="ready"
- POST /api/intelligence-reports/:id/email         → emails naumansherwani@hostflowai.net
- GET  /api/revenue-reports/summary                → summary cards + chart
- GET  /api/revenue-reports                        → paginated list
- POST /api/revenue-reports/:id/reanalyze
- Export PDF = client-side only (no backend endpoint)

## Intelligence report JSON shape (EXACT keys)
id, periodLabel, periodType, status ("generating"|"ready"|"failed"), confidenceScore (0-100), createdAt
- s1_executive_summary: string
- s2_revenue_impact: { revenueGrowthEstimate, conversionImprovements, bookingIncreases, occupancyImprovements, repeatCustomerGrowth, aiAssistedUpsells, abandonedRecoveries, totalRevenueImpact, confidenceNote }
- s3_cost_savings: { vsMarketplaceFees, vsManualSupport, vsExternalAICRM, operationalEfficiency, automationImpact, totalSavingsEstimate, savingsConfidence (0-100) }
- s4_ai_resolution_metrics: { totalAiCallsThisPeriod, avgResolutionTime, aiFirstResolutionRate, sherlockEscalationRate, automationPercentage, engagementTrend, topEndpoints[{endpoint,count}], channelBreakdown{chat,email,whatsapp}, advisorEffectiveness[{advisor,interactions,industry}] }
- s5_recovery_engine: { paymentRecoveries, abandonedWorkflows, customerRetentionSaves, aiInterventionCount, recoveredRevenueEstimate, preventedChurnValue, operationalContinuity }
- s6_industry_advisor_insights: [{industry, advisor, interactions, memoriesExtracted, topInsight, performanceNote}] — 8 entries
- s7_sherlock_strategic_notes: string (3-5 paragraphs)
- s8_growth_recommendations: { strategicGrowthRec{title,detail,estimatedImpact}, operationalWarning{title,detail,urgency:"immediate"|"this_week"|"this_month"}, missedOpportunity{title,detail,potentialValue}, revenueOptimization{title,prediction,triggerCondition} }
- s9_forecast_next_month: { expectedGrowthRange, keyDrivers[], watchItems[], recommendedActions[], confidenceLevel }
- s10_net_business_impact: { totalRevenueImpact, totalCostSavings, totalROIEstimate, hostflowValueScore (0-100), verdictOneLiner }

## Top bar mapping
Last Sync ← createdAt | AI Confidence ← confidenceScore | Sherlock Status ← status (generating=spinner, ready=green, failed=amber)
Hero score ← s10_net_business_impact.hostflowValueScore | Hero verdict ← verdictOneLiner

## Live AI Feed — SSE GET /v1/stream (no auth, auto-reconnect)
Events: advisor.escalated{industry,elapsed_ms}, advisor.resolved{industry,elapsed_ms}, subscription.created{user_id,plan}, subscription.updated{user_id,plan,status}, payment.success{user_id,amount}
Industry→Advisor: hospitality=Aria, airlines=Orion, car_rental=Rex, healthcare=Lyra, education=Sage, logistics=Atlas, events_entertainment=Vega, railways=Kai

## Hard rules
- Founder-only (403 for others)
- No fabricated metrics, no client-side calculation of revenue
- Powered by revenuereport@hostflowai.net (display label only)
