from playwright.sync_api import sync_playwright
import json
import os

base=os.environ.get('PREVIEW_URL','http://127.0.0.1:4177/dist/')
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1100,'height':650})
    page.goto(base+'?capture=1&hour=12',wait_until='networkidle')
    page.wait_for_function('window.ready')
    data=[]
    for t in range(0,1800,150):
        state=page.evaluate('''(time)=>{
            window.renderAt(time);
            const {scene,THREE}=window.debug;
            scene.updateMatrixWorld(true);
            return [-1,1].map(side=>{
                const platform=scene.getObjectByName(`pedal-${side}`);
                const shoe=scene.getObjectByName(`shoe-${side}`);
                const axle=scene.getObjectByName(`pedal-axle-${side}`);
                if(!platform||!shoe||!axle)return null;
                const pedalBox=new THREE.Box3().setFromObject(platform);
                const shoeBox=new THREE.Box3().setFromObject(shoe);
                const position=platform.getWorldPosition(new THREE.Vector3());
                const axleEnd=axle.localToWorld(new THREE.Vector3(0,axle.geometry.parameters.height/2,0));
                return {position:position.toArray(),up:new THREE.Vector3(0,1,0).transformDirection(platform.matrixWorld).toArray(),
                    gap:shoeBox.min.y-pedalBox.max.y,
                    overlapX:Math.min(shoeBox.max.x,pedalBox.max.x)-Math.max(shoeBox.min.x,pedalBox.min.x),
                    overlapZ:Math.min(shoeBox.max.z,pedalBox.max.z)-Math.max(shoeBox.min.z,pedalBox.min.z),
                    axleGap:position.distanceTo(axleEnd)};
            });
        }''',t)
        assert all(state),f'完整左右踏板、踏板轴或鞋子缺失：{state}'
        for pedal in state:
            assert abs(pedal['gap'])<.001,pedal
            assert pedal['overlapX']>.15 and pedal['overlapZ']>.15,pedal
            assert abs(pedal['up'][1]-1)<.0001,pedal
            assert pedal['axleGap']<.001,pedal
        assert abs(state[0]['position'][0]+state[1]['position'][0]+.16)<.001
        assert abs(state[0]['position'][1]+state[1]['position'][1]-1.2)<.001
        data.append(state)
    browser.close()
print(json.dumps({'sampled_poses':len(data),'pedals':2,'shoe_contact':'pass','axle_connection':'pass','horizontal_platforms':'pass'}))
