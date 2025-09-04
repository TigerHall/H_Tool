// 更新日期显示和版权年份
function initPage() {
  // 更新日期显示
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const dateElement = document.getElementById("current-date");
  if (dateElement) {
    dateElement.textContent = dateStr;
  }

  // 更新版权年份
  document.getElementById("copyright").textContent = 
    `© ${now.getFullYear()} H_Tool 自制工具集`;
}

// 初始化
document.addEventListener("DOMContentLoaded", initPage);
