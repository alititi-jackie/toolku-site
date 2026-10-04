function value(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}
function checkRealId() {
  const six = value("sixpoints"),
    identity = value("identity"),
    ssn = value("ssn"),
    res = value("residency");
  const box = document.getElementById("realIdResult");
  if (!box) return;
  const unanswered = [six, identity, ssn, res].filter((v) => !v).length;
  const sixOk = six === "yes",
    identityOk = identity === "yes",
    ssnOk = ssn === "yes" || ssn === "number" || ssn === "ineligible",
    resOk = res === "2";
  const rows = [
    [
      "6 Points",
      sixOk ? "✓ 已确认" : six === "unsure" ? "? 尚未确认" : "✕ 未选择",
    ],
    [
      "身份 / 合法身份",
      identityOk
        ? "✓ 已确认"
        : identity === "unsure"
          ? "? 需要核对"
          : "✕ 未选择",
    ],
    [
      "Social Security",
      ssnOk ? "✓ 已选择符合路径" : ssn === "unsure" ? "? 需要核对" : "✕ 未选择",
    ],
    [
      "纽约地址证明",
      resOk
        ? "✓ ≥ 2 份"
        : res === "1"
          ? "✕ 还缺 1 份"
          : res === "0"
            ? "✕ 还缺 2 份"
            : "✕ 未选择",
    ],
  ];
  const allOk = sixOk && identityOk && ssnOk && resOk;
  box.className =
    "result-box " + (allOk ? "ok" : unanswered >= 3 ? "bad" : "warn");
  let html = `<strong>${allOk ? "REAL ID 主要条件基本满足" : "你可能还缺或需要确认以下项目"}</strong><div class="result-list">${rows.map((r) => `<div><span>${r[0]}</span><b>${r[1]}</b></div>`).join("")}</div>`;
  if (six !== "yes")
    html +=
      '<p><a href="/usa/dmv/6-points-calculator.html">先检查 6 Points →</a></p>';
  if (allOk)
    html +=
      "<p>主要条件已通过预检查。还要逐份核对文件适用于 REAL ID、全名、原件、有效期、必要认证英译和改名链。下一步建议查看“材料清单”，确认实际去 DMV 要带的原件和具体文件。</p>";
  else
    html +=
      "<p>本结果是中文预检查；身份文件、SSA 文件及地址证明最终是否接受，以纽约 DMV 最新 ID-44 和现场审核为准。</p>";
  box.innerHTML = html;
}
document
  .querySelector("[data-action=checkRealId]")
  ?.addEventListener("click", checkRealId);
// Explicit initialization signal for reliable production interaction checks.
document
  .querySelector("[data-action=checkRealId]")
  ?.setAttribute("data-ready", "true");
