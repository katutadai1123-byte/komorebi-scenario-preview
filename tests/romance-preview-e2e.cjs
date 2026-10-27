const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540}});
 let errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const log=[];
 try{
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#chapter-list button').count(),20);
  assert.equal(await page.locator('#chapter-list button').last().isVisible(),false);
  assert.equal(await page.locator('#romance-toggle').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#extra-demo').isVisible(),false);
  log.push('PASS 初期OFF・通常19章を維持・サンプル非表示');
  await page.screenshot({path:'test-artifacts/preview-extra-off.png',animations:'disabled'});
  await page.locator('#romance-toggle').click();
  assert.equal(await page.locator('#romance-toggle').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#extra-demo').isVisible(),true);
  assert.equal(await page.locator('#chapter-list button').last().getAttribute('hidden'),null); // chapter menu is closed, so isVisible() would be false
  log.push('PASS ONで体験ボタン・追加章が現れる');
  await page.screenshot({path:'test-artifacts/preview-extra-on.png',animations:'disabled'});
  await page.locator('#extra-demo').click();
  assert.equal(await page.locator('#chapter').isVisible(),true);
  assert.match(await page.locator('#chapter-title').innerText(),/追加イベント体験/);
  await page.locator('#preview').click({position:{x:480,y:300}});
  assert.equal(await page.locator('#dialog').isVisible(),true);
  assert.match(await page.locator('#text').innerText(),/採用済みのシナリオではありません/);
  await page.screenshot({path:'test-artifacts/preview-extra-story.png',animations:'disabled'});
  log.push('PASS サンプル章をノベルゲームとして実際に再生');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#romance-toggle').getAttribute('aria-pressed'),'true');
  log.push('PASS ONがリロード後も保持される');
  await page.locator('#extra-demo').click();
  await page.locator('#romance-toggle').click();
  assert.equal(await page.locator('#extra-demo').isVisible(),false);
  assert.equal(await page.locator('#endcard').isVisible(),true);
  log.push('PASS 体験中にOFFでもサンプルを閉じられる');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#romance-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#start').click();
  assert.equal(await page.locator('#chapter').isVisible(),true);
  assert.match(await page.locator('#chapter-title').innerText(),/第1章/);
  await page.locator('#preview').click({position:{x:480,y:300}});
  assert.equal(await page.locator('#dialog').isVisible(),true);
  assert.equal(await page.locator('#chapter-list button').last().isVisible(),false);
  assert.equal(errors.length,0,errors.join('\n'));
  log.push('PASS OFFでも第1章の通常シナリオ再生・JSエラーなし');
  const phone=await browser.newPage({viewport:{width:844,height:390},isMobile:true});
  await phone.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
  assert.equal(await phone.locator('#romance-toggle').isVisible(),true);
  log.push('PASS 横画面スマートフォン相当サイズでボタン表示');
  await phone.close();
  console.log(log.join('\n'));
 }catch(e){console.error(e);log.push('FAILED '+String(e));process.exitCode=1;await page.screenshot({path:'test-artifacts/failure.png'}).catch(()=>{})}
 finally{fs.writeFileSync('test-artifacts/result.txt',log.join('\n'));await browser.close();}
})();
