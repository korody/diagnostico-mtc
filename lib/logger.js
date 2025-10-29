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
  const when = new Date().toISOString();
  const epoch = Date.now();
  if (obj !== undefined) {
    // attach timestamps inside the printed object for easier JSON search
    const wrapped = { _logged_at: when, _logged_at_epoch: epoch, payload: obj };
    console.log(`${when} [INFO] [${id}] ${msg} -> ${_safePrint(wrapped)}`);
  } else {
    console.log(`${when} [INFO] [${id}] ${msg}`);
  }
}

function error(id, msg, obj) {
  const when = new Date().toISOString();
  const epoch = Date.now();
  if (obj !== undefined) {
    const wrapped = { _logged_at: when, _logged_at_epoch: epoch, payload: obj };
    console.error(`${when} [ERROR] [${id}] ${msg} -> ${_safePrint(wrapped)}`);
  } else {
    console.error(`${when} [ERROR] [${id}] ${msg}`);
  }
}

module.exports = {
  mkid,
  info,
  error
};