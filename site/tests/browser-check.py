from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import os

base=os.environ.get('PREVIEW_URL','http://127.0.0.1:4177/dist/')
root=Path(__file__).resolve().parents[1]
errors=[]
results=[]
clock_script="""(()=>{
 const NativeDate=Date;let now=NativeDate.parse('2026-11-11T04:00:00Z');
 globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
 window.setTestClock=(iso)=>{now=NativeDate.parse(iso);};
})()"""

with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    context=browser.new_context(viewport={'width':1100,'height':720},timezone_id='America/Los_Angeles')
    context.add_init_script(clock_script)
    page=context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.goto(base,wait_until='networkidle')
    page.wait_for_function('window.ready',timeout=45000)
    assert page.evaluate('window.dayNightState.clock')=='12:00'
    assert page.evaluate('window.dayNightState.mode')=='live'
    page.wait_for_function('window.motionState.elapsed > 0')
    page.locator('#pause').click()
    page.wait_for_function('window.motionState.paused')
    elapsed=page.evaluate('window.motionState.elapsed')
    page.wait_for_timeout(300)
    assert page.evaluate('window.motionState.elapsed')==elapsed
    results.append('加载独立构建、骑行及暂停通过')

    for iso,label,phase in [('2026-11-11T10:00:00Z','18:00','dusk'),('2026-11-11T14:00:00Z','22:00','night'),('2026-11-11T15:59:59Z','23:59','night'),('2026-11-11T16:00:00Z','00:00','night')]:
        page.evaluate('(iso)=>window.setTestClock(iso)',iso)
        page.wait_for_function('(label)=>window.dayNightState.clock===label',arg=label,timeout=3000)
        assert page.evaluate('window.dayNightState.phase')==phase
        assert page.evaluate('window.motionState.paused')
    assert page.evaluate('window.debug.headlamp.intensity')>0
    results.append('暂停期间真实时钟持续更新，跨傍晚及午夜通过')

    before=page.evaluate('window.debug.camera.position.toArray()')
    page.mouse.move(810,320);page.mouse.down();page.mouse.move(910,340,steps=12);page.mouse.up()
    after=page.evaluate('window.debug.camera.position.toArray()')
    assert sum(abs(a-b) for a,b in zip(before,after))>.2
    page.locator('#reset').click()
    page.wait_for_timeout(200)
    reset=page.evaluate('window.debug.camera.position.toArray()')
    assert sum(abs(a-b) for a,b in zip(reset,[4.2,2.85,7.4]))<.001,reset
    results.append('拖动旋转及快速复位通过')

    for width in [320,390,768,1100]:
        page.set_viewport_size({'width':width,'height':844 if width<680 else 720})
        page.wait_for_timeout(80)
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),width
        for selector in ['.copy','#pause','#reset']:
            box=page.locator(selector).bounding_box()
            assert box['x']>=0 and box['x']+box['width']<=width, (width,selector,box)
    results.append('320/390/768/1100 宽度布局无溢出')

    # 先让所有运动姿态进入视锥，完成 GPU 几何体的延迟上传。
    page.evaluate('()=>{for(let i=0;i<50;i++)window.renderAt(i*108)}')
    geometries=page.evaluate('window.debug.renderer.info.memory.geometries')
    page.evaluate('()=>{for(let i=0;i<50;i++)window.renderAt(i*108)}')
    assert page.evaluate('window.debug.renderer.info.memory.geometries')==geometries
    motions=[]
    for t in [0,450,900,1350]:
        motions.append(page.evaluate('(t)=>{window.renderAt(t);return window.motionState}',t))
    assert all(b['crankAngle']<a['crankAngle'] and b['wheelAngle']<a['wheelAngle'] and b['roadOffset']<a['roadOffset'] for a,b in zip(motions,motions[1:]))
    assert motions[1]['pedalY']<motions[0]['pedalY']
    results.append('脚踏、车轮、路面方向一致，连续渲染没有新增几何体')

    reduced=browser.new_context(viewport={'width':390,'height':844},timezone_id='Asia/Shanghai',reduced_motion='reduce')
    reduced.add_init_script(clock_script)
    mobile=reduced.new_page();mobile.goto(base,wait_until='networkidle');mobile.wait_for_function('window.ready')
    assert mobile.evaluate('window.motionState.paused')
    assert mobile.evaluate('window.motionState.elapsed')==0
    assert mobile.evaluate('window.dayNightState.clock')=='12:00'
    results.append('上海与洛杉矶设备均使用北京时间；减少动态效果默认暂停')
    browser.close()

assert not errors,errors
report={'checks':results,'console_errors':errors}
(root/'docs').mkdir(exist_ok=True)
(root/'docs/browser-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True,indent=2))
