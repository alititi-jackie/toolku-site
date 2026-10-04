import { checkEligibility } from "../lib/dmv-eligibility.js";
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
