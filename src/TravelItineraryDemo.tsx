import React, { useState } from "react";

// ───────────────────────────────────────────────────────────────
// Codex 旅行推荐 Demo v1.4
// 说明：你看到“排不到 5 天以上”的根因，是 Demo 的 POI 池很小（每地 ~8–12 个），
//       且我们遵循“不可复用同一 POI、避选优先宁可留空”规则。3 段/天 × 多天 很快就会把池子用完。
// 新增：
//  - 可选开关【自动填满空档（建议项）】→ 在不违背避选的情况下，用“就近、休闲、短时”的建议项补齐空档，
//    这样即便 7~10 天也能填满。（默认关闭，保持你之前的偏好）
//  - 候选排序已支持“同片区优先 + 长活动日偏休闲/短时”。
// 测试：新增 T10 验证在补齐算法下，极小 POI 池也能填满长行程。
// ───────────────────────────────────────────────────────────────

// 静态汇率与币种（演示用）
const FX = { USD: 1, TWD: 32, CNY: 7.2 };

// 目的地示例数据（基于经验估算的日均花费，单位：USD）
const DESTS = {
  Tokyo: {
    country: "Japan",
    costPerDayUSD: 220,
    vibe: ["美食", "科技", "寺庙", "购物"],
    pois: [
      { name: "浅草寺", type: "文化", area: "浅草", durationHr: 2, cost: "Free" },
      { name: "晴空塔", type: "地标", area: "押上", durationHr: 2, cost: "$20" },
      { name: "上野公园&博物馆", type: "文化", area: "上野", durationHr: 3, cost: "$0-15" },
      { name: "秋叶原电器街", type: "购物", area: "秋叶原", durationHr: 2, cost: "Free" },
      { name: "银座逛街", type: "购物", area: "银座", durationHr: 2, cost: "Free" },
      { name: "筑地/丰州美食", type: "美食", area: "丰洲", durationHr: 2, cost: "$10-30" },
      { name: "涩谷十字路口", type: "地标", area: "涩谷", durationHr: 1.5, cost: "Free" },
      { name: "明治神宫", type: "文化", area: "原宿", durationHr: 1.5, cost: "Free" },
      { name: "台场海滨公园", type: "休闲", area: "台场", durationHr: 2, cost: "Free" },
      { name: "新宿都厅夜景", type: "地标", area: "新宿", durationHr: 1.5, cost: "Free" },
      { name: "拉面博物馆(新横滨)", type: "美食", area: "横滨", durationHr: 2, cost: "$10-20" },
      { name: "歌舞伎町散步", type: "夜生活", area: "新宿", durationHr: 1.5, cost: "$10+" },
    ],
  },
  Paris: {
    country: "France",
    costPerDayUSD: 260,
    vibe: ["艺术", "建筑", "咖啡馆", "塞纳河"],
    pois: [
      { name: "卢浮宫", type: "艺术", area: "1区", durationHr: 3, cost: "$20" },
      { name: "埃菲尔铁塔", type: "地标", area: "7区", durationHr: 2, cost: "$30" },
      { name: "圣母院周边", type: "建筑", area: "西岱岛", durationHr: 2, cost: "Free" },
      { name: "蒙马特高地", type: "文化", area: "18区", durationHr: 2, cost: "Free" },
      { name: "塞纳河游船", type: "休闲", area: "河畔", durationHr: 1.5, cost: "$15-20" },
      { name: "香榭丽舍&凯旋门", type: "地标", area: "8区", durationHr: 2, cost: "$15" },
      { name: "奥赛博物馆", type: "艺术", area: "7区", durationHr: 2.5, cost: "$18" },
      { name: "左岸咖啡馆", type: "美食", area: "拉丁区", durationHr: 1.5, cost: "$10-30" },
      { name: "凡尔赛一日/半日", type: "文化", area: "郊区", durationHr: 5, cost: "$20-30" },
      { name: "玛黑区闲逛", type: "购物", area: "4区", durationHr: 2, cost: "Free" },
    ],
  },
  Bangkok: {
    country: "Thailand",
    costPerDayUSD: 120,
    vibe: ["寺庙", "夜市", "泰菜", "按摩"],
    pois: [
      { name: "大皇宫&玉佛寺", type: "文化", area: "Phra Nakhon", durationHr: 3, cost: "$15" },
      { name: "卧佛寺", type: "文化", area: "Phra Nakhon", durationHr: 1.5, cost: "$5" },
      { name: "郑王庙", type: "文化", area: "Thonburi", durationHr: 1.5, cost: "$3" },
      { name: "考山路", type: "夜生活", area: "Phra Nakhon", durationHr: 2, cost: "Free" },
      { name: "恰图恰周末市场", type: "购物", area: "Chatuchak", durationHr: 3, cost: "Free" },
      { name: "唐人街美食", type: "美食", area: "Yaowarat", durationHr: 2, cost: "$5-15" },
      { name: "湄南河夜游", type: "休闲", area: "Riverside", durationHr: 1.5, cost: "$10-20" },
      { name: "水门市场&四面佛", type: "购物", area: "Ratchaprasong", durationHr: 2, cost: "Free" },
      { name: "暹罗商圈", type: "购物", area: "Siam", durationHr: 2, cost: "Free" },
      { name: "泰式按摩", type: "休闲", area: "各处", durationHr: 1.5, cost: "$10-20" },
    ],
  },
  Taipei: {
    country: "Taiwan",
    costPerDayUSD: 140,
    vibe: ["夜市", "自然", "历史", "咖啡"],
    pois: [
      { name: "故宫博物院", type: "文化", area: "士林", durationHr: 2.5, cost: "$12" },
      { name: "台北101&信义商圈", type: "地标", area: "信义", durationHr: 2, cost: "$15(观景台)" },
      { name: "中正纪念堂", type: "文化", area: "中正", durationHr: 1.5, cost: "Free" },
      { name: "永康街美食", type: "美食", area: "大安", durationHr: 2, cost: "$8-20" },
      { name: "士林夜市", type: "夜市", area: "士林", durationHr: 2, cost: "$5-15" },
      { name: "象山登顶", type: "自然", area: "信义", durationHr: 2, cost: "Free" },
      { name: "九份&十分(半日)", type: "近郊", area: "新北", durationHr: 5, cost: "$10-20" },
      { name: "北投温泉(足汤)", type: "休闲", area: "北投", durationHr: 2, cost: "Free/$5+" },
      { name: "华山/松烟文创", type: "文化", area: "中正/信义", durationHr: 2, cost: "Free" },
    ],
  },
  Rome: {
    country: "Italy",
    costPerDayUSD: 200,
    vibe: ["古迹", "美食", "艺术", "广场"],
    pois: [
      { name: "斗兽场&古罗马广场", type: "古迹", area: "Centro Storico", durationHr: 3, cost: "$18" },
      { name: "梵蒂冈博物馆&圣彼得", type: "艺术", area: "Vatican", durationHr: 4, cost: "$20" },
      { name: "特雷维喷泉", type: "地标", area: "Trevi", durationHr: 1, cost: "Free" },
      { name: "西班牙广场&台阶", type: "地标", area: "Spagna", durationHr: 1.5, cost: "Free" },
      { name: "纳沃纳广场", type: "地标", area: "Navona", durationHr: 1.5, cost: "Free" },
      { name: "鲜花广场&坎波德菲奥里", type: "美食", area: "Centro", durationHr: 2, cost: "$10-25" },
      { name: "特拉斯提弗列区", type: "文化", area: "Trastevere", durationHr: 2, cost: "Free" },
      { name: "波格赛美术馆(需预约)", type: "艺术", area: "Villa Borghese", durationHr: 2.5, cost: "$15" },
    ],
  },
};

