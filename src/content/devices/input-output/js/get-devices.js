/**
 * 打印设备列表中的信息。
 * @param {MediaDeviceInfo[]} list 
 */
function logDevices(list) {
  list.forEach((item) => {
    if (item.kind === 'videoinput') return;
    log(`
      [${item.kind}]
      groupId:${formatGroupId(item.groupId)}
      deviceId:${formatDeviceId(item.deviceId)} 
      label:${item.label} 
      `);
  });
}
async function getDevices() {
  const deviceList = await navigator.mediaDevices.enumerateDevices();
  const audioinputList = [];
  const audiooutputList = [];
  deviceList.forEach((item) => {
    if (item.kind === 'audioinput') {
      audioinputList.push(item);
    } else if (item.kind === 'audiooutput') {
      audiooutputList.push(item);
    }
  });
  log('麦克风列表：');
  logDevices(audioinputList);
  log('扬声器列表：');
  logDevices(audiooutputList);
}
async function init() {
  const constraints = {
    audio: true,
    video: true,
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  stream.getTracks().forEach(track => track.stop());
  getDevices();
}

init();