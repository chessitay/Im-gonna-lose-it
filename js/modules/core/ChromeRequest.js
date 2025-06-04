// Chrome extension communication
export const ChromeRequest = (function () {
  // Options listener and sender
  var requestId = 0;
  function getData(data) {
    var id = requestId++;
    return new Promise(function (resolve, reject) {
      var listener = function (evt) {
        if (evt.detail.requestId == id) {
          // Deregister self
          window.removeEventListener("BetterMintSendOptions", listener);
          resolve(evt.detail.data);
        }
      };
      window.addEventListener("BetterMintSendOptions", listener);
      var payload = {
        data: data,
        id: id,
      };
      window.dispatchEvent(
        new CustomEvent("BetterMintGetOptions", { detail: payload })
      );
    });
  }
  return { getData: getData };
})(); 