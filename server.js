const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const https = require("https");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";

const USERS = [
  {
    id: 658518683,
    display: "Brain",
    handle: "@TheBrainy06",
    profileUrl: "https://www.roblox.com/users/658518683/profile",
  },
  {
    id: 1029137081,
    display: "Zai",
    handle: "@Zaixoz",
    profileUrl: "https://www.roblox.com/users/1029137081/profile",
  },
  {
    id: 3885333094,
    display: "karkaroteZemel",
    handle: "@karkaroteZemel",
    profileUrl: "https://www.roblox.com/users/3885333094/profile",
  },
  {
    id: 369981372,
    display: "XDavodioX",
    handle: "@XDavodioX",
    profileUrl: "https://www.roblox.com/users/369981372/profile",
  },
  {
    id: 344908964,
    display: "asertt1",
    handle: "@asertt1",
    profileUrl: "https://www.roblox.com/users/344908964/profile",
  },
  {
    id: 479087043,
    display: "onlinoon",
    handle: "@onlinoon",
    profileUrl: "https://www.roblox.com/users/479087043/profile",
  },
  {
    id: 103591509,
    display: "Uhette",
    handle: "@UhDeadMeme21",
    profileUrl: "https://www.roblox.com/users/103591509/profile",
  },
  {
    id: 2755094646,
    display: "Kin",
    handle: "@Kinozb",
    profileUrl: "https://www.roblox.com/users/2755094646/profile",
  },
  {
    id: 126884453,
    display: "ChipsDoge",
    handle: "@JustsomePlainChips",
    profileUrl: "https://www.roblox.com/users/126884453/profile",
  },
  {
    id: 1720114452,
    display: "Doge",
    handle: "@hahaienjoychips",
    profileUrl: "https://www.roblox.com/users/1720114452/profile",
  },
  {
    id: 4136044298,
    display: "SHAQ",
    handle: "@BodilySniffer",
    profileUrl: "https://www.roblox.com/users/4136044298/profile",
  },
  {
    id: 117350142,
    display: "NoobLance",
    handle: "@STR1XPOINT",
    profileUrl: "https://www.roblox.com/users/117350142/profile",
  },
  {
    id: 498948263,
    display: "lambarini",
    handle: "@lambarini",
    profileUrl: "https://www.roblox.com/users/498948263/profile",
  },
  {
    id: 1535121082,
    display: "Berry",
    handle: "@stxrw_berri",
    profileUrl: "https://www.roblox.com/users/1535121082/profile",
  },
  {
    id: 1988546377,
    display: "Towh",
    handle: "@Mowhno",
    profileUrl: "https://www.roblox.com/users/1988546377/profile",
  },
  {
    id: 219365262,
    display: "Apex",
    handle: "@rode347",
    profileUrl: "https://www.roblox.com/users/219365262/profile",
  },
  {
    id: 487752459,
    display: "zwhiso",
    handle: "@zwhiso",
    profileUrl: "https://www.roblox.com/users/487752459/profile",
  },
];

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extra,
  };
}

function sendJson(res, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, corsHeaders({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    ...extraHeaders,
  }));
  res.end(body);
}

function sendText(res, status, text, extraHeaders = {}) {
  res.writeHead(status, corsHeaders({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  }));
  res.end(text);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function safePublicPath(urlPathname) {
  const decoded = decodeURIComponent(urlPathname);
  const normalized = decoded.replace(/\\/g, "/");
  const withoutPublic =
    normalized === "/public"
      ? "/"
      : normalized.startsWith("/public/")
        ? normalized.slice("/public".length)
        : normalized;
  const rel = withoutPublic === "/" ? "/index.html" : withoutPublic;
  const joined = path.join(PUBLIC_DIR, rel);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(path.resolve(PUBLIC_DIR))) return null;
  return resolved;
}

