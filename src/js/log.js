/**
 * Get the raw type string of a value, e.g., [object Object].
 */
const _toString = Object.prototype.toString;
/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
function isPlainObject(obj) {
  return _toString.call(obj) === '[object Object]';
}
/**
 * Convert a value to a string that is actually rendered.
 */
function toString(val) {
  return val == null ?
    '' :
    Array.isArray(val) || (isPlainObject(val) && val.toString === _toString) ?
    JSON.stringify(val) :
    val instanceof Error ?
    `errName:${val.name};errMessage:${val.message}` :
    String(val);
}

function log(...args) {
  console.log(...args);
  const logContent = args.reduce((pre, cur) => pre + ' ' + toString(cur), '');
  // 这个函数的词法作用域会使用这个实例
  // 而不是 window.console
  let logger = document.getElementById('debugInfo');
  if (logger === null) {
    logger = document.createElement('div');
    logger.id = 'debugInfo';
    logger.style.background = '#dedede';
    logger.style.border = '1px solid silver';
    logger.style.padding = '5px';
    logger.style.fontFamily = 'monospace';
    // logger.style.width = '400px';
    // logger.style.position = 'absolute';
    // logger.style.right = '0px';
    // logger.style.top = '0px';
    document.body.appendChild(logger);
  }

  logger.innerHTML += `<p> ${logContent}</p>`;
}

function initLog() {
  const elLogInfo = document.createElement('div');
  elLogInfo.setAttribute('id', 'logInfo');
  document.body.append(elLogInfo);
}
initLog();

const useShortId = location.search.includes('short');

function formatDeviceId(deviceId) {
  return (useShortId && deviceId) ? deviceId.slice(0, 7) : deviceId;
}

function formatGroupId(groupId) {
  return (useShortId && groupId) ? groupId.slice(0, 5) : groupId;
}