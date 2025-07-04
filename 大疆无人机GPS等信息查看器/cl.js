// DOM元素
const folderSelectBtn = document.getElementById("folder-select-btn");
const folderInput = document.getElementById("folder-input");
const pptDownloadBtn = document.getElementById("ppt-download-btn");
const loadingOverlay = document.getElementById("loading-overlay");
const emptyState = document.getElementById("empty-state");
const resultsContainer = document.getElementById("results-container");
const photoList = document.getElementById("photo-list");
const loadingStatus = document.getElementById("loading-status");
const loadedText = document.getElementById("loaded-text");

// 存储所有照片数据的数组
let allPhotos = [];

// PPT下载按钮点击事件
pptDownloadBtn.addEventListener("click", () => {
  // 检查PPT生成器是否已加载
  if (!window.PPTGenerator || !window.pptGenerator) {
    alert("PPT生成功能初始化失败，请刷新页面重试");
    console.error(
      "PPTGenerator未定义:",
      window.PPTGenerator,
      window.pptGenerator
    );
    return;
  }

  pptDownloadBtn.disabled = true;
  pptDownloadBtn.innerHTML =
    '<i class="fa fa-spinner fa-spin mr-2"></i><span>正在生成PPT...</span>';

  try {
    window.pptGenerator
      .generate(allPhotos)
      .then(() => {
        pptDownloadBtn.disabled = false;
        pptDownloadBtn.innerHTML =
          '<i class="fa fa-download mr-2"></i><span>导出PPT</span>';
      })
      .catch((error) => {
        console.error("生成PPT失败:", error);
        alert("生成PPT时出错，请重试");
        pptDownloadBtn.disabled = false;
        pptDownloadBtn.innerHTML =
          '<i class="fa fa-download mr-2"></i><span>导出PPT</span>';
      });
  } catch (e) {
    console.error("调用PPT生成器失败:", e);
    alert("PPT生成功能不可用，请刷新页面重试");
    pptDownloadBtn.disabled = false;
    pptDownloadBtn.innerHTML =
      '<i class="fa fa-download mr-2"></i><span>导出PPT</span>';
  }
});

// 懒加载相关参数
const initialLoadCount = 100; // 初始加载数量
const loadMoreCount = 50; // 每次滚动加载数量
const loadMoreThreshold = window.innerHeight * 3; // 距离底部三倍视口高度时加载更多
let isLoading = false; // 是否正在加载
let hasMoreToLoad = true; // 是否还有更多数据可以加载

// 选择文件夹按钮点击事件
folderSelectBtn.addEventListener("click", () => {
  folderInput.click();
});

// 文件夹选择事件
folderInput.addEventListener("change", async (e) => {
  const files = e.target.files;
  if (files.length === 0) return;

  // 重置界面
  resetResults();

  // 重置数据
  allPhotos = [];

  // 显示加载状态
  loadingOverlay.classList.remove("hidden");
  emptyState.classList.add("hidden");

  // 处理所有文件
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg")
    ) {
      try {
        const exifData = await readExifData(file);
        allPhotos.push({ file, exifData });
      } catch (error) {
        console.error(`处理文件 ${file.name} 时出错:`, error);
      }
    }
  }

  // 隐藏加载状态
  loadingOverlay.classList.add("hidden");

  // 如果有照片，显示结果容器
  if (allPhotos.length > 0) {
    resultsContainer.classList.remove("hidden");
    pptDownloadBtn.disabled = false;
    loadInitialPhotos();
    setupScrollListener();
  } else {
    pptDownloadBtn.disabled = true;
  }
});

// 重置结果
function resetResults() {
  photoList.innerHTML = "";
  resultsContainer.classList.add("hidden");
  // 清除可能存在的总照片数显示
  const existingTotalCount = document.querySelector('.photo-count-display');
  if (existingTotalCount) {
    existingTotalCount.remove();
  }
}

// 读取照片EXIF数据
function readExifData(file) {
  return new Promise((resolve, reject) => {
    try {
      EXIF.getData(file, function () {
        try {
          const exifData = EXIF.getAllTags(this);
          resolve(exifData);
        } catch (e) {
          console.warn(`解析${file.name}的EXIF数据时出错:`, e);
          resolve({});
        }
      });
    } catch (e) {
      console.warn(`读取${file.name}的EXIF数据时出错:`, e);
      resolve({});
    }
  });
}

// 初始加载照片
function loadInitialPhotos() {
  // 添加总照片数显示
  const totalCountElement = document.createElement('div');
  totalCountElement.className = 'photo-count-display text-right mb-4';
  totalCountElement.innerHTML = `
    <span class="bg-primary text-white px-3 py-1 rounded-full text-sm">
      共 ${allPhotos.length} 张照片
    </span>
  `;
  photoList.parentNode.insertBefore(totalCountElement, photoList);
  
  loadPhotos(initialLoadCount);
}

// 加载更多照片
function loadMorePhotos() {
  if (isLoading) return;
  isLoading = true;
  loadPhotos(loadMoreCount);
  isLoading = false;
}

// 加载照片
function loadPhotos(count) {
  const loadedCount = photoList.querySelectorAll(".exif-item").length;
  const loadCount = Math.min(count, allPhotos.length - loadedCount);

  // 直接同步加载所有照片
  for (let i = 0; i < loadCount; i++) {
    const index = loadedCount + i;
    const { file, exifData } = allPhotos[index];
    const exifItem = createExifItem(file, exifData, index);
    photoList.appendChild(exifItem);
  }

  hasMoreToLoad = loadedCount + loadCount < allPhotos.length;

  // 只在加载完成时显示提示
  if (!hasMoreToLoad) {
    loadingStatus.classList.remove("hidden");
    loadedText.classList.remove("hidden");
  } else {
    loadingStatus.classList.add("hidden");
  }
}

