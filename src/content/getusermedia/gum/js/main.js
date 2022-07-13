/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';
const url = new URL(location.href);
const width = parseInt(url.searchParams.get('width'), 10) || 640;
const height = parseInt(url.searchParams.get('height'), 10) || 360;
const deviceId = url.searchParams.get('deviceId') || '';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: false,
  video: {
    width,
    height,
    deviceId,
  }
};

function handleSuccess(stream, container) {
  console.log(container);
  const video = document.getElementById(container);
  const videoTracks = stream.getVideoTracks();
  log('Got stream with constraints:', constraints);
  log('Actual stream settings:', videoTracks[0].getSettings());
  log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
}

function handleError(error) {
  if (error.name === 'OverconstrainedError') {
    const v = constraints.video;
    errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
  } else if (error.name === 'NotAllowedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

async function init(e, container) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream, container);
    e.target.disabled = true;
  } catch (e) {
    handleError(e);
  }
}

document.querySelector('#showVideo').addEventListener('click', e => init(e, 'gum-local'));
document.querySelector('#showVideo2').addEventListener('click', e => init(e, 'gum-local-2'));
