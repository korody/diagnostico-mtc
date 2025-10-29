// logger (migrado) - não usar chaves hardcoded em produção
// Simple structured logger used by serverless functions to add a correlation id and timestamps.
// Keep minimal to avoid extra dependencies and avoid leaking secrets.
function mkid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

function _safePrint(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}

function info(id, msg, obj) {
  // Print message starting with the provided msg (so Vercel's Messages column
  // shows the emoji/marker first). Append the request id at the end for
  // correlation. Keep object printed after the message for details.
  if (obj !== undefined) {
    console.log(`${msg} -> ${_safePrint(obj)} [req:${id}]`);
  } else {
    console.log(`${msg} [req:${id}]`);
  }
}

function error(id, msg, obj) {
  // For errors, likewise start with the message so it appears first in logs.
  if (obj !== undefined) {
    console.error(`${msg} -> ${_safePrint(obj)} [req:${id}]`);
  } else {
    console.error(`${msg} [req:${id}]`);
  }
}

module.exports = {
  mkid,
  info,
  error
};