// 创建照片项
function createExifItem(file, exifData, index) {
  const exifItem = document.createElement("div");
  exifItem.className = "exif-item bg-white p-4 rounded-lg";

  // 创建临时URL用于查看图片
  const objectUrl = URL.createObjectURL(file);

  // 格式化GPS坐标 - 优先使用十进制度信息
  let gpsInfo = "";
  if (exifData) {
    // 检查是否存在十进制度GPS信息
    const hasDecimalCoords =
      exifData.GPSLatitudeDecimal && exifData.GPSLongitudeDecimal;
    const hasDMScoords = exifData.GPSLatitude && exifData.GPSLongitude;

    if (hasDecimalCoords) {
      // 使用现成的十进制度坐标
      gpsInfo = `纬度: ${exifData.GPSLatitudeDecimal.toFixed(
        6
      )}<br>经度: ${exifData.GPSLongitudeDecimal.toFixed(6)}`;
    } else if (hasDMScoords) {
      // 备用方案：转换度分秒格式
      const lat = convertDMSToDD(exifData.GPSLatitude, exifData.GPSLatitudeRef);
      const lng = convertDMSToDD(
        exifData.GPSLongitude,
        exifData.GPSLongitudeRef
      );
      gpsInfo = `纬度: ${lat.toFixed(6)}<br>经度: ${lng.toFixed(6)}`;
    }
  }

  // 获取相机信息
  const cameraModel = exifData.Model || "未知相机";
  let dateTaken = exifData.DateTimeOriginal || "Invalid Date";
  // 格式化日期为YYYY-MM-DD HH:MM:SS
  if (dateTaken !== "Invalid Date") {
    dateTaken = dateTaken.replace(
      /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
      "$1-$2-$3 $4:$5:$6"
    );
  }
  const focalLength = exifData.FocalLength
    ? `${exifData.FocalLength}mm`
    : "未知焦距";
  const aperture = exifData.FNumber ? `f/${exifData.FNumber}` : "未知光圈";
  const exposureTime = exifData.ExposureTime
    ? getExposureTime(exifData.ExposureTime)
    : "未知快门";

  // 获取高度信息
  const altitude = exifData.GPSAltitude
    ? `${exifData.GPSAltitude.toFixed(1)}m`
    : "";

  // 设置项目内容
  exifItem.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-3">
      <div>
        <h3 class="font-semibold text-lg"><span class="text-primary">${index + 1}/${allPhotos.length}</span> - ${file.name}</h3>
      </div>
      <div class="mt-2 md:mt-0">
        <a href="${objectUrl}" target="_blank" class="text-primary hover:text-primary/80 flex items-center">
          <i class="fa fa-external-link mr-1"></i>
          <span>查看图片</span>
        </a>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-gray-50 p-3 rounded-lg">
        <h4 class="font-semibold text-gray-700 mb-2">相机信息</h4>
        <div class="space-y-1.5 text-sm">
          <div class="flex items-start">
            <span class="w-24 text-gray-600">相机型号:</span>
            <span class="font-medium">${cameraModel}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 text-gray-600">拍摄日期:</span>
            <span class="font-medium">${dateTaken}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 text-gray-600">焦距:</span>
            <span class="font-medium">${focalLength}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 text-gray-600">光圈:</span>
            <span class="font-medium">${aperture}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 text-gray-600">快门速度:</span>
            <span class="font-medium">${exposureTime}</span>
          </div>
        </div>
      </div>

      <div class="bg-gray-50 p-3 rounded-lg">
        <h4 class="font-semibold text-gray-700 mb-2">飞行与位置信息</h4>
        <div class="space-y-1.5 text-sm">
          ${
            gpsInfo
              ? gpsInfo
                  .split("<br>")
                  .map(
                    (info) => `
            <div class="flex items-start">
              <span class="w-24 text-gray-600">${info.split(":")[0]}:</span>
              <span class="font-medium">${info.split(":")[1]}</span>
            </div>
          `
                  )
                  .join("")
              : '<div class="text-gray-500">无GPS信息</div>'
          }
          ${
            altitude
              ? `
            <div class="flex items-start">
              <span class="w-24 text-gray-600">飞行高度:</span>
              <span class="font-medium">${altitude}</span>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;

  return exifItem;
}

// 设置滚动监听
function setupScrollListener() {
  let lastScrollTime = 0;
  const throttleTime = 300;

  window.addEventListener("scroll", (e) => {
    const now = Date.now();
    if (now - lastScrollTime > throttleTime) {
      lastScrollTime = now;
      handleScroll();
    }
  });
}

// 处理滚动事件
function handleScroll() {
  if (isLoading || !hasMoreToLoad) return;

  const scrollPosition = window.innerHeight + window.scrollY;
  const documentHeight = document.body.offsetHeight;

  if (scrollPosition >= documentHeight - loadMoreThreshold) {
    loadMorePhotos();
  }
}

// 将度分秒转换为十进制度数
function convertDMSToDD(dms, ref) {
  let degrees = dms[0];
  let minutes = dms[1];
  let seconds = dms[2];

  let dd = degrees + minutes / 60 + seconds / (60 * 60);

  if (ref === "S" || ref === "W") {
    dd = -dd;
  }

  return dd;
}

// 获取人类可读的快门速度
function getExposureTime(time) {
  if (time < 1) {
    const denominator = Math.round(1 / time);
    return `1/${denominator}s`;
  } else {
    return `${time.toFixed(1)}s`;
  }
}
