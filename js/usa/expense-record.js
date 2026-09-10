function showToast(text){const old=document.querySelector('.toast');if(old)old.remove();const t=document.createElement('div');t.className='toast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.remove(),2400)}
/* ToolKu 生活开支记录工具：本地保存 + 汇总 + 导出备份 */
    (function initExpenseApp(){
      const KEY = 'openaa_expense_records_v1';
      let deferredInstallPrompt = null;
      const CATEGORIES = ['购物','餐饮','交通','房屋','账单','其它'];
      const CATEGORY_ICONS = { '购物':'🛒', '餐饮':'🍜', '交通':'🚗', '房屋':'🏠', '账单':'📱', '其它':'📦' };
      const $ = (id) => document.getElementById(id);
      const views = () => Array.from(document.querySelectorAll('#expenseApp .expense-view'));
      const num = (v) => Number.parseFloat(v) || 0;
      const money = (n) => '$' + (Number(n)||0).toLocaleString('zh-CN',{minimumFractionDigits:2, maximumFractionDigits:2});
      const today = () => new Date().toISOString().slice(0,10);
      const monthNow = () => today().slice(0,7);
      function load(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e){ return []; } }
      function save(rows){ localStorage.setItem(KEY, JSON.stringify(rows)); }
      function sorted(){ return load().sort((a,b)=>String(b.date).localeCompare(String(a.date)) || String(b.createdAt||'').localeCompare(String(a.createdAt||''))); }
      function escapeText(str){ return String(str || '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
      function startOfWeek(dateStr){
        const d = new Date(dateStr + 'T00:00:00');
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        return d.toISOString().slice(0,10);
      }
      function inRange(row, range){
        const d = String(row.date || '');
        if(range === 'week') return startOfWeek(d) === startOfWeek(today());
        if(range === 'month') return d.slice(0,7) === monthNow();
        if(range === 'year') return d.slice(0,4) === today().slice(0,4);
        return true;
      }
      function summarize(rows){
        const total = rows.reduce((s,r)=>s+num(r.amount),0);
        const cash = rows.filter(r=>r.payment==='现金').reduce((s,r)=>s+num(r.amount),0);
        const card = rows.filter(r=>r.payment==='银行卡').reduce((s,r)=>s+num(r.amount),0);
        const byCategory = {};
        CATEGORIES.forEach(c => byCategory[c] = 0);
        rows.forEach(r => { byCategory[r.category || '其它'] = (byCategory[r.category || '其它'] || 0) + num(r.amount); });
        return { total, cash, card, count: rows.length, byCategory };
      }
      function summaryHtml(s){
        return [
          ['开支总金额', money(s.total)],
          ['记录笔数', s.count + ' 笔'],
          ['现金总额', money(s.cash)],
          ['银行卡总额', money(s.card)]
        ].map(x => '<div class="expense-stat"><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>').join('');
      }
      function categorySummaryHtml(s){
        const items = CATEGORIES.map(c => [c, s.byCategory[c] || 0]).filter(x => x[1] > 0);
        if(!items.length) return '<div class="expense-empty">暂无分类数据</div>';
        return items.map(([c,v]) => '<div class="expense-category-stat"><span>'+CATEGORY_ICONS[c]+' '+c+'</span><strong>'+money(v)+'</strong></div>').join('');
      }
      function recordHtml(r){
        return '<div class="expense-record"><div class="expense-record-top"><div class="expense-record-date">'+escapeText(r.date)+'</div><div class="expense-record-money">'+money(r.amount)+'</div></div><div class="expense-record-meta">'+(CATEGORY_ICONS[r.category]||'📦')+' '+escapeText(r.category||'其它')+' ｜ '+escapeText(r.payment||'')+(r.note?' ｜ '+escapeText(r.note):'')+'</div><div class="expense-record-actions"><button class="expense-chip-btn" type="button" data-expense-edit="'+escapeText(r.id)+'">编辑</button><button class="expense-chip-btn" type="button" data-expense-delete="'+escapeText(r.id)+'">删除</button></div></div>';
      }
      function renderList(id, rows, emptyText){
        const box = $(id); if(!box) return;
        box.innerHTML = rows.length ? rows.map(recordHtml).join('') : '<div class="expense-empty">'+emptyText+'</div>';
      }
      function render(){
        const rows = sorted();
        const month = $('expenseMonthPicker')?.value || monthNow();
        const monthRows = rows.filter(r => String(r.date||'').slice(0,7) === month);
        if($('homeMonthSummary')) $('homeMonthSummary').innerHTML = summaryHtml(summarize(rows.filter(r => String(r.date||'').slice(0,7) === monthNow())));
        if($('homeCategorySummary')) $('homeCategorySummary').innerHTML = categorySummaryHtml(summarize(rows.filter(r => String(r.date||'').slice(0,7) === monthNow())));
        if($('recordsSummary')) $('recordsSummary').innerHTML = summaryHtml(summarize(monthRows));
        renderList('recordsList', monthRows, '这个月份暂无记录。');
        const activeRange = document.querySelector('.expense-tab.active')?.dataset.summaryRange || 'week';
        const rangeRows = rows.filter(r => inRange(r, activeRange));
        if($('summaryStats')) $('summaryStats').innerHTML = summaryHtml(summarize(rangeRows));
        if($('summaryCategoryStats')) $('summaryCategoryStats').innerHTML = categorySummaryHtml(summarize(rangeRows));
        renderList('summaryList', rangeRows, '暂无记录。');
      }
      function goto(name){
        views().forEach(v => v.classList.toggle('active', v.dataset.view === name));
        const sectionTitleRow = $('expenseSectionTitleRow');
        if(sectionTitleRow) sectionTitleRow.hidden = name !== 'home';
        if(name === 'input' && !$('expenseEditId').value) $('expenseDate').value = $('expenseDate').value || today();
        if(name === 'records' && $('expenseMonthPicker') && !$('expenseMonthPicker').value) $('expenseMonthPicker').value = monthNow();
        render(); window.scrollTo({top:0, behavior:'smooth'});
      }
      function setChoice(kind, value){
        const id = kind === 'payment' ? 'expensePayment' : 'expenseCategory';
        const selector = kind === 'payment' ? '[data-payment]' : '[data-category]';
        $(id).value = value;
        document.querySelectorAll(selector).forEach(btn => btn.classList.toggle('active', (kind==='payment'?btn.dataset.payment:btn.dataset.category) === value));
      }
      function resetForm(){
        $('expenseEditId').value = '';
        $('expenseInputTitle').textContent = '记一笔';
        $('expenseDate').value = today();
        $('expenseAmount').value = '';
        $('expenseNote').value = '';
        $('expensePayment').value = '';
        $('expenseCategory').value = '';
        document.querySelectorAll('#expensePaymentGrid .expense-choice-card, #expenseCategoryGrid .expense-choice-card').forEach(b=>b.classList.remove('active'));
        validateAmount();
      }
      function validateAmount(){
        const amount = num($('expenseAmount')?.value);
        const raw = String($('expenseAmount')?.value || '').trim();
        const warn = raw && (amount < 1 || amount > 10000 || amount < 0);
        $('expenseAmountWarning')?.classList.toggle('show', !!warn);
        return !!warn;
      }
      function editRecord(id){
        const r = load().find(x => x.id === id); if(!r) return;
        $('expenseEditId').value = r.id;
        $('expenseInputTitle').textContent = '编辑记录';
        $('expenseDate').value = r.date;
        $('expenseAmount').value = r.amount;
        $('expenseNote').value = r.note || '';
        setChoice('payment', r.payment || '');
        setChoice('category', r.category || '其它');
        validateAmount(); goto('input');
      }
      function deleteRecord(id){
        if(!confirm('确定删除这条记录吗？')) return;
        save(load().filter(r=>r.id!==id)); render(); showToast('已删除');
      }
      function buildExportHtml(){
        const rows = sorted();
        const s = summarize(rows);
        const trs = rows.map(r => '<tr><td>'+escapeText(r.date)+'</td><td>'+escapeText(r.payment)+'</td><td>'+escapeText(r.category)+'</td><td style="text-align:right">'+money(r.amount)+'</td><td>'+escapeText(r.note||'')+'</td></tr>').join('');
        const cats = CATEGORIES.map(c => '<tr><td>'+c+'</td><td style="text-align:right">'+money(s.byCategory[c]||0)+'</td></tr>').join('');
        return '<html><head><meta charset="UTF-8"></head><body><table border="1"><tr><th colspan="5">生活开支记录</th></tr><tr><th>日期</th><th>支付方式</th><th>分类</th><th>金额</th><th>备注</th></tr>'+trs+'<tr></tr><tr><th>汇总</th><th colspan="4"></th></tr><tr><td>开支总金额</td><td style="text-align:right">'+money(s.total)+'</td></tr><tr><td>记录笔数</td><td>'+s.count+' 笔</td></tr><tr><td>现金总额</td><td style="text-align:right">'+money(s.cash)+'</td></tr><tr><td>银行卡总额</td><td style="text-align:right">'+money(s.card)+'</td></tr><tr></tr><tr><th>分类</th><th>金额</th></tr>'+cats+'</table></body></html>';
      }

      function escapeXml(value){
        return String(value ?? '').replace(/[<>&"']/g, ch => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[ch]));
      }
      function utf8Bytes(str){ return new TextEncoder().encode(str); }
      const EXPENSE_CRC_TABLE = (() => {
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
        for (let i = 0; i < bytes.length; i++) c = EXPENSE_CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
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
        let col = '';
        index += 1;
        while(index > 0){ const mod = (index - 1) % 26; col = String.fromCharCode(65 + mod) + col; index = Math.floor((index - mod) / 26); }
        return col;
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
          '<cols><col min="1" max="1" width="15" customWidth="1"/><col min="2" max="2" width="14" customWidth="1"/><col min="3" max="3" width="14" customWidth="1"/><col min="4" max="4" width="14" customWidth="1"/><col min="5" max="5" width="24" customWidth="1"/></cols>' +
          '<sheetData>' + rows.map((row, rIdx) => '<row r="'+(rIdx+1)+'">' + row.map((cell, cIdx) => cellXml(cell, rIdx+1, cIdx)).join('') + '</row>').join('') + '</sheetData></worksheet>';
      }
      function xlsxStylesXml(){
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
          '<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="16"/><name val="Calibri"/><color rgb="FF1D4ED8"/></font><font><b/><sz val="12"/><name val="Calibri"/><color rgb="FF334155"/></font><font><b/><sz val="15"/><name val="Calibri"/><color rgb="FFDC2626"/></font></fonts>' +
          '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF7ED"/><bgColor indexed="64"/></patternFill></fill></fills>' +
          '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD1D5DB"/></left><right style="thin"><color rgb="FFD1D5DB"/></right><top style="thin"><color rgb="FFD1D5DB"/></top><bottom style="thin"><color rgb="FFD1D5DB"/></bottom><diagonal/></border></borders>' +
          '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
          '<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="right"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment horizontal="right"/></xf></cellXfs>' +
          '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
          '</styleSheet>';
      }
      function fixedAmount(n){ return Number(n || 0).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2}); }
      function headerRow(labels){ return labels.map(v => ({v, s:1})); }
      function blankRow(){ return ['', '', '', '', '']; }
      function recordRowXlsx(r){ return [{v:r.date, s:0}, {v:r.payment || '', s:0}, {v:r.category || '', s:0}, {v:Number(num(r.amount).toFixed(2)), s:5}, {v:r.note || '', s:0}]; }
      function summaryRowsXlsx(title, rows){
        const s = summarize(rows);
        const out = [[{v:title, s:2}, '', '', '', ''], [{v:'开支总金额', s:3}, {v:Number(s.total.toFixed(2)), s:4}, '', '', ''], [{v:'记录笔数', s:3}, {v:s.count + ' 笔', s:4}, '', '', ''], [{v:'现金总额', s:3}, {v:Number(s.cash.toFixed(2)), s:4}, '', '', ''], [{v:'银行卡总额', s:3}, {v:Number(s.card.toFixed(2)), s:4}, '', '', ''], ['', '', '', '', ''], [{v:'分类', s:1}, {v:'金额', s:1}, '', '', '']];
        CATEGORIES.forEach(c => out.push([{v:c, s:3}, {v:Number((s.byCategory[c] || 0).toFixed(2)), s:4}, '', '', '']));
        return out;
      }
      function groupByMonthRows(rows){
        const map = {};
        rows.forEach(r => { const k = String(r.date || '').slice(0,7); if(!map[k]) map[k] = []; map[k].push(r); });
        return Object.keys(map).sort().reverse().map(k => ({period:k, rows:map[k].sort((a,b)=>String(b.date).localeCompare(String(a.date)))}));
      }
      function buildAllSheetRows(rows){ const out = [headerRow(['日期','支付方式','分类','金额','备注'])]; rows.forEach(r => out.push(recordRowXlsx(r))); out.push(blankRow(), ...summaryRowsXlsx('总汇总', rows)); return out; }
      function buildMonthSheetRows(rows){
        const groups = groupByMonthRows(rows);
        const out = [];
        groups.forEach((g, idx) => {
          if(idx) out.push(blankRow());
          out.push([{v:g.period + ' 月度记录', s:2}, '', '', '', ''], headerRow(['日期','支付方式','分类','金额','备注']));
          g.rows.forEach(r => out.push(recordRowXlsx(r)));
          out.push(blankRow(), ...summaryRowsXlsx(g.period + ' 汇总', g.rows));
        });
        if(!out.length) out.push([{v:'暂无记录', s:2}, '', '', '', '']);
        return out;
      }
      function buildYearSheetRows(rows){
        const groups = groupByMonthRows(rows);
        const out = [headerRow(['月份','开支总金额','记录笔数','现金总额','银行卡总额'])];
        groups.forEach(g => { const s = summarize(g.rows); out.push([{v:g.period, s:0}, {v:Number(s.total.toFixed(2)), s:5}, {v:s.count + ' 笔', s:0}, {v:Number(s.cash.toFixed(2)), s:5}, {v:Number(s.card.toFixed(2)), s:5}]); });
        out.push(blankRow(), ...summaryRowsXlsx('年度/全部汇总', rows));
        return out;
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
      function blob(name, content, type){ return new Blob([content], {type}); }
      function downloadBlob(b, name){ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();}, 500); }
      async function shareBlob(b, name, title){
        const file = new File([b], name, {type:b.type});
        if(navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({title, files:[file]});
        else { downloadBlob(b, name); showToast('当前浏览器不支持直接分享，已改为下载'); }
      }
      function excelBlob(){ return makeXlsxBlob(); }
      function backupBlob(){ return blob('expense.backup', JSON.stringify({app:'OpenAA Expense Records', version:1, exportedAt:new Date().toISOString(), records:load()}, null, 2), 'application/json;charset=utf-8'); }
      function fname(ext){ return '生活开支记录_' + today().replaceAll('-','') + ext; }
      function openSheet(id){ $(id)?.classList.add('open'); }
      function closeSheets(){ document.querySelectorAll('.expense-sheet-backdrop.open').forEach(s=>s.classList.remove('open')); }
      async function importBackup(file){
        try{
          const data = JSON.parse(await file.text());
          const rows = Array.isArray(data) ? data : data.records;
          if(!Array.isArray(rows)) throw new Error('bad');
          if(load().length){
            const choice = prompt('当前浏览器已有数据。请输入导入方式：\n1 = 覆盖当前数据\n2 = 合并数据\n0 = 取消');
            if(choice === '1') save(rows);
            else if(choice === '2') save([...load(), ...rows.filter(r => !load().some(x => x.id === r.id))]);
            else return;
          } else save(rows);
          showToast('导入成功'); render(); goto('home');
        }catch(e){ alert('导入失败，请选择正确的数据备份文件。'); }
      }
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
      });
      async function installExpenseApp(){
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
      }
      document.addEventListener('click', (e)=>{
        const go = e.target.closest('[data-expense-goto]'); if(go){ if(go.dataset.expenseGoto==='input') resetForm(); goto(go.dataset.expenseGoto); }
        const pay = e.target.closest('[data-payment]'); if(pay) setChoice('payment', pay.dataset.payment);
        const cat = e.target.closest('[data-category]'); if(cat) setChoice('category', cat.dataset.category);
        const edit = e.target.closest('[data-expense-edit]'); if(edit) editRecord(edit.dataset.expenseEdit);
        const del = e.target.closest('[data-expense-delete]'); if(del) deleteRecord(del.dataset.expenseDelete);
        if(e.target.closest('[data-expense-close-sheet]')) closeSheets();
      });
      document.querySelectorAll('.expense-sheet-backdrop').forEach(sheet => sheet.addEventListener('click', e => { if(e.target===sheet) closeSheets(); }));
      $('expenseAmount')?.addEventListener('input', validateAmount);
      $('expenseForm')?.addEventListener('submit', (e)=>{
        e.preventDefault();
        if(!$('expensePayment').value){ alert('请选择支付方式。'); return; }
        if(!$('expenseCategory').value){ alert('请选择开支分类。'); return; }
        if(validateAmount() && !confirm('金额看起来可能有误。\n\n是否仍然保存？')) return;
        const rows = load();
        const id = $('expenseEditId').value || ('r_' + Date.now() + '_' + Math.random().toString(16).slice(2));
        const row = { id, date:$('expenseDate').value, amount:num($('expenseAmount').value), payment:$('expensePayment').value, category:$('expenseCategory').value, note:$('expenseNote').value.trim(), createdAt:new Date().toISOString() };
        const idx = rows.findIndex(r=>r.id===id); if(idx>=0) rows[idx] = {...rows[idx], ...row}; else rows.push(row);
        save(rows); resetForm(); goto('saved'); showToast('保存成功');
      });
      $('expenseContinueBtn')?.addEventListener('click', ()=>{ resetForm(); goto('input'); });
      $('expenseMonthPicker')?.addEventListener('change', render);
      $('expenseThisMonthBtn')?.addEventListener('click', ()=>{ $('expenseMonthPicker').value = monthNow(); render(); });
      document.querySelectorAll('.expense-tab').forEach(btn => btn.addEventListener('click', ()=>{ document.querySelectorAll('.expense-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); render(); }));
      $('expenseExcelBtn')?.addEventListener('click', ()=>openSheet('expenseExcelSheet'));
      $('expenseBackupBtn')?.addEventListener('click', ()=>openSheet('expenseBackupSheet'));
      $('expenseDownloadExcelBtn')?.addEventListener('click', ()=>{ downloadBlob(excelBlob(), fname('.xlsx')); closeSheets(); });
      $('expenseShareExcelBtn')?.addEventListener('click', async ()=>{ await shareBlob(excelBlob(), fname('.xlsx'), '生活开支记录'); closeSheets(); });
      $('expenseDownloadBackupBtn')?.addEventListener('click', ()=>{ downloadBlob(backupBlob(), fname('.backup')); closeSheets(); });
      $('expenseShareBackupBtn')?.addEventListener('click', async ()=>{ await shareBlob(backupBlob(), fname('.backup'), '生活开支数据备份'); closeSheets(); });
      $('expenseImportInput')?.addEventListener('change', async (e)=>{ const f=e.target.files&&e.target.files[0]; if(f){ closeSheets(); await importBackup(f); } e.target.value=''; });
      $('expenseClearBtn')?.addEventListener('click', ()=>{ if(confirm('确定清空全部数据吗？此操作不可恢复。')){ save([]); render(); showToast('已清空'); } });
      $('expenseCopySummaryBtn')?.addEventListener('click', async ()=>{
        const rows = sorted().filter(r => String(r.date||'').slice(0,7) === monthNow()); const s=summarize(rows);
        const text = '生活开支本月汇总\n\n开支总金额：'+money(s.total)+'\n记录笔数：'+s.count+' 笔\n现金总额：'+money(s.cash)+'\n银行卡总额：'+money(s.card);
        if(navigator.clipboard) await navigator.clipboard.writeText(text); showToast('已复制，可到微信粘贴发送');
      });
      $('expenseInstallBtn')?.addEventListener('click', installExpenseApp);
      $('expenseInstallBtnExport')?.addEventListener('click', installExpenseApp);
      resetForm(); if($('expenseMonthPicker')) $('expenseMonthPicker').value = monthNow(); render();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(()=>{});
      }
    })();
