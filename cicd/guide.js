// Draws the interactive build guide from guide-data.js and runs the pipeline simulator.
(function () {
  "use strict";

  var G = window.GUIDE;
  if (!G) return;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ENVS = ["dev", "int", "prod"];
  var state = { env: "dev", scenario: "happy", step: 0, status: {}, playing: false, timer: null, logs: [] };

  // ---------- helpers ----------
  // Text is always set with textContent, so the content file can't inject markup.
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var v = attrs[key];
      if (v === null || v === undefined || v === false) return;
      if (key === "text") node.textContent = v;
      else if (key === "className") node.className = v;
      else if (key === "on") Object.keys(v).forEach(function (t) { node.addEventListener(t, v[t]); });
      else node.setAttribute(key, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function target(name) {
    return document.querySelector('[data-render="' + name + '"]');
  }

  function envText(text) {
    return String(text).replace(/\{env\}/g, state.env);
  }

  // Lucide icons (lucide.dev, ISC licence), inlined so they take the text colour.
  var ICONS = {
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    play: '<path d="M6 3 20 12 6 21Z"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    prev: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    branch: '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "user-check": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
    "file-check": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
  };

  function icon(name, size) {
    if (!ICONS[name]) return null;
    var s = size || 16;
    var node = svg("svg", {
      class: "ic", width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
      "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false",
    });
    node.innerHTML = ICONS[name]; // trusted constant markup from the table above
    return node;
  }

  document.querySelectorAll("[data-icon]").forEach(function (slot) {
    var node = icon(slot.getAttribute("data-icon"));
    if (node) slot.replaceWith(node);
  });

  // Technical names in the prose (role names, keys, commands) are shown as code.
  var CODE_RE = new RegExp(
    [
      "<project>-[\\w{}-]+", "<project>", "<owner>/<repo>", "<branch>/source\\.zip", "<cicd-account-id>",
      "(?:dev|int|prod|ENV)/source\\.zip", "\\bsource\\.zip\\b", "repo:<owner>/<repo>:ref:refs/heads/(?:dev|int|prod)",
      "\\b(?:aws:PrincipalArn|aws:SourceAccount|aws:SourceArn|sts:AssumeRole|s3:PutObject|sns:Publish|codepipeline:StartPipelineExecution)\\b",
      "\\b(?:events|codepipeline|codebuild|sts)\\.amazonaws\\.com\\b",
      "\\bterraform (?:fmt -check|fmt|plan -out|plan -detailed-exitcode|plan|validate|apply)\\b",
      "\\bplan -detailed-exitcode\\b", "\\btflint --fix\\b", "\\bfmt -check\\b",
      "\\b(?:tools_image_tag|workflow_dispatch|versions\\.tf|required_version|USER)\\b",
      "\\btar: Function not implemented\\b", "\\b(?:GenerateDataKey|Decrypt)\\b",
    ].join("|"),
    "g"
  );

  function rich(text) {
    var frag = document.createDocumentFragment();
    var s = envText(text);
    var last = 0;
    s.replace(CODE_RE, function (match, offset) {
      if (offset > last) frag.appendChild(document.createTextNode(s.slice(last, offset)));
      frag.appendChild(el("code", { text: match }));
      last = offset + match.length;
      return match;
    });
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    return frag;
  }

  function richEl(tag, attrs, text) {
    var node = el(tag, attrs);
    node.appendChild(rich(text));
    return node;
  }

  // Everything that shows environment-specific names re-renders when the environment changes.
  var envRenderers = [];
  function onEnv(fn) {
    envRenderers.push(fn);
    fn();
  }

  function envSwitch(label) {
    var group = el("div", { className: "seg", role: "radiogroup", "aria-label": label || "Environment" });
    ENVS.forEach(function (env) {
      var btn = el("button", {
        type: "button", role: "radio", className: "seg-btn", "data-env": env, text: env,
        on: { click: function () { setEnv(env); } },
      });
      group.appendChild(btn);
    });
    group.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var i = ENVS.indexOf(state.env) + (e.key === "ArrowRight" ? 1 : -1);
      setEnv(ENVS[(i + ENVS.length) % ENVS.length]);
      var on = group.querySelector('[data-env="' + state.env + '"]');
      if (on) on.focus();
    });
    return group;
  }

  function syncEnvSwitches() {
    document.querySelectorAll(".seg-btn[data-env]").forEach(function (b) {
      var on = b.getAttribute("data-env") === state.env;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
  }

  function setEnv(env) {
    if (env === state.env) return;
    state.env = env;
    syncEnvSwitches();
    envRenderers.forEach(function (fn) { fn(); });
  }

  // ---------- header, theme, PDF links ----------
  document.querySelectorAll("[data-pdf]").forEach(function (a) { a.setAttribute("href", G.pdf); });
  var yearSlot = target("year");
  if (yearSlot) yearSlot.textContent = String(new Date().getFullYear());

  var root = document.documentElement;
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var themeBtn = document.querySelector(".theme-toggle");
  function currentTheme() {
    return root.getAttribute("data-theme") || (darkQuery.matches ? "dark" : "light");
  }
  function labelTheme() {
    themeBtn.setAttribute("aria-label", currentTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    labelTheme();
  });
  labelTheme();

  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".scroll-progress");
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("nav-menu");
  function setMenu(open) {
    navMenu.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  }
  navToggle.addEventListener("click", function () { setMenu(!navMenu.classList.contains("is-open")); });
  navMenu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navMenu.classList.contains("is-open")) { setMenu(false); navToggle.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (navMenu.classList.contains("is-open") && !header.contains(e.target)) setMenu(false);
  });
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
    });
  }, { passive: true });

  // ---------- hero ----------
  target("byline").textContent = "By " + G.author + " · " + G.date + " · Account IDs, bucket names, email addresses and tokens are left out on purpose.";
  var statsEl = target("stats");
  G.stats.forEach(function (s) {
    statsEl.appendChild(el("li", null, [el("span", { className: "stat-value", text: s.value }), el("span", { className: "stat-label", text: s.label })]));
  });

  // ---------- 01 summary ----------
  var summaryEl = target("summary");
  G.summary.forEach(function (p) { summaryEl.appendChild(richEl("p", null, p)); });

  function reasonCard(r) {
    return el("article", { className: "g-reason glass tone-" + r.tone }, [
      el("div", { className: "g-reason-head" }, [el("h3", { text: r.title }), el("span", { className: "g-reason-icon" }, [icon(r.icon, 20)])]),
      richEl("p", null, r.text),
    ]);
  }
  var reasonsEl = target("reasons");
  G.reasons.forEach(function (r) { reasonsEl.appendChild(reasonCard(r)); });

  var accountsEl = target("accounts");
  onEnv(function () {
    accountsEl.textContent = "";
    var targets = el("div", { className: "acc-targets" }, ENVS.map(function (env) {
      return el("div", { className: "acc-box tone-iam" + (env === state.env ? " is-current" : "") }, [
        el("strong", { text: env + " account" }),
        el("code", { text: "<project>-terraform-deployer" }),
      ]);
    }));
    accountsEl.append(
      el("div", { className: "acc-box tone-github" }, [el("strong", { text: "GitHub" }), el("span", { text: "repo and Actions upload job" })]),
      el("div", { className: "acc-arrow" }, [el("span", { text: "OIDC" }), el("small", { text: "uploads source.zip only" })]),
      el("div", { className: "acc-box acc-cicd tone-aws" }, [
        el("strong", { text: "CI/CD account" }),
        el("ul", null, [
          el("li", { text: "Pipelines cicd-dev, cicd-int, cicd-prod" }),
          el("li", { text: "Source and artifact buckets, KMS key" }),
          el("li", { text: "ECR repository and SNS topic per ENV" }),
          el("li", { text: "OIDC provider and four roles per ENV" }),
        ]),
      ]),
      el("div", { className: "acc-arrow" }, [el("span", { text: "AssumeRole" }), el("small", { text: "one deployer role per account" })]),
      targets
    );
  });
  summaryEl.parentNode.insertBefore(el("p", { className: "g-note-inline" }, [icon("info", 16), rich(G.accountNote)]), accountsEl.nextSibling);

  // ---------- 02 pipeline simulator ----------
  var LANES = [
    { id: "lane-github", y: 12, h: 104, label: "GitHub", tone: "github" },
    { id: "lane-cicd", y: 128, h: 338, label: "CI/CD account · AWS", tone: "aws" },
    { id: "lane-target", y: 478, h: 100, label: "Target account · {env}", tone: "iam" },
  ];
  var NODES = [
    { id: "dev", x: 44, y: 44, w: 180, h: 56, tone: "github", title: "Developer", sub: "merges a change", n: 1 },
    { id: "repo", x: 300, y: 44, w: 220, h: 56, tone: "github", title: "GitHub repository", sub: "branches dev · int · prod" },
    { id: "actions", x: 640, y: 44, w: 280, h: 56, tone: "github", title: "GitHub Actions", sub: "upload job: zips the repo", n: 2 },
    { id: "rule", x: 44, y: 158, w: 160, h: 52, tone: "aws", title: "EventBridge rule", sub: "matches {env}/source.zip" },
    { id: "s3", x: 300, y: 158, w: 220, h: 52, tone: "aws", title: "S3 source bucket", sub: "{env}/source.zip", n: 3 },
    { id: "oidc", x: 640, y: 158, w: 280, h: 52, tone: "iam", title: "<project>-cicd-github-{env}", sub: "assumed with the OIDC token", mono: true },
    { id: "docker", x: 44, y: 270, w: 160, h: 52, tone: "aws", title: "Docker", sub: "build tools image", n: 4 },
    { id: "maven", x: 224, y: 270, w: 160, h: 52, tone: "aws", title: "Maven", sub: "run the Maven command", n: 5 },
    { id: "plan", x: 404, y: 270, w: 160, h: 52, tone: "aws", title: "Plan", sub: "lint, validate, plan", n: 6 },
    { id: "approve", x: 584, y: 270, w: 160, h: 52, tone: "aws", title: "Approve", sub: "manual approval", n: 7 },
    { id: "apply", x: 764, y: 270, w: 160, h: 52, tone: "aws", title: "Apply", sub: "apply the saved plan", n: 8 },
    { id: "ecr", x: 44, y: 380, w: 160, h: 50, tone: "aws", title: "Amazon ECR", sub: "pinned tools image" },
    { id: "sns", x: 584, y: 380, w: 160, h: 50, tone: "aws", title: "SNS topic", sub: "approval email" },
    { id: "reviewer", x: 764, y: 380, w: 160, h: 50, tone: "github", title: "Reviewer", sub: "reads the plan, decides" },
    { id: "deployer", x: 300, y: 508, w: 330, h: 52, tone: "iam", title: "<project>-terraform-deployer", sub: "one per account · this run: {env}", mono: true },
    { id: "resources", x: 680, y: 508, w: 240, h: 52, tone: "aws", title: "Managed resources", sub: "plus Terraform state and KMS" },
  ];
  var EDGES = [
    { id: "e-merge", pts: [[224, 72], [300, 72]], label: "merge", lx: 262, ly: 64 },
    { id: "e-push", pts: [[520, 72], [640, 72]], label: "push event", lx: 580, ly: 64 },
    { id: "e-oidc", pts: [[780, 100], [780, 158]], label: "OIDC token", lx: 826, ly: 133 },
    { id: "e-put", pts: [[640, 184], [520, 184]], label: "s3:PutObject", lx: 580, ly: 176 },
    { id: "e-upload", pts: [[300, 184], [204, 184]], label: "upload event", lx: 252, ly: 176 },
    { id: "e-start", pts: [[124, 210], [124, 270]], label: "starts", lx: 152, ly: 226 },
    { id: "e-ecr", pts: [[124, 322], [124, 380]], label: "push", lx: 146, ly: 356 },
    { id: "e-maven", pts: [[204, 296], [224, 296]] },
    { id: "e-plan", pts: [[384, 296], [404, 296]] },
    { id: "e-approve", pts: [[564, 296], [584, 296]] },
    { id: "e-apply", pts: [[744, 296], [764, 296]] },
    { id: "e-notify", pts: [[664, 322], [664, 380]], label: "notify", lx: 690, ly: 356 },
    { id: "e-email", pts: [[744, 405], [764, 405]] },
    { id: "e-decide", pts: [[804, 380], [744, 322]], label: "approves", lx: 806, ly: 352 },
    { id: "e-assume-plan", pts: [[484, 322], [484, 508]], label: "AssumeRole", lx: 484, ly: 455, iam: true },
    { id: "e-assume-apply", pts: [[924, 296], [944, 296], [944, 478], [600, 478], [600, 508]], label: "AssumeRole", lx: 772, ly: 470, iam: true },
    { id: "e-manage", pts: [[630, 534], [680, 534]] },
  ];

  var simEl = target("sim");
  var diagramSvg, consoleEl, detailEl, railEl, playBtn, scenarioSel, statusEl;
  var nodeEls = {}, edgeEls = {}, laneLabels = {};

  function buildDiagram() {
    var s = svg("svg", { class: "dia", viewBox: "0 0 960 590", role: "img", "aria-labelledby": "dia-title" });
    var title = svg("title", { id: "dia-title" });
    title.textContent = "Architecture of one pipeline run: GitHub, then the CI/CD account, then the target account. The active step is highlighted.";
    s.appendChild(title);
    LANES.forEach(function (l) {
      var g = svg("g", { class: "lane tone-" + l.tone });
      g.appendChild(svg("rect", { x: 8, y: l.y, width: 944, height: l.h, rx: 14 }));
      var t = svg("text", { x: 22, y: l.y + 20, class: "lane-label" });
      g.appendChild(t);
      laneLabels[l.id] = { node: t, text: l.label };
      s.appendChild(g);
    });
    var group = svg("g", { class: "pipe-group" });
    group.appendChild(svg("rect", { x: 24, y: 232, width: 912, height: 112, rx: 12 }));
    var gl = svg("text", { x: 220, y: 253, class: "pipe-label" });
    group.appendChild(gl);
    laneLabels.pipe = { node: gl, text: "CodePipeline  <project>-cicd-{env}  ·  one pipeline per environment" };
    s.appendChild(group);

    EDGES.forEach(function (e) {
      var g = svg("g", { class: "edge" + (e.iam ? " is-iam" : "") });
      g.appendChild(svg("polyline", { points: e.pts.map(function (p) { return p.join(","); }).join(" ") }));
      var a = e.pts[e.pts.length - 2], b = e.pts[e.pts.length - 1];
      var ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      var tip = [b[0], b[1]];
      var left = [b[0] - 9 * Math.cos(ang) + 4.5 * Math.sin(ang), b[1] - 9 * Math.sin(ang) - 4.5 * Math.cos(ang)];
      var right = [b[0] - 9 * Math.cos(ang) - 4.5 * Math.sin(ang), b[1] - 9 * Math.sin(ang) + 4.5 * Math.cos(ang)];
      g.appendChild(svg("polygon", { class: "arrow", points: [tip, left, right].map(function (p) { return p.map(function (v) { return v.toFixed(1); }).join(","); }).join(" ") }));
      if (e.label) {
        var t = svg("text", { x: e.lx, y: e.ly, class: "edge-label", "text-anchor": "middle" });
        t.textContent = e.label;
        g.appendChild(t);
      }
      edgeEls[e.id] = g;
      s.appendChild(g);
    });

    NODES.forEach(function (n) {
      var g = svg("g", { class: "node tone-" + n.tone + (n.mono ? " is-mono" : "") });
      g.appendChild(svg("rect", { x: n.x, y: n.y, width: n.w, height: n.h, rx: 10 }));
      var t1 = svg("text", { x: n.x + n.w / 2, y: n.y + n.h / 2 - 3, class: "node-title", "text-anchor": "middle" });
      var t2 = svg("text", { x: n.x + n.w / 2, y: n.y + n.h / 2 + 14, class: "node-sub", "text-anchor": "middle" });
      g.appendChild(t1);
      g.appendChild(t2);
      if (n.n) {
        var badge = svg("g", { class: "node-badge" });
        badge.appendChild(svg("circle", { cx: n.x + 2, cy: n.y + 2, r: 10 }));
        var bt = svg("text", { x: n.x + 2, y: n.y + 6, "text-anchor": "middle" });
        bt.textContent = String(n.n);
        badge.appendChild(bt);
        g.appendChild(badge);
      }
      nodeEls[n.id] = { g: g, title: t1, sub: t2, data: n };
      s.appendChild(g);
    });
    return s;
  }

  function renderDiagramText() {
    Object.keys(laneLabels).forEach(function (k) { laneLabels[k].node.textContent = envText(laneLabels[k].text).toUpperCase(); });
    laneLabels.pipe.node.textContent = envText(laneLabels.pipe.text);
    Object.keys(nodeEls).forEach(function (k) {
      var n = nodeEls[k];
      n.title.textContent = envText(n.data.title);
      n.sub.textContent = envText(n.data.sub);
    });
  }

  function stepOf(n) {
    return G.steps[n - 1];
  }

  function highlight() {
    var step = state.step ? stepOf(state.step) : null;
    var on = {};
    (step ? step.highlight : []).forEach(function (id) { on[id] = true; });
    var failed = state.status[state.step] === "failed";
    diagramSvg.classList.toggle("has-focus", Boolean(step));
    Object.keys(nodeEls).forEach(function (k) {
      var g = nodeEls[k].g;
      g.classList.toggle("is-on", Boolean(on[k]));
      g.classList.toggle("is-failed", Boolean(on[k]) && failed && (k === "plan" || k === "approve" || k === "reviewer"));
      var n = nodeEls[k].data.n;
      g.classList.toggle("is-done", Boolean(n && state.status[n] === "done" && !on[k]));
      g.classList.toggle("is-skipped", Boolean(n && state.status[n] === "skipped"));
    });
    Object.keys(edgeEls).forEach(function (k) { edgeEls[k].classList.toggle("is-on", Boolean(on[k])); });
  }

  function logFor(step) {
    if (state.scenario === "destroy" && step.destroyLog) return step.destroyLog;
    if (state.scenario === "reject" && step.rejectLog) return step.rejectLog;
    return step.log;
  }

  function failsAt() {
    if (state.scenario === "destroy") return 6;
    if (state.scenario === "reject") return 7;
    return 0;
  }

  // Mark steps up to n as finished, as if the run had reached step n.
  function settleTo(n) {
    var stop = failsAt();
    if (stop && n > stop) n = stop; // a run can't get past the step that stops it
    state.status = {};
    for (var i = 1; i <= 8; i++) {
      if (i < n) state.status[i] = "done";
      else if (i === n) state.status[i] = stop === n ? "failed" : "done";
      else state.status[i] = stop && n === stop ? "skipped" : "idle";
    }
    state.step = n;
    state.logs = [];
    for (var j = 1; j <= n; j++) {
      logFor(stepOf(j)).forEach(function (line) { state.logs.push({ n: j, line: line }); });
    }
    if (stop && n === stop) state.logs.push({ n: stop, line: "!Run stopped at step " + stop + ". Steps after it are skipped." });
    else if (n === 8) state.logs.push({ n: 8, line: "+Run finished: the {env} account matches the code." });
  }

  function renderRail() {
    railEl.querySelectorAll(".rail-step").forEach(function (b) {
      var n = Number(b.getAttribute("data-n"));
      var st = state.status[n] || "idle";
      b.setAttribute("data-status", st);
      b.setAttribute("aria-current", n === state.step ? "step" : "false");
      b.setAttribute("aria-label", "Step " + n + ": " + stepOf(n).name + (st !== "idle" ? " (" + st + ")" : ""));
    });
  }

  function renderDetail() {
    detailEl.textContent = "";
    if (!state.step) {
      detailEl.append(
        el("p", { className: "detail-kicker", text: "Ready" }),
        el("h3", { text: "One run, from merge to apply" }),
        richEl("p", null, "Press Run to play all eight steps for the {env} environment, or click a step to jump to it. Each step shows who acts, what happens and which credentials it uses.")
      );
      return;
    }
    var step = stepOf(state.step);
    var st = state.status[state.step];
    detailEl.append(
      el("p", { className: "detail-kicker" }, [document.createTextNode("Step " + step.n + " of 8 · "), el("span", { className: "actor tone-" + step.lane, text: step.actor })]),
      el("h3", { text: step.name + " · " + step.sub }),
      el("h4", { text: "What happens" }),
      richEl("p", null, step.what),
      el("h4", null, [icon("key", 14), document.createTextNode("Credentials")]),
      richEl("p", null, step.creds)
    );
    if (st === "failed") {
      detailEl.appendChild(
        el("p", { className: "detail-status is-failed" }, [
          icon("x", 16),
          document.createTextNode(state.scenario === "destroy" ? "The destroy guard stopped the run. Nothing is applied." : "The reviewer rejected the plan. Nothing is applied."),
        ])
      );
    } else if (state.step === 8 && st === "done") {
      detailEl.appendChild(el("p", { className: "detail-status is-ok" }, [icon("check", 16), rich("Applied. The post-apply plan exits 0, so the {env} account matches the code.")]));
    }
  }

  function renderConsole() {
    consoleEl.textContent = "";
    if (!state.logs.length) {
      consoleEl.appendChild(el("p", { className: "log-muted", text: "Waiting for a merge…" }));
      return;
    }
    state.logs.forEach(function (entry) {
      var text = entry.line;
      var cls = "log-line";
      if (text.charAt(0) === "!") { cls += " is-err"; text = text.slice(1); }
      else if (text.charAt(0) === "+") { cls += " is-ok"; text = text.slice(1); }
      consoleEl.appendChild(el("p", { className: cls }, [el("span", { className: "log-step", text: "[" + entry.n + "/8]" }), document.createTextNode(" " + envText(text))]));
    });
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function renderSim() {
    renderRail();
    highlight();
    renderDetail();
    renderConsole();
    var stop = failsAt();
    var finished = state.step === 8 || (stop && state.step === stop && state.status[stop] === "failed");
    statusEl.textContent = !state.step ? "Ready" : finished ? (stop ? "Stopped" : "Finished") : state.playing ? "Running" : "Paused";
    playBtn.replaceChildren(icon(state.playing ? "pause" : "play", 16), document.createTextNode(state.playing ? "Pause" : finished ? "Run again" : state.step ? "Resume" : "Run"));
  }

  function stop() {
    state.playing = false;
    clearTimeout(state.timer);
  }

  function tick() {
    var stopAt = failsAt();
    if (state.step === 8 || (stopAt && state.step === stopAt)) {
      stop();
      renderSim();
      return;
    }
    settleTo(state.step + 1);
    renderSim();
    state.timer = setTimeout(tick, reduceMotion ? 900 : 1500);
  }

  function play() {
    var stopAt = failsAt();
    if (state.step === 8 || (stopAt && state.step === stopAt)) settleTo(0);
    state.playing = true;
    renderSim();
    state.timer = setTimeout(tick, 250);
  }

  function goTo(n) {
    stop();
    settleTo(Math.max(0, Math.min(8, n)));
    renderSim();
  }

  function buildSim() {
    scenarioSel = el("select", { className: "sim-select", "aria-label": "Scenario", on: { change: function () { state.scenario = scenarioSel.value; goTo(0); } } }, [
      el("option", { value: "happy", text: "Normal run" }),
      el("option", { value: "reject", text: "Reviewer rejects" }),
      el("option", { value: "destroy", text: "Plan would destroy a resource" }),
    ]);
    playBtn = el("button", { type: "button", className: "btn btn-primary btn-small", on: { click: function () { if (state.playing) { stop(); renderSim(); } else play(); } } });
    statusEl = el("span", { className: "sim-status", "aria-live": "polite" });
    var toolbar = el("div", { className: "sim-toolbar" }, [
      el("div", { className: "sim-group" }, [el("span", { className: "sim-label", text: "Environment" }), envSwitch("Environment for this run")]),
      el("label", { className: "sim-group" }, [el("span", { className: "sim-label", text: "Scenario" }), scenarioSel]),
      el("div", { className: "sim-controls" }, [
        el("button", { type: "button", className: "icon-btn", "aria-label": "Previous step", title: "Previous step", on: { click: function () { goTo(state.step - 1); } } }, [icon("prev", 18)]),
        playBtn,
        el("button", { type: "button", className: "icon-btn", "aria-label": "Next step", title: "Next step", on: { click: function () { goTo(state.step + 1); } } }, [icon("next", 18)]),
        el("button", { type: "button", className: "icon-btn", "aria-label": "Reset", title: "Reset", on: { click: function () { goTo(0); } } }, [icon("reset", 17)]),
        statusEl,
      ]),
    ]);

    railEl = el("ol", { className: "rail" }, G.steps.map(function (s) {
      return el("li", null, [
        el("button", { type: "button", className: "rail-step tone-" + s.lane, "data-n": String(s.n), on: { click: function () { goTo(s.n); } } }, [
          el("span", { className: "rail-num", text: String(s.n) }),
          el("span", { className: "rail-name", text: s.name }),
          el("span", { className: "rail-sub", text: s.sub }),
        ]),
      ]);
    }));

    diagramSvg = buildDiagram();
    detailEl = el("div", { className: "sim-detail", "aria-live": "polite" });
    consoleEl = el("div", { className: "sim-console-body", role: "log", "aria-label": "Simulated pipeline output" });

    simEl.append(
      toolbar,
      railEl,
      el("div", { className: "sim-grid" }, [
        el("div", null, [
          el("div", { className: "dia-scroll" }, [diagramSvg]),
          el("p", { className: "dia-hint", text: "Scroll the diagram sideways to see all of it." }),
        ]),
        el("div", { className: "sim-side" }, [
          detailEl,
          el("div", { className: "sim-console" }, [
            el("div", { className: "sim-console-head" }, [icon("terminal", 14), el("span", { text: "Run log" }), el("small", { text: "simulated, illustrative only" })]),
            consoleEl,
          ]),
        ]),
      ]),
      el("div", { className: "sim-legend", "aria-hidden": "true" }, [
        el("span", { className: "lg tone-github", text: "GitHub and people" }),
        el("span", { className: "lg tone-aws", text: "AWS services" }),
        el("span", { className: "lg tone-iam", text: "IAM roles" }),
        el("span", { className: "lg lg-dash", text: "role assumption" }),
      ])
    );
  }

  buildSim();
  onEnv(function () {
    renderDiagramText();
    renderSim();
  });

  // ---------- 03 IAM roles ----------
  var rolesEl = target("roles");
  var currentRole = G.roles[0].id;
  var roleTabs = el("div", { className: "role-tabs", role: "tablist", "aria-label": "Role types" });
  var rolePanel = el("div", { className: "role-panel", role: "tabpanel", id: "role-panel" });
  G.roles.forEach(function (r) {
    roleTabs.appendChild(
      el("button", {
        type: "button", role: "tab", className: "role-tab", id: "role-tab-" + r.id, "aria-controls": "role-panel", "data-role": r.id,
        on: { click: function () { selectRole(r.id); } },
      }, [el("span", { className: "role-tab-label", text: r.label })])
    );
  });
  roleTabs.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    var ids = G.roles.map(function (r) { return r.id; });
    var i = ids.indexOf(currentRole) + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1);
    selectRole(ids[(i + ids.length) % ids.length], true);
  });
  rolesEl.append(
    el("div", { className: "roles-top" }, [el("span", { className: "sim-label", text: "Environment" }), envSwitch("Environment for role names")]),
    el("div", { className: "roles-body" }, [roleTabs, rolePanel])
  );

  function renderRole() {
    var r = G.roles.filter(function (x) { return x.id === currentRole; })[0];
    roleTabs.querySelectorAll(".role-tab").forEach(function (b) {
      var on = b.getAttribute("data-role") === currentRole;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      var r2 = G.roles.filter(function (x) { return x.id === b.getAttribute("data-role"); })[0];
      var nameSlot = b.querySelector(".role-tab-name");
      if (nameSlot) nameSlot.remove();
      b.appendChild(el("code", { className: "role-tab-name", text: envText(r2.name) }));
    });
    rolePanel.setAttribute("aria-labelledby", "role-tab-" + r.id);
    rolePanel.textContent = "";
    rolePanel.append(
      el("div", { className: "role-flow" }, [
        el("div", { className: "rf-box tone-github" }, [el("small", { text: "Who may assume it" }), richEl("strong", null, r.from)]),
        el("span", { className: "rf-arrow", "aria-hidden": "true" }, [icon("arrow-right", 18)]),
        el("div", { className: "rf-box tone-iam is-role" }, [el("small", { text: "The role · " + envText(r.account) }), el("code", { text: envText(r.name) })]),
        el("span", { className: "rf-arrow", "aria-hidden": "true" }, [icon("arrow-right", 18)]),
        el("div", { className: "rf-box tone-aws" }, [el("small", { text: "What it reaches" }), richEl("strong", null, r.reaches)]),
      ]),
      el("dl", { className: "role-facts" }, [
        el("div", null, [el("dt", { text: "Account" }), el("dd", { text: envText(r.account) })]),
        el("div", null, [el("dt", { text: "Trusted principal" }), richEl("dd", null, r.from)]),
        el("div", null, [el("dt", { text: "Trust condition" }), richEl("dd", null, r.trust)]),
        el("div", null, [el("dt", { text: "Main permissions" }), richEl("dd", null, r.perms)]),
      ])
    );
  }

  function selectRole(id, focus) {
    currentRole = id;
    renderRole();
    if (focus) {
      var b = roleTabs.querySelector('[data-role="' + id + '"]');
      if (b) b.focus();
    }
  }
  onEnv(renderRole);

  var rulesEl = target("rules");
  G.designRules.forEach(function (r) { rulesEl.appendChild(reasonCard(r)); });
  var notesEl = target("role-notes");
  G.roleNotes.forEach(function (n) {
    notesEl.appendChild(el("aside", { className: "g-note tone-" + n.tone }, [el("h3", { text: n.title }), richEl("p", null, n.text)]));
  });

  // ---------- 04 build steps ----------
  var STORE_KEY = "cicd-guide-progress";
  var done = {};
  try { done = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; } catch (e) { done = {}; }
  function saveDone() { try { localStorage.setItem(STORE_KEY, JSON.stringify(done)); } catch (e) {} }

  var buildEl = target("build");
  var bar = el("div", { className: "bp-bar" }, [el("i")]);
  var barText = el("span", { className: "bp-text" });
  var expandBtn = el("button", { type: "button", className: "btn btn-small btn-ghost" });
  buildEl.appendChild(el("div", { className: "bp-head glass" }, [
    el("div", { className: "bp-progress" }, [barText, bar]),
    expandBtn,
    el("button", { type: "button", className: "btn btn-small btn-ghost", text: "Clear ticks", on: { click: function () { done = {}; saveDone(); renderBuild(); } } }),
  ]));
  var stepsList = el("ol", { className: "bsteps" });
  buildEl.appendChild(stepsList);
  var openAll = false;

  function stepBody(s) {
    var body = el("div", { className: "bstep-body" });
    if (s.intro) body.appendChild(richEl("p", null, s.intro));
    if (s.points) body.appendChild(el("ul", { className: "g-list" }, s.points.map(function (p) { return richEl("li", null, p); })));
    if (s.modules) {
      body.appendChild(el("table", { className: "g-table" }, [
        el("thead", null, [el("tr", null, [el("th", { text: "Module" }), el("th", { text: "What it creates" })])]),
        el("tbody", null, s.modules.map(function (m) { return el("tr", null, [el("td", null, [el("code", { text: m[0] })]), richEl("td", null, m[1])]); })),
      ]));
    }
    if (s.outro) body.appendChild(richEl("p", { className: "g-muted" }, s.outro));
    if (s.chains) {
      s.chains.forEach(function (c) {
        body.appendChild(el("div", { className: "chain" }, [
          el("div", { className: "chain-row" }, [el("span", { className: "chain-stage tone-" + c.lane, text: c.stage })].concat(
            c.links.map(function (l, i) {
              return el("span", { className: "chain-link" + (/guard/.test(l) ? " is-guard" : /must exit 0/.test(l) ? " is-ok" : "") }, [
                i ? el("span", { className: "chain-sep", "aria-hidden": "true", text: "›" }) : null,
                el("span", { className: "chain-pill", text: l }),
              ]);
            })
          )),
          c.note ? richEl("p", { className: "g-muted" }, c.note) : null,
        ]));
      });
    }
    if (s.promotion) {
      body.appendChild(el("div", { className: "promo" }, ENVS.map(function (env, i) {
        return el("div", { className: "promo-col" }, [
          el("div", { className: "promo-box" }, [el("strong", { text: env }), el("code", { text: "cicd-" + env }), el("small", { text: i ? "same code, merged from " + ENVS[i - 1] : "test here first" })]),
          el("ol", null, [el("li", { text: "local terraform plan" }), el("li", { text: "merge, pipeline runs" }), el("li", { text: "read Plan, then approve" })]),
        ]);
      })));
    }
    return body;
  }

  function renderBuild() {
    stepsList.textContent = "";
    var count = 0;
    G.buildSteps.forEach(function (s, i) {
      var key = String(i + 1);
      var isDone = Boolean(done[key]);
      if (isDone) count++;
      var details = el("details", { className: "bstep glass" + (isDone ? " is-done" : ""), open: openAll || null });
      var check = el("input", { type: "checkbox", "aria-label": "Mark step " + key + " done", checked: isDone || null });
      check.addEventListener("click", function (e) { e.stopPropagation(); });
      check.addEventListener("change", function () { if (check.checked) done[key] = true; else delete done[key]; saveDone(); renderBuild(); });
      details.append(
        el("summary", null, [
          el("span", { className: "bstep-num", text: key }),
          el("span", { className: "bstep-title" }, [el("strong", { text: s.title }), s.where ? el("small", { text: s.where }) : null]),
          el("label", { className: "bstep-check" }, [check, el("span", { text: "Done" })]),
        ]),
        stepBody(s)
      );
      stepsList.appendChild(el("li", null, [details]));
    });
    barText.textContent = count + " of " + G.buildSteps.length + " steps done";
    bar.firstChild.style.width = (count / G.buildSteps.length) * 100 + "%";
    expandBtn.replaceChildren(icon(openAll ? "minus" : "plus", 14), document.createTextNode(openAll ? "Collapse all" : "Expand all"));
  }
  expandBtn.addEventListener("click", function () {
    openAll = !openAll;
    stepsList.querySelectorAll("details").forEach(function (d) { d.open = openAll; });
    expandBtn.replaceChildren(icon(openAll ? "minus" : "plus", 14), document.createTextNode(openAll ? "Collapse all" : "Expand all"));
  });
  renderBuild();

  // ---------- 05 problems ----------
  var problemsEl = target("problems");
  var places = ["All"].concat(G.problems.map(function (p) { return p.where; }).filter(function (w, i, a) { return a.indexOf(w) === i; }));
  var filterRow = el("div", { className: "filters", role: "group", "aria-label": "Filter problems by where they happened" });
  var grid = el("div", { className: "probs" });
  var current = "All";
  places.forEach(function (w) {
    filterRow.appendChild(el("button", {
      type: "button", className: "filter", "data-where": w, "aria-pressed": String(w === current), text: w,
      on: { click: function () { current = w; renderProblems(); } },
    }));
  });
  function renderProblems() {
    filterRow.querySelectorAll(".filter").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-where") === current)); });
    grid.textContent = "";
    G.problems.filter(function (p) { return current === "All" || p.where === current; }).forEach(function (p) {
      grid.appendChild(el("article", { className: "prob glass" }, [
        el("span", { className: "chain-stage tone-" + p.lane, text: p.where }),
        el("h3", null, [icon("alert", 16), el("span", { text: p.symptom })]),
        el("dl", null, [
          el("div", null, [el("dt", { text: "Cause" }), richEl("dd", null, p.cause)]),
          el("div", { className: "prob-fix" }, [el("dt", { text: "Fix" }), richEl("dd", null, p.fix)]),
        ]),
      ]));
    });
  }
  problemsEl.append(filterRow, grid, el("aside", { className: "g-note tone-warn" }, [el("h3", { text: "Habits that avoid repeats" }), richEl("p", null, G.habits)]));
  renderProblems();

  // ---------- 06 trade-offs ----------
  var tradeEl = target("tradeoffs");
  tradeEl.append(
    el("div", { className: "gc" }, [
      el("div", { className: "gc-col is-gain glass" }, [el("h3", null, [icon("check", 18), document.createTextNode("Gains")]), el("ul", { className: "g-list" }, G.gains.map(function (t) { return richEl("li", null, t); }))]),
      el("div", { className: "gc-col is-cost glass" }, [el("h3", null, [icon("minus", 18), document.createTextNode("Costs")]), el("ul", { className: "g-list" }, G.costs.map(function (t) { return richEl("li", null, t); }))]),
    ]),
    el("h3", { className: "g-h3", text: "Compared with doing everything in GitHub Actions" }),
    el("p", { className: "g-muted", text: G.comparison.note }),
    el("div", { className: "table-scroll glass" }, [
      el("table", { className: "g-table g-compare" }, [
        el("thead", null, [el("tr", null, [el("th", { text: "" })].concat(G.comparison.columns.map(function (c) { return el("th", { text: c }); })))]),
        el("tbody", null, G.comparison.rows.map(function (r) {
          return el("tr", null, [el("th", { scope: "row", text: r[0] }), richEl("td", null, r[1]), richEl("td", null, r[2])]);
        })),
      ]),
    ]),
    el("aside", { className: "g-note tone-info" }, [
      el("h3", { text: "Open points to check before you copy" }),
      el("p", { text: "The source notes do not cover these. Read them from the repository, do not assume them." }),
      el("ul", { className: "g-list" }, G.openPoints.map(function (t) { return richEl("li", null, t); })),
    ])
  );

  // ---------- 07 terms ----------
  var termsEl = target("terms");
  G.terms.forEach(function (t) {
    termsEl.appendChild(el("div", { className: "term glass" }, [el("dt", { text: t[0] }), richEl("dd", null, t[1])]));
  });

  syncEnvSwitches();
})();
