console.log("开始加载ppt-generator.js");

// 检查PptxGenJS是否可用
if (typeof PptxGenJS === "undefined") {
  console.error("PptxGenJS未定义，请确保已正确加载pptxgenjs库");
  throw new Error("PptxGenJS库加载失败");
}

// 全局PPT生成器实例
window.PPTGenerator = class {
  constructor() {
    try {
      // 尝试两种可能的库导出方式
      const PptxGen = window.PptxGenJS || window.PptxGenJS.default;
      if (!PptxGen) {
        throw new Error("无法找到PptxGenJS构造函数");
      }
      this.ppt = new PptxGen();
      this.slide = null;
    } catch (e) {
      console.error("PPT生成器初始化失败:", e);
      throw e;
    }
  }

  // 生成PPTX文件
  generate(allPhotos) {
    return new Promise((resolve, reject) => {
      try {
        // 创建新演示文稿
        this.ppt = new PptxGenJS();
        this.ppt.author = "大疆无人机照片信息查看器";
        this.ppt.company = "无人机用户";

        // 为每张照片创建幻灯片
        const slidePromises = allPhotos.map((photo) =>
          this.addPhotoSlide(photo)
        );

        Promise.all(slidePromises).then(() => {
          // 生成并下载PPTX文件
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          const fileName = `无人机照片信息_${year}年${month}月${day}日${hours}时${minutes}分${seconds}秒.pptx`;
          this.ppt.writeFile({ fileName }).then(() => {
            resolve(true);
          });
        });
      } catch (error) {
        console.error("生成PPTX时出错:", error);
        reject(false);
      }
    });
  }

  // 添加照片幻灯片
  addPhotoSlide(photo) {
    return new Promise((resolve) => {
      const { file, exifData } = photo;
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          // 确保每次创建新幻灯片
          const slide = this.ppt.addSlide();

          // 创建临时图片元素获取实际尺寸
          const img = new Image();
          img.src = e.target.result;

          img.onload = () => {
            try {
              // 根据实际PPT尺寸计算(25.4cm x 14.288cm)
              const pptWidth = 10; // 英寸
              const pptHeight = 5.625; // 英寸

              // 计算图片显示尺寸(占幻灯片80%高度)
              const aspectRatio = img.width / img.height;
              const maxHeight = pptHeight;
              const displayHeight = maxHeight;
              const displayWidth = maxHeight * aspectRatio;

              // 精确居中显示图片
              const xPos = (pptWidth - displayWidth) / 2;
              const yPos = (pptHeight - displayHeight) / 2;

              // 添加图片
              slide.addImage({
                data: e.target.result,
                x: xPos,
                y: yPos,
                w: displayWidth,
                h: displayHeight,
              });

              // 提取并格式化相机信息
              const cameraModel = exifData?.Model || "未知相机";
              let dateTaken = exifData?.DateTimeOriginal || "";

              // 格式化日期
              if (dateTaken) {
                dateTaken = dateTaken.replace(
                  /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
                  "$1-$2-$3 $4:$5:$6"
                );
              }

              // 提取并格式化GPS信息
              let gpsInfo = "";
              if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
                const lat = this.convertDMSToDD(
                  exifData.GPSLatitude,
                  exifData.GPSLatitudeRef
                );
                const lng = this.convertDMSToDD(
                  exifData.GPSLongitude,
                  exifData.GPSLongitudeRef
                );
                gpsInfo =
                  ` ${lat.toFixed(6)}°${exifData.GPSLatitudeRef || ""} ` +
                  ` ${lng.toFixed(6)}°${exifData.GPSLongitudeRef || ""}`;
              }

              // 构建信息文本(包含完整GPS信息)
              const infoLines = [
                // ` ${file.name}`,
                ` ${cameraModel ? "DJI " + cameraModel : "未知相机"}`,
                ` ${dateTaken || "未知"}`,
                `${gpsInfo}${
                  exifData?.GPSAltitude
                    ? ` ${exifData.GPSAltitude.toFixed(1)}m`
                    : ""
                }`,
              ].filter(Boolean);

              // 添加信息框(位于图片左下角)
              if (infoLines.length > 0) {
                slide.addText(infoLines.join("\n"), {
                  x: xPos + 0.2,
                  y: yPos + displayHeight - 0.8, // 减小偏移量使文字更靠近底部
                  w: displayWidth - 0.4,
                  h: 0.6,
                  fontSize: 8,
                  fontFace: "微软雅黑",
                  color: "FFFFFF",
                  align: "left",
                  bold: true,
                  fill: { color: "000000", transparency: 100 },
                  outline: { size: 0.3, color: "000000" }, // 添加0.5pt黑色描边
                  margin: 0.5,
                });
              }

              resolve();
            } catch (error) {
              console.error("处理图片时出错:", error);
              resolve(); // 继续处理下一张
            }
          };
        } catch (error) {
          console.error("处理文件时出错:", error);
          resolve(); // 即使出错也继续处理下一张图片
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // 将度分秒转换为十进制度数
  convertDMSToDD(dms, ref) {
    let degrees = dms[0];
    let minutes = dms[1];
    let seconds = dms[2];

    let dd = degrees + minutes / 60 + seconds / (60 * 60);

    if (ref === "S" || ref === "W") {
      dd = -dd;
    }

    return dd;
  }
};

// 创建全局实例
window.pptGenerator = new PPTGenerator();
console.log("PPTGenerator初始化完成", window.pptGenerator);
