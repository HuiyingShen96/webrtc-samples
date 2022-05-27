function log(message) {
  // 这个函数的词法作用域会使用这个实例
  // 而不是 window.console
  let console = document.getElementById('debugInfo');
  if (console === null) {
    console = document.createElement('div');
    console.id = 'debugInfo';
    console.style.background = '#dedede';
    console.style.border = '1px solid silver';
    console.style.padding = '5px';
    console.style.fontFamily = 'monospace';
    // console.style.width = '400px';
    // console.style.position = 'absolute';
    // console.style.right = '0px';
    // console.style.top = '0px';
    document.body.appendChild(console);
  }

  console.innerHTML += `<p> ${message}</p>`;
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