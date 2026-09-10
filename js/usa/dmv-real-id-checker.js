function checkRealId() {
            const keys = ['identity','ssn','res1','res2','sixpoints','namechange','currentid'];
            const state = {};
            keys.forEach(k => {
              const el = document.querySelector('[data-key="' + k + '"]');
              state[k] = !!(el && el.checked);
            });
            const missing = [];
            if (!state.identity) missing.push('身份证明 / 出生日期 / 合法身份文件');
            if (!state.ssn) missing.push('SSN 证明，或 SSA 不符合资格信');
            if (!state.res1 || !state.res2) missing.push('两份纽约州居住地址证明');
            if (!state.sixpoints) missing.push('6 Points 身份证明文件');
            if (!state.namechange) missing.push('姓名一致证明；如改过名，需要改名相关文件');
            if (!state.currentid) missing.push('现有驾照 / Permit / Non-driver ID（如已经有）');
            const box = document.getElementById('realIdResult');
            if (!box) return;
            box.className = 'result-box';
            if (missing.length === 0) {
              box.classList.add('ok');
              box.innerHTML = '<strong>看起来准备比较完整。</strong><br>你已经勾选了 REAL ID 常见核心文件。去 DMV 前，仍建议用官方 Document Guide 再生成一次清单，并带原件或官方认可文件。';
            } else if (missing.length <= 2) {
              box.classList.add('warn');
              box.innerHTML = '<strong>还差一点，建议补齐后再去 DMV。</strong><br>你可能还需要：<ul>' + missing.map(x => '<li>' + x + '</li>').join('') + '</ul>';
            } else {
              box.classList.add('bad');
              box.innerHTML = '<strong>现在不建议直接去 DMV，容易白跑。</strong><br>你可能还缺：<ul>' + missing.map(x => '<li>' + x + '</li>').join('') + '</ul>';
            }
          }