const styleFromBudget = (ppd, basePPD) => {
  const ratio = ppd / basePPD;
  if (ratio < 0.7) return { key: "Shoestring", label: "节省型", hotel: "2-3星/青旅", food: "路边摊+商场餐", pace: "较紧凑" };
  if (ratio < 1.1) return { key: "Balanced", label: "均衡型", hotel: "3-4星", food: "地道餐馆+小资店", pace: "适中" };
  return { key: "Comfort", label: "舒适型", hotel: "4星+精品", food: "好评餐厅+打卡店", pace: "从容" };
};

// 主题模板配置（按使用场景偏好不同类型的 POI）
const THEME_PROFILES = {
  通用: {
    typesOrder: [["文化", "艺术", "自然", "古迹"], ["地标", "购物", "近郊"], ["美食", "夜生活", "夜市", "休闲"]],
    avoid: [],
  },
  亲子: {
    typesOrder: [["自然", "文化", "古迹", "休闲"], ["地标", "近郊", "文化"], ["美食", "夜市", "休闲"]],
    avoid: ["夜生活"],
  },
  美食: {
    typesOrder: [["文化", "自然", "休闲", "购物"], ["美食", "购物", "地标"], ["美食", "夜市", "休闲"]],
    avoid: [],
  },
  摄影: {
    typesOrder: [["古迹", "文化", "自然"], ["地标", "近郊", "艺术"], ["地标", "自然", "休闲"]],
    avoid: [],
  },
};

