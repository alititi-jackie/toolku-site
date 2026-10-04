// NY ID-44 (2/26), Green Light Law. Checks documents, not exam/age eligibility.
function checkEligibility(a) {
  const lawful = ["citizen", "green", "passport", "ead"].includes(a.identity);
  const citizenProof = a.citizen === "yes" && a.identity === "citizen";
  const consistent =
    !(a.citizen === "no" && a.identity === "citizen") &&
    !(a.citizen === "yes" && ["green", "passport", "ead"].includes(a.identity));
  const result = {};
  for (const type of ["Standard", "REAL ID", "Enhanced"]) {
    const federal = type !== "Standard",
      enhanced = type === "Enhanced",
      missing = [],
      met = [],
      blocked = [];
    const check = (ok, yes, no) => (ok ? met.push(yes) : missing.push(no));
    check(
      a.sixpoints === "yes",
      "已核对 ≥6 Points 姓名证明",
      a.sixpoints === "no"
        ? "姓名证明不足6分"
        : "尚未确认6 Points（不同证件可用文件不同，须按本类型重新核对）",
    );
    check(a.dob === "yes", "有合格出生日期证明", "缺出生日期证明或未确认");
    if (enhanced) {
      if (a.citizen === "no")
        blocked.push("Enhanced 仅限美国公民，非美国公民不适用");
      else
        check(
          citizenProof,
          "有美国公民身份证明",
          "需确认美国公民资格并提供公民身份证明",
        );
    } else if (federal || a.purpose === "id")
      check(
        lawful,
        "有相应公民身份 / lawful status 文件",
        "缺 citizenship / 合格 lawful status 文件（只有 EAD 或护照不能直接满足）",
      );
    else met.push("普通非商业驾照 / Permit 不以 lawful status 为条件");
    if (!consistent) missing.push("公民身份和所选文件矛盾，需重新核对");
    const ssnOk = enhanced
      ? ["card", "alternative"].includes(a.ssn)
      : type === "REAL ID"
        ? ["card", "number", "alternative", "ineligible"].includes(a.ssn)
        : ["card", "number", "alternative", "never", "ineligible"].includes(
            a.ssn,
          );
    check(
      ssnOk,
      "已选择适用 Social Security 路径",
      enhanced
        ? "缺原始社安卡；有有效纽约照片证件时可按 ID-44 用显示完整 SSN 的指定税务文件替代；SSN 数字或无资格信不能代替"
        : "需核对 Social Security 路径；REAL ID 的无资格信须30天内并带相应 DHS 文件",
    );
    const needed = federal ? 2 : a.purpose === "id" ? 0 : 1,
      have = Number(a.residency);
    check(
      have >= needed,
      needed
        ? `纽约地址证明已达 ${needed} 份`
        : "Standard Non-Driver ID 无居住证明要求",
      `还缺${Math.max(0, needed - have)}份纽约地址证明`,
    );
    check(
      a.documents === "yes",
      "已核对原件、有效期、全名 / 改名链及必要英译",
      "还需核对原件 / 签发机构认证件、文件有效期、全名、改名连接证明与认证英文翻译",
    );
    result[type] = {
      state: blocked.length
        ? "ineligible"
        : missing.length
          ? "missing"
          : "ready",
      met,
      missing,
      blocked,
    };
  }
  return result;
}

const result = document.getElementById("ridResult");
const names = [
  "purpose",
  "citizen",
  "identity",
  "sixpoints",
  "dob",
  "ssn",
  "residency",
  "documents",
];
document.getElementById("ridChoose")?.addEventListener("click", () => {
  const a = Object.fromEntries(
    names.map((n) => [
      n,
      document.querySelector(`input[name="${n}"]:checked`)?.value || "",
    ]),
  );
  if (names.some((n) => !a[n])) {
    result.innerHTML = "<strong>请先完成上面的选择。</strong>";
    return;
  }
  const outcomes = checkEligibility(a);
  result.innerHTML =
    Object.entries(outcomes)
      .map(
        ([type, r]) =>
          `<section class="rid-type-card" data-eligibility="${type}"><h2>${type}：${r.state === "ready" ? "✅ 基本符合" : r.state === "ineligible" ? "❌ 不适用" : "⚠️ 还缺材料 / 待核对"}</h2>${r.met.length ? `<p>已符合：${r.met.join("；")}。</p>` : ""}${[...r.blocked, ...r.missing].map((x) => `<p>${x}</p>`).join("")}<a href="/usa/dmv/document-checker.html">查看出门材料清单 →</a></section>`,
      )
      .join("") +
    `<h2>用途建议</h2><p>${outcomes["REAL ID"].state === "ready" ? "你基本符合 REAL ID 材料要求；如果希望用驾照乘坐美国国内航班，可优先考虑 REAL ID。" : "先补齐资格材料。美国国内乘机可另外使用 TSA 接受的有效护照等证件。"}${outcomes.Enhanced.state === "ready" ? " 你也基本符合 Enhanced 材料要求；有特定陆路 / 海路返美需求时可考虑，国际航空仍需护照。" : ""}</p><p>本结果是材料预检查。年龄、考试和具体文件真实性仍由 DMV 审核；本页不会收集 SSN、护照号码或移民文件。</p>`;
});

// Explicit initialization signal for reliable production interaction checks.
document.querySelector("#ridChoose")?.setAttribute("data-ready", "true");
