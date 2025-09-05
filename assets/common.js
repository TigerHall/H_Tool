// 加载并渲染链接
async function loadLinks() {
  try {
    const response = await fetch('assets/links.json');
    const data = await response.json();
    const grid = document.querySelector('.grid');
    
    if (grid) {
      grid.innerHTML = data.links
        .filter(link => link.title) // 过滤掉没有标题的项
        .map(link => {
          // 只渲染存在的字段
          const elements = [
            link.url ? `href="${link.url}"` : '',
            link.image ? `style="background-image: url('${link.image}')"` : ''
          ].join(' ');
          
          return `
            <a href="${link.url || '#'}" class="tool-card">
              <div class="card-content">
                <h3>${link.title}</h3>
                ${link.description ? `<p class="description">${link.description}</p>` : ''}
              </div>
            </a>
          `;
        })
        .join('');
    }
  } catch (error) {
    console.error('加载链接失败:', error);
    // 显示错误信息
    const grid = document.querySelector('.grid');
    if (grid) {
      grid.innerHTML = '<p class="error">加载工具列表失败，请稍后再试</p>';
    }
  }
}

// 初始化页面
function initPage() {
  // 加载链接
  loadLinks();
}

// 初始化
document.addEventListener("DOMContentLoaded", initPage);
