const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:960,height:540}}),errors=[],checks=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://localhost:8766/',{waitUntil:'networkidle'});
 const init=await page.evaluate(()=>({ordinary:chapters.filter(c=>c.kind!=='romance_extra').length,extra:window.KM_MIKA_SCENE03_EXTRA.lines.length,enabled:romanceExtraEnabled}));
 assert.equal(init.ordinary,19);assert(init.extra>30);assert.equal(init.enabled,false);checks.push('PASS 初期OFF／通常19章／新規原稿ロード');
 await page.screenshot({path:'test-artifacts/off.png'});
 page.once('dialog',d=>d.dismiss());await page.locator('#romance-toggle').click();assert.equal(await page.locator('#romance-toggle').getAttribute('aria-pressed'),'false');checks.push('PASS 18歳以上確認を拒否でOFF維持');
 page.once('dialog',d=>d.accept());await page.locator('#romance-toggle').click();assert.equal(await page.locator('#romance-toggle').getAttribute('aria-pressed'),'true');checks.push('PASS 18歳以上確認でON');
 await page.screenshot({path:'test-artifacts/on.png'});
 await page.locator('#extra-demo').click();assert.match(await page.locator('#chapter-title').innerText(),/勝者の夜/);await page.locator('#preview').click({position:{x:480,y:280}});assert.match(await page.locator('#text').innerText(),/奇妙な熱/);checks.push('PASS ADVで原稿再生');
 await page.screenshot({path:'test-artifacts/scene.png'});
 const bridge=await page.evaluate(()=>{ci=2;li=chapters[2].lines.length-1;mode='line';advance();let a=ci;ci=19;li=chapters[19].lines.length-1;mode='line';advance();return [a,ci]});assert.deepEqual(bridge,[19,3]);checks.push('PASS Scene03→追加→Scene04');
 await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#romance-toggle').getAttribute('aria-pressed'),'true');checks.push('PASS ON設定永続化');
 await page.locator('#romance-toggle').click();const skipped=await page.evaluate(()=>{ci=2;li=chapters[2].lines.length-1;mode='line';advance();return ci});assert.equal(skipped,3);checks.push('PASS OFFで通常Scene04へ');
 assert.deepEqual(errors,[]);checks.push('PASS JavaScriptエラーなし');console.log(checks.join('\n'));
}catch(e){console.error(e);checks.push('FAIL '+e);process.exitCode=1;await page.screenshot({path:'test-artifacts/error.png'}).catch(()=>{});}finally{fs.writeFileSync('test-artifacts/results.txt',checks.join('\n'));await browser.close();}})();