  // ---- 藏版直書科判表 PDF：依畫面排版逐頁轉成 PDF（干支／章節可選） ----
  async function zangKepanPDF(a, b, lab, onStep) {
    await loadPdfLib();
    if (!window.fontkit) await loadScript("data/fontkit.umd.min.js");
    var P = PDFLib, doc = await P.PDFDocument.create(); doc.registerFontkit(window.fontkit);
    var kai = await doc.embedFont(await pdfFont("kai"), { subset: false });
    doc.setTitle("瑜伽師地論藏經科判表（" + (lab === "zj" ? "章節" : "干支") + "）"); doc.setLanguage("zh-TW");
    var W = 595.28, H = 841.89, oldLab = LABEL, host = document.createElement("div");
    host.className = "ksheet"; host.style.cssText = "position:fixed;left:-4000px;top:0;width:210mm;height:297mm;background:#fff;z-index:-1";
    document.body.appendChild(host);
    function rgb(c) { var m = /(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)/.exec(c || ""); return m ? P.rgb(+m[1] / 255, +m[2] / 255, +m[3] / 255) : P.rgb(0, 0, 0); }
    function tw(s, sz) { try { return kai.widthOfTextAtSize(s, sz); } catch (e) { return sz * s.length; } }
    try {
      LABEL = lab;
      for (var p = a; p <= b; p++) {
        host.innerHTML = ""; fillPage(host, p);
        var ks = host.querySelector(".kscale"); if (ks) ks.style.transform = "none";
        var pg = host.querySelector(".page"); if (!pg) continue;
        var R = pg.getBoundingClientRect(), s = W / R.width, page = doc.addPage([W, H]);
        function X(x) { return (x - R.left) * s; } function Y(y) { return H - (y - R.top) * s; }
        // 連接線
        pg.querySelectorAll("svg line").forEach(function (ln) {
          var M = ln.getScreenCTM(); if (!M) return;
          var x1 = +ln.getAttribute("x1"), y1 = +ln.getAttribute("y1"), x2 = +ln.getAttribute("x2"), y2 = +ln.getAttribute("y2");
          page.drawLine({ start: { x: X(M.a * x1 + M.c * y1 + M.e), y: Y(M.b * x1 + M.d * y1 + M.f) }, end: { x: X(M.a * x2 + M.c * y2 + M.e), y: Y(M.b * x2 + M.d * y2 + M.f) }, thickness: 0.8, color: P.rgb(0.12, 0.11, 0.1) });
        });
        // 文字：逐字依畫面位置寫入
        var wk = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT), t, rg = document.createRange();
        while ((t = wk.nextNode())) {
          var el = t.parentElement; if (!el || el.closest("svg")) continue;
          var cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
          var sz = parseFloat(cs.fontSize) * s, col = rgb(cs.color), vert = /vertical/.test(cs.writingMode), str = t.data;
          if (!str.trim()) continue;
          var tcy = el.closest(".tcy");
          if (!vert || tcy) {
            var box = (tcy || el).getBoundingClientRect(), txt = str.trim(), fs = tcy ? Math.min(sz, box.width * s / Math.max(1, txt.length) * 1.7) : sz, w = tw(txt, fs);
            var cx = tcy ? X(box.left + box.width / 2) - w / 2 : X(box.left), cy = Y(box.top + box.height / 2) - fs * 0.36;
            if (!tcy) { rg.selectNodeContents(t); var rb = rg.getBoundingClientRect(); cx = X(rb.left); cy = Y(rb.top + rb.height / 2) - fs * 0.36; }
            page.drawText(txt, { x: cx, y: cy, size: fs, font: kai, color: col });
            continue;
          }
          for (var i = 0; i < str.length; i++) {
            var ch = str[i]; if (/\s/.test(ch)) continue;
            rg.setStart(t, i); rg.setEnd(t, i + 1); var r = rg.getBoundingClientRect(); if (!r.width && !r.height) continue;
            var ccx = X(r.left + r.width / 2), top = Y(r.top), mid = Y(r.top + r.height / 2);
            if (/[\x21-\x7e—―─…～]/.test(ch)) page.drawText(ch, { x: ccx - sz * 0.36, y: top - (r.height * s - tw(ch, sz)) / 2, size: sz, font: kai, color: col, rotate: P.degrees(-90) });
            else page.drawText(ch, { x: ccx - tw(ch, sz) / 2, y: mid - sz * 0.36, size: sz, font: kai, color: col });
          }
        }
        if (onStep) onStep(p - a + 1, b - a + 1);
        await new Promise(function (r) { setTimeout(r, 0); });
      }
    } finally { LABEL = oldLab; host.remove(); }
    return new Blob([await doc.save()], { type: "application/pdf" });
  }
  function zangLab() { return $("kplZj") && $("kplZj").checked ? "zj" : $("kplGz") && $("kplGz").checked ? "gz" : LABEL; }
  async function zangKpExport(all) {
    var msg = $("dlMsg"), a = all ? 2 : Math.max(2, Math.min(NPDF, +$("dlFrom").value || 2)), b = all ? NPDF : Math.max(2, Math.min(NPDF, +$("dlTo").value || a));
    if (b < a) { var t = a; a = b; b = t; }
    var lab = zangLab(), name = "瑜伽師地論藏經科判表（" + (lab === "zj" ? "章節" : "干支") + "）" + (all ? "全本" : "_第" + a + (b > a ? "-" + b : "") + "頁") + ".pdf";
    msg.textContent = "正在產生 PDF…";
    try {
      var blob = await zangKepanPDF(a, b, lab, function (d, n) { msg.textContent = "正在排版 PDF…（" + d + "／" + n + " 頁）"; });
      await saveFile(name, blob); msg.textContent = "已匯出：" + name;
    } catch (err) { msg.textContent = err && err.code === "declined" ? "已取消存檔。" : (/font|script|load/i.test(String(err && err.message)) ? "需要的字型或程式沒有載入，請確認 data 資料夾完整，或連網後再試。" : "產生檔案時出錯：" + (err && err.message || err)); }
  }