function chunkDayPlan(poisPool, typesOrder, avoidTypes = []) {
  const dayPlan = ["Morning", "Afternoon", "Evening"].map((slot, i) => {
    const prefTypes = typesOrder[i] || [];
    const pick = poisPool.find((p) => prefTypes.includes(p.type) && !avoidTypes.includes(p.type));
    if (pick) {
      const idx = poisPool.indexOf(pick);
      poisPool.splice(idx, 1);
      return { slot, poi: pick };
    }
    const fallbackIdx = poisPool.findIndex((p) => !avoidTypes.includes(p.type));
    const fallback = fallbackIdx >= 0 ? poisPool.splice(fallbackIdx, 1)[0] : null;
    return { slot, poi: fallback ?? null };
  });
  return dayPlan;
}

function money(n) { return n.toLocaleString(); }

// ───────────────────────────────────────────────────────────────
// 建议词典 & 候选排序（区域优先 + 长活动偏休闲）
// ───────────────────────────────────────────────────────────────
const SUGGESTION_BOOK = {
  通用: { Morning: ["近酒店步行景点", "公园散步", "博物馆轻游"], Afternoon: ["城市地标打卡", "商圈逛街", "近郊半日"], Evening: ["夜景步道", "商场休闲", "咖啡/甜点"] },
  亲子: { Morning: ["城市公园/动物园", "亲子博物馆", "科学馆互动区"], Afternoon: ["标志性地标合影", "儿童体验课堂", "亲子友好商场游乐区"], Evening: ["亲子友好餐厅", "早休息作息稳定", "简短夜市打卡"] },
  美食: { Morning: ["当地早餐店", "传统市场", "咖啡巡礼"], Afternoon: ["菜市场/美食街", "地方小吃拼盘", "人气餐厅午市"], Evening: ["夜市", "宵夜街", "评分餐厅/酒吧"] },
  摄影: { Morning: ["晨光古迹/自然", "桥梁/河岸取景", "巷弄人文扫街"], Afternoon: ["高处视角/观景台", "地标对称构图", "近郊景观"], Evening: ["日落蓝调/夜景位", "城市天际线", "河畔倒影"] },
};
const RESTFUL_SUGGEST = { Morning: ["公园散步", "咖啡巡礼", "慢节奏市区"], Afternoon: ["商场休闲", "咖啡/甜点", "返回市区轻松游"], Evening: ["早睡/温泉足汤", "夜景散步", "轻食宵夜"] };

