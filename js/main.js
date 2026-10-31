// Renders the content from content.js and wires up the interactive bits.
// You shouldn't need to edit this file to change your portfolio text.
(function () {
  "use strict";

  var data = window.PORTFOLIO;
  if (!data) return;
  var profile = data.profile || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVG_NS = "http://www.w3.org/2000/svg";

  // Small DOM helper. Text is always set with textContent, so any characters are safe.
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "text") node.textContent = attrs[key];
        else if (key === "className") node.className = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  function target(name) {
    return document.querySelector('[data-render="' + name + '"]');
  }

  // ---------- Icons ----------
  // UI icons are Lucide (lucide.dev, ISC licence), inlined so they inherit the text colour.
  var LUCIDE = {
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "map-pin": '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.97a4 4 0 0 0 3.3-1.7l5.45-7.6A4 4 0 0 1 16.03 7H22"/><path d="M2 6h1.97a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.04a4 4 0 0 1-3.3-1.8l-.36-.45"/>',
    play: '<path d="M6 3 20 12 6 21Z"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
    cap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    "badge-check": '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    sigma: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    branch: '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    scatter: '<circle cx="7.5" cy="7.5" r="1.5"/><circle cx="18.5" cy="5.5" r="1.5"/><circle cx="11.5" cy="11.5" r="1.5"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="17.5" cy="14.5" r="1.5"/><path d="M3 3v18h18"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    loop: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>',
    table: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
    commit: '<circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    star: '<path d="M11.52 2.3a.53.53 0 0 1 .96 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.13a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .29-.9l5.17-.76a2.12 2.12 0 0 0 1.6-1.16z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  };

  function icon(name, size) {
    if (!LUCIDE[name]) return null;
    var s = size || 16;
    var node = svg("svg", {
      class: "ic",
      width: s,
      height: s,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false",
    });
    node.innerHTML = LUCIDE[name]; // trusted constant markup from the table above
    return node;
  }

  each("[data-icon]", function (slot) {
    var node = icon(slot.getAttribute("data-icon"));
    if (node) slot.replaceWith(node);
  });

  // Brand logos (Devicon, MIT licence) live in assets/icons. Matching is by lower-case name.
  // An array is [light-theme file, dark-theme file] for logos with dark lettering.
  var BRAND = {
    python: "python-original.svg",
    pandas: "pandas-original.svg",
    numpy: "numpy-original.svg",
    "scikit-learn": "scikitlearn-original.svg",
    tensorflow: "tensorflow-original.svg",
    keras: "keras-original.svg",
    terraform: "terraform-original.svg",
    docker: "docker-original.svg",
    git: "git-original.svg",
    "linux / wsl (ubuntu)": "ubuntu-original.svg",
    angular: "angular-original.svg",
    mongodb: "mongodb-original.svg",
    matplotlib: "matplotlib-original.svg",
    "r (regression)": "r-original.svg",
    aws: ["amazonwebservices-original-wordmark.svg", "amazonwebservices-dark.svg"],
  };
  // Concepts and AWS services get a matching UI icon instead of a logo.
  var CONCEPT = {
    "mixed-integer linear programming": "sigma",
    milp: "sigma",
    scipy: "sigma",
    "statistics & hypothesis testing": "chart",
    "regression & classification": "trend",
    "decision trees & random forests": "branch",
    xgboost: "trend",
    "k-means & pca": "scatter",
    "k-means": "scatter",
    pca: "scatter",
    "feature engineering": "wrench",
    cnns: "cpu",
    rnns: "cpu",
    autoencoders: "cpu",
    glue: "layers",
    "aws glue": "layers",
    lambda: "zap",
    s3: "database",
    ecr: "box",
    "iam & cross-account roles": "shield",
    iam: "shield",
    cloud9: "cloud",
    "multi-account architecture": "layers",
    "ci/cd pipelines": "loop",
    "ci/cd": "loop",
    sql: "database",
    tableau: "chart",
    seaborn: "chart",
    "excel automation": "table",
    excel: "table",
    automation: "zap",
    dashboards: "chart",
    statsmodels: "trend",
  };

  function skillName(item) {
    return typeof item === "string" ? item : item.name || "";
  }

  // Returns a logo/icon node for a skill or tag name, or null.
  function techIcon(item, size) {
    var name = skillName(item);
    var key = ((item && item.icon) || name).toLowerCase();
    var file = BRAND[key];
    var px = size || 16;
    if (file) {
      var files = Array.isArray(file) ? file : [file];
      var wrap = el("span", { className: "logo", "aria-hidden": "true" });
      files.forEach(function (f, i) {
        wrap.appendChild(
          el("img", {
            src: "assets/icons/" + f,
            alt: "",
            width: String(px),
            height: String(px),
            loading: "lazy",
            decoding: "async",
            className: files.length > 1 ? (i === 0 ? "only-light" : "only-dark") : "",
          })
        );
      });
      return wrap;
    }
    return icon(CONCEPT[key], px - 2);
  }

  // ---------- Simple text bindings ----------
  var availability = profile.availability || "";
  var bindings = {
    name: profile.name,
    initials: profile.initials,
    role: profile.role,
    tagline: profile.tagline,
    location: profile.location,
    availability: availability,
    availabilityLower: availability.charAt(0).toLowerCase() + availability.slice(1),
    year: String(new Date().getFullYear()),
  };
  each("[data-bind]", function (node) {
    var value = bindings[node.getAttribute("data-bind")];
    if (value) node.textContent = value;
  });
  if (!availability) each(".status", function (n) { n.hidden = true; });
  if (!profile.location) each(".hero-location", function (n) { n.hidden = true; });

  // ---------- Contact links and CV ----------
  var links = {
    email: profile.email ? "mailto:" + profile.email : "",
    linkedin: profile.linkedin,
    github: profile.github,
  };
  each("[data-link]", function (node) {
    var href = links[node.getAttribute("data-link")];
    if (href) {
      node.href = href;
      node.hidden = false;
    }
  });
  each("[data-resume]", function (node) {
    if (profile.resume) {
      node.href = profile.resume;
      node.hidden = false;
    }
  });
  // With no email, LinkedIn becomes the main call to action.
  if (!profile.email) {
    var contactLinkedIn = document.querySelector('.contact-actions [data-link="linkedin"]');
    if (contactLinkedIn) contactLinkedIn.classList.add("btn-primary", "btn-shine");
  }

  // "Copy email" button with a short confirmation tooltip.
  each("[data-copy-email]", function (btn) {
    if (!profile.email) return;
    btn.hidden = false;
    var live = document.querySelector("[data-copy-status]");
    var timer;
    btn.addEventListener("click", function () {
      function done(ok) {
        var msg = ok ? "Copied to clipboard!" : profile.email;
        btn.querySelector(".tooltip").textContent = msg;
        btn.classList.add("is-copied");
        if (live) live.textContent = ok ? "Email address copied to clipboard" : "Email address: " + profile.email;
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.classList.remove("is-copied");
        }, 1800);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(profile.email).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  });

  // ---------- Stats ----------
  var stats = target("stats");
  if (stats && data.stats && data.stats.length) {
    data.stats.forEach(function (s) {
      stats.appendChild(
        el("li", null, [
          el("span", { className: "stat-value", text: s.value }),
          el("span", { className: "stat-label", text: s.label }),
        ])
      );
    });
  } else if (stats) {
    stats.hidden = true;
  }

  // ---------- About ----------
  var about = target("about");
  (data.about || []).forEach(function (para) {
    about.appendChild(el("p", { text: para }));
  });

  var avatar = target("avatar");
  if (profile.photo) {
    avatar.appendChild(el("img", { src: profile.photo, alt: "Photo of " + (profile.name || "me") }));
  } else {
    avatar.textContent = profile.initials || "";
    avatar.setAttribute("aria-hidden", "true");
  }

  var facts = target("facts");
  (data.facts || []).forEach(function (f) {
    facts.appendChild(el("div", null, [el("dt", { text: f.label }), el("dd", { text: f.value })]));
  });

  // ---------- Skills ----------
  var skills = target("skills");
  (data.skills || []).forEach(function (group) {
    skills.appendChild(
      el("div", { className: "skill-card glass glow" }, [
        el("div", { className: "skill-head" }, [
          el("h3", { text: group.group }),
          group.tag ? el("span", { className: "pill", text: group.tag }) : null,
        ]),
        el(
          "ul",
          { className: "chips" },
          (group.items || []).map(function (item) {
            return el("li", null, [techIcon(item, 16), el("span", { text: skillName(item) })]);
          })
        ),
      ])
    );
  });

  // ---------- Tags (shared by the featured tile and project cards) ----------
  function tagList(tags) {
    return el(
      "ul",
      { className: "tags", "aria-label": "Tools used" },
      (tags || []).map(function (t) {
        return el("li", null, [techIcon(t, 14), el("span", { text: t })]);
      })
    );
  }

  function linkRow(p) {
    if (!p.links || !p.links.length) return null;
    return el(
      "div",
      { className: "project-links" },
      p.links.map(function (l) {
        return el(
          "a",
          {
            href: l.url,
            target: "_blank",
            rel: "noopener",
            "aria-label": l.label + ": " + p.title + " (opens in a new tab)",
          },
          [document.createTextNode(l.label), icon("external", 14)]
        );
      })
    );
  }

  function pointList(points) {
    if (!points || !points.length) return null;
    return el(
      "ul",
      { className: "points" },
      points.map(function (pt) {
        return el("li", { text: pt });
      })
    );
  }

  // ---------- Featured project (large bento tile) ----------
  var projects = data.projects || [];
  var featured = null;
  projects.forEach(function (p) {
    if (p.featured && !featured) featured = p;
  });
  var featuredBox = target("featured");
  if (featured) {
    featuredBox.classList.add("glow");
    featuredBox.appendChild(
      el("div", { className: "project-meta" }, [
        el("span", { className: "tile-label" }, [icon("star", 14), document.createTextNode("Featured · " + (featured.category || ""))]),
        el("span", { className: "project-year", text: [featured.context, featured.year].filter(Boolean).join(" · ") }),
      ])
    );
    featuredBox.appendChild(el("h3", { className: "featured-title", text: featured.title }));
    if (featured.summary) featuredBox.appendChild(el("p", { className: "project-summary", text: featured.summary }));
    if (featured.flow && featured.flow.length) {
      var flow = el("ol", { className: "flow", "aria-label": "Deployment stages" });
      featured.flow.forEach(function (stage, i) {
        flow.appendChild(el("li", { style: "--i:" + i }, [el("span", { text: stage })]));
      });
      featuredBox.appendChild(flow);
    }
    var fp = pointList(featured.points);
    if (fp) featuredBox.appendChild(fp);
    featuredBox.appendChild(el("div", { className: "project-foot" }, [tagList(featured.tags), linkRow(featured)]));
  } else {
    featuredBox.hidden = true;
  }

  // ---------- Telemetry tile ----------
  var telemetryBox = target("telemetry");
  var telemetry = data.telemetry || [];
  var counters = [];
  if (telemetry.length) {
    telemetryBox.appendChild(
      el("p", { className: "tile-label" }, [icon("activity", 14), document.createTextNode("At a glance")])
    );
    var list = el("ul", { className: "metrics" });
    telemetry.forEach(function (m) {
      var value = el("span", { className: "metric-value", text: m.value });
      counters.push(value);
      list.appendChild(el("li", null, [value, el("span", { className: "metric-label", text: m.label })]));
    });
    telemetryBox.appendChild(list);
  } else {
    telemetryBox.hidden = true;
  }

  // Count numbers up from zero the first time they scroll into view.
  function countUp(node) {
    var text = node.textContent;
    var match = text.match(/^(\D*)([\d,]+)(.*)$/);
    if (!match || reduceMotion) return;
    var end = parseInt(match[2].replace(/,/g, ""), 10);
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / 900);
      var eased = 1 - Math.pow(1 - k, 3);
      node.textContent = match[1] + Math.round(end * eased).toLocaleString("en-US") + match[3];
      if (k < 1) requestAnimationFrame(frame);
      else node.textContent = text;
    }
    requestAnimationFrame(frame);
  }

  // ---------- Code tile ----------
  var terminalBox = target("terminal");
  var snippets = data.snippets && data.snippets.files ? data.snippets : null;
  if (snippets && snippets.files.length) renderTerminal(snippets, terminalBox);
  else terminalBox.hidden = true;

  function highlight(code, lang) {
    var KW = {
      python: /^(import|from|as|for|in|if|else|elif|return|def|class|with|while|and|or|not|None|True|False|lambda)$/,
      hcl: /^(resource|variable|module|output|data|locals|provider|terraform|true|false|null)$/,
    };
    var kw = KW[lang] || KW.python;
    var frag = document.createDocumentFragment();
    var re = /(#.*$)|("(?:[^"\\]|\\.)*")|(\b\d[\d_.]*\b)|([A-Za-z_][\w]*)|(\s+)|([^\sA-Za-z_\d"#]+)/gm;
    var m;
    while ((m = re.exec(code))) {
      var cls = null;
      var tok = m[0];
      if (m[1]) cls = "t-com";
      else if (m[2]) cls = "t-str";
      else if (m[3]) cls = "t-num";
      else if (m[4]) {
        var rest = code.slice(re.lastIndex);
        if (kw.test(tok)) cls = "t-kw";
        else if (/^\s*\(/.test(rest)) cls = "t-fn";
        else if (lang === "hcl" && /^\s*=/.test(rest)) cls = "t-attr";
      } else if (m[6]) cls = "t-op";
      frag.appendChild(cls ? el("span", { className: cls, text: tok }) : document.createTextNode(tok));
    }
    return frag;
  }

  function renderTerminal(info, box) {
    var tabs = el("div", { className: "term-tabs", role: "tablist", "aria-label": "Code examples" });
    var body = el("div", { className: "term-body" });
    var codeEl = el("code");
    var pre = el("pre", { tabindex: "0", "aria-label": "Code example" }, [codeEl]);
    body.appendChild(pre);

    function show(i) {
      var f = info.files[i];
      codeEl.textContent = "";
      f.code.split("\n").forEach(function (line, n) {
        var row = el("span", { className: "line", style: "--n:" + n });
        row.appendChild(highlight(line, f.lang));
        codeEl.appendChild(row);
        codeEl.appendChild(document.createTextNode("\n"));
      });
      pre.setAttribute("aria-label", "Code example: " + f.file);
      each(".term-tab", function (t, j) {
        t.setAttribute("aria-selected", String(j === i));
        t.tabIndex = j === i ? 0 : -1;
      });
      box.classList.remove("is-typing");
      void box.offsetWidth;
      if (!reduceMotion) box.classList.add("is-typing");
    }

    info.files.forEach(function (f, i) {
      var t = el("button", { className: "term-tab", type: "button", role: "tab", "aria-selected": "false", tabindex: "-1" }, [
        document.createTextNode(f.file),
      ]);
      t.addEventListener("click", function () { show(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var next = (i + (e.key === "ArrowRight" ? 1 : info.files.length - 1)) % info.files.length;
        show(next);
        tabs.children[next].focus();
      });
      tabs.appendChild(t);
    });

    box.appendChild(
      el("div", { className: "term-head" }, [
        el("span", { className: "plot-dots", "aria-hidden": "true" }, [el("i"), el("i"), el("i")]),
        tabs,
      ])
    );
    box.appendChild(body);
    if (info.note) box.appendChild(el("p", { className: "term-note", text: info.note }));
    show(0);
  }

  // ---------- Projects + filters (the featured project has its own tile) ----------
  var listed = projects.filter(function (p) {
    return p !== featured;
  });
  var projectGrid = target("projects");
  var cards = listed.map(function (p) {
    var card = el("article", { className: "project glass glow", "data-category": p.category || "" }, [
      el("div", { className: "project-meta" }, [
        el("span", { className: "project-cat", text: p.category || "" }),
        p.context || p.year
          ? el("span", { className: "project-year", text: [p.context, p.year].filter(Boolean).join(" · ") })
          : null,
      ]),
      el("h3", { text: p.title }),
      p.summary ? el("p", { className: "project-summary", text: p.summary }) : null,
      pointList(p.points),
      el("div", { className: "project-foot" }, [tagList(p.tags), linkRow(p)]),
    ]);
    projectGrid.appendChild(card);
    return card;
  });

  var filters = target("filters");
  var categories = [];
  listed.forEach(function (p) {
    if (p.category && categories.indexOf(p.category) === -1) categories.push(p.category);
  });

  function applyFilter(category) {
    cards.forEach(function (card) {
      card.hidden = category !== "All" && card.getAttribute("data-category") !== category;
    });
    each(".filters .filter", function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-filter") === category));
    });
  }

  if (categories.length > 1) {
    ["All"].concat(categories).forEach(function (cat) {
      var count =
        cat === "All"
          ? listed.length
          : listed.filter(function (p) {
              return p.category === cat;
            }).length;
      var btn = el("button", { className: "filter", type: "button", "data-filter": cat, "aria-pressed": "false" }, [
        document.createTextNode(cat),
        el("span", { className: "filter-count", text: String(count), "aria-hidden": "true" }),
      ]);
      btn.addEventListener("click", function () {
        applyFilter(cat);
      });
      filters.appendChild(btn);
    });
    applyFilter("All");
  } else {
    filters.hidden = true;
  }
  if (!listed.length) document.getElementById("projects").hidden = true;

  // ---------- Experience (vertical timeline, grouped by company) ----------
  function badgeText(job) {
    if (job.badge) return job.badge;
    var words = (job.org || "").split(/\s+/).filter(Boolean);
    if (words[0] && words[0].length <= 3) return words[0];
    return words
      .filter(function (w) { return /^[A-Z0-9]/.test(w); })
      .slice(0, 2)
      .map(function (w) { return w.charAt(0); })
      .join("");
  }

  var experience = target("experience");
  (data.experience || []).forEach(function (job, jobIndex) {
    var current = (job.roles || []).some(function (r) {
      return /present/i.test(r.period || "");
    });
    experience.appendChild(
      el("li", { className: "job" + (current ? " is-current" : "") }, [
        el("span", { className: "job-node", "aria-hidden": "true" }),
        el("div", { className: "job-card glass glow" }, [
          el("div", { className: "job-head" }, [
            el("span", { className: "job-badge", text: badgeText(job), "aria-hidden": "true" }),
            el("div", null, [
              el("h3", { text: job.org }),
              el("p", { className: "job-meta", text: [job.place, job.period].filter(Boolean).join(" · ") }),
            ]),
          ]),
          job.impact && job.impact.length
            ? el(
                "ul",
                { className: "impact", "aria-label": "Key impact" },
                job.impact.map(function (txt) {
                  return el("li", null, [icon("zap", 13), el("span", { text: txt })]);
                })
              )
            : null,
          el(
            "ol",
            { className: "roles" },
            (job.roles || []).map(function (role, i) {
              var isNow = /present/i.test(role.period || "");
              var details = el("details", { className: "role" + (isNow ? " is-current" : "") }, [
                el("summary", null, [
                  el("span", { className: "role-title" }, [
                    el("h4", { text: role.title }),
                    role.period ? el("span", { className: "role-period", text: role.period }) : null,
                  ]),
                  role.points && role.points.length
                    ? el("span", { className: "role-toggle", "aria-hidden": "true" })
                    : null,
                ]),
                role.points && role.points.length
                  ? el(
                      "ul",
                      null,
                      role.points.map(function (pt) {
                        return el("li", { text: pt });
                      })
                    )
                  : null,
              ]);
              // Open the newest role at every company; the rest expand on click.
              if (i === 0 || jobIndex === 0 && i < 2) details.open = true;
              return el("li", null, [details]);
            })
          ),
        ]),
      ])
    );
  });

  // Printed copies show every role in full.
  window.addEventListener("beforeprint", function () {
    each("details.role", function (d) { d.open = true; });
  });

  // ---------- GitHub activity (contribution graph tile + highlights tile) ----------
  var activity = data.activity;
  var activityBox = target("activity");
  var commitsBox = target("commits");
  var weekly = [];
  if (activity && activity.years && activity.years.length) {
    renderActivity(activity, activityBox, commitsBox);
  } else {
    activityBox.hidden = true;
    commitsBox.hidden = true;
  }

  function renderActivity(info, box, highlightsBox) {
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // GitHub's colour levels are relative to the account's own busiest days, so name them as levels.
    var LEVEL_NAMES = [
      "no contributions",
      "contribution level 1 of 4",
      "contribution level 2 of 4",
      "contribution level 3 of 4",
      "contribution level 4 of 4 (busiest)",
    ];
    // Fixed pixel sizes (like GitHub) so labels stay readable and the legend matches the cells.
    var CELL = 12;
    var PITCH = 15;
    var TOP = 20;
    var DAY_COL = 32;
    var HEIGHT = TOP + 7 * PITCH;

    var years = info.years;
    var grandTotal = years.reduce(function (sum, y) { return sum + (y.total || 0); }, 0);
    var totalLabel = info.totalLabel || "contributions";

    // Weekly activity (sum of daily levels), oldest first, for the telemetry sparkline.
    years.slice().sort(function (a, b) { return a.year - b.year; }).forEach(function (y) {
      var lv = y.levels || "";
      for (var d = 0; d < lv.length; d += 7) {
        var sum = 0;
        for (var j = d; j < Math.min(d + 7, lv.length); j++) sum += parseInt(lv.charAt(j), 10) || 0;
        weekly.push(sum);
      }
    });

    var tabs = el("div", { className: "activity-tabs", role: "group", "aria-label": "Choose a year" });
    var yearTotal = el("p", { className: "activity-year" });
    var scroller = el("div", { className: "heatmap-scroll" });
    var tip = document.querySelector(".cell-tip");

    // Weekday labels live outside the scrolling area so they stay visible on phones.
    var dayLabels = svg("svg", {
      class: "heatmap-days",
      width: DAY_COL,
      height: HEIGHT,
      viewBox: "0 0 " + DAY_COL + " " + HEIGHT,
      "aria-hidden": "true",
    });
    [1, 3, 5].forEach(function (d) {
      var t = svg("text", { x: 0, y: TOP + d * PITCH + CELL - 2, class: "heatmap-label" });
      t.textContent = DAYS[d];
      dayLabels.appendChild(t);
    });

    var counter = el("span", { className: "stat-value", text: String(grandTotal) });
    counters.push(counter);
    box.appendChild(
      el("div", { className: "activity-top" }, [
        el("div", null, [
          el("p", { className: "tile-label" }, [icon("github", 14), document.createTextNode("GitHub activity at BMW IT Hub")]),
          el("p", { className: "activity-total" }, [counter, el("span", { className: "stat-label", text: totalLabel })]),
        ]),
        tabs,
      ])
    );
    box.appendChild(yearTotal);
    box.appendChild(el("div", { className: "heatmap-wrap" }, [dayLabels, scroller]));
    box.appendChild(
      el("div", { className: "activity-bottom" }, [
        info.note ? el("p", { className: "activity-note", text: info.note }) : null,
        el("div", { className: "heatmap-legend", "aria-hidden": "true" }, [el("span", { text: "Less" })]
          .concat([0, 1, 2, 3, 4].map(function (l) {
            return el("i", { className: "lvl-" + l });
          }))
          .concat([el("span", { text: "More" })])),
      ])
    );

    if (info.highlights && info.highlights.length) {
      highlightsBox.appendChild(
        el("p", { className: "tile-label" }, [icon("commit", 14), document.createTextNode("Recent highlights")])
      );
      highlightsBox.appendChild(
        el("ol", { className: "gitlog" }, info.highlights.map(function (h) {
          return el("li", null, [
            el("span", { className: "role-period", text: h.period }),
            el("p", { text: h.text }),
          ]);
        }))
      );
    } else {
      highlightsBox.hidden = true;
    }

    var latestX = 0;
    var monthLabels = [];

    // Hide any month label whose start has scrolled out of view, so no sliver shows at the edge.
    function hideClippedMonths() {
      var left = scroller.scrollLeft;
      monthLabels.forEach(function (t) {
        t.style.visibility = Number(t.getAttribute("x")) < left - 0.5 ? "hidden" : "";
      });
    }
    scroller.addEventListener("scroll", function () {
      hideClippedMonths();
      tip.hidden = true;
    }, { passive: true });

    // On narrow screens the graph scrolls sideways; keep the latest activity in view.
    function scrollToLatest() {
      scroller.scrollLeft = Math.max(0, latestX - scroller.clientWidth);
      hideClippedMonths();
      if (window.requestAnimationFrame) requestAnimationFrame(hideClippedMonths);
    }

    // A styled tooltip for each day cell (pointer only; the graph has a text summary for screen readers).
    scroller.addEventListener("pointerover", function (e) {
      var cell = e.target.closest && e.target.closest("rect[data-tip]");
      if (!cell) return;
      tip.textContent = cell.getAttribute("data-tip");
      tip.hidden = false;
      var r = cell.getBoundingClientRect();
      var w = tip.offsetWidth;
      var x = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
      tip.style.transform = "translate(" + Math.round(x) + "px," + Math.round(r.top - tip.offsetHeight - 8) + "px)";
    });
    scroller.addEventListener("pointerleave", function () {
      tip.hidden = true;
    });

    function draw(y) {
      var levels = y.levels || "";
      var jan1 = new Date(Date.UTC(y.year, 0, 1));
      var lead = jan1.getUTCDay(); // empty slots before 1 January in the first column
      var weeks = Math.ceil((lead + levels.length) / 7);
      var width = weeks * PITCH;

      var svgEl = svg("svg", {
        class: "heatmap",
        width: width,
        height: HEIGHT,
        viewBox: "0 0 " + width + " " + HEIGHT,
        role: "img",
        "aria-label": "Contribution graph for " + y.year + ": " + y.total + " contributions",
      });

      // Month labels go above the first week that starts in that month, as on GitHub.
      monthLabels = [];
      var lastLabelCol = -9;
      for (var m = 0; m < 12; m++) {
        var dayIndex = Math.round((Date.UTC(y.year, m, 1) - jan1) / 86400000);
        if (dayIndex >= levels.length) break;
        var col = m === 0 ? 0 : Math.ceil((lead + dayIndex) / 7);
        if (col >= weeks || col - lastLabelCol < 3) continue;
        var label = svg("text", { x: col * PITCH, y: 11, class: "heatmap-label" });
        label.textContent = MONTHS[m];
        svgEl.appendChild(label);
        monthLabels.push(label);
        lastLabelCol = col;
      }

      for (var i = 0; i < levels.length; i++) {
        var level = Math.max(0, Math.min(4, parseInt(levels.charAt(i), 10) || 0));
        var slot = lead + i;
        var date = new Date(jan1.getTime() + i * 86400000);
        svgEl.appendChild(
          svg("rect", {
            x: Math.floor(slot / 7) * PITCH,
            y: TOP + (slot % 7) * PITCH,
            width: CELL,
            height: CELL,
            rx: 2.5,
            class: "lvl-" + level,
            "data-tip":
              DAYS[date.getUTCDay()] + " " + date.getUTCDate() + " " + MONTHS[date.getUTCMonth()] + " " + y.year +
              " · " + LEVEL_NAMES[level],
          })
        );
      }

      scroller.textContent = "";
      scroller.appendChild(svgEl);

      var lastActive = levels.search(/[1-4]0*$/);
      var lastCol = lastActive < 0 ? weeks - 1 : Math.floor((lead + lastActive) / 7);
      latestX = Math.min(width, (lastCol + 3) * PITCH);
      scrollToLatest();

      yearTotal.textContent = y.total + " contributions in " + y.year + (y.label ? " " + y.label : "");

      each(".activity-tabs .filter", function (btn) {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-year") === String(y.year)));
      });
    }

    years.forEach(function (y) {
      var btn = el("button", { className: "filter", type: "button", "data-year": String(y.year), "aria-pressed": "false" }, [
        document.createTextNode(String(y.year)),
      ]);
      btn.addEventListener("click", function () {
        draw(y);
      });
      tabs.appendChild(btn);
    });
    if (years.length < 2) tabs.hidden = true;
    draw(years[0]);

    if ("ResizeObserver" in window) {
      var lastWidth = scroller.clientWidth;
      new ResizeObserver(function () {
        if (scroller.clientWidth !== lastWidth) {
          lastWidth = scroller.clientWidth;
          scrollToLatest();
        }
      }).observe(scroller);
    }
  }

  // Sparkline of weekly activity at the bottom of the telemetry tile.
  if (weekly.length && !telemetryBox.hidden) {
    var recent = weekly.slice(-26);
    var max = Math.max.apply(null, recent.concat([1]));
    var W = 240;
    var H = 56;
    var stepX = W / Math.max(1, recent.length - 1);
    var pts = recent.map(function (v, i) {
      return [i * stepX, H - 4 - (v / max) * (H - 10)];
    });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var spark = svg("svg", { class: "spark", viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", "aria-hidden": "true" });
    var defs = svg("defs");
    var grad = svg("linearGradient", { id: "spark-fill", x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(svg("stop", { offset: "0", "stop-color": "currentColor", "stop-opacity": "0.35" }));
    grad.appendChild(svg("stop", { offset: "1", "stop-color": "currentColor", "stop-opacity": "0" }));
    defs.appendChild(grad);
    spark.appendChild(defs);
    spark.appendChild(svg("path", { d: line + " L" + W + " " + H + " L0 " + H + " Z", fill: "url(#spark-fill)" }));
    spark.appendChild(svg("path", { class: "spark-line", d: line, fill: "none", "vector-effect": "non-scaling-stroke" }));
    telemetryBox.appendChild(
      el("figure", { className: "spark-wrap" }, [
        spark,
        el("figcaption", { text: "Weekly GitHub activity, last 26 weeks of data" }),
      ])
    );
  }

  if (counters.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          seen.unobserve(entry.target);
          countUp(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { seen.observe(c); });
    }
  }

  // ---------- Education & certifications ----------
  var education = target("education");
  (data.education || []).forEach(function (item) {
    education.appendChild(
      el("li", { className: "glass" }, [
        el("span", { className: "tl-icon", "aria-hidden": "true" }, [icon("cap", 18)]),
        el("div", null, [
          el("span", { className: "tl-period", text: item.period }),
          el("h4", { text: item.title }),
          el("p", { className: "tl-org", text: item.org }),
          item.detail ? el("p", { className: "tl-detail", text: item.detail }) : null,
          item.credential ? el("span", { className: "tl-credential", text: item.credential }) : null,
        ]),
      ])
    );
  });

  var certs = target("certifications");
  (data.certifications || []).forEach(function (c) {
    var meta = [c.org, c.year].filter(Boolean).join(" · ");
    certs.appendChild(
      el("li", null, [
        el("span", { className: "cert-icon", "aria-hidden": "true" }, [icon("award", 16)]),
        el("div", { className: "cert-body" }, [
          el("span", { className: "cert-title", text: c.title }),
          meta ? el("span", { className: "cert-meta", text: meta }) : null,
          c.credential
            ? el("span", { className: "tl-credential" }, [icon("badge-check", 13), document.createTextNode("Credential " + c.credential)])
            : null,
        ]),
      ])
    );
  });
  if (!certs.children.length) certs.parentNode.hidden = true;
  if (!education.children.length) education.parentNode.hidden = true;

  // ---------- Header: mobile menu, scroll state, progress, active link ----------
  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".scroll-progress");
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("nav-menu");

  function setMenu(open) {
    navMenu.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  }
  navToggle.addEventListener("click", function () {
    setMenu(!navMenu.classList.contains("is-open"));
  });
  navMenu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navMenu.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus();
    }
  });
  document.addEventListener("click", function (e) {
    if (navMenu.classList.contains("is-open") && !header.contains(e.target)) setMenu(false);
  });

  var ticking = false;
  function onScroll() {
    ticking = false;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window) {
    var navLinks = {};
    each('.nav-menu a[href^="#"]', function (a) {
      navLinks[a.getAttribute("href").slice(1)] = a;
    });
    var inBand = {};
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          inBand[entry.target.id] = entry.isIntersecting;
        });
        var current = Object.keys(navLinks).filter(function (id) {
          return inBand[id];
        }).pop();
        Object.keys(navLinks).forEach(function (id) {
          var on = id === current;
          navLinks[id].classList.toggle("is-active", on);
          if (on) navLinks[id].setAttribute("aria-current", "true");
          else navLinks[id].removeAttribute("aria-current");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(navLinks).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    // Fade sections in as they arrive (content is visible without JS or with reduced motion).
    if (!reduceMotion) {
      var reveal = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            reveal.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      each(".section", function (s) {
        if (s.getBoundingClientRect().top > window.innerHeight) {
          s.classList.add("reveal");
          reveal.observe(s);
        }
      });
    }
  }

  // ---------- Pointer glow on cards and the hero ----------
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer) {
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".glow");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--gx", e.clientX - r.left + "px");
      card.style.setProperty("--gy", e.clientY - r.top + "px");
    }, { passive: true });

    var heroBand = document.querySelector(".hero-band");
    if (heroBand && !reduceMotion) {
      heroBand.addEventListener("pointermove", function (e) {
        var r = heroBand.getBoundingClientRect();
        heroBand.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        heroBand.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      }, { passive: true });
    }
  }

  // ---------- Theme toggle ----------
  var root = document.documentElement;
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  function currentTheme() {
    return root.getAttribute("data-theme") || (darkQuery.matches ? "dark" : "light");
  }
  var themeBtn = document.querySelector(".theme-toggle");
  function labelThemeButton() {
    themeBtn.setAttribute("aria-label", currentTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    labelThemeButton();
  });
  labelThemeButton();

  // ---------- Hero lab: tabs ----------
  var labTabs = Array.prototype.slice.call(document.querySelectorAll(".lab-tab"));
  var labHooks = {};
  function selectTab(tab) {
    labTabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    var hook = labHooks[tab.getAttribute("aria-controls")];
    if (hook) hook();
  }
  labTabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var next = labTabs[(i + (e.key === "ArrowRight" ? 1 : labTabs.length - 1)) % labTabs.length];
      selectTab(next);
      next.focus();
    });
  });

  // ---------- Hero lab: interactive k-means ----------
  var plot = document.querySelector(".plot");
  if (plot) initKMeans(plot);

  function initKMeans(svgEl) {
    var W = 400;
    var H = 280;
    var PAD = 18;
    var K = 3;
    var gridLayer = svgEl.querySelector(".plot-grid");
    var pointLayer = svgEl.querySelector(".plot-points");
    var centroidLayer = svgEl.querySelector(".plot-centroids");
    var status = document.querySelector(".plot-status");
    var inertiaEl = document.querySelector(".plot-inertia");
    var panel = document.getElementById("panel-cluster");
    var runId = 0;
    var pts = [];

    for (var gx = 50; gx < W; gx += 50) gridLayer.appendChild(svg("line", { x1: gx, y1: 0, x2: gx, y2: H }));
    for (var gy = 40; gy < H; gy += 40) gridLayer.appendChild(svg("line", { x1: 0, y1: gy, x2: W, y2: gy }));

    function gaussian() {
      var u = 1 - Math.random();
      var v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function clamp(v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    }

    // Blobs around 3–4 random centres, so choosing k is a real question.
    function makeData() {
      var n = 3 + Math.floor(Math.random() * 2);
      var centers = [];
      var guard = 0;
      while (centers.length < n && guard++ < 800) {
        var c = { x: 60 + Math.random() * (W - 120), y: 50 + Math.random() * (H - 100) };
        var farEnough = centers.every(function (o) {
          return Math.hypot(o.x - c.x, o.y - c.y) > 115;
        });
        if (farEnough) centers.push(c);
      }
      var out = [];
      centers.forEach(function (c) {
        var count = 22 + Math.floor(Math.random() * 12);
        for (var i = 0; i < count; i++) {
          out.push({
            x: clamp(c.x + gaussian() * 26, PAD, W - PAD),
            y: clamp(c.y + gaussian() * 22, PAD, H - PAD),
          });
        }
      });
      return out;
    }

    function dist2(a, b) {
      return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    }

    function nearest(p, cents) {
      var best = 0;
      var bestD = Infinity;
      cents.forEach(function (c, i) {
        var d = dist2(p, c);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    }

    // k-means++ seeding, then Lloyd iterations; every step is recorded so it can be replayed.
    function solve(points) {
      var cents = [points[Math.floor(Math.random() * points.length)]];
      while (cents.length < K) {
        var d = points.map(function (p) {
          return dist2(p, cents[nearest(p, cents)]);
        });
        var total = d.reduce(function (s, v) { return s + v; }, 0);
        var r = Math.random() * total;
        var idx = 0;
        while (idx < d.length - 1 && (r -= d[idx]) > 0) idx++;
        cents.push(points[idx]);
      }
      cents = cents.map(function (c) { return { x: c.x, y: c.y }; });
      var steps = [{ cents: cents, labels: null }];
      var labels = null;
      for (var iter = 0; iter < 15; iter++) {
        var next = points.map(function (p) {
          return nearest(p, cents);
        });
        var changed = !labels || next.some(function (l, i) {
          return l !== labels[i];
        });
        labels = next;
        if (!changed) break;
        cents = cents.map(function (c, k) {
          var members = points.filter(function (_, i) {
            return labels[i] === k;
          });
          if (!members.length) return c;
          return {
            x: members.reduce(function (s, p) { return s + p.x; }, 0) / members.length,
            y: members.reduce(function (s, p) { return s + p.y; }, 0) / members.length,
          };
        });
        steps.push({ cents: cents, labels: labels });
      }
      return steps;
    }

    function inertia(step) {
      if (!step.labels) return null;
      var s = 0;
      pts.forEach(function (p, i) {
        s += dist2(p, step.cents[step.labels[i]]);
      });
      return s / pts.length;
    }

    function place(g, c) {
      g.style.transform = "translate(" + c.x.toFixed(1) + "px, " + c.y.toFixed(1) + "px)";
    }

    function drawPoints() {
      pointLayer.textContent = "";
      return pts.map(function (p) {
        var c = svg("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 4 });
        pointLayer.appendChild(c);
        return c;
      });
    }

    function run() {
      var id = ++runId;
      if (pts.length < K) return;
      var steps = solve(pts);
      var circles = drawPoints();
      centroidLayer.textContent = "";
      var markers = steps[0].cents.map(function (c, k) {
        var g = svg("g", { "data-k": k });
        g.appendChild(svg("circle", { class: "halo", r: 16 }));
        g.appendChild(svg("circle", { r: 8 }));
        g.appendChild(svg("path", { d: "M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5" }));
        g.style.transition = "none";
        place(g, c);
        centroidLayer.appendChild(g);
        return g;
      });

      function show(step, index) {
        if (step.labels) {
          circles.forEach(function (c, i) {
            c.setAttribute("data-k", step.labels[i]);
          });
        }
        markers.forEach(function (g, k) {
          place(g, step.cents[k]);
        });
        var last = index === steps.length - 1;
        status.textContent = last && index > 0
          ? "converged in " + index + (index === 1 ? " iteration" : " iterations")
          : "iteration " + index;
        var inr = inertia(step);
        inertiaEl.textContent = inr === null ? "" : "inertia " + Math.round(inr).toLocaleString("en-US");
      }

      if (reduceMotion) {
        show(steps[steps.length - 1], steps.length - 1);
        return;
      }

      show(steps[0], 0);
      // Force a layout so the first position doesn't animate, then re-enable transitions.
      void svgEl.getBoundingClientRect();
      markers.forEach(function (g) {
        g.style.transition = "";
      });

      var i = 1;
      function tick() {
        if (id !== runId || i >= steps.length) return;
        show(steps[i], i);
        i++;
        setTimeout(tick, 750);
      }
      setTimeout(tick, 650);
    }

    function setK(k) {
      K = k;
      each(".seg [data-k]", function (b) {
        b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-k")) === k));
      });
      run();
    }

    each(".seg [data-k]", function (b) {
      b.addEventListener("click", function () {
        setK(Number(b.getAttribute("data-k")));
      });
    });
    panel.querySelector('[data-act="data"]').addEventListener("click", function () {
      pts = makeData();
      run();
    });
    panel.querySelector('[data-act="run"]').addEventListener("click", run);

    // Click to drop a small cluster of points where you clicked, then re-cluster.
    svgEl.addEventListener("click", function (e) {
      var ctm = svgEl.getScreenCTM();
      if (!ctm) return;
      var pt = svgEl.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      var p = pt.matrixTransform(ctm.inverse());
      for (var i = 0; i < 6; i++) {
        pts.push({ x: clamp(p.x + gaussian() * 10, PAD, W - PAD), y: clamp(p.y + gaussian() * 10, PAD, H - PAD) });
      }
      if (pts.length > 260) pts = pts.slice(pts.length - 260);
      run();
    });

    pts = makeData();
    run();
  }

  // ---------- Hero lab: simulated AWS solve pipeline ----------
  var pipeSvg = document.querySelector(".pipe");
  if (pipeSvg) initPipeline(pipeSvg);

  function initPipeline(root) {
    var NODES = [
      { id: "in", x: 14, y: 30, svc: "S3", name: "input bucket", color: "#7AA116" },
      { id: "fn", x: 150, y: 30, svc: "Lambda", name: "validate & enqueue", color: "#ED7100" },
      { id: "q", x: 286, y: 30, svc: "SQS", name: "solve requests", color: "#E7157B" },
      { id: "solve", x: 286, y: 128, svc: "Container", name: "MILP solver", color: "#00a3e0" },
      { id: "out", x: 150, y: 128, svc: "S3", name: "results bucket", color: "#7AA116" },
    ];
    var NW = 100;
    var NH = 54;
    var status = document.querySelector(".pipe-status");
    var autoBtn = document.querySelector('[data-act="auto"]');
    var running = false;
    var auto = false;
    var autoTimer = null;
    var runNo = 420;
    var started = false;

    function mid(n, side) {
      if (side === "r") return [n.x + NW, n.y + NH / 2];
      if (side === "l") return [n.x, n.y + NH / 2];
      if (side === "b") return [n.x + NW / 2, n.y + NH];
      return [n.x + NW / 2, n.y];
    }
    var EDGES = [
      [mid(NODES[0], "r"), mid(NODES[1], "l")],
      [mid(NODES[1], "r"), mid(NODES[2], "l")],
      [mid(NODES[2], "b"), mid(NODES[3], "t")],
      [mid(NODES[3], "l"), mid(NODES[4], "r")],
    ];

    var edgeLayer = svg("g", { class: "pipe-edges" });
    var nodeLayer = svg("g", { class: "pipe-nodes" });
    var packet = svg("circle", { class: "pipe-packet", r: 4.5, cx: -20, cy: -20 });
    var logLayer = svg("g", { class: "pipe-log" });
    root.appendChild(edgeLayer);
    root.appendChild(nodeLayer);
    root.appendChild(packet);
    root.appendChild(logLayer);

    var edgeEls = EDGES.map(function (e) {
      var d = "M" + e[0][0] + " " + e[0][1] + " L" + e[1][0] + " " + e[1][1];
      edgeLayer.appendChild(svg("path", { d: d, class: "pipe-edge" }));
      var flow = svg("path", { d: d, class: "pipe-flow" });
      edgeLayer.appendChild(flow);
      return flow;
    });

    var nodeEls = NODES.map(function (n) {
      var g = svg("g", { class: "pipe-node", transform: "translate(" + n.x + " " + n.y + ")" });
      g.appendChild(svg("rect", { width: NW, height: NH, rx: 10, class: "pipe-box" }));
      g.appendChild(svg("rect", { x: 10, y: 12, width: 6, height: 6, rx: 1.5, fill: n.color }));
      var svc = svg("text", { x: 22, y: 19, class: "pipe-svc" });
      svc.textContent = n.svc;
      var name = svg("text", { x: 10, y: 38, class: "pipe-name" });
      name.textContent = n.name;
      g.appendChild(svc);
      g.appendChild(name);
      nodeLayer.appendChild(g);
      return g;
    });

    // Progress bar inside the solver node.
    var barBg = svg("rect", { x: 10, y: 44, width: NW - 20, height: 3, rx: 1.5, class: "pipe-bar-bg" });
    var bar = svg("rect", { x: 10, y: 44, width: 0, height: 3, rx: 1.5, class: "pipe-bar" });
    nodeEls[3].appendChild(barBg);
    nodeEls[3].appendChild(bar);

    // Summary card in the free bottom-left slot.
    var summary = svg("g", { class: "pipe-summary", transform: "translate(14 128)" });
    summary.appendChild(svg("rect", { width: NW, height: NH, rx: 10, class: "pipe-box pipe-box-dashed" }));
    var sumTop = svg("text", { x: 10, y: 21, class: "pipe-name" });
    var sumBottom = svg("text", { x: 10, y: 39, class: "pipe-svc" });
    sumTop.textContent = "last run";
    sumBottom.textContent = "—";
    summary.appendChild(sumTop);
    summary.appendChild(sumBottom);
    root.appendChild(summary);

    var logLines = [];
    function log(text, kind) {
      logLines.push({ text: text, kind: kind || "" });
      if (logLines.length > 4) logLines.shift();
      logLayer.textContent = "";
      logLines.forEach(function (l, i) {
        var t = svg("text", { x: 14, y: 210 + i * 17, class: "pipe-logline " + l.kind });
        t.textContent = l.text;
        logLayer.appendChild(t);
      });
    }
    log("$ waiting for an upload…", "dim");

    function wait(ms) {
      return new Promise(function (resolve) { setTimeout(resolve, reduceMotion ? 0 : ms); });
    }

    function activate(i, on) {
      nodeEls[i].classList.toggle("is-active", on);
    }

    function travel(i) {
      var e = EDGES[i];
      edgeEls[i].classList.add("is-on");
      if (reduceMotion) return Promise.resolve();
      return new Promise(function (resolve) {
        var start = null;
        function frame(t) {
          if (start === null) start = t;
          var k = Math.min(1, (t - start) / 520);
          var ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          packet.setAttribute("cx", e[0][0] + (e[1][0] - e[0][0]) * ease);
          packet.setAttribute("cy", e[0][1] + (e[1][1] - e[0][1]) * ease);
          if (k < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
    }

    function stamp(t0) {
      return ((performance.now() - t0) / 1000).toFixed(2).padStart(5, "0");
    }

    function trigger() {
      if (running) return;
      running = true;
      var t0 = performance.now();
      var id = "run-" + ++runNo;
      var vars = 900 + Math.floor(Math.random() * 600);
      edgeEls.forEach(function (e) { e.classList.remove("is-on"); });
      bar.setAttribute("width", 0);
      packet.classList.add("is-live");
      status.textContent = "running " + id;

      Promise.resolve()
        .then(function () {
          activate(0, true);
          log("[" + stamp(t0) + "] s3      ObjectCreated input/" + id + ".json");
          return wait(450);
        })
        .then(function () { return travel(0); })
        .then(function () {
          activate(0, false);
          activate(1, true);
          log("[" + stamp(t0) + "] lambda  schema ok · " + vars + " variables");
          return wait(450);
        })
        .then(function () { return travel(1); })
        .then(function () {
          activate(1, false);
          activate(2, true);
          log("[" + stamp(t0) + "] sqs     message queued (1 in flight)");
          return wait(400);
        })
        .then(function () { return travel(2); })
        .then(function () {
          activate(2, false);
          activate(3, true);
          return new Promise(function (resolve) {
            var gaps = [12.4, 5.1, 1.8, 0.4, 0];
            var g = 0;
            (function step() {
              bar.setAttribute("width", ((NW - 20) * (g + 1)) / gaps.length);
              var line = "[" + stamp(t0) + "] solver  branch & bound · gap " + gaps[g].toFixed(2) + "%";
              if (g > 0) logLines.pop(); // update the solver line in place
              log(line);
              g++;
              if (g < gaps.length) setTimeout(step, reduceMotion ? 0 : 320);
              else resolve();
            })();
          });
        })
        .then(function () { return travel(3); })
        .then(function () {
          activate(3, false);
          activate(4, true);
          var secs = ((performance.now() - t0) / 1000).toFixed(1);
          log("[" + stamp(t0) + "] s3      results/" + id + ".parquet · OPTIMAL", "ok");
          sumTop.textContent = id;
          sumBottom.textContent = "OPTIMAL · " + secs + " s";
          status.textContent = id + " finished: optimal solution in " + secs + " s";
          return wait(700);
        })
        .then(function () {
          activate(4, false);
          packet.classList.remove("is-live");
          running = false;
          if (auto) autoTimer = setTimeout(trigger, 1400);
        });
    }

    document.querySelector('[data-act="trigger"]').addEventListener("click", trigger);
    autoBtn.addEventListener("click", function () {
      auto = !auto;
      autoBtn.setAttribute("aria-pressed", String(auto));
      clearTimeout(autoTimer);
      if (auto && !running) trigger();
    });

    // Run once the first time the tab is opened.
    labHooks["panel-pipeline"] = function () {
      if (!started) {
        started = true;
        trigger();
      }
    };
  }
})();