function httpsJson(urlString, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlString);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method,
        headers,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const status = res.statusCode || 0;
          if (status < 200 || status >= 300) {
            reject(new Error(`HTTP ${status}: ${data.slice(0, 200)}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function fetchJson(url, options) {
  if (typeof fetch === "function") {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }
  return httpsJson(url, {
    method: options?.method || "GET",
    headers: options?.headers || {},
    body: options?.body,
  });
}

const PRESENCE_URL = "https://presence.roblox.com/v1/presence/users";
let cachedPresence = null;
let cachedAtMs = 0;
const CACHE_TTL_MS = 15_000;

const USER_INFO_URL_BASE = "https://users.roblox.com/v1/users/";
const AVATAR_HEADSHOT_URL =
  "https://thumbnails.roblox.com/v1/users/avatar-headshot";
const GAMES_BY_UNIVERSE_URL_BASE = "https://games.roblox.com/v1/games";

const userInfoCache = new Map();
const avatarCache = new Map();
const gameCache = new Map();
const lastSeenGame = new Map();

function nowMs() {
  return Date.now();
}

function getFromCache(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (typeof entry.expiresAtMs === "number" && entry.expiresAtMs < nowMs()) {
    map.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(map, key, value, ttlMs) {
  map.set(key, { value, expiresAtMs: nowMs() + ttlMs });
}

function presenceTypeToLabel(presenceType) {
  if (presenceType === 0) return "offline";
  if (presenceType === 1) return "online";
  if (presenceType === 2) return "in_game";
  if (presenceType === 3) return "in_studio";
  return "unknown";
}

async function getUserInfo(userId) {
  const cached = getFromCache(userInfoCache, userId);
  if (cached) return cached;
  const data = await fetchJson(`${USER_INFO_URL_BASE}${userId}`, {
    headers: {
      "User-Agent": "Webstatus/1.0 (presence dashboard)",
    },
  });
  const value = {
    name: typeof data?.name === "string" ? data.name : "",
    displayName: typeof data?.displayName === "string" ? data.displayName : "",
  };
  setCache(userInfoCache, userId, value, 60 * 60 * 1000);
  return value;
}

async function getUsersInfo(userIds) {
  const result = {};
  await Promise.all(
    userIds.map(async (id) => {
      try {
        result[id] = await getUserInfo(id);
      } catch {
        result[id] = { name: "", displayName: "" };
      }
    })
  );
  return result;
}

async function getAvatars(userIds) {
  const missing = [];
  const result = {};
  for (const id of userIds) {
    const cached = getFromCache(avatarCache, id);
    if (cached) result[id] = cached;
    else missing.push(id);
  }
  if (missing.length === 0) return result;

  const url = new URL(AVATAR_HEADSHOT_URL);
  url.searchParams.set("userIds", missing.join(","));
  url.searchParams.set("size", "150x150");
  url.searchParams.set("format", "Png");
  url.searchParams.set("isCircular", "true");
  const data = await fetchJson(url.toString(), {
    headers: { "User-Agent": "Webstatus/1.0 (presence dashboard)" },
  });
  const list = Array.isArray(data?.data) ? data.data : [];
  for (const item of list) {
    const id = Number(item?.targetId);
    const imageUrl = typeof item?.imageUrl === "string" ? item.imageUrl : "";
    if (Number.isFinite(id)) {
      result[id] = imageUrl;
      setCache(avatarCache, id, imageUrl, 60 * 60 * 1000);
    }
  }
  return result;
}

async function getGamesByUniverse(universeIds) {
  const unique = Array.from(
    new Set(universeIds.map((id) => Number(id)).filter((n) => Number.isFinite(n)))
  );
  const result = {};
  const missing = [];

  for (const id of unique) {
    const cached = getFromCache(gameCache, id);
    if (cached) result[id] = cached;
    else missing.push(id);
  }

  if (missing.length > 0) {
    const url = new URL(GAMES_BY_UNIVERSE_URL_BASE);
    url.searchParams.set("universeIds", missing.join(","));
    const data = await fetchJson(url.toString(), {
      headers: { "User-Agent": "Webstatus/1.0 (presence dashboard)" },
    });
    const list = Array.isArray(data?.data) ? data.data : [];
    for (const g of list) {
      const id = Number(g?.id);
      if (!Number.isFinite(id)) continue;
      const name = typeof g?.name === "string" ? g.name : "";
      const rootPlaceId = Number(g?.rootPlaceId);
      const placeId = Number.isFinite(rootPlaceId) ? rootPlaceId : null;
      const url = placeId ? `https://www.roblox.com/games/${placeId}/` : "";
      const value = { universeId: id, name, rootPlaceId: placeId, url };
      result[id] = value;
      setCache(gameCache, id, value, 60 * 1000);
    }
  }

  return result;
}

function joinUrlFor(placeId, gameId) {
  const pId = Number(placeId);
  const hasPlace = Number.isFinite(pId) && pId > 0;
  const gId = typeof gameId === "string" && gameId.length > 0 ? gameId : null;
  if (hasPlace && gId) {
    return `roblox://experiences/start?placeId=${pId}&gameInstanceId=${encodeURIComponent(
      gId
    )}`;
  }
  if (hasPlace) {
    return `https://www.roblox.com/games/${pId}/`;
  }
  return "";
}

