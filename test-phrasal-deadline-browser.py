"""Isolated Edge regression: Phrasal Sprint timeout wins over delayed timer tick."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parent
BASE="https://adrianxds-ads.github.io/adaptive-phrasal-verbs/?qa=deadline-test"
results=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, channel="msedge")
    for width,height in ((360,740),(412,915)):
        ctx=browser.new_context(viewport={"width":width,"height":height},service_workers="block")
        ctx.add_init_script("localStorage.setItem('adaptive_phrasal_read_first_v1','0')")
        page=ctx.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        def routefn(route):
            u=urlparse(route.request.url)
            f=ROOT/(u.path.split("/")[-1] or "index.html")
            if u.path.startswith("/adaptive-phrasal-verbs/") and f.is_file():
                mime={".js":"application/javascript",".css":"text/css",".json":"application/json",
                      ".html":"text/html",".webmanifest":"application/manifest+json",
                      ".png":"image/png",".svg":"image/svg+xml"}.get(f.suffix,"application/octet-stream")
                route.fulfill(path=str(f),content_type=mime)
            else:route.continue_()
        page.route("**/adaptive-phrasal-verbs/**",routefn)
        page.goto(BASE,wait_until="domcontentloaded",timeout=45000)
        page.locator("#startBtn").click()
        page.wait_for_function("session && current && questionPhase==='answer' && deadline>Date.now() && document.querySelectorAll('#answers button.answer').length===4",timeout=45000)
        expired=page.evaluate("""() => {
            quizFlow.cancel();
            clearInterval(timerHandle);
            const before=session.times.length;
            const correct=current.options.find(o=>o.key===current.correctKey);
            deadline=Date.now()-250;
            answer(correct,false);
            const rec=state.answerHistory.at(-1);
            answer(correct,false);
            return {added:session.times.length-before,correct:rec.ok,elapsed:rec.time,
                    score:session.correct,limit:TIME_LIMIT};
        }""")
        ontime=page.evaluate("""() => {
            quizFlow.cancel();
            session.index++;
            nextQuestion();
            clearInterval(timerHandle);
            const correct=current.options.find(o=>o.key===current.correctKey);
            const before=session.times.length;
            answer(correct,false);
            return {added:session.times.length-before,correct:state.answerHistory.at(-1).ok,
                    elapsed:state.answerHistory.at(-1).time};
        }""")
        results.append({"viewport":f"{width}x{height}","expired":expired,"onTime":ontime,"errors":errors})
        ctx.close()
    browser.close()
print(json.dumps(results))
for r in results:
    x,y=r["expired"],r["onTime"]
    assert x["added"]==1 and x["correct"] is False, "Late input must not score"
    assert x["elapsed"]==x["limit"], "Late input must have full timeout duration"
    assert y["added"]==1 and y["correct"] is True, "On-time correct input must score"
    assert not r["errors"],r["errors"]
print("PASS Phrasal Sprint late answer guard and normal scoring at two viewports")
