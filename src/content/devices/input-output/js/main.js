/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

const videoElement = document.querySelector('video');
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const videoSelect = document.querySelector('select#videoSource');
const selectors = [audioInputSelect, audioOutputSelect, videoSelect];

audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

// 只有首次获取到设备列表需要打印
let isFirstGetDevices = false;
// 1. 保存一份设备列表
let prevDevices = [];
/**
 * 
 * @param {MediaDeviceInfo[]} deviceInfos 
 */
function setSelectOptions(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput') {
      option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

// navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== 'undefined') {
    element.setSinkId(sinkId)
        .then(() => {
          log(`[success] audio output device attached: ${sinkId}`);
        })
        .catch(error => {
          let errorMessage = error;
          if (error.name === 'SecurityError') {
            errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
          }
          log('[error]' + errorMessage);
          // Jump back to first output device in the list as it's the default.
          audioOutputSelect.selectedIndex = 0;
        });
  } else {
    log('[warn] Browser does not support output device selection.');
  }
}

function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
  attachSinkId(videoElement, audioDestination);
}

/**
 * @param {MediaStream} stream
 */
function gotStream(stream) {
  window.stream = stream; // make stream available to console
  videoElement.srcObject = stream;
  videoElement.onabort = () => { log('[videoElement] onabort') };
  videoElement.onchange = () => { log('[videoElement] onchange') };
  videoElement.onclose = () => { log('[videoElement] onclose') };
  videoElement.onended = () => { log('[videoElement] onended') };
  const audioTrack = stream.getAudioTracks()[0];
  logAudioTrackSettings(audioTrack);
  if (audioTrack) {
    audioTrack.onended = () => { log('[audioTrack] onended') };
    audioTrack.onmute = () => { log('[audioTrack] onmute') };
    audioTrack.onunmute = () => { log('[audioTrack] onunmute') };
  }
}

function handleError(error) {
  log(`[error] navigator.mediaDevices.getUserMedia error: [${error.name}]${error.message}`);
}

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioInputSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  // const constraints = {
  //   audio: false,
  //   video: true,
  // }
  log(`UA: ${navigator.userAgent}`);
  log('视频流参数设置：' + JSON.stringify(constraints));
  navigator.mediaDevices.getUserMedia(constraints)
    .then(gotStream)
    .then(() => {
      if (!isFirstGetDevices) {
        return getDevices();
      }
    })
    .then((res) => {
      if (!res) return;
      if (!isFirstGetDevices) {
        logDevices(res);
      }
      isFirstGetDevices = true;
      prevDevices = res;
      setSelectOptions(res);
      initDeviceChangeListener();
    }).catch(handleError);
}

audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;

videoSelect.onchange = start;

start();

/**
 * 打印设备列表中的信息。
 * @param {MediaDeviceInfo[]} list 
 */
function logDevices(list) {
  list.forEach((item) => {
    // if (item.kind === 'videoinput') return;
    log(`
      [${item.kind}]
      groupId:${formatGroupId(item.groupId)}
      deviceId:${formatDeviceId(item.deviceId)} 
      label:${item.label} 
      `);
  });
}

/**
 * 打印 audioTrack 使用的设备信息。
 * @param {MediaStreamTrack} audioTrack 
 */
function logAudioTrackSettings(audioTrack) {
  if (!audioTrack) {
    log('[audioTrack] 奇怪，没有 audioTrack');
    return;
  }
  const settings = audioTrack.getSettings();
  log(`[audioTrack] 
    label:${audioTrack.label} 
    kind:${audioTrack.kind} / 
    deviceId:${formatDeviceId(settings.deviceId)}
    groupId:${formatGroupId(settings.groupId)}
    `);
}


// 2. 监听设备变更事件
function initDeviceChangeListener() {
  const isSupportDeviceChange = 'ondevicechange' in navigator.mediaDevices;
  log(`[support] 是否支持 devicechange 事件:${isSupportDeviceChange}`);
  if (isSupportDeviceChange) {
    navigator.mediaDevices.addEventListener('devicechange', checkDevicesUpdate);
  } else {
    setInterval(checkDevicesUpdate, 1000);
  }
}

// 判断是否当前正在使用的设备被拔出
function isCurrentMicrophoneRemoved(devicesRemoved) {
  try {
    const audioTrack = window.stream.getAudioTracks()[0];
    const inUsingDeviceId = audioTrack.getSettings().deviceId;
    log(`正在使用：${formatDeviceId(inUsingDeviceId)}`);
    return audioTrack && devicesRemoved.filter(item => item.deviceId === inUsingDeviceId);
  } catch (error) {
    log(`[error] ${error.name}; ${error.message}`);
  }
}

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function switchToDefaultDevice() {
  // ios 会自动切换
  if (isIOS()) return;
  log('切换设备');
  if (window.stream) {
    window.stream.getTracks().forEach(track => track.stop());
  }
  const constraints = {
    audio: true,
    video: true,
  };
  navigator.mediaDevices.getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

async function checkDevicesUpdate() {
  // 3. 设备变更时，获取变更后的设备列表，用于和 prevDevices 比对
  const devices = await getDevices();
  // 4. 新增的设备列表
  const devicesAdded = devices.filter(device => prevDevices.findIndex(({ deviceId, kind }) => device.kind === kind && device.deviceId === deviceId) < 0);
  // 5. 移除的设备列表
  const devicesRemoved = prevDevices.filter(prevDevice => devices.findIndex(({ deviceId, kind }) => prevDevice.kind === kind && prevDevice.deviceId === deviceId) < 0);
  if (devicesAdded.length > 0 || devicesRemoved.length > 0) {
    // log(`设备变化
    //   +${devicesAdded.length} -${devicesRemoved.length}
    //   prev:${prevDevices.map(item => item.kind + formatDeviceId(item.deviceId)).join(',')}
    //   curr:${devices.map(item => item.kind + formatDeviceId(item.deviceId)).join(',')}
    //   `);
    setSelectOptions(devices);
  }
  if (devicesAdded.length > 0) {
    log('新增设备');
    logDevices(devicesAdded);
    switchToDefaultDevice();
  }
  if (devicesRemoved.length > 0) {
    log('移除设备');
    logDevices(devicesRemoved);
    if (isCurrentMicrophoneRemoved(devicesRemoved)) {
      log(`当前在使用的设备被移除了！`);
      switchToDefaultDevice();
    }
  }
  prevDevices = devices;
}
