from playwright.sync_api import sync_playwright
import json
import os

base=os.environ.get('PREVIEW_URL','http://127.0.0.1:4177/dist/')
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1100,'height':650})
    page.goto(base+'?capture=1&hour=12',wait_until='networkidle')
    page.wait_for_function('window.ready')
    poses=[]
    for t in range(0,5401,150):
        pose=page.evaluate('''(t)=>{
            window.renderAt(t);window.debug.scene.updateMatrixWorld(true);
            const {scene,THREE,rider}=window.debug;
            const point=name=>scene.getObjectByName(name)?.getWorldPosition(new THREE.Vector3());
            const hands=[-1,1].map(side=>{
                const grip=point(`grip-center-${side}`),contact=point(`hand-contact-${side}`),
                    shoulder=point(`shoulder-${side}`),elbow=point(`elbow-${side}`),wrist=point(`wrist-${side}`);
                if(!grip||!contact||!shoulder||!elbow||!wrist)return null;
                return {gap:grip.distanceTo(contact),upper:shoulder.distanceTo(elbow),lower:elbow.distanceTo(wrist),elbow:elbow.toArray(),shoulder:shoulder.toArray()};
            });
            return {hands,rotation:rider.rotation.toArray().slice(0,3)};
        }''',t)
        assert all(pose['hands']),'缺少完整的握把和手臂约束'
        for hand in pose['hands']:
            assert hand['gap']<.0001,hand
            assert abs(hand['upper']-.44)<.001 and abs(hand['lower']-.42)<.001,hand
        poses.append(pose)
    assert max(p['rotation'][0] for p in poses)-min(p['rotation'][0] for p in poses)>.08
    assert max(p['rotation'][2] for p in poses)-min(p['rotation'][2] for p in poses)>.035
    assert max(p['hands'][0]['shoulder'][2] for p in poses)-min(p['hands'][0]['shoulder'][2] for p in poses)>.035
    assert max(abs(a-b) for a,b in zip(poses[0]['rotation'],poses[-1]['rotation']))<1e-8
    for a,b in zip(poses[0]['hands'],poses[-1]['hands']):
        assert max(abs(x-y) for x,y in zip(a['elbow'],b['elbow']))<1e-8
    browser.close()
print(json.dumps({'poses':len(poses),'grip_contact':'pass','limb_lengths':'pass','body_motion':'pass','loop_seam':'pass'}))