async function getPresenceSnapshot() {
  const now = Date.now();
  if (cachedPresence && now - cachedAtMs < CACHE_TTL_MS) return cachedPresence;

  const userIds = USERS.map((u) => u.id);
  const body = JSON.stringify({ userIds });
  const data = await fetchJson(PRESENCE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Webstatus/1.0 (presence dashboard)",
    },
    body,
  });

  const presences = {};
  const universeIds = [];
  const list = Array.isArray(data?.userPresences) ? data.userPresences : [];
  for (const p of list) {
    const id = Number(p.userId);
    const universeId = p.universeId ?? null;
    presences[id] = {
      type: presenceTypeToLabel(p.userPresenceType),
      lastLocation: typeof p.lastLocation === "string" ? p.lastLocation : "",
      placeId: p.placeId ?? null,
      gameId: p.gameId ?? null,
      universeId,
    };
    if (universeId != null) universeIds.push(universeId);
  }

  const [usersInfo, avatars, gamesByUniverse] = await Promise.all([
    getUsersInfo(userIds).catch(() => ({})),
    getAvatars(userIds).catch(() => ({})),
    getGamesByUniverse(universeIds).catch(() => ({})),
  ]);

  const items = USERS.map((u) => {
    const p = presences[u.id] || {
      type: "unknown",
      lastLocation: "",
      placeId: null,
      gameId: null,
      universeId: null,
    };
    const universeIdNum =
      typeof p.universeId === "number" ? p.universeId : Number(p.universeId);
    const game = Number.isFinite(universeIdNum)
      ? gamesByUniverse[universeIdNum] || null
      : null;

    const placeId = p.placeId ?? game?.rootPlaceId ?? null;
    const gameId = typeof p.gameId === "string" ? p.gameId : null;

    if (p.type === "in_game") {
      const name = (game && game.name) || p.lastLocation || "";
      const url = (game && game.url) || (placeId ? `https://www.roblox.com/games/${placeId}/` : "");
      if (name || url) {
        lastSeenGame.set(u.id, {
          name,
          url,
          universeId: p.universeId ?? null,
          placeId,
          gameId,
          at: new Date().toISOString(),
        });
      }
    }

    const last = lastSeenGame.get(u.id) || null;
    const joinUrl = p.type === "in_game" ? joinUrlFor(placeId, gameId) : "";

    return {
      id: u.id,
      display: u.display,
      handle: u.handle,
      profileUrl: u.profileUrl,
      robloxName: usersInfo?.[u.id]?.name || "",
      robloxDisplayName: usersInfo?.[u.id]?.displayName || "",
      avatarUrl: avatars?.[u.id] || "",
      presence: {
        type: p.type,
        lastLocation: p.lastLocation,
        placeId: p.placeId ?? null,
        gameId: p.gameId ?? null,
        universeId: p.universeId ?? null,
      },
      game: {
        currentName: p.type === "in_game" ? (game?.name || p.lastLocation || "") : "",
        currentUrl:
          p.type === "in_game"
            ? game?.url || (placeId ? `https://www.roblox.com/games/${placeId}/` : "")
            : "",
        joinUrl,
        lastName: last?.name || "",
        lastUrl: last?.url || "",
        lastAt: last?.at || "",
      },
    };
  });

  cachedPresence = {
    updatedAt: new Date().toISOString(),
    items,
  };
  cachedAtMs = now;
  return cachedPresence;
}

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url || "/", `http://${host}`);

    if (url.pathname === "/api/presence") {
      if (req.method === "OPTIONS") {
        res.writeHead(204, corsHeaders({ "Cache-Control": "no-store" }));
        res.end();
        return;
      }
      if (req.method !== "GET") {
        sendText(res, 405, "Method Not Allowed");
        return;
      }
      const snapshot = await getPresenceSnapshot();
      sendJson(res, 200, snapshot);
      return;
    }

    const filePath = safePublicPath(url.pathname);
    if (!filePath) {
      sendText(res, 400, "Bad Request");
      return;
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        sendText(res, 404, "Not Found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "no-store",
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    sendJson(res, 500, { error: "internal_error" });
  }
});

server.listen(PORT, () => {
  console.log(`Webstatus running: http://localhost:${PORT}`);
});