function usedSetFromDayPlans(dayPlans) {
  const set = new Set();
  dayPlans.forEach((d) => d.slots.forEach((s) => { if (s && s.poi) set.add(s.poi.name); }));
  return set;
}
function availableCandidatesFor(dest, avoid, usedSet) { return dest.pois.filter((p) => !usedSet.has(p.name) && !avoid.includes(p.type)); }

function scoreCandidate(p, dayAreas, hasLong, preferredTypes = []) {
  let score = 0;
  if (dayAreas.includes(p.area)) score += 3; // 同片区强力加权
  if (preferredTypes.includes(p.type)) score += 1;
  if (hasLong) {
    if (typeof p.durationHr === 'number') {
      if (p.durationHr <= 2) score += 1.5; // 长活动日优先短时
      if (p.durationHr > 3) score -= 1;   // 惩罚再加长
    }
    if (["休闲", "美食", "夜市"].includes(p.type)) score += 0.5; // 偏休闲
  }
  return score;
}
function prioritizedCandidates(dest, avoid, usedSet, dayAreas, hasLong, preferredTypes = []) {
  const base = availableCandidatesFor(dest, avoid, usedSet);
  return [...base].sort((a, b) => scoreCandidate(b, dayAreas, hasLong, preferredTypes) - scoreCandidate(a, dayAreas, hasLong, preferredTypes));
}

function suggestFor(theme, slot, hasLong = false) {
  const book = SUGGESTION_BOOK[theme] || SUGGESTION_BOOK["通用"];
  const base = book[slot] || book.Morning;
  if (!hasLong) return base;
  const rest = RESTFUL_SUGGEST[slot] || [];
  const seen = new Set();
  return [...rest, ...base].filter((x) => (seen.has(x) ? false : (seen.add(x), true)));
}

// 生成“建议项”POI（不违反避选）
function makeSuggestionPOI(theme, slot, area, hasLong) {
  const name = (suggestFor(theme, slot, hasLong)[0] || "自由活动").toString();
  return { name: `建议：${name}`, type: "休闲", area: area || "市中心", durationHr: 1.5, cost: "Free", isPseudo: true };
}

// 自动补齐空档（遵循避选 + 区域优先 + 长活动偏休闲）
function autofillGaps(dayPlans, dest, profile, theme) {
  const next = JSON.parse(JSON.stringify(dayPlans));
  const used = usedSetFromDayPlans(next);
  next.forEach((d) => {
    const dayAreas = d.slots.filter((x) => x.poi).map((x) => x.poi.area);
    const hasLong = d.slots.some((x) => x.poi && x.poi.durationHr >= 3);
    d.slots.forEach((s, idx) => {
      if (s.poi) return;
      const preferred = profile.typesOrder[idx] || [];
      const cands = prioritizedCandidates(dest, profile.avoid, used, dayAreas, hasLong, preferred);
      const pick = cands[0];
      if (pick) {
        s.poi = pick; used.add(pick.name); dayAreas.push(pick.area);
      } else {
        // 仍无可用候选 → 生成建议项（不算避选，类型用“休闲”）
        s.poi = makeSuggestionPOI(theme, s.slot, dayAreas[0] || (dest.pois[0] && dest.pois[0].area) || "市中心", hasLong);
      }
    });
  });
  return next;
}

