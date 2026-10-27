const {chromium}=require('playwright'), assert=require('node:assert/strict'), fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://localhost:8766/',{waitUntil:'networkidle'});
  const init=await page.evaluate(()=>({mode:romanceMode,normal:chapters.filter(c=>c.kind!=='romance_extra').length,A:sourceExtra.lines.length,R:sourceExtraR18.lines.length}));
  assert.deepEqual(init,{mode:'off',normal:19,A:44,R:38});
  assert.equal(await page.locator('#extra-demo').isVisible(),false);
  checks.push('PASS 初期OFF・通常19章保持・全年齢とR18両原稿を読み込み');

  await page.locator('#romance-toggle').click();
  assert.equal(await page.locator('#romance-toggle').innerText(),'♡ 全年齢');
  const povA=await page.evaluate(()=>({mode:romanceMode,lines:chapters[19].lines.length,first:chapters[19].lines[0].text}));
  assert.equal(povA.mode,'allages');assert.equal(povA.lines,44);assert.match(povA.first,/俺の返信/);
  checks.push('PASS 全年齢モードで主人公一人称Ver14を表示');
  await page.locator('#extra-demo').click();await page.locator('#preview').click({position:{x:470,y:270}});
  assert.match(await page.locator('#text').innerText(),/俺の返信/);
  await page.screenshot({path:'test-artifacts/all-ages.png',animations:'disabled'});
  checks.push('PASS 全年齢イベントをADV再生');

  page.once('dialog',d=>d.dismiss());await page.locator('#romance-toggle').click();
  assert.equal(await page.locator('#romance-toggle').innerText(),'♡ 全年齢');
  checks.push('PASS R18確認をキャンセルしたら全年齢を維持');

  page.once('dialog',d=>d.accept());await page.locator('#romance-toggle').click();
  const povR=await page.evaluate(()=>({mode:romanceMode,lines:chapters[19].lines.length,first:chapters[19].lines[0].text,topic:chapters[19].topic}));
  assert.equal(povR.mode,'r18');assert.equal(povR.lines,38);assert.match(povR.first,/奇妙な熱/);assert.match(povR.topic,/ミカの部屋/);
  checks.push('PASS R18でミカ視点の作者原稿が復元される');
  await page.locator('#extra-demo').click();await page.locator('#preview').click({position:{x:470,y:270}});
  assert.match(await page.locator('#text').innerText(),/奇妙な熱/);
  await page.screenshot({path:'test-artifacts/mika-pov.png',animations:'disabled'});
  checks.push('PASS R18イベントもADV再生');
  const join=await page.evaluate(()=>{ci=2;li=chapters[2].lines.length-1;mode='line';advance();let first=ci;ci=19;li=chapters[19].lines.length-1;mode='line';advance();return [first,ci,mode]});
  assert.deepEqual(join,[19,3,'chapter']);checks.push('PASS Scene03→選択版→Scene04に接続');

  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#romance-toggle').innerText(),'♡ R-18');
  checks.push('PASS 再読込後もR18選択を保存');
  await page.locator('#romance-toggle').click();
  assert.equal(await page.locator('#romance-toggle').innerText(),'♡ 追加OFF');
  const direct=await page.evaluate(()=>{ci=2;li=chapters[2].lines.length-1;mode='line';advance();return ci});
  assert.equal(direct,3);checks.push('PASS OFFで元のScene03→Scene04');
  assert.deepEqual(errors,[]);checks.push('PASS ブラウザJS例外なし');
  console.log(checks.join('\n'));
 }catch(e){console.error(e);checks.push('FAILED '+String(e));process.exitCode=1;await page.screenshot({path:'test-artifacts/failure.png'}).catch(()=>{})}
 finally{fs.writeFileSync('test-artifacts/results.txt',checks.join('\n'));await browser.close();}
})();