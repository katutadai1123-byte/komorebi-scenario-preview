const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://localhost:8766/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#start-allages').isVisible(),true);
  assert.equal(await page.locator('#start-r18').isVisible(),true);
  assert.equal(await page.locator('#romance-toggle').count(),0);
  assert.equal(await page.locator('#extra-demo').count(),0);
  const initial=await page.evaluate(()=>({mode:romanceMode,normal:chapters.filter(c=>c.kind!=='romance_extra').length,all:sourceExtra.lines.length,adult:sourceExtraR18.lines.length}));
  assert.deepEqual(initial,{mode:null,normal:19,all:44,adult:38});
  checks.push('PASS 起動画面で全年齢／R-18を選択、追加ON/OFF廃止');
  await page.screenshot({path:'test-artifacts/version-select.png',animations:'disabled'});

  await page.locator('#preview').click({position:{x:120,y:180}}); // タイトルの背景タップは開始しない
  assert.equal(await page.locator('#intro').isVisible(),true);
  await page.keyboard.press('Enter'); // キーボードでもモード選択を迂回しない
  assert.equal(await page.locator('#intro').isVisible(),true);
  checks.push('PASS バージョン未選択で開始できない');

  await page.locator('#start-allages').click();
  assert.match(await page.locator('#chapter-title').innerText(),/第1章/);
  const all=await page.evaluate(()=>({mode:romanceMode,first:chapters[19].lines[0].text,count:chapters[19].lines.length}));
  assert.equal(all.mode,'allages');assert.match(all.first,/俺の返信/);assert.equal(all.count,44);
  checks.push('PASS 全年齢版の開始、主人公視点の原稿選択');
  const allPassage=await page.evaluate(()=>{ci=2;li=chapters[2].lines.length-1;mode='line';advance();const a=ci;ci=19;li=chapters[19].lines.length-1;mode='line';advance();return [a,ci,mode]});
  assert.deepEqual(allPassage,[19,3,'chapter']);
  checks.push('PASS 全年齢：Scene03→主人公視点→Scene04');

  await page.locator('#back').click();
  assert.equal(await page.locator('#intro').isVisible(),true);
  page.once('dialog',dlg=>dlg.dismiss());
  await page.locator('#start-r18').click();
  assert.equal(await page.locator('#intro').isVisible(),true);
  checks.push('PASS R-18年齢確認を拒否するとタイトル維持');

  page.once('dialog',dlg=>dlg.accept());
  await page.locator('#start-r18').click();
  assert.match(await page.locator('#chapter-title').innerText(),/第1章/);
  const adult=await page.evaluate(()=>({mode:romanceMode,first:chapters[19].lines[0].text,count:chapters[19].lines.length,topic:chapters[19].topic}));
  assert.equal(adult.mode,'r18');assert.match(adult.first,/奇妙な熱/);assert.equal(adult.count,38);assert.match(adult.topic,/ミカの部屋/);
  checks.push('PASS R-18版の開始、元のミカ視点原稿復元');

  const r18Passage=await page.evaluate(()=>{ci=2;li=chapters[2].lines.length-1;mode='line';advance();const a=ci;ci=19;li=chapters[19].lines.length-1;mode='line';advance();return [a,ci,mode]});
  assert.deepEqual(r18Passage,[19,3,'chapter']);
  await page.locator('#toc').click();
  assert.equal(await page.locator('#chapter-list button').count(),20);
  assert.match(await page.locator('#chapter-list button').last().innerText(),/R-18・ミカ視点/);
  checks.push('PASS R-18：Scene03→ミカ視点→Scene04、章一覧にも反映');

  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#intro').isVisible(),true);
  assert.equal(await page.locator('#start-allages').isVisible(),true);
  assert.equal(await page.evaluate(()=>romanceMode),null);
  checks.push('PASS 再読込後にも版選択を提示（旧設定の自動継承なし）');
  assert.deepEqual(errors,[]);checks.push('PASS JS例外なし');
  console.log(checks.join('\n'));
 }catch(e){console.error(e);checks.push('FAIL '+String(e));process.exitCode=1;await page.screenshot({path:'test-artifacts/failure.png'}).catch(()=>{})}
 finally{fs.writeFileSync('test-artifacts/results.txt',checks.join('\n'));await browser.close();}
})();