// ───────────────────────────────────────────────────────────────
// 内置轻量测试（不影响 UI，输出到 console）
// ───────────────────────────────────────────────────────────────
function assert(cond, msg) { if (!cond) throw new Error(msg || "Assertion failed"); }
function runChunkDayPlanTests() {
  const mockPois = [
    { name: "A", type: "文化", area: "X", durationHr: 1, cost: "F" },
    { name: "B", type: "地标", area: "Y", durationHr: 1, cost: "F" },
    { name: "C", type: "美食", area: "Z", durationHr: 1, cost: "F" },
    { name: "D", type: "夜生活", area: "W", durationHr: 1, cost: "F" },
  ];
  const t1 = chunkDayPlan([...mockPois], THEME_PROFILES["亲子"].typesOrder, THEME_PROFILES["亲子"].avoid);
  assert(Array.isArray(t1) && t1.length === 3, "T1: 返回应为 3 段");
  assert(!t1.some((s) => s.poi && s.poi.type === "夜生活"), "T1: 不应包含夜生活");
  const typesOrder = [["艺术"], ["购物"], ["自然"]];
  const t2 = chunkDayPlan([...mockPois], typesOrder, []);
  assert(t2.filter((s) => s.poi).length >= 1, "T2: 应至少回退到一个可用 POI");
  const smallPool = [{ name: "OnlyOne", type: "文化", area: "X", durationHr: 1, cost: "F" }];
  const t3 = chunkDayPlan([...smallPool], THEME_PROFILES["通用"].typesOrder, []);
  assert(t3.length === 3, "T3: 仍应返回 3 段");
  assert(t3.filter((s) => !s.poi).length >= 1, "T3: 应出现 >=1 个空时段以显示自由活动");
  const avoidOnlyPool = [ { name: "Night1", type: "夜生活", area: "W", durationHr: 1, cost: "F" }, { name: "Night2", type: "夜生活", area: "W", durationHr: 1, cost: "F" } ];
  const t4 = chunkDayPlan([...avoidOnlyPool], THEME_PROFILES["亲子"].typesOrder, THEME_PROFILES["亲子"].avoid);
  assert(t4.some((s) => !s.poi), "T4: 当仅剩避选类型时，应留空");
  assert(!t4.some((s) => s.poi && s.poi.type === "夜生活"), "T4: 不应选择避选类型 POI");
  const used = new Set(["A"]);
  const cand = availableCandidatesFor({ pois: mockPois }, ["夜生活"], used);
  assert(!cand.some((p) => p.name === "A"), "T5: 已使用的 POI 不应出现在备选");
  assert(!cand.some((p) => p.type === "夜生活"), "T6: 避选类型不应出现在备选");
  const sug = suggestFor("通用", "Evening");
  assert(Array.isArray(sug) && sug.length > 0, "T7: 建议词典应返回非空数组");
  const dayAreas = ["Y", "Z"]; const hasLong = false;
  const pr = prioritizedCandidates({ pois: mockPois }, [], new Set(), dayAreas, hasLong, ["地标"]);
  assert(pr[0].area === "Y", "T8: 同片区候选应排在第一");
  const mock2 = [ { name: "LongLandmark", type: "地标", area: "Y", durationHr: 4, cost: "F" }, { name: "ShortRest", type: "休闲", area: "Y", durationHr: 1, cost: "F" } ];
  const pr2 = prioritizedCandidates({ pois: mock2 }, [], new Set(), ["Y"], true, ["地标"]);
  assert(pr2[0].name === "ShortRest", "T9: 长活动日应优先短时/休闲候选");
  // 新增：T10 极小池 + 7 天，补齐后应全部填满
  const miniDest = { pois: [{ name: "OneSpot", type: "文化", area: "X", durationHr: 1, cost: "F" }] };
  const profile = THEME_PROFILES["通用"];
  const dp = Array.from({ length: 7 }).map((_, i) => ({ day: i + 1, slots: chunkDayPlan([...miniDest.pois], profile.typesOrder, []) }));
  const dpFilled = autofillGaps(dp, miniDest, profile, "通用");
  const filledCount = dpFilled.flatMap(d=>d.slots).filter(s=>s.poi).length;
  assert(filledCount === 7*3, "T10: 自动补齐应填满全部空档");
  console.log("✅ chunkDayPlan tests passed", { t1, t2, t3, t4, cand, sug, pr, pr2, filledCount });
}
try { runChunkDayPlanTests(); } catch (e) { console.error("❌ chunkDayPlan tests failed:", e); }

