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
  if (obj !== undefined) {
    console.log(`[INFO] [${id}] ${msg} -> ${_safePrint(obj)}`);
  } else {
    console.log(`[INFO] [${id}] ${msg}`);
  }
}

function error(id, msg, obj) {
  if (obj !== undefined) {
    console.error(`[ERROR] [${id}] ${msg} -> ${_safePrint(obj)}`);
  } else {
    console.error(`[ERROR] [${id}] ${msg}`);
  }
}

module.exports = {
  mkid,
  info,
  error
};