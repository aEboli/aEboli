import test from 'node:test';
import assert from 'node:assert/strict';
import {beijingTime,lightingAtHour} from '../daylight.js';

test('UTC 时刻正确转换为北京时间并跨过午夜',()=>{
  assert.equal(beijingTime(new Date('2026-11-11T04:00:00Z')).label,'12:00');
  assert.equal(beijingTime(new Date('2026-11-11T15:59:59Z')).label,'23:59');
  assert.equal(beijingTime(new Date('2026-11-11T16:00:00Z')).hour,0);
});

test('白天没有夜灯，黄昏部分开启，夜晚完全开启',()=>{
  const day=lightingAtHour(12),dusk=lightingAtHour(18),night=lightingAtHour(22);
  assert.equal(day.phase,'day');assert.equal(day.lamp,0);assert.equal(day.stars,0);
  assert.equal(dusk.phase,'dusk');assert.ok(dusk.lamp>0&&dusk.lamp<1);
  assert.equal(night.phase,'night');assert.equal(night.lamp,1);assert.equal(night.stars,1);
  assert.ok(night.key<day.key);
});

test('晨昏边界连续变化，跨午夜没有跳变',()=>{
  for(const boundary of [5,6,7,16,18,19.5,24]){
    const a=lightingAtHour(boundary-.0001),b=lightingAtHour(boundary+.0001);
    for(const key of ['day','stars','lamp','key','ambient'])assert.ok(Math.abs(a[key]-b[key])<.001,`${boundary}: ${key}`);
    assert.equal(a.top,b.top);
  }
  assert.deepEqual(lightingAtHour(24),lightingAtHour(0));
});

test('输入时间归一到同一天',()=>{
  assert.deepEqual(lightingAtHour(-2),lightingAtHour(22));
  assert.deepEqual(lightingAtHour(36),lightingAtHour(12));
});
