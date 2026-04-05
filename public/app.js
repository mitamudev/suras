const rowsEl = document.getElementById("rows");
const lastUpdatedEl = document.getElementById("lastUpdated");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const riskPanelEl = document.getElementById("riskPanel");
const riskLabelEl = document.getElementById("riskLabel");
const riskDescEl = document.getElementById("riskDesc");
const riskFillEl = document.getElementById("riskFill");
const riskCountEl = document.getElementById("riskCount");

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function statusText(type) {
  if (type === "offline") return "Offline";
  if (type === "online") return "Online";
  if (type === "in_game") return "In-Game";
  if (type === "in_studio") return "In-Studio";
  return "Unknown";
}

function safeText(value) {
  if (typeof value !== "string") return "";
  return value;
}

function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function createLink(text, href) {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noreferrer";
  a.textContent = text;
  return a;
}

function riskLevelFromOnlineCount(onlineCount, total) {
  if (!Number.isFinite(total) || total <= 0) {
    return { cls: "risk-unknown", label: "กำลังประเมิน...", desc: "" };
  }
  if (onlineCount <= 0) {
    return {
      cls: "risk-safe",
      label: "ปลอดภัยมาก",
      desc: "ยังไม่พบแอดมินออนไลน์ (จากลิสต์นี้)",
    };
  }
  if (onlineCount <= 1) {
    return {
      cls: "risk-ok",
      label: "ปลอดภัย",
      desc: "มีแอดมินออนไลน์เล็กน้อย ควรตรวจสอบก่อนเทรด",
    };
  }
  if (onlineCount <= 3) {
    return {
      cls: "risk-warn",
      label: "ไม่ค่อยปลอดภัย",
      desc: "มีแอดมินออนไลน์หลายคน แนะนำให้ระวังหรือรอก่อน",
    };
  }
  return {
    cls: "risk-danger",
    label: "ไม่ปลอดภัย ควรรอก่อน",
    desc: "แอดมินออนไลน์เยอะ ความเสี่ยงสูง ควรรอก่อนเทรด",
  };
}

function updateRisk(items) {
  if (!riskPanelEl) return;
  const total = Array.isArray(items) ? items.length : 0;
  const onlineCount = (Array.isArray(items) ? items : []).filter((it) => {
    const t = it?.presence?.type || "unknown";
    return t !== "offline";
  }).length;

  const level = riskLevelFromOnlineCount(onlineCount, total);
  riskPanelEl.classList.remove("risk-safe", "risk-ok", "risk-warn", "risk-danger", "risk-unknown");
  riskPanelEl.classList.add(level.cls);

  if (riskCountEl) riskCountEl.textContent = `แอดมินออนไลน์: ${onlineCount}/${total}`;
  if (riskLabelEl) riskLabelEl.textContent = level.label;
  if (riskDescEl) riskDescEl.textContent = level.desc || "ยิ่งแอดมินออนไลน์เยอะ ยิ่งไม่ปลอดภัย";

  if (riskFillEl) {
    const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((onlineCount / total) * 100))) : 0;
    riskFillEl.style.width = `${pct}%`;
  }
}

