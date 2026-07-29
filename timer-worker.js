// Background Timer Web Worker
let timerId = null;

self.onmessage = function (e) {
  const { command, interval } = e.data;

  if (command === 'START') {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage({ type: 'TICK', timestamp: Date.now() });
    }, interval || 1000);
  } else if (command === 'STOP' || command === 'PAUSE') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
