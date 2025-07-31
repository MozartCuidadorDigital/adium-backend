/**
 * Send a message through WebSocket
 * @param {WebSocket} ws - WebSocket instance
 * @param {Object} message - Message object to send
 */
export function sendMessage(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket is not open, cannot send message');
  }
}

/**
 * Send error message
 * @param {WebSocket} ws - WebSocket instance
 * @param {string} error - Error message
 * @param {string} code - Error code (optional)
 */
export function sendError(ws, error, code = 'ERROR') {
  sendMessage(ws, {
    type: 'error',
    code: code,
    message: error,
    timestamp: Date.now()
  });
}

/**
 * Send status update
 * @param {WebSocket} ws - WebSocket instance
 * @param {string} status - Status string
 */
export function sendStatus(ws, status) {
  sendMessage(ws, {
    type: 'status',
    status: status,
    timestamp: Date.now()
  });
}

/**
 * Send ping message
 * @param {WebSocket} ws - WebSocket instance
 */
export function sendPing(ws) {
  sendMessage(ws, {
    type: 'ping',
    timestamp: Date.now()
  });
}

/**
 * Send pong response
 * @param {WebSocket} ws - WebSocket instance
 */
export function sendPong(ws) {
  sendMessage(ws, {
    type: 'pong',
    timestamp: Date.now()
  });
}

/**
 * Parse incoming WebSocket message
 * @param {string|Buffer} data - Raw message data
 * @returns {Object|null} - Parsed message object or null if invalid
 */
export function parseMessage(data) {
  try {
    const message = typeof data === 'string' ? data : data.toString();
    return JSON.parse(message);
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
    return null;
  }
}

/**
 * Validate message structure
 * @param {Object} message - Message object to validate
 * @returns {boolean} - Whether message is valid
 */
export function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (!message.type || typeof message.type !== 'string') {
    return false;
  }

  return true;
}

/**
 * Create a heartbeat interval for WebSocket connection
 * @param {WebSocket} ws - WebSocket instance
 * @param {number} interval - Heartbeat interval in milliseconds
 * @returns {Object} - Heartbeat control object
 */
export function createHeartbeat(ws, interval = 30000) {
  let heartbeatInterval = null;
  let lastPong = Date.now();

  const start = () => {
    heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastPong = now - lastPong;

      // If no pong received in 2 intervals, consider connection dead
      if (timeSinceLastPong > interval * 2) {
        console.warn('WebSocket heartbeat timeout, closing connection');
        ws.close(1000, 'Heartbeat timeout');
        return;
      }

      sendPing(ws);
    }, interval);
  };

  const stop = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  const updatePong = () => {
    lastPong = Date.now();
  };

  return {
    start,
    stop,
    updatePong
  };
}

/**
 * Create a reconnection handler for WebSocket
 * @param {string} url - WebSocket URL
 * @param {Object} options - Reconnection options
 * @returns {Object} - Reconnection control object
 */
export function createReconnectionHandler(url, options = {}) {
  const {
    maxAttempts = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2
  } = options;

  let currentAttempt = 0;
  let currentDelay = initialDelay;
  let reconnectTimeout = null;
  let isReconnecting = false;

  const attemptReconnect = (onReconnect) => {
    if (isReconnecting || currentAttempt >= maxAttempts) {
      return;
    }

    isReconnecting = true;
    currentAttempt++;

    console.log(`Attempting to reconnect (${currentAttempt}/${maxAttempts})...`);

    reconnectTimeout = setTimeout(() => {
      try {
        const ws = new WebSocket(url);
        onReconnect(ws);
        
        // Reset on successful connection
        ws.onopen = () => {
          console.log('Reconnection successful');
          isReconnecting = false;
          currentAttempt = 0;
          currentDelay = initialDelay;
        };

        ws.onerror = () => {
          console.log('Reconnection failed');
          isReconnecting = false;
          currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
          attemptReconnect(onReconnect);
        };

      } catch (error) {
        console.error('Error during reconnection:', error);
        isReconnecting = false;
        currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
        attemptReconnect(onReconnect);
      }
    }, currentDelay);
  };

  const stop = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    isReconnecting = false;
  };

  const reset = () => {
    stop();
    currentAttempt = 0;
    currentDelay = initialDelay;
  };

  return {
    attemptReconnect,
    stop,
    reset,
    isReconnecting: () => isReconnecting,
    getCurrentAttempt: () => currentAttempt,
    getMaxAttempts: () => maxAttempts
  };
}

/**
 * Create a message queue for WebSocket
 * @param {WebSocket} ws - WebSocket instance
 * @returns {Object} - Message queue control object
 */
export function createMessageQueue(ws) {
  const queue = [];
  let isProcessing = false;

  const processQueue = () => {
    if (isProcessing || queue.length === 0 || ws.readyState !== ws.OPEN) {
      return;
    }

    isProcessing = true;

    while (queue.length > 0 && ws.readyState === ws.OPEN) {
      const message = queue.shift();
      try {
        sendMessage(ws, message);
      } catch (error) {
        console.error('Error sending queued message:', error);
      }
    }

    isProcessing = false;
  };

  const enqueue = (message) => {
    queue.push(message);
    processQueue();
  };

  const clear = () => {
    queue.length = 0;
  };

  const getSize = () => queue.length;

  return {
    enqueue,
    clear,
    getSize,
    processQueue
  };
}

/**
 * Get WebSocket ready state string
 * @param {WebSocket} ws - WebSocket instance
 * @returns {string} - Ready state string
 */
export function getReadyStateString(ws) {
  const states = {
    0: 'CONNECTING',
    1: 'OPEN',
    2: 'CLOSING',
    3: 'CLOSED'
  };
  return states[ws.readyState] || 'UNKNOWN';
}

/**
 * Check if WebSocket is ready to send messages
 * @param {WebSocket} ws - WebSocket instance
 * @returns {boolean} - Whether WebSocket is ready
 */
export function isReady(ws) {
  return ws.readyState === ws.OPEN;
} 