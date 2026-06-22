/*
 * Helpdeck embeddable chat widget.
 * Usage:
 *   <script src="http://localhost:8000/widget/widget.js"
 *           data-widget-key="wk_xxx"
 *           data-api-url="http://localhost:8000"
 *           data-title="Acme Support"
 *           data-accent="#4f46e5"></script>
 *
 * Use the publishable data-widget-key (safe to expose). data-api-key is still
 * accepted for backwards compatibility but should not be used on public sites.
 *
 * Renders in a Shadow DOM so host-site CSS cannot interfere.
 */
(function () {
  "use strict";

  var script =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();

  var WIDGET_KEY = script.getAttribute("data-widget-key") || "";
  var API_KEY = script.getAttribute("data-api-key") || "";
  var AUTH_HEADER = WIDGET_KEY ? "X-Widget-Key" : "X-API-Key";
  var AUTH_VALUE = WIDGET_KEY || API_KEY;
  var API_URL = (script.getAttribute("data-api-url") || "http://localhost:8000").replace(/\/$/, "");
  var TITLE = script.getAttribute("data-title") || "AI Assistant";
  var ACCENT = script.getAttribute("data-accent") || "#4f46e5";
  var GREETING =
    script.getAttribute("data-greeting") || "Hi! 👋 Ask me anything about our product or service.";

  if (!AUTH_VALUE) {
    console.error("[Helpdeck] Missing data-widget-key on the widget <script> tag.");
    return;
  }

  var conversationId = null;

  // ---- mount host + shadow root ----
  var host = document.createElement("div");
  host.id = "helpdeck-widget-host";
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  host.style.bottom = "0";
  host.style.right = "0";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = [
    ":host{ all: initial; }",
    "*{ box-sizing:border-box; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }",
    ".hd-bubble{ position:fixed; bottom:20px; right:20px; width:60px; height:60px; border-radius:50%; background:" +
      ACCENT +
      "; box-shadow:0 8px 24px rgba(0,0,0,.22); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform .15s ease, box-shadow .15s ease; }",
    ".hd-bubble:hover{ transform:translateY(-2px) scale(1.04); box-shadow:0 12px 30px rgba(0,0,0,.28); }",
    ".hd-bubble svg{ width:28px; height:28px; fill:#fff; }",
    ".hd-panel{ position:fixed; bottom:92px; right:20px; width:380px; max-width:calc(100vw - 32px); height:560px; max-height:calc(100vh - 120px); background:#fff; border-radius:16px; box-shadow:0 16px 48px rgba(0,0,0,.24); display:flex; flex-direction:column; overflow:hidden; opacity:0; transform:translateY(12px) scale(.98); pointer-events:none; transition:opacity .18s ease, transform .18s ease; }",
    ".hd-panel.open{ opacity:1; transform:translateY(0) scale(1); pointer-events:auto; }",
    ".hd-header{ background:" +
      ACCENT +
      "; color:#fff; padding:16px 18px; display:flex; align-items:center; justify-content:space-between; }",
    ".hd-header h3{ margin:0; font-size:15px; font-weight:600; }",
    ".hd-header .hd-status{ font-size:11px; opacity:.85; margin-top:2px; }",
    ".hd-close{ cursor:pointer; background:transparent; border:0; color:#fff; font-size:22px; line-height:1; opacity:.85; }",
    ".hd-close:hover{ opacity:1; }",
    ".hd-msgs{ flex:1; overflow-y:auto; padding:16px; background:#f7f8fa; display:flex; flex-direction:column; gap:10px; }",
    ".hd-msg{ max-width:85%; padding:10px 13px; border-radius:14px; font-size:14px; line-height:1.45; white-space:pre-wrap; word-wrap:break-word; }",
    ".hd-msg.user{ align-self:flex-end; background:" + ACCENT + "; color:#fff; border-bottom-right-radius:4px; }",
    ".hd-msg.bot{ align-self:flex-start; background:#fff; color:#1f2330; border:1px solid #e7e9ef; border-bottom-left-radius:4px; }",
    ".hd-sources{ font-size:11px; color:#8a90a0; margin-top:4px; align-self:flex-start; }",
    ".hd-typing{ display:inline-flex; gap:4px; }",
    ".hd-typing span{ width:7px; height:7px; border-radius:50%; background:#c2c6d2; animation:hd-blink 1.2s infinite; }",
    ".hd-typing span:nth-child(2){ animation-delay:.2s; } .hd-typing span:nth-child(3){ animation-delay:.4s; }",
    "@keyframes hd-blink{ 0%,60%,100%{opacity:.3;} 30%{opacity:1;} }",
    ".hd-input{ display:flex; padding:12px; gap:8px; border-top:1px solid #eceef3; background:#fff; }",
    ".hd-input input{ flex:1; border:1px solid #d8dbe4; border-radius:10px; padding:11px 13px; font-size:14px; outline:none; }",
    ".hd-input input:focus{ border-color:" + ACCENT + "; }",
    ".hd-send{ background:" +
      ACCENT +
      "; border:0; border-radius:10px; width:42px; cursor:pointer; display:flex; align-items:center; justify-content:center; }",
    ".hd-send:disabled{ opacity:.5; cursor:not-allowed; }",
    ".hd-send svg{ width:18px; height:18px; fill:#fff; }",
    ".hd-footer{ text-align:center; font-size:10px; color:#aab0bd; padding:6px; background:#fff; }",
    ".hd-footer a{ color:#aab0bd; text-decoration:none; }",
  ].join("\n");
  root.appendChild(style);

  // ---- build DOM ----
  var bubble = el("div", "hd-bubble");
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.4 1.05 4.58 2.77 6.2L4 22l5.1-1.6c.9.26 1.88.4 2.9.4 5.52 0 10-4.04 10-9S17.52 2 12 2z"/></svg>';

  var panel = el("div", "hd-panel");

  var header = el("div", "hd-header");
  var hgroup = el("div");
  var h3 = el("h3"); h3.textContent = TITLE;
  var status = el("div", "hd-status"); status.textContent = "Online";
  hgroup.appendChild(h3); hgroup.appendChild(status);
  var close = el("button", "hd-close"); close.innerHTML = "&times;";
  header.appendChild(hgroup); header.appendChild(close);

  var msgs = el("div", "hd-msgs");

  var inputBar = el("div", "hd-input");
  var input = el("input");
  input.type = "text";
  input.placeholder = "Type your message…";
  var send = el("button", "hd-send");
  send.innerHTML = '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>';
  inputBar.appendChild(input); inputBar.appendChild(send);

  var footer = el("div", "hd-footer");
  footer.innerHTML = 'Powered by <a href="#" target="_blank" rel="noopener">Helpdeck</a>';

  panel.appendChild(header);
  panel.appendChild(msgs);
  panel.appendChild(inputBar);
  panel.appendChild(footer);
  root.appendChild(bubble);
  root.appendChild(panel);

  // ---- behaviour ----
  var greeted = false;
  function toggle() {
    var open = panel.classList.toggle("open");
    if (open && !greeted) {
      addMsg(GREETING, "bot");
      greeted = true;
      setTimeout(function () { input.focus(); }, 150);
    }
  }
  bubble.addEventListener("click", toggle);
  close.addEventListener("click", function () { panel.classList.remove("open"); });

  send.addEventListener("click", sendMessage);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg(text, "user");
    streamReply(text);
  }

  function streamReply(question) {
    setBusy(true);
    var typing = addTyping();
    var botEl = null;

    var headers = { "Content-Type": "application/json" };
    headers[AUTH_HEADER] = AUTH_VALUE;
    fetch(API_URL + "/api/chat", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ message: question, conversation_id: conversationId }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";

        function pump() {
          return reader.read().then(function (result) {
            if (result.done) { finish(); return; }
            buffer += decoder.decode(result.value, { stream: true });
            var parts = buffer.split("\n\n");
            buffer = parts.pop();
            parts.forEach(function (part) {
              var line = part.trim();
              if (line.indexOf("data: ") !== 0) return;
              var evt;
              try { evt = JSON.parse(line.slice(6)); } catch (e) { return; }
              handleEvent(evt);
            });
            return pump();
          });
        }

        function handleEvent(evt) {
          if (evt.type === "token") {
            if (!botEl) { removeTyping(typing); botEl = addMsg("", "bot"); }
            botEl.textContent += evt.text;
            scrollDown();
          } else if (evt.type === "done") {
            conversationId = evt.conversation_id || conversationId;
          } else if (evt.type === "error") {
            if (!botEl) { removeTyping(typing); botEl = addMsg("", "bot"); }
            botEl.textContent = "Sorry, something went wrong. Please try again.";
          }
        }

        function finish() {
          removeTyping(typing);
          if (!botEl) addMsg("Sorry, I couldn't generate a response.", "bot");
          setBusy(false);
        }

        return pump();
      })
      .catch(function (err) {
        removeTyping(typing);
        addMsg(
          err.message.indexOf("429") > -1
            ? "Message limit reached. Please try again later."
            : "Sorry, I couldn't reach the assistant. Please try again.",
          "bot"
        );
        setBusy(false);
      });
  }

  function setBusy(b) { send.disabled = b; input.disabled = b; }

  function addMsg(text, who) {
    var m = el("div", "hd-msg " + who);
    m.textContent = text;
    msgs.appendChild(m);
    scrollDown();
    return m;
  }

  function addTyping() {
    var m = el("div", "hd-msg bot");
    m.innerHTML = '<span class="hd-typing"><span></span><span></span><span></span></span>';
    msgs.appendChild(m);
    scrollDown();
    return m;
  }
  function removeTyping(node) { if (node && node.parentNode) node.parentNode.removeChild(node); }

  function scrollDown() { msgs.scrollTop = msgs.scrollHeight; }

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }
})();
