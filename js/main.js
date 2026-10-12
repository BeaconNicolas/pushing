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
    if (contactLinkedIn) contactLinkedIn.classList.add("btn-primary");
  }

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
      el("div", { className: "skill-card" }, [
        el("h3", { text: group.group }),
        el(
          "ul",
          { className: "chips" },
          (group.items || []).map(function (item) {
            return el("li", { text: item });
          })
        ),
      ])
    );
  });

  // ---------- Projects + filters ----------
  var projects = data.projects || [];
  var projectGrid = target("projects");
  var cards = projects.map(function (p) {
    var card = el("article", { className: "project", "data-category": p.category || "" }, [
      el("div", { className: "project-meta" }, [
        el("span", { className: "project-cat", text: p.category || "" }),
        p.context || p.year
          ? el("span", { className: "project-year", text: [p.context, p.year].filter(Boolean).join(" · ") })
          : null,
      ]),
      el("h3", { text: p.title }),
      p.summary ? el("p", { className: "project-summary", text: p.summary }) : null,
      p.points && p.points.length
        ? el(
            "ul",
            { className: "points" },
            p.points.map(function (pt) {
              return el("li", { text: pt });
            })
          )
        : null,
      el("div", { className: "project-foot" }, [
        el(
          "ul",
          { className: "tags", "aria-label": "Tools used" },
          (p.tags || []).map(function (t) {
            return el("li", { text: t });
          })
        ),
        p.links && p.links.length
          ? el(
              "div",
              { className: "project-links" },
              p.links.map(function (l) {
                return el("a", {
                  href: l.url,
                  target: "_blank",
                  rel: "noopener",
                  text: l.label + " ↗",
                  "aria-label": l.label + ": " + p.title + " (opens in a new tab)",
                });
              })
            )
          : null,
      ]),
    ]);
    projectGrid.appendChild(card);
    return card;
  });

  var filters = target("filters");
  var categories = [];
  projects.forEach(function (p) {
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
          ? projects.length
          : projects.filter(function (p) {
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

  // ---------- Experience (grouped by company) ----------
  var experience = target("experience");
  (data.experience || []).forEach(function (job) {
    experience.appendChild(
      el("li", { className: "job" }, [
        el("div", { className: "job-head" }, [
          el("h3", { text: job.org }),
          el("p", { className: "job-meta", text: [job.place, job.period].filter(Boolean).join(" · ") }),
        ]),
        el(
          "ol",
          { className: "roles" },
          (job.roles || []).map(function (role) {
            var current = /present/i.test(role.period || "");
            return el("li", { className: "role" + (current ? " is-current" : "") }, [
              el("h4", { text: role.title }),
              role.period ? el("p", { className: "role-period", text: role.period }) : null,
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
          })
        ),
      ])
    );
  });

  // ---------- GitHub activity (contribution graph) ----------
  var activity = data.activity;
  var activityBox = target("activity");
  if (activity && activity.years && activity.years.length) {
    renderActivity(activity, activityBox);
  } else {
    document.getElementById("activity").hidden = true;
  }

  function renderActivity(info, box) {
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var LEVEL_NAMES = ["no contributions", "low activity", "medium activity", "high activity", "very high activity"];
    // Fixed pixel sizes (like GitHub) so labels stay readable and the legend matches the cells.
    var CELL = 12;
    var PITCH = 15;
    var TOP = 20;
    var DAY_COL = 32;
    var HEIGHT = TOP + 7 * PITCH;

    var note = target("activity-note");
    if (info.note) note.textContent = info.note;
    else note.hidden = true;

    var years = info.years;
    var grandTotal = years.reduce(function (sum, y) { return sum + (y.total || 0); }, 0);
    var totalLabel = info.totalLabel || "contributions";

    var tabs = el("div", { className: "activity-tabs", role: "group", "aria-label": "Choose a year" });
    var yearTotal = el("p", { className: "activity-year" });
    var scroller = el("div", { className: "heatmap-scroll" });

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

    box.appendChild(
      el("div", { className: "activity-card" }, [
        el("div", { className: "activity-top" }, [
          el("p", { className: "activity-total" }, [
            el("span", { className: "stat-value", text: String(grandTotal) }),
            el("span", { className: "stat-label", text: totalLabel }),
          ]),
          tabs,
        ]),
        yearTotal,
        el("div", { className: "heatmap-wrap" }, [dayLabels, scroller]),
        el("div", { className: "heatmap-legend", "aria-hidden": "true" }, [
          el("span", { text: "Less" }),
        ].concat([0, 1, 2, 3, 4].map(function (l) {
          return el("i", { className: "lvl-" + l });
        })).concat([el("span", { text: "More" })])),
      ])
    );

    if (info.highlights && info.highlights.length) {
      box.appendChild(
        el("ul", { className: "activity-highlights" }, info.highlights.map(function (h) {
          return el("li", null, [
            el("span", { className: "role-period", text: h.period }),
            el("p", { text: h.text }),
          ]);
        }))
      );
    }

    var latestX = 0;

    // On narrow screens the graph scrolls sideways; keep the latest activity in view.
    function scrollToLatest() {
      scroller.scrollLeft = Math.max(0, latestX - scroller.clientWidth);
    }

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
      var lastLabelCol = -9;
      for (var m = 0; m < 12; m++) {
        var dayIndex = Math.round((Date.UTC(y.year, m, 1) - jan1) / 86400000);
        if (dayIndex >= levels.length) break;
        var col = m === 0 ? 0 : Math.ceil((lead + dayIndex) / 7);
        if (col >= weeks || col - lastLabelCol < 3) continue;
        var label = svg("text", { x: col * PITCH, y: 11, class: "heatmap-label" });
        label.textContent = MONTHS[m];
        svgEl.appendChild(label);
        lastLabelCol = col;
      }

      for (var i = 0; i < levels.length; i++) {
        var level = Math.max(0, Math.min(4, parseInt(levels.charAt(i), 10) || 0));
        var slot = lead + i;
        var date = new Date(jan1.getTime() + i * 86400000);
        var rect = svg("rect", {
          x: Math.floor(slot / 7) * PITCH,
          y: TOP + (slot % 7) * PITCH,
          width: CELL,
          height: CELL,
          rx: 2,
          class: "lvl-" + level,
        });
        var title = svg("title", {});
        title.textContent =
          DAYS[date.getUTCDay()] + " " + date.getUTCDate() + " " + MONTHS[date.getUTCMonth()] + " " + y.year +
          ": " + LEVEL_NAMES[level];
        rect.appendChild(title);
        svgEl.appendChild(rect);
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

  // ---------- Education & certifications ----------

  var education = target("education");
  (data.education || []).forEach(function (item) {
    education.appendChild(
      el("li", null, [
        el("span", { className: "tl-period", text: item.period }),
        el("h4", { text: item.title }),
        el("p", { className: "tl-org", text: item.org }),
        item.detail ? el("p", { className: "tl-detail", text: item.detail }) : null,
        item.credential ? el("span", { className: "tl-credential", text: item.credential }) : null,
      ])
    );
  });

  var certs = target("certifications");
  (data.certifications || []).forEach(function (c) {
    var meta = [c.org, c.year].filter(Boolean).join(" · ");
    certs.appendChild(
      el("li", null, [
        el("span", { className: "cert-title", text: c.title }),
        meta ? el("span", { className: "cert-meta", text: meta }) : null,
        c.credential ? el("span", { className: "tl-credential", text: "Credential " + c.credential }) : null,
      ])
    );
  });
  if (!certs.children.length) certs.parentNode.hidden = true;
  if (!education.children.length) education.parentNode.hidden = true;

  // ---------- Header: mobile menu, scroll state, active link ----------
  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("nav-menu");

  function setMenu(open) {
    navMenu.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  }
  navToggle.addEventListener("click", function () {
    setMenu(!navMenu.classList.contains("is-open"));
  });
  navMenu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window) {
    var navLinks = {};
    each('.nav-menu a[href^="#"]', function (a) {
      navLinks[a.getAttribute("href").slice(1)] = a;
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = navLinks[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            Object.keys(navLinks).forEach(function (id) {
              navLinks[id].classList.remove("is-active");
            });
            link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(navLinks).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
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

  // ---------- Hero: a small live k-means demo ----------
  var plot = document.querySelector(".plot");
  if (plot) initKMeans(plot);

  function initKMeans(svgEl) {
    var W = 400;
    var H = 280;
    var PAD = 22;
    var K = 3;
    var gridLayer = svgEl.querySelector(".plot-grid");
    var pointLayer = svgEl.querySelector(".plot-points");
    var centroidLayer = svgEl.querySelector(".plot-centroids");
    var status = document.querySelector(".plot-status");
    var runBtn = document.querySelector(".plot-run");
    var runId = 0;

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

    function makeData() {
      var centers = [];
      var guard = 0;
      while (centers.length < K && guard++ < 500) {
        var c = { x: 70 + Math.random() * (W - 140), y: 60 + Math.random() * (H - 120) };
        var farEnough = centers.every(function (o) {
          return Math.hypot(o.x - c.x, o.y - c.y) > 130;
        });
        if (farEnough) centers.push(c);
      }
      var pts = [];
      centers.forEach(function (c) {
        for (var i = 0; i < 30; i++) {
          pts.push({
            x: clamp(c.x + gaussian() * 30, PAD, W - PAD),
            y: clamp(c.y + gaussian() * 26, PAD, H - PAD),
          });
        }
      });
      return pts;
    }

    function nearest(p, cents) {
      var best = 0;
      var bestD = Infinity;
      cents.forEach(function (c, i) {
        var d = (p.x - c.x) * (p.x - c.x) + (p.y - c.y) * (p.y - c.y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    }

    // Run k-means to completion and record every step so it can be replayed.
    function solve(pts) {
      var shuffled = pts.slice().sort(function () {
        return Math.random() - 0.5;
      });
      var cents = shuffled.slice(0, K).map(function (p) {
        return { x: p.x, y: p.y };
      });
      var steps = [{ cents: cents, labels: null }];
      var labels = null;
      for (var iter = 0; iter < 12; iter++) {
        var next = pts.map(function (p) {
          return nearest(p, cents);
        });
        var changed = !labels || next.some(function (l, i) {
          return l !== labels[i];
        });
        labels = next;
        if (!changed) break;
        cents = cents.map(function (c, k) {
          var members = pts.filter(function (_, i) {
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

    function place(g, c) {
      g.style.transform = "translate(" + c.x.toFixed(1) + "px, " + c.y.toFixed(1) + "px)";
    }

    function run() {
      var id = ++runId;
      var pts = makeData();
      var steps = solve(pts);

      pointLayer.textContent = "";
      centroidLayer.textContent = "";
      var circles = pts.map(function (p) {
        var c = svg("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 4.2, "fill-opacity": 0.85 });
        pointLayer.appendChild(c);
        return c;
      });
      var markers = steps[0].cents.map(function (c, k) {
        var g = svg("g", { "data-k": k });
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
      }

      if (reduceMotion) {
        show(steps[steps.length - 1], steps.length - 1);
        return;
      }

      status.textContent = "iteration 0";
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
        setTimeout(tick, 900);
      }
      setTimeout(tick, 900);
    }

    runBtn.addEventListener("click", run);
    run();
  }
})();
