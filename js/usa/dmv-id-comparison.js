(function(){
            const result = document.getElementById('ridResult');
            const purpose = document.getElementById('ridPurpose');
            const status = document.getElementById('ridStatus');

            function getRecommendation(){
              const p = purpose.value;
              const s = status.value;
              let title = '建议：';
              let body = '';

              if (p === 'drive') {
                title += 'Standard 可能已经够用';
                body = '如果你只是为了在纽约州开车、考 Learner Permit、换普通驾照，Standard License / Permit 通常可以满足开车用途。但它不能用于坐美国国内飞机或进入部分联邦设施。';
              } else if (p === 'fly') {
                title += '优先考虑 REAL ID';
                body = '如果你以后要用纽约驾照/ID 坐美国国内飞机，REAL ID 是最常见选择。Enhanced 也可以坐国内飞机，但如果你不需要边境陆路/海路功能，REAL ID 通常更简单。';
              } else if (p === 'federal') {
                title += '选择 REAL ID 或 Enhanced';
                body = '如果你需要进入部分联邦大楼、军事基地，或需要联邦认可的州证件，应选择 REAL ID 或 Enhanced。Standard 标注 Not for Federal Purposes，不适合这类用途。';
              } else if (p === 'border') {
                title += '考虑 Enhanced';
                body = '如果你经常从加拿大、墨西哥或部分加勒比地区经陆路或海路返回美国，Enhanced 更合适。注意：坐国际飞机仍需要护照，Enhanced 不能代替护照坐国际航班。';
              } else if (p === 'passport') {
                title += '有护照可以不急，但 REAL ID 更方便';
                body = '有效护照本身就是 TSA 接受的身份证件，可以用于坐飞机。REAL ID 的好处是国内旅行不必每次带护照；如果你不介意带护照，Standard 也可继续用于开车。';
              } else {
                title += '长期稳妥选 REAL ID';
                body = '如果你不确定未来用途，REAL ID 通常是最平衡的选择：可开车、可坐美国国内飞机、可进入部分联邦设施。只有经常陆路/海路过境加拿大或墨西哥时，才更需要 Enhanced。';
              }

              const warnings = [];
              if (s === 'no-ssn') warnings.push('你选择了“没有 SSN 或社安卡”：请特别核对 DMV 对 SSN 不适用信或其它证明的要求。');
              if (s === 'name-change') warnings.push('你选择了“姓名不一致”：请准备能把名字变化串起来的文件，例如结婚证、离婚判决或法院改名文件。');
              if (s === 'few-address') warnings.push('你选择了“地址证明不多”：REAL ID / Enhanced 通常要 2 份纽约州地址证明，建议先准备银行账单、水电煤账单、租约、工资单等不同来源文件。');

              return '<strong>' + title + '</strong><br>' + body + (warnings.length ? '<br><br>' + warnings.join('<br>') : '');
            }

            function update(){ if(result) result.innerHTML = getRecommendation(); }
            if(purpose) purpose.addEventListener('change', update);
            if(status) status.addEventListener('change', update);
            update();
          })();
