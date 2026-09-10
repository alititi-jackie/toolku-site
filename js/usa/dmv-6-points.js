(function(){
            const docs = [
              {id:'ssn-card', section:'A', name:'Original U.S. Social Security Card 原始社安卡', points:2, res:false, note:'SSN 证明'},
              {id:'ssn-ineligible', section:'A', name:'Social Security Ineligibility Letter 社安号不适用信', points:0, res:false, note:'REAL ID 常见情况，需看官方要求'},
              {id:'ssn-number-only', section:'A', name:'只有 SSN 号码，写在 MV-44 表格上', points:0, res:false, note:'不计分；Enhanced 不可用'},

              {id:'us-passport', section:'B', name:'U.S. Passport or Passport Card 美国护照/护照卡', points:4, res:false, note:'生日/公民身份证明'},
              {id:'naturalization', section:'B', name:'Certificate of Naturalization / Citizenship 入籍纸/公民纸', points:3, res:false, note:'公民身份证明'},
              {id:'us-birth', section:'B', name:'U.S. Birth Certificate 美国出生纸', points:0, res:false, note:'证明生日'},
              {id:'foreign-passport', section:'B', name:'Foreign Passport 外国护照', points:4, res:false, note:'可能需要签证/I-94等合法身份文件'},
              {id:'green-card', section:'B', name:'Unexpired Permanent Resident Card I-551 有效绿卡', points:3, res:false, note:'合法身份'},
              {id:'ead', section:'B', name:'Employment Authorization Card EAD 工卡', points:3, res:false, note:'需符合官方说明'},
              {id:'foreign-dl', section:'B', name:'Foreign Driver License with Photo 外国照片驾照', points:4, res:false, note:'当前或过期不超过2年'},
              {id:'foreign-id', section:'B', name:'Foreign National ID Card with Photo 外国照片身份证', points:3, res:false, note:'常见补充分'},
              {id:'out-state-id', section:'B', name:'外州/加拿大照片驾照、Permit 或 ID', points:4, res:false, note:'当前或过期不超过2年'},

              {id:'ny-dmv-id', section:'C', name:'纽约州 Driver License / Permit / Non-Driver ID', points:6, res:true, note:'当前或过期不超过2年'},
              {id:'mv45', section:'C', name:'MV-45 父母/监护人身份或地址声明（21岁以下）', points:4, res:true, note:'适合21岁以下'},
              {id:'ny-title', section:'C', name:'New York State Certificate of Title 纽约车辆产权证', points:2, res:true, note:'地址证明'},
              {id:'ny-prof-license', section:'C', name:'New York State Professional License 纽约州专业执照', points:2, res:true, note:'地址证明'},
              {id:'school-photo', section:'C', name:'美国高中/大学照片学生证 + 成绩单', points:2, res:true, note:'通常需1年内'},
              {id:'bank', section:'C', name:'Bank Statement 银行账单', points:1, res:true, note:'通常需1年内'},
              {id:'paystub', section:'C', name:'U.S. Computer-Printed Pay Stub 工资单', points:1, res:true, note:'通常需1年内'},
              {id:'utility', section:'C', name:'Utility Bill 水电煤/网络等账单', points:1, res:true, note:'通常需1年内'},
              {id:'w2', section:'C', name:'W-2 税表', points:1, res:true, note:'通常需1年内'},
              {id:'ssa1099', section:'C', name:'Social Security Benefit Statement SSA-1099', points:1, res:true, note:'当年'},
              {id:'credit-card-statement', section:'C', name:'Credit Card Statement 信用卡账单', points:0, res:true, note:'可作地址证明，但不计分'},
              {id:'lease', section:'C', name:'Residential Lease 租约', points:0, res:true, note:'可作地址证明'},
              {id:'insurance', section:'C', name:'Homeowners/Renters Insurance 房屋/租客保险', points:0, res:true, note:'可作地址证明'},
              {id:'postmarked-mail', section:'C', name:'Postmarked Mail 带邮戳邮件', points:0, res:true, note:'可作地址证明'},
              {id:'major-credit-card', section:'C', name:'Valid Major Credit Card 有效信用卡', points:1, res:false, note:'不算地址证明'},
              {id:'atm-card', section:'C', name:'Cash Card / ATM Card 银行卡', points:1, res:false, note:'需签名和预印姓名'},
              {id:'employee-id', section:'C', name:'U.S. Employee ID Card 员工证', points:1, res:false, note:'不算地址证明'},
              {id:'health-card', section:'C', name:'Health Insurance / Prescription Card 医保卡/处方卡', points:1, res:false, note:'不算地址证明'},
              {id:'name-change', section:'C', name:'结婚/离婚/法院改名文件', points:2, res:false, note:'名字不一致时很重要'}
            ];
            function render(section, elId){
              const el=document.getElementById(elId); if(!el) return;
              el.innerHTML = docs.filter(d=>d.section===section).map(d=>`<label class="dmv-doc"><input type="checkbox" data-id="${d.id}"><div class="dmv-doc-main"><div class="dmv-doc-title">${d.name}</div><div class="dmv-doc-meta"><span class="dmv-pill points">${d.points} 分</span><span class="dmv-pill ${d.res?'res':'nores'}">${d.res?'可作地址证明':'非地址证明'}</span><span class="dmv-pill">${d.note}</span></div></div></label>`).join('');
            }
            render('A','sectionA'); render('B','sectionB'); render('C','sectionC');
            const scoreEl=document.getElementById('dmvScore');
            const statusEl=document.getElementById('dmvStatus');
            const progressEl=document.getElementById('dmvProgress');
            const textEl=document.getElementById('dmvResultText');
            const summaryEl=document.getElementById('dmvSummary');
            const credEl=document.getElementById('credentialType');
            const credentialHelpEl=document.getElementById('credentialHelp');
            const credentialHelpText={
              standard: credentialHelpEl ? credentialHelpEl.innerHTML : '',
              realid: '<strong>真实身份驾照 / REAL ID</strong>适合需要用纽约驾照/ID 坐美国国内飞机或进入部分联邦设施的人。通常需要更严格核验身份、SSN、合法身份和地址证明。<br><span class="green">通常需要 2 份纽约州地址证明</span>',
              enhanced: '<strong>增强身份驾照 / Enhanced ID / Enhanced License</strong>除 REAL ID 用途外，还可用于部分陆路或海路边境场景；通常要求美国公民身份并可能有额外费用。<br><span class="green">通常需要 2 份纽约州地址证明</span>'
            };
            function update(){
              const checked=[...document.querySelectorAll('.dmv-doc input:checked')].map(i=>docs.find(d=>d.id===i.dataset.id)).filter(Boolean);
              const score=checked.reduce((s,d)=>s+d.points,0);
              const resCount=checked.filter(d=>d.res).length;
              const hasA=checked.some(d=>d.section==='A');
              const hasB=checked.some(d=>d.section==='B');
              const needRes=credEl.value==='standard'?1:2;
              if(credentialHelpEl) credentialHelpEl.innerHTML=credentialHelpText[credEl.value] || credentialHelpText.standard;
              scoreEl.textContent=score;
              progressEl.style.width=Math.min(100, Math.round(score/6*100))+'%';
              const okScore=score>=6;
              statusEl.className='dmv-status '+(okScore?'ok':'warn');
              statusEl.textContent=okScore?'已够 6 分':'还差 '+Math.max(0,6-score)+' 分';
              const problems=[];
              if(!hasA) problems.push('还没有选择 SSN / 社安号相关证明。');
              if(!hasB) problems.push('还没有选择生日、公民身份或合法身份相关文件。');
              if(resCount<needRes) problems.push('地址证明还差 '+(needRes-resCount)+' 份。');
              if(score<6) problems.push('Proof of Name 积分还差 '+(6-score)+' 分。');
              if(!problems.length) textEl.textContent='初步看起来比较完整：积分已够，地址证明数量也达到当前选择类型的基本要求。去 DMV 前仍建议用官方 Document Guide 再核对一次。';
              else textEl.textContent=problems.join(' ');
              summaryEl.innerHTML = [
                `<div class="dmv-summary-item"><strong>积分：</strong>${score} / 6 分。${okScore?'积分已达到 6 分。':'建议再准备可计分文件。'}</div>`,
                `<div class="dmv-summary-item"><strong>地址证明：</strong>已选 ${resCount} 份；当前证件类型建议至少 ${needRes} 份。</div>`,
                `<div class="dmv-summary-item"><strong>SSN 相关：</strong>${hasA?'已选择相关项目。':'还未选择，去 DMV 前请确认。'}</div>`,
                `<div class="dmv-summary-item"><strong>生日/身份文件：</strong>${hasB?'已选择相关项目。':'还未选择，通常需要至少一项。'}</div>`,
                `<div class="dmv-summary-item"><strong>已选文件：</strong>${checked.length?checked.map(d=>d.name.split(' ')[0]).join('、'):'暂无'}</div>`
              ].join('');
            }
            document.addEventListener('change', e=>{ if(e.target.matches('.dmv-doc input,#credentialType,#ageType')) update(); });
            document.getElementById('resetDmvCalc').addEventListener('click',()=>{document.querySelectorAll('.dmv-doc input').forEach(i=>i.checked=false); update(); window.scrollTo({top:0,behavior:'smooth'});});
            update();
          })();
