# v1.69：導覽重寫（電腦：科判點法、右鍵查辭典；手機：辭典使用）
import sys, json
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
D = [  # 電腦／平板
 {"t":"閱讀導覽","d":"三欄同步：左邊卷次、中間正文、右邊直書科判。捲動正文時，標題上滑到畫面約五分之二處會自動反白，三欄一起跟到同一科。","desk":1},
 {"s":".rail-top","t":"卷目次","d":"點卷號切換卷。下方卷次科判可一直上下滑，會接著看到前後卷。","desk":1},
 {"s":"#rv","t":"卷次科判","d":"點一條標題，正文與直書科判都跳到同一處。","desk":1},
 {"s":"#article","t":"查辭典","d":"用滑鼠拖曳反白詞語，佛學辭典就會出現；在反白處按右鍵也可以。","desk":1,"demo":1},
 {"s":"#panel","t":"直書科判：標題","d":"點一下標題：正文跳到該段。點兩下標題：回到它的上一層並置中；◎開頭的標題點兩下，回到它在母支中的位置。","desk":1},
 {"s":"#panel","t":"直書科判：小字","d":"點標題下方的小字「(分N)」：跳到這一科展開的分支。點兩下右側「別表」的小字：跳到那一科的位置。","desk":1},
 {"s":"#labBadge","t":"科標（藏版）","d":"科判欄左上角的「干支／章節」，點一下切換標號。","desk":1},
 {"s":"#edBadge","t":"版本","d":"點正文右上的「藏版／韓版」，直接切換版本，停在同一段原文。","desk":1},
 {"s":"#menuBtn","t":"功能","d":"三點裡可切換版本、開關註釋、調整字體與介面，也能匯出。","desk":1},
 {"s":"#searchButton","t":"搜尋","d":"點放大鏡，輸入要找的字詞。","desk":1},
 # 手機
 {"t":"閱讀導覽","d":"下方三個分頁：卷次、正文、科判。左上「卷」可開百卷目次。","phone":1},
 {"s":"#article","t":"查辭典 1／3：反白","d":"在正文上長按一個詞，出現反白後，拖動兩端的控制點調整範圍。","phone":1,"demo":1},
 {"s":"#article","t":"查辭典 2／3：查詞","d":"反白處下方會出現小小的「查詞」按鈕（上方是系統的拷貝選單），點它就開啟佛學辭典，視窗在畫面中間。","phone":1},
 {"s":"#article","t":"查辭典 3／3：關閉","d":"點辭典外面或關閉鈕即可回到正文；系統的拷貝選單照常可用，不會互相擋住。","phone":1},
 {"s":".device-tabs","t":"科判分頁","d":"點標題跳到正文；點小字「(分N)」看下一層；點兩下標題回到上一層。左下的 ↑ 一鍵回到頂端。","phone":1},
 {"s":"#menuBtn","t":"功能","d":"三點裡可切換版本、開關註釋、調整字體，也能匯出。","phone":1},
]
i = s.index('var TOUR='); j = s.index('];', i) + 2
s = s[:i] + 'var TOUR=' + json.dumps(D, ensure_ascii=False) + ';' + s[j:]
rep('var TOUR_VER="7";', 'var TOUR_VER="8";')
rep('STEPS = TOUR.filter(function(x){return (!x.desk || deviceLayout!=="iphone") && (!x.ipad || deviceLayout==="ipad");});',
    'STEPS = TOUR.filter(function(x){if(x.s==="#labBadge"&&EDITION!=="zang")return false;return (!x.desk || deviceLayout!=="iphone") && (!x.phone || deviceLayout==="iphone") && (!x.ipad || deviceLayout==="ipad");});')
rep('<b id="appVer">v1.68</b>', '<b id="appVer">v1.69</b>')
i = s.index("$('versionHistory').onclick=null;$('versionDoc').textContent=") + len("$('versionHistory').onclick=null;$('versionDoc').textContent=")
_, end = json.JSONDecoder().raw_decode(s[i:])
s = s[:i] + json.dumps("v1.69\n最後更新：2026年10月4日", ensure_ascii=False) + s[i + end:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
