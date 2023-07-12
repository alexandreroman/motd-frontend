function init() {
  $('#refresh-quote-button').on('click', refreshQuote);
  loadQuote();
}

function buildBackendUrl(req) {
  var myReq = req;
  if(!myReq.startsWith("/")) {
    myReq = "/" + req;
  }
  return config.backendBaseUrl + myReq;
}

function loadQuote() {
  $('#loading-quote').show();
  $('#quote').hide();

  const url = buildBackendUrl("/api/v1/quote");
  console.log("Loading quote from: %s", url);

  axios.get(url, {
    timeout: 20000
  })
    .then(resp => {
      const quoteMsg = resp.data.message;
      const quoteSrc = resp.data.source;
      showQuote(quoteMsg, quoteSrc);
    }).catch(e => {
      if(e.response) {
        // Request sent and the server responded.
        console.log("Received error while loading quote: %s (error %s)",
          e.message, e.response.status);
      } else if(e.request) {
        // Request sent but no response from server.
        console.log("No response from server while loading quote: %s", e.message);
      } else {
        // Something bad happened.
        console.log("Failed to load quote", e.message);
      }
      showQuoteError();
    });
}

function refreshQuote() {
  $('#loading-quote').show();
  $('#quote').hide();

  const url = buildBackendUrl("/api/v1/quote");
  console.log("Refreshing quote from: %s", url);

  axios.post(url, {
    timeout: 20000
  })
    .then(resp => {
      const quoteMsg = resp.data.message;
      const quoteSrc = resp.data.source;
      showQuote(quoteMsg, quoteSrc);
    }).catch(e => {
      if(e.response) {
        // Request sent and the server responded.
        console.log("Received error while refreshing quote: %s (error %s)",
          e.message, e.response.status);
      } else if(e.request) {
        // Request sent but no response from server.
        console.log("No response from server while refreshing quote: %s", e.message);
      } else {
        // Something bad happened.
        console.log("Failed to refresh quote", e.message);
      }
      showQuoteError();
    });
}

function showQuote(quoteMessage, quoteSource) {
  $('#quote-message').html(quoteMessage);
  $('#quote-source').html(quoteSource);
  $('#loading-quote').hide();
  $('#quote').show();
  console.log("Quote updated: %s (%s)", quoteMessage, quoteSource);
}

function showQuoteError() {
  const quoteMsgFallback = "Shift happens: something went wrong 😥";
  const quoteSrcFallback = "Oops";
  $('#quote-message').html(quoteMsgFallback);
  $('#quote-source').html(quoteSrcFallback);
  $('#loading-quote').hide();
  $('#quote').show();
  console.log("Quote error set");
}