export default function TravelItineraryDemo() {
  const [destination, setDestination] = useState("Tokyo");
  const [days, setDays] = useState(4);
  const [budget, setBudget] = useState(50000); // 默认台币预算
  const [currency, setCurrency] = useState("TWD");
  const [result, setResult] = useState(null);
  const [theme, setTheme] = useState("通用");
  const [fills, setFills] = useState({}); // 手动补位暂存
  const [autoFill, setAutoFill] = useState(false); // 新增：是否自动填满空档

  const destOptions = Object.keys(DESTS);

  const calc = () => {
    const dest = DESTS[destination];
    const fx = FX[currency];
    const basePPDLocal = dest.costPerDayUSD * fx; // 目的地基准日均（本地币）
    const ppd = budget / Math.max(1, days); // 每人每日预算
    const style = styleFromBudget(ppd, basePPDLocal);

    const hotelPerDay = basePPDLocal * (style.key === "Comfort" ? 0.55 : style.key === "Balanced" ? 0.45 : 0.35);
    const foodPerDay = basePPDLocal * (style.key === "Comfort" ? 0.25 : style.key === "Balanced" ? 0.30 : 0.35);
    const activityPerDay = basePPDLocal * 0.15;
    const miscPerDay = basePPDLocal * 0.05;
    const totalEst = (hotelPerDay + foodPerDay + activityPerDay + miscPerDay) * days;
    const overUnder = Math.round(budget - totalEst);

    // 生成行程
    const pool = [...dest.pois];
    const profile = THEME_PROFILES[theme] || THEME_PROFILES["通用"];
    let dayPlans = Array.from({ length: days }).map((_, i) => ({
      day: i + 1,
      slots: chunkDayPlan(pool, profile.typesOrder, profile.avoid),
      tip:
        i === 0 ? "抵达当日尽量安排市区轻松项目；晚间可选择地标夜景，避免舟车劳顿。" :
        i === days - 1 ? "返程前半天建议近酒店/市中心活动，预留交通与退税时间。" :
        "中间日可安排半日近郊或深度体验，注意节奏与补水。",
    }));

    // 若勾选自动填满空档，用建议项/候选补齐
    if (autoFill) {
      dayPlans = autofillGaps(dayPlans, dest, profile, theme);
    }

    setResult({
      destination, country: dest.country, style,
      basePPDLocal: Math.round(basePPDLocal), ppd: Math.round(ppd),
      hotelPerDay: Math.round(hotelPerDay), foodPerDay: Math.round(foodPerDay),
      activityPerDay: Math.round(activityPerDay), miscPerDay: Math.round(miscPerDay),
      totalEst: Math.round(totalEst), overUnder, dayPlans, currency, vibe: dest.vibe, theme,
    });
  };

  const handleFill = (dayIdx, slotIdx, poiName) => {
    if (!result || !poiName) return;
    const dest = DESTS[result.destination];
    const profile = THEME_PROFILES[result.theme] || THEME_PROFILES["通用"];
    const poi = dest.pois.find((p) => p.name === poiName && !profile.avoid.includes(p.type));
    if (!poi) return;
    const next = JSON.parse(JSON.stringify(result));
    next.dayPlans[dayIdx].slots[slotIdx].poi = poi;
    setResult(next);
    const key = `${dayIdx}-${slotIdx}`;
    setFills((prev) => { const cp = { ...prev }; delete cp[key]; return cp; });
  };

  const copyText = () => {
    if (!result) return;
    const lines = [];
    lines.push(`# ${result.destination}（${result.country}）${days}日行程建议`);
    lines.push(`风格：${result.style.label}｜主题：${result.theme}｜氛围：${result.vibe.join(" / ")}`);
    lines.push(`预算：${money(budget)} ${currency}（≈ 每日每人 ${money(result.ppd)}）`);
    lines.push(`估算总花费：${money(result.totalEst)} ${currency}（酒店/餐饮/活动/其他）`);
    lines.push("\n—— 行 程 安 排 ——");
    result.dayPlans.forEach((d) => {
      lines.push(`第${d.day}天`);
      d.slots.forEach((s) => { if (!s.poi) return; lines.push(`· ${s.slot}：${s.poi.name}（${s.poi.type}｜${s.poi.area}｜${s.poi.durationHr}h）`); });
      lines.push(`Tips：${d.tip}`);
      lines.push("");
    });
    navigator.clipboard?.writeText(lines.join("\n"));
    alert("已复制到剪贴板 ✅");
  };

  const reset = () => { setResult(null); };

  const container = "mx-auto max-w-5xl px-4 py-8";
  const card = "rounded-2xl shadow-lg bg-white/80 border border-gray-100 p-6";
  const label = "block text-sm text-gray-600 mb-1";
  const input = "w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const btn = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition";
  const btnGhost = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50";

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className={container}>
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Codex · 智能行程生成器 <span className="text-indigo-600">Demo</span>
          </h1>
          <p className="text-gray-600 mt-2">选择目的地、行程天数与预算，我们将为你生成一份<em className="px-1">可执行</em>的推荐行程（示例版）。</p>
        </header>

        {/* 表单卡片 */}
        <div className={card}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={label}>目的地</label>
              <select className={input} value={destination} onChange={(e) => setDestination(e.target.value)}>
                {destOptions.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
            <div>
              <label className={label}>行程天数</label>
              <input type="number" min={2} max={14} className={input} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>总预算（本地币）</label>
              <input type="number" min={1000} step={500} className={input} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>币种</label>
              <select className={input} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {Object.keys(FX).map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-2">主题模板</label>
            <div className="flex flex-wrap gap-2">
              {['通用','亲子','美食','摄影'].map((t) => (
                <button type="button" key={t} onClick={() => setTheme(t)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition ${theme === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={autoFill} onChange={(e)=>setAutoFill(e.target.checked)} />
              自动填满空档（用建议项/就近候选）
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button className={btn} onClick={calc}>生成行程</button>
            <button className={btnGhost} onClick={reset}>重置</button>
          </div>
        </div>

        {/* 结果 */}
        {result && (
          <div className="mt-8 space-y-6">
            <div className={card}>
              <div className="flex flex-wrap items-end justify之间 gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{result.destination}（{result.country}）· 推荐风格：<span className="text-indigo-600">{result.style.label}</span></h2>
                  <p className="text-gray-600 mt-1">氛围关键词：{result.vibe.join(" / ")} ｜ 主题：{result.theme}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">预算（总 / 人均日）</div>
                  <div className="text-lg font-medium">{money(budget)} {result.currency}<span className="text-gray-400"> ｜ </span>{money(result.ppd)} {result.currency}/天</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-xl p-4"><div className="text-xs text-gray-500 mb-1">基准日均（该地）</div><div className="text-lg font-semibold">{money(result.basePPDLocal)} {result.currency}</div></div>
                <div className="bg-gray-50 rounded-xl p-4"><div className="text-xs text-gray-500 mb-1">酒店/日</div><div className="text-lg font-semibold">{money(result.hotelPerDay)} {result.currency}</div><div className="text-xs text-gray-500">{result.style.hotel}</div></div>
                <div className="bg-gray-50 rounded-xl p-4"><div className="text-xs text-gray-500 mb-1">餐饮/日</div><div className="text-lg font-semibold">{money(result.foodPerDay)} {result.currency}</div><div className="text-xs text-gray-500">{result.style.food}</div></div>
                <div className="bg-gray-50 rounded-xl p-4"><div className="text-xs text-gray-500 mb-1">活动+其他/日</div><div className="text-lg font-semibold">{money(result.activityPerDay + result.miscPerDay)} {result.currency}</div><div className="text-xs text-gray-500">节奏：{result.style.pace}</div></div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className={`text-sm ${result.overUnder >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {result.overUnder >= 0 ? `预计低于预算约 ${money(result.overUnder)} ${result.currency}` : `预计超出预算约 ${money(Math.abs(result.overUnder))} ${result.currency}`}
                </div>
                <div className="flex gap-3"><button className={btnGhost} onClick={copyText}>复制行程</button></div>
              </div>
            </div>

            {/* Day by Day */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.dayPlans.map((d, dayIdx) => (
                <div key={d.day} className={card}>
                  <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">第 {d.day} 天</h3><span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">节奏：{result.style.pace}</span></div>
                  <div className="mt-4 space-y-3">
                    {d.slots.map((s, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-100 bg白 p-3">
                        {s?.poi ? (
                          <>
                            <div className="text-sm text-gray-500 mb-1">{s.slot}</div>
                            <div className="font-medium">{s.poi.name}</div>
                            <div className="text-sm text-gray-600">{s.poi.type} · {s.poi.area} · {s.poi.durationHr} 小时 · 门票 {s.poi.cost}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-500">{s.slot}：自由活动 / 补觉 / 逛商场</div>
                            {/* 建议与一键补位（智能排序） */}
                            {(() => {
                              const destR = DESTS[result.destination];
                              const profileR = THEME_PROFILES[result.theme] || THEME_PROFILES["通用"];
                              const usedSet = usedSetFromDayPlans(result.dayPlans);
                              const dayAreas = d.slots.filter(x => x.poi).map(x => x.poi.area);
                              const hasLong = d.slots.some(x => x.poi && x.poi.durationHr >= 3);
                              const preferred = profileR.typesOrder[idx] || [];
                              const cands = prioritizedCandidates(destR, profileR.avoid, usedSet, dayAreas, hasLong, preferred);
                              const suggestions = suggestFor(result.theme, s.slot, hasLong);
                              const key = `${dayIdx}-${idx}`;
                              const selected = fills[key] || "";
                              const top = cands[0];
                              return (
                                <div className="mt-2 space-y-2">
                                  <div className="text-xs text-gray-500">建议：{suggestions.join(" / ")}</div>
                                  {cands.length > 0 ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <select className="w全 rounded-lg border border-gray-200 px-2 py-1 text-sm" value={selected} onChange={(e) => setFills((prev) => ({ ...prev, [key]: e.target.value }))}>
                                          <option value="">选择一个备选 POI（遵循主题避选）</option>
                                          {cands.slice(0, 12).map((p) => (
                                            <option key={p.name} value={p.name}>{p.name} · {p.type} · {p.area}{typeof p.durationHr==='number' ? ` · ${p.durationHr}h` : ''}</option>
                                          ))}
                                        </select>
                                        <button type="button" className="px-3 py-1.5 rounded-lg border text-sm bg白 border-gray-200 text-gray-700 hover:bg-gray-50" disabled={!selected} onClick={() => handleFill(dayIdx, idx, selected)}>一键补位</button>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button type="button" className="px-3 py-1.5 rounded-lg border text-sm bg白 border-gray-200 text-gray-700 hover:bg-gray-50" disabled={!top} onClick={() => top && handleFill(dayIdx, idx, top.name)}>智能推荐（{top ? `${top.name} · ${top.type} · ${top.area}${typeof top.durationHr==='number' ? ` · ${top.durationHr}h` : ''}` : '无合适候选'}）</button>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-xs text-gray-400">暂无符合主题的备选可补位</div>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">Tips：{d.tip}</div>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500 text-center">本结果为 Demo 估算，未包含机票与实际税费。后续可接入你的 POI 库与价格规则，实现精准排期与报价。</div>
          </div>
        )}
      </div>
    </div>
  );
}