function render(snapshot) {
  const items = Array.isArray(snapshot?.items) ? snapshot.items : [];

  lastUpdatedEl.textContent = formatTime(snapshot?.updatedAt);
  clearEl(rowsEl);
  updateRisk(items);

  for (const item of items) {
    const type = item?.presence?.type || "unknown";
    const tr = document.createElement("tr");

    const userTd = document.createElement("td");
    const userWrap = document.createElement("div");
    userWrap.className = "user";

    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.alt = "";
    avatar.loading = "lazy";
    avatar.referrerPolicy = "no-referrer";
    if (isNonEmptyString(item?.avatarUrl)) avatar.src = item.avatarUrl;

    const userLines = document.createElement("div");
    userLines.className = "user-lines";

    const nameLine = document.createElement("div");
    nameLine.className = "user-name";
    nameLine.textContent = safeText(item?.display || "");

    const handleLine = document.createElement("div");
    handleLine.className = "user-handle";
    handleLine.textContent = safeText(item?.handle || "");

    const robloxLine = document.createElement("div");
    robloxLine.className = "user-roblox";
    const rbDisp = safeText(item?.robloxDisplayName || "");
    const rbName = safeText(item?.robloxName || "");
    robloxLine.textContent =
      rbDisp && rbName && rbDisp !== rbName
        ? `${rbDisp} (@${rbName})`
        : rbName
          ? `@${rbName}`
          : "";

    userLines.appendChild(nameLine);
    if (isNonEmptyString(handleLine.textContent)) userLines.appendChild(handleLine);
    if (isNonEmptyString(robloxLine.textContent)) userLines.appendChild(robloxLine);

    userWrap.appendChild(avatar);
    userWrap.appendChild(userLines);
    userTd.appendChild(userWrap);

    const statusTd = document.createElement("td");
    statusTd.innerHTML = `
      <span class="badge status-${type}">
        <span class="dot"></span>
        <span>${statusText(type)}</span>
      </span>
    `;

    const gameTd = document.createElement("td");
    const gameWrap = document.createElement("div");
    gameWrap.className = "game";

    const currentName = safeText(item?.game?.currentName || "");
    const currentUrl = safeText(item?.game?.currentUrl || "");
    const lastName = safeText(item?.game?.lastName || "");
    const lastUrl = safeText(item?.game?.lastUrl || "");
    const lastAt = safeText(item?.game?.lastAt || "");

    if (type === "in_game") {
      const title = document.createElement("div");
      title.className = "game-title";
      const label = isNonEmptyString(currentName) ? currentName : "กำลังเล่นเกม";
      if (isNonEmptyString(currentUrl)) title.appendChild(createLink(label, currentUrl));
      else title.textContent = label;
      gameWrap.appendChild(title);

      const sub = document.createElement("div");
      sub.className = "game-sub";
      sub.textContent = safeText(item?.presence?.lastLocation || "");
      if (
        isNonEmptyString(sub.textContent) &&
        (!isNonEmptyString(currentName) || sub.textContent !== currentName)
      ) {
        gameWrap.appendChild(sub);
      }
    } else if (type === "offline" && isNonEmptyString(lastName)) {
      const title = document.createElement("div");
      title.className = "game-title";
      const label = `ล่าสุด: ${lastName}`;
      if (isNonEmptyString(lastUrl)) title.appendChild(createLink(label, lastUrl));
      else title.textContent = label;
      gameWrap.appendChild(title);

      const sub = document.createElement("div");
      sub.className = "game-sub";
      sub.textContent = lastAt ? `เวลา ${formatTime(lastAt)}` : "";
      if (isNonEmptyString(sub.textContent)) gameWrap.appendChild(sub);
    } else {
      const muted = document.createElement("div");
      muted.className = "muted";
      muted.textContent = safeText(item?.presence?.lastLocation || "-");
      gameWrap.appendChild(muted);
    }

    gameTd.appendChild(gameWrap);

    const linkTd = document.createElement("td");
    linkTd.appendChild(createLink("ดูโปรไฟล์", safeText(item?.profileUrl || "#")));

    const joinTd = document.createElement("td");
    const joinUrl = safeText(item?.game?.joinUrl || "");
    if (type === "in_game" && isNonEmptyString(joinUrl)) {
      const joinA = createLink("Join", joinUrl);
      joinA.className = "btn";
      joinTd.appendChild(joinA);
    } else {
      joinTd.textContent = "";
    }

    tr.appendChild(userTd);
    tr.appendChild(statusTd);
    tr.appendChild(gameTd);
    tr.appendChild(linkTd);
    tr.appendChild(joinTd);
    rowsEl.appendChild(tr);
  }
}

let inFlight = false;

function resolvePresenceApiUrl() {
  const params = new URLSearchParams(window.location.search);
  const apiParam = params.get("api");

  if (isNonEmptyString(apiParam)) {
    try {
      const raw = apiParam.trim();
      if (raw.endsWith("/api/presence")) return raw;
      return raw.replace(/\/+$/, "") + "/api/presence";
    } catch {
      return "./api/presence";
    }
  }

  return "./api/presence";
}

async function refresh() {
  if (inFlight) return;
  inFlight = true;
  errorEl.classList.add("hidden");
  errorEl.textContent = "";

  try {
    const url = resolvePresenceApiUrl();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    render(data);
    loadingEl.classList.add("hidden");
  } catch (e) {
    loadingEl.classList.add("hidden");
    errorEl.textContent = "ดึงสถานะไม่สำเร็จ (อาจโดน rate limit หรือเน็ตมีปัญหา) ลองรีเฟรชหน้าใหม่";
    errorEl.classList.remove("hidden");
  } finally {
    inFlight = false;
  }
}

refresh();
setInterval(refresh, 20_000);
