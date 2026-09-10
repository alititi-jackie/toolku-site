(()=>{
  const $=id=>document.getElementById(id);
  function checkedDocs(){return [...document.querySelectorAll('#docs input:checked')]}
  window.checkDmvDocs=()=>{
    const type=$('docType').value;
    const ssn=$('ssn').value;
    const citizen=$('citizen').value;
    const docs=checkedDocs();
    const points=docs.reduce((sum,x)=>sum+Number(x.dataset.points||0),0);
    const residences=docs.filter(x=>x.dataset.res==='1').length;
    const hasBirth=docs.some(x=>x.dataset.birth==='1');
    const hasLawful=docs.some(x=>x.dataset.lawful==='1');
    const hasCitizen=docs.some(x=>x.dataset.citizen==='1');
    const needResidence=type==='standard'?1:2;
    const missing=[];
    if(points<6)missing.push('身份证明积分目前约 '+points+' 分，建议继续准备可计分文件');
    if(residences<needResidence)missing.push('纽约地址证明目前 '+residences+' 份，建议至少准备 '+needResidence+' 份');
    if(!hasBirth)missing.push('缺少常见的出生日期证明');
    if(type!=='standard'&&!hasLawful)missing.push('REAL ID / Enhanced 通常需要合法身份相关证明');
    if(type!=='standard'&&ssn==='yes-no-card')missing.push('有 SSN 但没有带证明文件');
    if(type==='enhanced'&&(citizen!=='yes'||!hasCitizen))missing.push('Enhanced 通常仅限美国公民，并需要公民身份证明');
    const box=$('dmvResult');
    const ok=missing.length===0;
    box.className='dmv-result '+(ok?'dmv-ok':'dmv-warn');
    box.innerHTML='<h3>'+(ok?'常见核心项目看起来已经准备齐':'仍有项目需要确认')+'</h3>'+
      '<p><strong>当前估算：</strong>'+points+' Points，'+residences+' 份纽约地址证明。</p>'+
      (missing.length?'<ul class="dmv-list">'+missing.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'<p>去 DMV 前仍请使用官方 Document Guide 核对原件、日期和姓名要求。</p>');
    box.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  window.resetDmvDocs=()=>{
    $('docType').selectedIndex=0;$('purpose').selectedIndex=0;$('ssn').selectedIndex=0;$('citizen').selectedIndex=0;
    checkedDocs().forEach(x=>x.checked=false);
    const box=$('dmvResult');box.className='';box.replaceChildren();
  };
})();
