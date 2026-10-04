# v1.80（以使用者的 v1.79 為底）
import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
# 匯出：Markdown → md
rep('<span>Markdown</span>', '<span>md</span>')
# 藏版直書科判：科標選擇
rep('<div class="ex-row"><span class="ex-l">頁碼</span>', '<div class="ex-row zang-only"><span class="ex-l">科標</span><div class="cks"><label class="ck"><input type="radio" name="kpl" id="kplGz"><span>干支</span></label><label class="ck"><input type="radio" name="kpl" id="kplZj"><span>章節</span></label></div></div><div class="ex-row"><span class="ex-l">頁碼</span>')
rep('  // ---- save a file (artifact download channel or a plain link) ----', open('zangkp180.js', encoding='utf-8').read() + '  // ---- save a file (artifact download channel or a plain link) ----')
rep('$("dlAll").onclick = dlAllKepan;', '$("dlAll").onclick = function () { if (EDITION === "zang") zangKpExport(true); else dlAllKepan(); };')
rep('$("dlGo").onclick = doDownload;', '''$("dlGo").onclick = function () { if (EDITION === "zang") zangKpExport(false); else doDownload(); };
    new MutationObserver(function () { if ($("dlPop").hidden) return; if (!$("dlFrom").value) { var j0 = S.view === "t" ? S.juan : S.railJuan, r0 = JRANGE[j0] || [2, 2]; $("dlFrom").value = Math.max(EDITION === "zang" ? 2 : 1, r0[0]); $("dlTo").value = Math.max(EDITION === "zang" ? 2 : 1, r0[1]); }
      $("dlInfo").textContent = EDITION === "zang" ? "藏經科判表第 2 至 " + NPDF + " 頁。預設為本卷所在的頁數。" : "全書共 " + NPDF + " 頁（第 1 頁為封面）。預設為本卷所在的頁數。";
      if (EDITION === "zang" && !$("kplGz").checked && !$("kplZj").checked) { $(LABEL === "zj" ? "kplZj" : "kplGz").checked = true; }
      $("dlPop").querySelectorAll('input[type=radio]').forEach(function (x) { x.dataset.on = x.checked ? "1" : "0"; });
    }).observe($("dlPop"), { attributes: true, attributeFilter: ["hidden"] });
    // 匯出面板：單選項目再點一下即取消
    $("dlPop").addEventListener("click", function (e) { var r = e.target; if (!(r instanceof HTMLInputElement) || r.type !== "radio") return; if (r.dataset.on === "1") { r.checked = false; r.dataset.on = "0"; } else { $("dlPop").querySelectorAll('input[name="' + r.name + '"]').forEach(function (x) { x.dataset.on = "0"; }); r.dataset.on = "1"; } });''')
rep('''    $("dlInfo").textContent = "全書共 " + NPDF + " 頁（第 1 頁為封面）。預設為" + (S.view === "v" ? "目前這一頁" : "本卷所在的頁數") + "。";''',
    '''    $("dlInfo").textContent = EDITION === "zang" ? "藏經科判表第 2 至 " + NPDF + " 頁。預設為本卷所在的頁數。" : "全書共 " + NPDF + " 頁（第 1 頁為封面）。預設為" + (S.view === "v" ? "目前這一頁" : "本卷所在的頁數") + "。";
    if (EDITION === "zang") { if (+$("dlFrom").value < 2) $("dlFrom").value = 2; if (+$("dlTo").value < 2) $("dlTo").value = 2; }
    $("dlPop").querySelectorAll('input[type=radio]').forEach(function (x) { x.dataset.on = x.checked ? "1" : "0"; });''')
# 辭典跟著正文倍率即時調整
rep('function applyZoom() {', 'function applyZoom() { setTimeout(function () { window.dispatchEvent(new Event("reader-zoom")); }, 0);')
rep('    function placePreview(){', "    window.addEventListener('reader-zoom',function(){placePreview();});\n    function placePreview(){")
# 版本
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.80', "藏版匯出新增直書科判表 PDF，可選干支或章節。\n匯出格式 Markdown 改稱 md；單選項目再點一下即可取消。\n電腦版辭典（含外部頁面備援）隨正文放大縮小即時調整。")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
s = s.replace('$(\'versionDoc\').textContent="v1.79\\n最後更新：2026年10月4日\\n\\n"+versionSummaries["1.79"];', '$(\'versionDoc\').textContent="v1.80\\n最後更新：2026年10月4日\\n\\n"+versionSummaries["1.80"];')
s = re.sub(r'<b id="appVer">v1\.79</b>', '<b id="appVer">v1.80</b>', s)
CSS = open('v180.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v180">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok', s.count('1.79'))
