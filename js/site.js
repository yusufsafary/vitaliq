/* VITALIQ shared UI: mobile nav toggle */
(function () {
  "use strict";
  var btn = document.getElementById("navToggle");
  var nav = document.getElementById("mainNav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }
})();
