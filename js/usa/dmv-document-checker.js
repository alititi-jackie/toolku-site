(() => {
  const result = document.getElementById("dmvResult");
  const selected = () =>
    document.querySelector('input[name="docType"]:checked')?.value || "";
  const data = {
    standard: {
      title: "Standard 材料清单",
      items: [
        "✓ 出生日期（DOB）证明：准备 1 份 DMV 接受的文件",
        "✓ 姓名 / 身份证明：准备能达到 ≥6 Points 的合格文件组合",
        "✓ 纽约地址证明：至少 1 份",
        "✓ Social Security：按 ID-44 中适用于 Standard 的 SSN / 无 SSN 路径准备",
        "✓ Learner Permit / Driver License：需要通过视力测试",
        "✓ MV-44 申请表和办理费用",
      ],
    },
    real: {
      title: "REAL ID 材料清单",
      items: [
        "✓ 姓名证明：满足 ≥6 Points",
        "✓ 公民身份或符合要求的 lawful status 文件",
        "✓ Social Security：原始社安卡，或在 MV-44 填已有 SSN；不符合 SSN 资格时带30天内 SSA 信及交给 SSA 的 DHS 文件",
        "✓ 纽约地址证明：2 份不同合格来源 / 类型",
        "✓ Learner Permit / Driver License：需要通过视力测试",
        "✓ MV-44 申请表和办理费用",
      ],
    },
    enhanced: {
      title: "Enhanced 材料清单",
      items: [
        "✓ 美国公民身份证明（Enhanced 仅限符合条件的美国公民）",
        "✓ 姓名证明：满足 ≥6 Points",
        "✓ 原始社安卡；有有效纽约照片证件时，可按 ID-44 用显示完整 SSN 的 W-2 / SSA-1099 / 1098或1099替代（仅填写号码不适用）",
        "✓ 纽约地址证明：2 份不同合格来源 / 类型",
        "✓ Learner Permit / Driver License：需要通过视力测试",
        "✓ MV-44 申请表和办理费用",
        "✓ Enhanced 额外费用：$30",
      ],
    },
  };
  function render() {
    const type = selected();
    if (!type) {
      result.className = "dmv-result dmv-warn";
      result.innerHTML =
        "<strong>请先选择 Standard、REAL ID 或 Enhanced。</strong>";
      return;
    }
    const d = data[type];
    result.className = "dmv-result dmv-ok";
    result.innerHTML = `<h3>${d.title}</h3><div class="generated-list">${d.items.map((x) => `<div>${x}</div>`).join("")}</div><p class="result-note">这是一份出门前简化清单，不代表某一张具体文件一定被接受。还应携带改名连接证明及必要认证英文翻译。请用纽约 DMV Document Guide 或最新 ID-44 核对你的具体文件、有效期和姓名情况。</p>${type === "real" ? '<p><a href="/usa/dmv/real-id-checker.html">不确定 REAL ID 条件？先检查 →</a></p>' : ""}<p><a href="/usa/dmv/6-points-calculator.html">不确定 6 Points？去计算 →</a></p>`;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  document
    .querySelector("[data-action=checkDmvDocs]")
    ?.addEventListener("click", render);
})();
// Explicit initialization signal for reliable production interaction checks.
document
  .querySelector("[data-action=checkDmvDocs]")
  ?.setAttribute("data-ready", "true");
