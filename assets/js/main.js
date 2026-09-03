/* ==========================================================================
   Slow Linen Organic - shared behaviour
   Vanilla JS, no dependencies, no build step.

   Modules
     01  progressive-enhancement flag
     02  header scroll state
     03  mobile navigation + dropdown menus
     04  scroll reveal (IntersectionObserver, reduced-motion aware)
     05  back to top
     06  accordions
     07  product filtering (Shop All + category pages)
     08  product gallery + size picker
     09  stockist search
     10  form validation with inline errors
     11  cookie consent (nothing non-essential fires before opt-in)
     12  current year stamp
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* -- 01  progressive enhancement flag ---------------------------------- */
  document.documentElement.classList.add("js");

  document.addEventListener("DOMContentLoaded", function () {

    /* -- 02  header scroll state ---------------------------------------- */
    var header = $(".site-header");
    if (header && !header.classList.contains("is-static")) {
      var ticking = false;
      var syncHeader = function () {
        header.classList.toggle("is-solid", window.pageYOffset > 24);
        ticking = false;
      };
      // rAF-throttled: the listener never does layout work directly.
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(syncHeader); }
      }, { passive: true });
      syncHeader();
    }

    /* -- 03  mobile navigation + dropdowns ------------------------------- */
    var navToggle = $(".nav-toggle");
    var nav = $("#site-nav");

    if (navToggle && nav) {
      navToggle.addEventListener("click", function () {
        var open = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", String(!open));
        nav.classList.toggle("is-open", !open);
        document.body.style.overflow = !open && window.innerWidth < 1024 ? "hidden" : "";
      });
    }

    var closeAllMenus = function (except) {
      $$(".has-menu > button").forEach(function (btn) {
        if (btn === except) { return; }
        btn.setAttribute("aria-expanded", "false");
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (panel) { panel.classList.remove("is-open"); }
      });
    };

    $$(".has-menu > button").forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) { return; }
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = btn.getAttribute("aria-expanded") === "true";
        closeAllMenus(btn);
        btn.setAttribute("aria-expanded", String(!open));
        panel.classList.toggle("is-open", !open);
      });
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".has-menu")) { closeAllMenus(); }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") { return; }
      closeAllMenus();
      if (nav && nav.classList.contains("is-open") && navToggle) {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        navToggle.focus();
      }
      var openModal = $(".modal.is-open");
      if (openModal) { closeModal(openModal); }
    });

    /* -- 04  scroll reveal ----------------------------------------------- */
    var revealTargets = $$(".reveal, .reveal-img");
    if (revealTargets.length) {
      if (reduceMotion.matches || !("IntersectionObserver" in window)) {
        revealTargets.forEach(function (el) { el.classList.add("is-in"); });
      } else {
        var io = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) { return; }
            var el = entry.target;
            var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
            window.setTimeout(function () { el.classList.add("is-in"); }, delay);
            obs.unobserve(el);
          });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
        revealTargets.forEach(function (el) { io.observe(el); });
      }
    }

    /* -- 05  back to top -------------------------------------------------- */
    var toTop = $(".to-top");
    if (toTop) {
      var topTick = false;
      var syncTop = function () {
        toTop.classList.toggle("is-visible", window.pageYOffset > 700);
        topTick = false;
      };
      window.addEventListener("scroll", function () {
        if (!topTick) { topTick = true; window.requestAnimationFrame(syncTop); }
      }, { passive: true });
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
        var skip = $(".skip-link");
        if (skip) { skip.focus(); }
      });
    }

    /* -- 06  accordions --------------------------------------------------- */
    $$(".accordion__btn").forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) { return; }
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        panel.classList.toggle("is-open", !open);
      });
    });

    /* -- 07  product filtering -------------------------------------------- */
    var shop = $("[data-shop]");
    if (shop) {
      var products = $$(".product", shop);
      var status = $("[data-shop-status]");
      var empty = $("[data-shop-empty]");
      var sortSelect = $("[data-shop-sort]");
      var listHost = $("[data-shop-list]");
      var state = { category: "all", size: "all", price: "all", fabric: "all" };

      var matches = function (el) {
        var cat = el.getAttribute("data-category") || "";
        var sizes = (el.getAttribute("data-sizes") || "").split(" ");
        var price = parseFloat(el.getAttribute("data-price") || "0");
        var fabric = el.getAttribute("data-fabric") || "";
        if (state.category !== "all" && cat !== state.category) { return false; }
        if (state.size !== "all" && sizes.indexOf(state.size) === -1) { return false; }
        if (state.fabric !== "all" && fabric !== state.fabric) { return false; }
        if (state.price === "under-100" && price >= 100) { return false; }
        if (state.price === "100-200" && (price < 100 || price > 200)) { return false; }
        if (state.price === "over-200" && price <= 200) { return false; }
        return true;
      };

      var applyFilters = function () {
        var shown = 0;
        products.forEach(function (el) {
          var ok = matches(el);
          el.classList.toggle("is-hidden", !ok);
          if (ok) { shown += 1; }
        });
        if (status) {
          status.textContent = shown === products.length
            ? "Showing all " + products.length + " pieces."
            : "Showing " + shown + " of " + products.length + " pieces.";
        }
        if (empty) { empty.hidden = shown !== 0; }
      };

      $$("[data-filter]", shop).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var group = btn.getAttribute("data-filter");
          var value = btn.getAttribute("data-value");
          state[group] = value;
          $$('[data-filter="' + group + '"]', shop).forEach(function (sibling) {
            sibling.setAttribute("aria-pressed", String(sibling === btn));
          });
          applyFilters();
        });
      });

      var reset = $("[data-shop-reset]");
      if (reset) {
        reset.addEventListener("click", function () {
          state = { category: "all", size: "all", price: "all", fabric: "all" };
          $$("[data-filter]", shop).forEach(function (btn) {
            btn.setAttribute("aria-pressed", String(btn.getAttribute("data-value") === "all"));
          });
          if (sortSelect) { sortSelect.value = "featured"; }
          if (listHost) { sortProducts("featured", listHost, products); }
          applyFilters();
        });
      }

      var sortProducts = function (mode, host, items) {
        var sorted = items.slice();
        if (mode === "price-asc") {
          sorted.sort(function (a, b) { return num(a, "data-price") - num(b, "data-price"); });
        } else if (mode === "price-desc") {
          sorted.sort(function (a, b) { return num(b, "data-price") - num(a, "data-price"); });
        } else if (mode === "name") {
          sorted.sort(function (a, b) {
            return (a.getAttribute("data-name") || "").localeCompare(b.getAttribute("data-name") || "");
          });
        } else {
          sorted.sort(function (a, b) { return num(a, "data-order") - num(b, "data-order"); });
        }
        sorted.forEach(function (el) { host.appendChild(el); });
      };

      var num = function (el, attr) { return parseFloat(el.getAttribute(attr) || "0"); };

      if (sortSelect && listHost) {
        sortSelect.addEventListener("change", function () {
          sortProducts(sortSelect.value, listHost, products);
        });
      }

      applyFilters();
    }

    /* -- 08  product gallery + size picker -------------------------------- */
    var gallery = $("[data-gallery]");
    if (gallery) {
      var mainImg = $("[data-gallery-main]", gallery);
      $$("[data-gallery-thumb]", gallery).forEach(function (thumb) {
        thumb.addEventListener("click", function () {
          var full = thumb.getAttribute("data-full");
          var alt = thumb.getAttribute("data-alt");
          if (mainImg && full) {
            mainImg.src = full;
            if (alt) { mainImg.alt = alt; }
          }
          $$("[data-gallery-thumb]", gallery).forEach(function (t) {
            t.setAttribute("aria-pressed", String(t === thumb));
          });
        });
      });
    }

    $$("[data-size-picker]").forEach(function (group) {
      var out = document.getElementById(group.getAttribute("data-size-output"));
      $$("button", group).forEach(function (btn) {
        btn.addEventListener("click", function () {
          $$("button", group).forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === btn));
          });
          if (out) {
            out.textContent = "Selected size: " + btn.textContent.trim() +
              ". Add to bag is disabled in this demonstration storefront.";
          }
        });
      });
    });

    /* -- 09  stockist search ---------------------------------------------- */
    var stockistInput = $("[data-stockist-search]");
    if (stockistInput) {
      var rows = $$("[data-stockist]");
      var stockistStatus = $("[data-stockist-status]");
      stockistInput.addEventListener("input", function () {
        var q = stockistInput.value.trim().toLowerCase();
        var shown = 0;
        rows.forEach(function (row) {
          var hay = (row.getAttribute("data-stockist") || "").toLowerCase();
          var ok = q === "" || hay.indexOf(q) !== -1;
          row.classList.toggle("is-hidden", !ok);
          if (ok) { shown += 1; }
        });
        if (stockistStatus) {
          stockistStatus.textContent = shown === 0
            ? "No stockists match that search. Try a state name or a two-letter state code."
            : "Showing " + shown + " of " + rows.length + " stockists.";
        }
      });
    }

    /* -- 10  form validation ---------------------------------------------- */
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    var showError = function (field, message) {
      field.classList.add("has-error");
      var err = $(".error", field);
      var input = $("input, select, textarea", field);
      if (err) { err.textContent = message; }
      if (input) { input.setAttribute("aria-invalid", "true"); }
    };

    var clearError = function (field) {
      field.classList.remove("has-error");
      var input = $("input, select, textarea", field);
      if (input) { input.removeAttribute("aria-invalid"); }
    };

    var validateField = function (field) {
      var input = $("input, select, textarea", field);
      if (!input) { return true; }
      var value = (input.value || "").trim();
      var label = field.getAttribute("data-label") || "This field";

      if (input.hasAttribute("required")) {
        if (input.type === "checkbox" && !input.checked) {
          showError(field, "Please tick this box to continue.");
          return false;
        }
        if (input.type !== "checkbox" && value === "") {
          showError(field, label + " is required.");
          return false;
        }
      }
      if (value !== "" && input.type === "email" && !emailRe.test(value)) {
        showError(field, "Enter a valid email address, for example name@example.com.");
        return false;
      }
      if (value !== "" && input.type === "tel" && value.replace(/[^0-9]/g, "").length < 10) {
        showError(field, "Enter a 10-digit US phone number, including area code.");
        return false;
      }
      if (input.tagName === "TEXTAREA" && input.hasAttribute("minlength")) {
        var min = parseInt(input.getAttribute("minlength"), 10);
        if (value.length > 0 && value.length < min) {
          showError(field, "Please write at least " + min + " characters so we can help properly.");
          return false;
        }
      }
      clearError(field);
      return true;
    };

    $$("form[data-validate]").forEach(function (form) {
      var fields = $$(".field", form);

      fields.forEach(function (field) {
        var input = $("input, select, textarea", field);
        if (!input) { return; }
        input.addEventListener("blur", function () { validateField(field); });
        input.addEventListener("input", function () {
          if (field.classList.contains("has-error")) { validateField(field); }
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        var firstBad = null;
        fields.forEach(function (field) {
          if (!validateField(field)) {
            ok = false;
            if (!firstBad) { firstBad = field; }
          }
        });

        var status = $(".form-status", form);
        if (!ok) {
          if (status) {
            status.className = "form-status form-status--bad is-visible";
            status.textContent = "Please correct the highlighted fields and send again.";
          }
          if (firstBad) {
            var badInput = $("input, select, textarea", firstBad);
            if (badInput) { badInput.focus(); }
          }
          return;
        }

        if (status) {
          status.className = "form-status form-status--ok is-visible";
          status.textContent = form.getAttribute("data-success") ||
            "Thank you. Your message has been queued and a person will reply within one business day.";
        }
        form.reset();
        fields.forEach(clearError);
      });
    });

    /* -- 11  cookie consent ------------------------------------------------
       Storage key holds an explicit record of the user's choice. No analytics
       or advertising script is loaded anywhere on this site until the visitor
       opts in here, so nothing non-essential is set before consent.          */
    var CONSENT_KEY = "slo-consent-v1";
    var banner = $(".cookie-banner");
    var prefsModal = $("#cookie-prefs");

    var readConsent = function () {
      try { return JSON.parse(window.localStorage.getItem(CONSENT_KEY) || "null"); }
      catch (err) { return null; }
    };

    var writeConsent = function (value) {
      try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); }
      catch (err) { /* storage blocked; the site still works, nothing is set */ }
    };

    var applyConsent = function (value) {
      // Placeholder integration point. Analytics and advertising tags are
      // attached here only when the matching flag is true.
      window.sloConsent = value;
      document.dispatchEvent(new CustomEvent("slo:consent", { detail: value }));
    };

    var hideBanner = function () { if (banner) { banner.classList.remove("is-visible"); } };

    function openModal(modal) {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      var focusable = $("input, button", modal);
      if (focusable) { focusable.focus(); }
      document.body.style.overflow = "hidden";
    }

    function closeModal(modal) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    if (banner) {
      var existing = readConsent();
      if (!existing) {
        // Delayed so it never blocks the first paint or the content on entry.
        window.setTimeout(function () { banner.classList.add("is-visible"); }, 900);
      } else {
        applyConsent(existing);
      }

      var acceptBtn = $("[data-consent-accept]");
      var rejectBtn = $("[data-consent-reject]");
      var manageBtn = $("[data-consent-manage]");

      if (acceptBtn) {
        acceptBtn.addEventListener("click", function () {
          var value = { essential: true, analytics: true, advertising: true, at: new Date().toISOString() };
          writeConsent(value); applyConsent(value); hideBanner();
        });
      }
      if (rejectBtn) {
        rejectBtn.addEventListener("click", function () {
          var value = { essential: true, analytics: false, advertising: false, at: new Date().toISOString() };
          writeConsent(value); applyConsent(value); hideBanner();
        });
      }
      if (manageBtn && prefsModal) {
        manageBtn.addEventListener("click", function () { openModal(prefsModal); });
      }
    }

    if (prefsModal) {
      var saved = readConsent();
      var analyticsBox = $("#pref-analytics");
      var adsBox = $("#pref-advertising");
      if (saved) {
        if (analyticsBox) { analyticsBox.checked = !!saved.analytics; }
        if (adsBox) { adsBox.checked = !!saved.advertising; }
      }

      $$("[data-consent-save]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var value = {
            essential: true,
            analytics: !!(analyticsBox && analyticsBox.checked),
            advertising: !!(adsBox && adsBox.checked),
            at: new Date().toISOString()
          };
          writeConsent(value); applyConsent(value); hideBanner(); closeModal(prefsModal);
        });
      });

      $$("[data-modal-close]").forEach(function (btn) {
        btn.addEventListener("click", function () { closeModal(prefsModal); });
      });

      prefsModal.addEventListener("click", function (e) {
        if (e.target === prefsModal) { closeModal(prefsModal); }
      });
    }

    // Any footer or in-page link can reopen the preference centre.
    $$("[data-open-prefs]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (!prefsModal) { return; }
        e.preventDefault();
        openModal(prefsModal);
      });
    });

    /* -- 12  current year -------------------------------------------------- */
    $$("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  });
})();
