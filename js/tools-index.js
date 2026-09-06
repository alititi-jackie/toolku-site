const T=[['tip-calculator','💵','美国小费计算器','钱 & 工资'],['salary-calculator','💰','美国税前工资估算','钱 & 工资'],['hourly-to-salary','🧮','时薪转年薪','钱 & 工资'],['split-bill','🧾','AA 分账计算器','钱 & 工资'],['sales-tax','🏷️','Sales Tax 计算器','钱 & 工资'],['discount','🛍️','折扣计算器','购物'],['currency','💱','美元人民币换算','钱 & 工资'],['temperature','🌡️','华氏度摄氏度换算','单位换算'],['weight','⚖️','磅公斤换算','单位换算'],['length','📏','英寸厘米换算','单位换算'],['distance','🚗','英里公里换算','单位换算'],['area','🏠','平方英尺平方米换算','单位换算'],['volume','🥛','加仑升换算','单位换算'],['mpg','⛽','MPG油耗换算','汽车'],['gas-cost','⛽','加油成本计算器','汽车'],['car-payment','🚙','汽车月供计算器','汽车'],['mortgage','🏡','房贷月供计算器','房屋'],['china-us-time','🕐','中美时间转换','时间日期'],['age','🎂','年龄计算器','时间日期'],['date-difference','📅','日期差计算器','时间日期'],['shoe-size','👟','中美鞋码转换','尺码'],['mattress-size','🛏️','美国床垫尺寸','尺码'],['psi-bar','🔧','PSI Bar换算','技术'],['hp-kw','⚡','HP kW换算','技术']];
const box=document.getElementById('list');
const input=document.getElementById('q');
function render(q=''){
  const keyword=q.trim().toLowerCase();
  const items=T.filter(x=>(x[2]+' '+x[3]).toLowerCase().includes(keyword));
  box.replaceChildren();
  if(!items.length){
    const empty=document.createElement('p');
    empty.textContent='没有找到工具';
    box.appendChild(empty);
    return;
  }
  const fragment=document.createDocumentFragment();
  items.forEach(x=>{
    const a=document.createElement('a');
    a.href=`/tools/${x[0]}/`;
    const b=document.createElement('b');
    b.textContent=`${x[1]} ${x[2]}`;
    const small=document.createElement('small');
    small.textContent=x[3];
    a.append(b,small);
    fragment.appendChild(a);
  });
  box.appendChild(fragment);
}
const params=new URLSearchParams(window.location.search);
const initialQuery=params.get('q')||'';
input.value=initialQuery;
render(initialQuery);
input.addEventListener('input',e=>{
  const q=e.target.value;
  const url=new URL(window.location.href);
  if(q.trim()) url.searchParams.set('q',q.trim()); else url.searchParams.delete('q');
  history.replaceState(null,'',url.pathname+(url.search?'?'+url.searchParams.toString():'')+url.hash);
  render(q);
});
