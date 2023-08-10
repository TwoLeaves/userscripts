// ==UserScript==
// @name        Fix "Open App" button on mobile YouTube to open with default handler (e.g. YouTube Revanced)
// @namespace   Violentmonkey Scripts
// @match       https://m.youtube.com/*
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.registerMenuCommand
// @version     1.0
// @author      TwoLeaves
// @description 09/08/2023, 15:52:08
// ==/UserScript==

// This script removes the hardcoded package=com.google.android.youtube param
// from the intent fired by the "Open App" button on YouTube mobile, so the
// button opens the video with the user's default YouTube link handler instead.
// If you prefer not to set a default handler then you can use the config menu
// or the Greasemonkey settings menu to hardcode a specific package name.

(function(){

  function waitForElm(selector) {
    return new Promise(resolve => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  async function menu() {
    let package = await GM.getValue("package");
    const input = prompt('Enter the app package name of your YouTube app\n(e.g. "app.rvx.youtube")', package);
    if (input != null) {
      GM.setValue('package', input);
    }
  }

  async function openApp() {
    let params = new URL(document.location).searchParams;
    let videoID = params.get("v");
    let package = await GM.getValue("package");
    var packageString;
    if (package != null && package != "none") {
      packageString = "package="+package+";";
    } else if (package == null) {
      GM.setValue('package', "none");
    }
    if (videoID != null) {
      let intentString = "intent://m.youtube.com/watch?v="+videoID+"#Intent;"+(packageString||"")+"scheme=vnd.youtube;launchFlags=268435456;end";
      location.href = intentString;
    }
  }

  // The unwanted onclick listener is attached to the "Open App" button more
  // than once, so we need to wait some indeterminate time before nixing it.
  // We can't watch for when listeners are attached without overwriting
  // EventListener, which would have to happen at document-start (and need to
  // beat YouTube's code to the punch). Instead we just repeatedly overwrite
  // the button for a few seconds.
  async function replaceButton() {
    const timer = ms => new Promise(res => setTimeout(res, ms))
    for (var i = 0; i <= 30; i++) {
      await timer(100);
      let target = document.querySelector(".yt-spec-button-shape-next[aria-label=\"Open App\"]");
      let parent = target.parentNode;
      let appButtonClone = target.cloneNode(false);
      while (target.firstChild) {
        appButtonClone.appendChild(target.firstChild);
      }
      appButtonClone.addEventListener("click", openApp);
      target.replaceWith(appButtonClone);
    }
  }

  GM.registerMenuCommand('Configure app package name', menu);

  waitForElm(".yt-spec-button-shape-next[aria-label=\"Open App\"]").then((elm) => {
    replaceButton();
  });

})();
