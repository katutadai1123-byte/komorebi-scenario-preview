const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540}}),errs=[],checks=[];
 page.on('pageerror',e=>errs.push(String(e)));
 try{
  await page.goto('http://localhost:8766/',{waitUntil:'networkidle'});
  const initial=await page.evaluate(()=>({chapters:chapters.filter(c=>c.kind!=='romance_extra').length,extra:window.KM_MIKA_SCENE03_EXTRA.lines.length,enabled:romanceExtraEnabled}));
  assert.equal(initial.chapters,19);assert.equal(initial.extra,44);assert.equal(initial.enabled,false);checks.push('PASS 通常19章維持・Ver14本文ロード・初期OFF');
  await page.locator('#romance-toggle').click();
  assert.equal(await page.locator('#romance-toggle').getAttribute('aria-pressed'),'true');
  await page.locator('#extra-demo').click();
  assert.match(await page.locator('#chapter-title').innerText(),/勝者の夜/);
  await page.locator('#preview').click({position:{x:480,y:280}});
  assert.match(await page.locator('#text').innerText(),/俺の返信/);
  assert.equal(await page.locator('#art-note').isVisible(),false);
  await page.screenshot({path:'test-artifacts/first-person-scene.png',animations:'disabled'});
  checks.push('PASS 主人公一人称の原稿再生・背景エラー表示なし');
  const story=await page.evaluate(()=>window.KM_MIKA_SCENE03_EXTRA.lines.map(l=>l.text).join(''));
  assert(story.includes('俺はまだ、週末が来ることを少しも疑っていなかった。'));
  assert(!story.includes('お気に入りの道具'));checks.push('PASS 旧三人称稿を置換済み');
  const passage=await page.evaluate(()=>{ci=2;li=chapters[2].lines.length-1;mode='line';advance();let a=ci;ci=19;li=chapters[19].lines.length-1;mode='line';advance();return [a,ci]});
  assert.deepEqual(passage,[19,3]);checks.push('PASS Scene03→追加→Scene04接続');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#romance-toggle').getAttribute('aria-pressed'),'true');
  await page.locator('#romance-toggle').click();
  assert.equal(await page.locator('#extra-demo').isVisible(),false);
  const skip=await page.evaluate(()=>{ci=2;li=chapters[2].lines.length-1;mode='line';advance();return ci});
  assert.equal(skip,3);checks.push('PASS 保存・OFFスキップ');
  assert.deepEqual(errs,[]);checks.push('PASS ブラウザ例外なし');
  console.log(checks.join('\\n'));
 }catch(e){console.error(e);checks.push('FAIL '+String(e));process.exitCode=1;await page.screenshot({path:'test-artifacts/error.png'}).catch(()=>{})}
 finally{fs.writeFileSync('test-artifacts/result.txt',checks.join('\\n'));await browser.close();}
})();