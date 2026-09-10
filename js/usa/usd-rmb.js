function showToast(text){const old=document.querySelector('.toast');if(old)old.remove();const t=document.createElement('div');t.className='toast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.remove(),2400)}
/* 美元人民币汇率记录工具：本地保存 + 导出分享 */
    (function initFxApp(){
      const KEY = 'openaa_usd_rmb_records_v1';
      let deferredInstallPrompt = null;
      const $ = (id) => document.getElementById(id);
      const views = () => Array.from(document.querySelectorAll('#fxApp .fx-view'));
      const money = (n, prefix='') => prefix + (Number(n)||0).toLocaleString('zh-CN',{minimumFractionDigits:2, maximumFractionDigits:2});
      const fixedMoney = (n) => (Number(n)||0).toLocaleString('zh-CN',{minimumFractionDigits:2, maximumFractionDigits:2});
      const fixedRate = (n) => (Number(n)||0).toLocaleString('zh-CN',{minimumFractionDigits:2, maximumFractionDigits:2});
      const num = (v) => Number.parseFloat(v) || 0;
      const today = () => new Date().toISOString().slice(0,10);
      function load(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e){ return []; } }
      function save(rows){ localStorage.setItem(KEY, JSON.stringify(rows)); }
      function calcCny(row){ return +(num(row.usd) * num(row.rate)).toFixed(2); }
      function sorted(){ return load().sort((a,b)=> String(b.date).localeCompare(String(a.date)) || String(b.createdAt||'').localeCompare(String(a.createdAt||''))); }
      function latestMonth(rows){
        const months = Array.from(new Set((rows || sorted()).map(r => String(r.date || '').slice(0,7)).filter(Boolean))).sort().reverse();
        return months[0] || '';
      }
      function summarize(rows){
        const addRows = rows.filter(r => num(r.usd) >= 0);
        const subtractRows = rows.filter(r => num(r.usd) < 0);
        const addUsd = addRows.reduce((s,r)=>s+Math.abs(num(r.usd)),0);
        const subtractUsd = subtractRows.reduce((s,r)=>s+Math.abs(num(r.usd)),0);
        const netUsd = rows.reduce((s,r)=>s+num(r.usd),0);
        const addCny = addRows.reduce((s,r)=>s+Math.abs(calcCny(r)),0);
        const subtractCny = subtractRows.reduce((s,r)=>s+Math.abs(calcCny(r)),0);
        const netCny = rows.reduce((s,r)=>s+calcCny(r),0);
        const totalAbsUsd = addUsd + subtractUsd;
        const totalAbsCny = addCny + subtractCny;
        const rateAvg = totalAbsUsd > 0 ? totalAbsCny / totalAbsUsd : 0;
        const months = new Set(rows.map(r => String(r.date || '').slice(0,7)).filter(Boolean));
        const monthCount = months.size;
        const monthAvgUsd = monthCount ? netUsd / monthCount : 0;
        const monthAvgCny = monthCount ? netCny / monthCount : 0;
        return {
          count: rows.length,
          addUsd, subtractUsd, netUsd,
          addCny, subtractCny, netCny,
          usd: netUsd, cny: netCny,
          rateAvg, monthCount, monthAvgUsd, monthAvgCny
        };
      }
      function signedMoneyText(n, prefix=''){
        const value = Number(n) || 0;
        const sign = value < 0 ? '-' : '';
        return sign + prefix + Math.abs(value).toLocaleString('zh-CN',{minimumFractionDigits:2, maximumFractionDigits:2});
      }
      function hasSubtractSummary(s){
        return Math.abs(Number(s.subtractUsd) || 0) > 0 || Math.abs(Number(s.subtractCny) || 0) > 0;
      }
      function summaryHtml(s, includeMonthlyAverage = true){
        const hasSubtract = hasSubtractSummary(s);
        const items = [];
        if(hasSubtract) {
          items.push(
            ['新增美金总金额', money(s.addUsd, '$'), ''],
            ['减去美金总金额', signedMoneyText(-Math.abs(s.subtractUsd || 0), '$'), 'fx-negative']
          );
        }
        items.push(
          ['美金净金额', signedMoneyText(s.netUsd, '$'), s.netUsd < 0 ? 'fx-negative' : ''],
          ['平均汇率', fixedRate(s.rateAvg), '']
        );
        if(hasSubtract) {
          items.push(
            ['新增人民币总金额', money(s.addCny, '¥'), ''],
            ['减去人民币总金额', signedMoneyText(-Math.abs(s.subtractCny || 0), '¥'), 'fx-negative']
          );
        }
        items.push(
          ['人民币净金额', signedMoneyText(s.netCny, '¥'), s.netCny < 0 ? 'fx-negative' : ''],
          ['记录行数', s.count + ' 行', '']
        );
        if(includeMonthlyAverage) {
          items.push(
            ['有记录月份', (s.monthCount || 0) + ' 个月', ''],
            ['每月平均美金', signedMoneyText(s.monthAvgUsd, '$'), s.monthAvgUsd < 0 ? 'fx-negative' : ''],
            ['每月平均人民币', signedMoneyText(s.monthAvgCny, '¥'), s.monthAvgCny < 0 ? 'fx-negative' : '']
          );
        }
        return items.map(x => '<div class="fx-stat"><span>'+x[0]+'</span><strong class="'+(x[2]||'')+'">'+x[1]+'</strong></div>').join('');
      }
      function empty(text){ return '<div class="fx-empty">'+text+'</div>'; }
      function recordType(row){
        return num(row.usd) < 0 || row.type === 'subtract' ? 'subtract' : 'add';
      }
      function recordTypeLabel(row){
        return recordType(row) === 'subtract' ? '减去' : '新增';
      }
      function recordHtml(r){
        const type = recordType(r);
        const isSub = type === 'subtract';
        const badge = '<span class="fx-type-badge '+(isSub ? 'subtract' : '')+'">'+recordTypeLabel(r)+'</span>';
        const amountClass = isSub ? ' fx-negative' : '';
        return '<div class="fx-record"><div class="fx-record-top"><div class="fx-record-date">'+escapeHtml(r.date)+badge+'</div><div class="fx-record-money'+amountClass+'">'+signedMoneyText(calcCny(r), '¥')+'</div></div><div class="fx-record-meta">美金：<span class="'+(isSub?'fx-negative':'')+'">'+signedMoneyText(num(r.usd), '$')+'</span> ｜ 汇率：'+fixedRate(r.rate)+(r.note?' ｜ '+escapeHtml(r.note):'')+'</div><div class="fx-record-actions"><button class="fx-chip-btn" type="button" data-edit="'+escapeHtml(r.id)+'">编辑</button><button class="fx-chip-btn" type="button" data-delete="'+escapeHtml(r.id)+'">删除</button></div></div>';
      }
      function renderList(containerId, rows, emptyText){
        const box = $(containerId);
        if(!box) return;
        box.innerHTML = rows.length ? rows.map(recordHtml).join('') : empty(emptyText);
      }
      function render(){
        const rows = sorted();
        const allS = summarize(rows);
        if($('homeSummary')) $('homeSummary').innerHTML = summaryHtml(allS);
        if($('allSummary')) $('allSummary').innerHTML = summaryHtml(allS);
        renderList('allList', rows, '暂无记录，请先输入一条数据。');

        let m = $('monthPicker')?.value || '';
        if(!m) {
          m = latestMonth(rows);
          if($('monthPicker')) $('monthPicker').value = m;
        }
        const monthRows = m ? rows.filter(r => String(r.date).slice(0,7) === m) : [];
        if($('monthSummary')) $('monthSummary').innerHTML = summaryHtml(summarize(monthRows), false);
        renderList('monthList', monthRows, m ? '这个月份暂无数据。' : '暂无记录。');

        const y = String($('yearPicker')?.value || '').trim();
        const yearRows = y ? rows.filter(r => String(r.date).slice(0,4) === y) : rows;
        if($('yearSummary')) $('yearSummary').innerHTML = summaryHtml(summarize(yearRows));
        renderList('yearList', yearRows, y ? '这个年份暂无数据。' : '暂无记录。');
      }
      function goto(name){
        views().forEach(v => v.classList.toggle('active', v.dataset.view === name));
        const sectionTitleRow = $('fxSectionTitleRow');
        if(sectionTitleRow) sectionTitleRow.hidden = name !== 'home';
        if(name === 'input' && !$('editId').value) {
          $('fxDate').value = $('fxDate').value || today();
        }
        if(name === 'month' && $('monthPicker') && !$('monthPicker').value) {
          $('monthPicker').value = latestMonth(sorted());
        }
        render();
        window.scrollTo({top:0, behavior:'smooth'});
      }
      function setRecordType(type){
        const value = type === 'subtract' ? 'subtract' : 'add';
        const input = $('fxType');
        if(input) input.value = value;
        document.querySelectorAll('.fx-type-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.typeValue === value));
        updatePreview();
      }
      function resetForm(){
        $('editId').value = '';
        $('inputTitle').textContent = '输入记录';
        $('fxDate').value = today();
        $('fxUsd').value = '';
        $('fxRate').value = '';
        $('fxNote').value = '';
        setRecordType('add');
        updatePreview();
      }
      function updatePreview(){
        const sign = $('fxType')?.value === 'subtract' ? -1 : 1;
        const cny = num($('fxUsd').value) * num($('fxRate').value) * sign;
        const box = $('fxCnyPreview');
        if(box) {
          box.textContent = signedMoneyText(cny, '¥');
          box.classList.toggle('fx-negative', cny < 0);
        }
        updateInputWarnings();
      }
      function getInputWarnings(){
        const warnings = [];
        const usdRaw = String($('fxUsd')?.value || '').trim();
        const rateRaw = String($('fxRate')?.value || '').trim();
        const usd = Number.parseFloat(usdRaw);
        const rate = Number.parseFloat(rateRaw);
        if(usdRaw && Number.isFinite(usd) && (usd < 20 || usd > 100000 || usd < 0)) {
          warnings.push('美金金额看起来可能有误，请确认是否输入正确。');
        }
        if(rateRaw && Number.isFinite(rate) && (rate < 5 || rate > 10 || rate <= 0)) {
          warnings.push('汇率看起来可能有误，请确认是否输入正确。');
        }
        return warnings;
      }
      function updateInputWarnings(){
        const usdRaw = String($('fxUsd')?.value || '').trim();
        const rateRaw = String($('fxRate')?.value || '').trim();
        const usd = Number.parseFloat(usdRaw);
        const rate = Number.parseFloat(rateRaw);
        const usdWarning = $('fxUsdWarning');
        const rateWarning = $('fxRateWarning');
        if(usdWarning) usdWarning.classList.toggle('show', !!usdRaw && Number.isFinite(usd) && (usd < 20 || usd > 100000 || usd < 0));
        if(rateWarning) rateWarning.classList.toggle('show', !!rateRaw && Number.isFinite(rate) && (rate < 5 || rate > 10 || rate <= 0));
      }
      function confirmInputWarnings(){
        const warnings = getInputWarnings();
        if(!warnings.length) return true;
        return confirm('输入数据看起来可能有误。\n\n' + warnings.map(w => '• ' + w).join('\n') + '\n\n点击“取消”返回修改，点击“确定”仍然保存。');
      }
      function editRecord(id){
        const r = load().find(x => x.id === id);
        if(!r) return;
        $('editId').value = r.id;
        $('inputTitle').textContent = '编辑记录';
        $('fxDate').value = r.date;
        $('fxUsd').value = Math.abs(num(r.usd));
        $('fxRate').value = r.rate;
        $('fxNote').value = r.note || '';
        setRecordType(recordType(r));
        updatePreview();
        goto('input');
      }
      function deleteRecord(id){
        if(!confirm('确定删除这条记录吗？')) return;
        save(load().filter(r => r.id !== id));
        render();
        showToast('已删除');
      }
      function exportRows(){
        const rows = sorted();
        const months = groupSummary(rows, 7);
        const years = groupSummary(rows, 4);
        return {rows, months, years};
      }
      function groupSummary(rows, len){
        const map = {};
        rows.forEach(r => {
          const k = String(r.date).slice(0,len);
          if(!map[k]) map[k] = [];
          map[k].push(r);
        });
        return Object.keys(map).sort().reverse().map(k => ({period:k, ...summarize(map[k])}));
      }
      function monthLabel(period){
        const parts = String(period || '').split('-');
        const y = parts[0] || '';
        const m = Number(parts[1] || 0);
        return y && m ? (y + '年' + m + '月') : String(period || '');
      }
      function escapeXml(value){
        return String(value ?? '').replace(/[<>&"']/g, ch => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[ch]));
      }
      function utf8Bytes(str){ return new TextEncoder().encode(str); }
      const CRC_TABLE = (() => {
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
          let c = n;
          for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
          table[n] = c >>> 0;
        }
        return table;
      })();
      function crc32(bytes){
        let c = 0xffffffff;
        for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
      }
      function writeU16(arr, value){ arr.push(value & 255, (value >>> 8) & 255); }
      function writeU32(arr, value){ arr.push(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255); }
      function concatBytes(parts){
        const total = parts.reduce((sum, part) => sum + part.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        parts.forEach(part => { out.set(part, offset); offset += part.length; });
        return out;
      }
      function makeZip(files){
        const localParts = [];
        const centralParts = [];
        let offset = 0;
        files.forEach(file => {
          const nameBytes = utf8Bytes(file.name);
          const dataBytes = utf8Bytes(file.content);
          const crc = crc32(dataBytes);
          const local = [];
          writeU32(local, 0x04034b50); writeU16(local, 20); writeU16(local, 0x0800); writeU16(local, 0);
          writeU16(local, 0); writeU16(local, 0); writeU32(local, crc); writeU32(local, dataBytes.length); writeU32(local, dataBytes.length);
          writeU16(local, nameBytes.length); writeU16(local, 0);
          const localBytes = concatBytes([new Uint8Array(local), nameBytes, dataBytes]);
          localParts.push(localBytes);
          const central = [];
          writeU32(central, 0x02014b50); writeU16(central, 20); writeU16(central, 20); writeU16(central, 0x0800); writeU16(central, 0);
          writeU16(central, 0); writeU16(central, 0); writeU32(central, crc); writeU32(central, dataBytes.length); writeU32(central, dataBytes.length);
          writeU16(central, nameBytes.length); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU32(central, 0); writeU32(central, offset);
          centralParts.push(concatBytes([new Uint8Array(central), nameBytes]));
          offset += localBytes.length;
        });
        const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
        const end = [];
        writeU32(end, 0x06054b50); writeU16(end, 0); writeU16(end, 0); writeU16(end, files.length); writeU16(end, files.length);
        writeU32(end, centralSize); writeU32(end, offset); writeU16(end, 0);
        return concatBytes([...localParts, ...centralParts, new Uint8Array(end)]);
      }
      function excelCol(index){
        let s = '';
        index += 1;
        while(index > 0){
          const mod = (index - 1) % 26;
          s = String.fromCharCode(65 + mod) + s;
          index = Math.floor((index - mod) / 26);
        }
        return s;
      }
      function cellXml(cell, r, c){
        const obj = (cell && typeof cell === 'object' && !Array.isArray(cell)) ? cell : {v: cell};
        const v = obj.v ?? '';
        const style = obj.s ? ' s="' + obj.s + '"' : '';
        const ref = excelCol(c) + r;
        const isNumber = typeof v === 'number' && isFinite(v);
        if(v === '') return '<c r="'+ref+'"'+style+'/>';
        return '<c r="'+ref+'"'+style+' t="'+(isNumber?'n':'inlineStr')+'">' + (isNumber ? '<v>'+v+'</v>' : '<is><t>'+escapeXml(v)+'</t></is>') + '</c>';
      }
      function sheetXmlAdvanced(rows){
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          '<cols><col min="1" max="1" width="14" customWidth="1"/><col min="2" max="2" width="16" customWidth="1"/><col min="3" max="8" width="16" customWidth="1"/><col min="9" max="9" width="24" customWidth="1"/></cols>' +
          '<sheetData>' + rows.map((row, rIdx) => '<row r="'+(rIdx+1)+'">' + row.map((cell, cIdx) => cellXml(cell, rIdx+1, cIdx)).join('') + '</row>').join('') + '</sheetData></worksheet>';
      }
      function headerRow(labels){ return labels.map(v => ({v, s:1})); }
      function blankRow(){ return ['', '', '', '', '', '', '', '', '']; }
      function summaryRows(title, summary, includeMonthlyAverage){
        const hasSubtract = hasSubtractSummary(summary);
        const rows = [
          [{v:title, s:2}, '', '', '', '', '', '', '', '']
        ];
        if(hasSubtract) {
          rows.push(
            [{v:'新增美金总金额', s:3}, {v:fixedMoney(summary.addUsd), s:4}, '', '', '', '', '', '', ''],
            [{v:'减去美金总金额', s:3}, {v:signedMoneyText(-Math.abs(summary.subtractUsd || 0)), s:6}, '', '', '', '', '', '', '']
          );
        }
        rows.push(
          [{v:'美金净金额', s:3}, {v:signedMoneyText(summary.netUsd), s:summary.netUsd < 0 ? 6 : 4}, '', '', '', '', '', '', ''],
          [{v:'平均汇率', s:3}, {v:fixedRate(summary.rateAvg), s:4}, '', '', '', '', '', '', '']
        );
        if(hasSubtract) {
          rows.push(
            [{v:'新增人民币总金额', s:3}, {v:fixedMoney(summary.addCny), s:4}, '', '', '', '', '', '', ''],
            [{v:'减去人民币总金额', s:3}, {v:signedMoneyText(-Math.abs(summary.subtractCny || 0)), s:6}, '', '', '', '', '', '', '']
          );
        }
        rows.push(
          [{v:'人民币净金额', s:3}, {v:signedMoneyText(summary.netCny), s:summary.netCny < 0 ? 6 : 4}, '', '', '', '', '', '', ''],
          [{v:'记录行数', s:3}, {v:summary.count + ' 行', s:4}, '', '', '', '', '', '', '']
        );
        if(includeMonthlyAverage) {
          rows.push(
            [{v:'有记录月份', s:3}, {v:(summary.monthCount || 0) + ' 个月', s:4}, '', '', '', '', '', '', ''],
            [{v:'每月平均美金', s:3}, {v:signedMoneyText(summary.monthAvgUsd), s:summary.monthAvgUsd < 0 ? 6 : 4}, '', '', '', '', '', '', ''],
            [{v:'每月平均人民币', s:3}, {v:signedMoneyText(summary.monthAvgCny), s:summary.monthAvgCny < 0 ? 6 : 4}, '', '', '', '', '', '', '']
          );
        }
        return rows;
      }
      function recordRow(r){
        const isSub = recordType(r) === 'subtract';
        const valueStyle = isSub ? 7 : 5;
        return [
          {v:recordTypeLabel(r), s:isSub ? 8 : 0},
          {v:r.date, s:0},
          {v:signedMoneyText(num(r.usd)), s:valueStyle},
          {v:fixedRate(r.rate), s:5},
          {v:signedMoneyText(calcCny(r)), s:valueStyle},
          {v:r.note || '', s:0}
        ];
      }
      function buildAllSheetRows(rows){
        const out = [headerRow(['类型','日期','美金','汇率','人民币','备注'])];
        rows.forEach(r => out.push(recordRow(r)));
        out.push(blankRow());
        out.push(...summaryRows('总汇总', summarize(rows), true));
        return out;
      }
      function buildMonthSheetRows(rows){
        const groups = {};
        rows.forEach(r => {
          const key = String(r.date).slice(0,7);
          if(!groups[key]) groups[key] = [];
          groups[key].push(r);
        });
        const months = Object.keys(groups).sort().reverse();
        const out = [];
        months.forEach((month, idx) => {
          if(idx > 0) out.push(blankRow());
          out.push([{v:monthLabel(month), s:2}, '', '', '', '']);
          out.push(headerRow(['类型','日期','美金','汇率','人民币','备注']));
          groups[month].sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(r => out.push(recordRow(r)));
          out.push(blankRow());
          out.push(...summaryRows(monthLabel(month) + '汇总', summarize(groups[month]), false));
        });
        if(!out.length) out.push([{v:'暂无记录', s:2}, '', '', '', '']);
        return out;
      }
      function buildYearSheetRows(rows){
        const months = groupSummary(rows, 7);
        const hasSubtract = hasSubtractSummary(summarize(rows));
        const headers = hasSubtract
          ? ['月份','新增美金总金额','减去美金总金额','美金净金额','平均汇率','新增人民币总金额','减去人民币总金额','人民币净金额','记录行数']
          : ['月份','美金净金额','平均汇率','人民币净金额','记录行数'];
        const out = [headerRow(headers)];
        months.forEach(r => {
          if(hasSubtract) {
            out.push([
              {v:monthLabel(r.period), s:0},
              {v:fixedMoney(r.addUsd), s:5},
              {v:signedMoneyText(-Math.abs(r.subtractUsd || 0)), s:6},
              {v:signedMoneyText(r.netUsd), s:r.netUsd < 0 ? 6 : 5},
              {v:fixedRate(r.rateAvg), s:5},
              {v:fixedMoney(r.addCny), s:5},
              {v:signedMoneyText(-Math.abs(r.subtractCny || 0)), s:6},
              {v:signedMoneyText(r.netCny), s:r.netCny < 0 ? 6 : 5},
              {v:r.count + ' 行', s:5}
            ]);
          } else {
            out.push([
              {v:monthLabel(r.period), s:0},
              {v:signedMoneyText(r.netUsd), s:r.netUsd < 0 ? 6 : 5},
              {v:fixedRate(r.rateAvg), s:5},
              {v:signedMoneyText(r.netCny), s:r.netCny < 0 ? 6 : 5},
              {v:r.count + ' 行', s:5}
            ]);
          }
        });
        out.push(blankRow());
        out.push(...summaryRows('年度总汇总', summarize(rows), true));
        return out;
      }
      function xlsxStylesXml(){
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
          '<fonts count="6"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="16"/><name val="Calibri"/><color rgb="FF1D4ED8"/></font><font><b/><sz val="12"/><name val="Calibri"/><color rgb="FF334155"/></font><font><b/><sz val="15"/><name val="Calibri"/><color rgb="FFDC2626"/></font><font><sz val="11"/><name val="Calibri"/><color rgb="FFDC2626"/></font></fonts>' +
          '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF7ED"/><bgColor indexed="64"/></patternFill></fill></fills>' +
          '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD1D5DB"/></left><right style="thin"><color rgb="FFD1D5DB"/></right><top style="thin"><color rgb="FFD1D5DB"/></top><bottom style="thin"><color rgb="FFD1D5DB"/></bottom><diagonal/></border></borders>' +
          '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
          '<cellXfs count="9"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="left"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="right"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment horizontal="right"/></xf><xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment horizontal="right"/></xf><xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment horizontal="right"/></xf><xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/></cellXfs>' +
          '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
          '</styleSheet>';
      }
      function makeXlsxBlob(){
        const rows = sorted();
        const files = [
          {name:'[Content_Types].xml', content:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'},
          {name:'_rels/.rels', content:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
          {name:'xl/workbook.xml', content:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="全部记录" sheetId="1" r:id="rId1"/><sheet name="月度记录" sheetId="2" r:id="rId2"/><sheet name="年度记录" sheetId="3" r:id="rId3"/></sheets></workbook>'},
          {name:'xl/_rels/workbook.xml.rels', content:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
          {name:'xl/styles.xml', content:xlsxStylesXml()},
          {name:'xl/worksheets/sheet1.xml', content:sheetXmlAdvanced(buildAllSheetRows(rows))},
          {name:'xl/worksheets/sheet2.xml', content:sheetXmlAdvanced(buildMonthSheetRows(rows))},
          {name:'xl/worksheets/sheet3.xml', content:sheetXmlAdvanced(buildYearSheetRows(rows))}
        ];
        return new Blob([makeZip(files)], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      }
      function makeCsvBlob(){
        const rows = sorted();
        const csv = ['日期,美金,汇率,人民币,备注'].concat(rows.map(r => [r.date, num(r.usd).toFixed(2), fixedRate(r.rate), calcCny(r).toFixed(2), '"'+String(r.note||'').replace(/"/g,'""')+'"'].join(','))).join('\n');
        return new Blob(['\ufeff', csv], {type:'text/csv;charset=utf-8'});
      }
      function downloadBlob(blob, name){
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
      }
      async function shareBlob(blob, name, title){
        const ua = navigator.userAgent.toLowerCase();
        const file = new File([blob], name, {type: blob.type});
        if(/micromessenger/.test(ua)) {
          downloadBlob(blob, name);
          showToast('微信里已改为下载文件');
          alert('微信内置浏览器通常不能直接分享文件。文件已下载；如需转发，请在微信聊天里选择文件发送，或用 Safari/Chrome 打开本页再分享。');
          return;
        }
        if(navigator.canShare && navigator.canShare({files:[file]})) {
          await navigator.share({title, text:title, files:[file]});
        } else {
          downloadBlob(blob, name);
          showToast('当前浏览器不支持直接分享文件，已改为下载');
        }
      }
      async function copyText(text){
        try {
          await navigator.clipboard.writeText(text);
        } catch(e) {
          const area = document.createElement('textarea');
          area.value = text;
          area.style.position = 'fixed';
          area.style.left = '-9999px';
          document.body.appendChild(area);
          area.focus();
          area.select();
          document.execCommand('copy');
          area.remove();
        }
      }
      function filename(ext){ return '美元人民币汇率记录_' + today().replaceAll('-','') + ext; }

      function backupFilename(){
        return '汇率数据备份_' + today().replaceAll('-','') + '.json';
      }
      function makeBackupBlob(){
        const data = {
          app: 'OpenAA USD RMB Rate Records',
          version: 1,
          exportedAt: new Date().toISOString(),
          records: load()
        };
        return new Blob([JSON.stringify(data, null, 2)], {type:'application/json;charset=utf-8'});
      }
      function normalizeBackupRows(data){
        const rows = Array.isArray(data) ? data : (data && Array.isArray(data.records) ? data.records : null);
        if(!rows) throw new Error('bad backup');
        return rows.map((r) => ({
          id: String(r.id || ('r_' + Date.now() + '_' + Math.random().toString(16).slice(2))),
          date: String(r.date || '').slice(0,10),
          type: (r.type === 'subtract' || num(r.usd) < 0) ? 'subtract' : 'add',
          usd: num(r.usd),
          rate: num(r.rate),
          note: String(r.note || ''),
          createdAt: String(r.createdAt || new Date().toISOString())
        })).filter(r => r.date && r.usd !== 0 && r.rate !== 0);
      }
      function mergeBackupRows(current, incoming){
        const seen = new Set();
        const keyOf = (r) => String(r.id || '') + '|' + String(r.date || '') + '|' + Number(r.usd || 0).toFixed(2) + '|' + Number(r.rate || 0).toFixed(4) + '|' + String(r.note || '');
        const merged = [];
        current.forEach(r => {
          const key = keyOf(r);
          seen.add(key);
          if(r.id) seen.add('id:' + r.id);
          merged.push(r);
        });
        incoming.forEach(r => {
          const key = keyOf(r);
          const idKey = r.id ? ('id:' + r.id) : '';
          if((idKey && seen.has(idKey)) || seen.has(key)) return;
          seen.add(key);
          if(idKey) seen.add(idKey);
          merged.push(r);
        });
        return merged;
      }
      async function importBackupFile(file){
        try {
          const text = await file.text();
          const incoming = normalizeBackupRows(JSON.parse(text));
          if(!incoming.length) {
            alert('备份文件里没有可导入的记录。');
            return;
          }
          const current = load();
          if(current.length) {
            const choice = prompt('检测到当前浏览器已有 ' + current.length + ' 条记录，备份文件有 ' + incoming.length + ' 条记录。\n\n请输入导入方式：\n1 = 覆盖当前数据\n2 = 合并数据\n0 = 取消');
            if(choice === '1') {
              save(incoming);
              showToast('已覆盖导入');
            } else if(choice === '2') {
              save(mergeBackupRows(current, incoming));
              showToast('已合并导入');
            } else {
              showToast('已取消导入');
              return;
            }
          } else {
            save(incoming);
            showToast('导入成功');
          }
          render();
          goto('home');
        } catch(err) {
          alert('导入失败，请选择正确的数据备份文件。');
        }
      }


      function openActionSheet(id){
        const sheet = $(id);
        if(!sheet) return;
        sheet.classList.add('open');
        sheet.setAttribute('aria-hidden', 'false');
      }
      function closeActionSheets(){
        document.querySelectorAll('.fx-sheet-backdrop.open').forEach(sheet => {
          sheet.classList.remove('open');
          sheet.setAttribute('aria-hidden', 'true');
        });
      }
      async function shareBackupFile(){
        await shareBlob(makeBackupBlob(), backupFilename(), '汇率数据备份');
      }

      window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstallPrompt = e; });
      document.addEventListener('click', (e) => {
        const go = e.target.closest('[data-goto]');
        if(go){ if(go.dataset.goto === 'input') resetForm(); goto(go.dataset.goto); }
        const edit = e.target.closest('[data-edit]');
        if(edit) editRecord(edit.dataset.edit);
        const del = e.target.closest('[data-delete]');
        if(del) deleteRecord(del.dataset.delete);
      });
      ['fxUsd','fxRate'].forEach(id => $(id)?.addEventListener('input', updatePreview));
      document.querySelectorAll('.fx-type-btn').forEach(btn => btn.addEventListener('click', () => setRecordType(btn.dataset.typeValue)));
      $('fxForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        updateInputWarnings();
        if(!confirmInputWarnings()) return;
        const rows = load();
        const id = $('editId').value || ('r_' + Date.now() + '_' + Math.random().toString(16).slice(2));
        const type = $('fxType')?.value === 'subtract' ? 'subtract' : 'add';
        const signedUsd = num($('fxUsd').value) * (type === 'subtract' ? -1 : 1);
        const row = { id, type, date:$('fxDate').value, usd:signedUsd, rate:num($('fxRate').value), note:$('fxNote').value.trim(), createdAt:new Date().toISOString() };
        const idx = rows.findIndex(r=>r.id===id);
        if(idx >= 0) rows[idx] = {...rows[idx], ...row}; else rows.push(row);
        save(rows); resetForm(); goto('saved'); showToast('保存成功');
      });
      $('continueAddBtn')?.addEventListener('click', () => { resetForm(); goto('input'); });
      $('monthPicker')?.addEventListener('change', render);
      $('yearPicker')?.addEventListener('input', render);
      $('clearYearBtn')?.addEventListener('click', ()=>{ $('yearPicker').value=''; render(); });
      $('excelFileBtn')?.addEventListener('click', ()=> openActionSheet('excelActionSheet'));
      $('backupFileBtn')?.addEventListener('click', ()=> openActionSheet('backupActionSheet'));
      document.querySelectorAll('[data-close-sheet]').forEach(btn => btn.addEventListener('click', closeActionSheets));
      document.querySelectorAll('.fx-sheet-backdrop').forEach(sheet => sheet.addEventListener('click', (e)=>{ if(e.target === sheet) closeActionSheets(); }));
      document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeActionSheets(); });
      $('downloadXlsBtn')?.addEventListener('click', ()=> { downloadBlob(makeXlsxBlob(), filename('.xlsx')); closeActionSheets(); });
      $('shareXlsBtn')?.addEventListener('click', async ()=> { await shareBlob(makeXlsxBlob(), filename('.xlsx'), '美元人民币汇率记录'); closeActionSheets(); });
      async function copySummary(){
        const s = summarize(sorted());
        const text = '美元人民币汇率记录\n\n新增美金总金额：$'+money(s.addUsd)+'\n减去美金总金额：'+signedMoneyText(-Math.abs(s.subtractUsd || 0), '$')+'\n美金净金额：'+signedMoneyText(s.netUsd, '$')+'\n平均汇率：'+fixedRate(s.rateAvg)+'\n新增人民币总金额：¥'+money(s.addCny)+'\n减去人民币总金额：'+signedMoneyText(-Math.abs(s.subtractCny || 0), '¥')+'\n人民币净金额：'+signedMoneyText(s.netCny, '¥')+'\n记录行数：'+s.count+' 行\n有记录月份：'+(s.monthCount || 0)+' 个月\n每月平均美金：'+signedMoneyText(s.monthAvgUsd, '$')+'\n每月平均人民币：'+signedMoneyText(s.monthAvgCny, '¥');
        await copyText(text);
        showToast('已复制，可到微信粘贴发送');
        alert('汇总内容已复制。请打开微信聊天窗口，长按输入框粘贴发送。');
      }
      $('copySummaryBtn')?.addEventListener('click', copySummary);
      $('downloadBackupBtn')?.addEventListener('click', ()=> { downloadBlob(makeBackupBlob(), backupFilename()); closeActionSheets(); });
      $('shareBackupBtn')?.addEventListener('click', async ()=> { await shareBackupFile(); closeActionSheets(); });
      $('importBackupInput')?.addEventListener('change', async (e)=>{
        const file = e.target.files && e.target.files[0];
        if(file) { closeActionSheets(); await importBackupFile(file); }
        e.target.value = '';
      });
      $('installAppBtnExport')?.addEventListener('click', ()=> $('installAppBtn')?.click());
      $('clearDataBtn')?.addEventListener('click', ()=>{ if(confirm('确定清空全部数据吗？此操作不可恢复。')){ save([]); render(); showToast('已清空'); }});
      $('installAppBtn')?.addEventListener('click', async ()=>{
        const ua = navigator.userAgent.toLowerCase();
        if(deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          await deferredInstallPrompt.userChoice;
          deferredInstallPrompt = null;
        } else if(/iphone|ipad|ipod/.test(ua)) {
          alert('iPhone 安装方法：请用 Safari 打开本页，点击底部“分享”按钮，然后选择“添加到主屏幕”。\n\n如果在微信里，请先点右上角，用 Safari 打开。');
        } else {
          alert('请用 Chrome/Edge 打开本页，然后在浏览器菜单选择“安装应用”或“添加到主屏幕”。如果在微信里，请先用浏览器打开。');
        }
      });
      resetForm();
      if($('monthPicker')) $('monthPicker').value = latestMonth(sorted());
      render();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(()=>{});
      }
    })();
