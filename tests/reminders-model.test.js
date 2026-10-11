const test = require('node:test'), assert = require('node:assert/strict');
const { visibleItems, validateSnapshot } = require('../renderer/reminders-model');
const now = new Date(2026,9,11,12,0);
function item(id, dueDate, extra={}) { return {id,title:'同名',dueDate,isAllDay:true,isOverdue:false,isCompleted:false,listName:'测试',listColor:'#438CFF',canComplete:true,completionBlockedReason:'',revision:'a'.repeat(64),...extra}; }
test('today date-only is not overdue; past is overdue; future/no due/completed excluded', () => {
 const items=visibleItems([item('today','2026-10-11'),item('past','2026-10-10'),item('future','2026-10-12'),item('none',null),item('done','2026-10-11',{isCompleted:true})],now);
 assert.deepEqual(items.map(i=>i.id),['past','today']);assert.equal(items[0].isOverdue,true);assert.equal(items[1].isOverdue,false);
});
test('timed today overdue and future start compare exact instants, duplicate titles retain IDs', () => {
 const a=item('a',new Date(2026,9,11,11).toISOString(),{isAllDay:false}),b=item('b',new Date(2026,9,11,13).toISOString(),{isAllDay:false});
 const items=visibleItems([b,a],now);assert.deepEqual(items.map(i=>[i.id,i.isOverdue]),[['a',true],['b',false]]);
});
test('midnight, cross-year and leap-day views use local calendar days',()=>{
 const items=[item('a','2024-02-29'),item('b','2024-03-01')];
 assert.deepEqual(visibleItems(items,new Date(2024,1,29,23,59)).map(i=>i.id),['a']);
 assert.deepEqual(visibleItems(items,new Date(2024,2,1,0,0)).map(i=>[i.id,i.isOverdue]),[['a',true],['b',false]]);
 assert.equal(visibleItems([item('year','2027-01-01')],new Date(2026,11,31,23,59)).length,0);
});
test('sorting has stable ID tie-breaker and invalid days are excluded',()=>{
 assert.deepEqual(visibleItems([item('b','2026-10-11'),item('a','2026-10-11'),item('invalid','2026-02-30')],now).map(i=>i.id),['a','b']);
});
test('native response validation rejects malformed, duplicate and unauthorized data',()=>{
 const good={authorization:'authorized',items:[item('a','2026-10-11')]};assert.equal(validateSnapshot(good),good);
 for(const bad of [{authorization:'bad',items:[]},{authorization:'denied',items:good.items},{...good,items:[...good.items,...good.items]},{...good,items:[item('a','2026-10-11',{revision:'shell'})]},{...good,items:[item('a','2026-10-11',{listColor:'url(file)'})]}])assert.throws(()=>validateSnapshot(bad));
});
