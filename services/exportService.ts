
import JSZip from "jszip";
import { ProjectState, AgentRole } from "../types";

/**
 * 智能 HTML 提取器
 * 能够从复杂的 AI 对话中精准定位并清洗出可运行的网页代码
 */
function extractHtml(content: string): string {
  if (!content) return "";

  // 1. 尝试匹配被 ``` 包裹的代码块 (宽松匹配)
  // 支持 ```html, ```xml, 或者仅仅是 ```
  const codeBlockRegex = /```(?:html|xml|jsx)?\s*([\s\S]*?)\s*```/i;
  const match = content.match(codeBlockRegex);
  
  if (match && match[1]) {
    const code = match[1].trim();
    // 简单验证代码有效性
    if (code.includes("<") && code.includes(">")) {
      return code;
    }
  }

  // 2. 兜底匹配：查找 <!DOCTYPE html> 或 <html> 标签
  const docTypeMatch = content.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
  if (docTypeMatch) return docTypeMatch[0];

  const htmlMatch = content.match(/<html[\s\S]*?<\/html>/i);
  if (htmlMatch) return htmlMatch[0];

  // 3. 最后的兜底：仅仅提取 div (防止只能提取到部分片段)
  const divMatch = content.match(/<div[\s\S]*<\/div>/i);
  if (divMatch) return divMatch[0];

  return "";
}

/**
 * 将项目一键打包为 Windows 系统可用的分发套件
 */
export async function exportProjectAsWindowsPackage(project: ProjectState) {
  try {
    const zip = new JSZip();

    // 1. 系统配置：软件清单 (Manifest)
    const manifest = {
      appName: `AutoForge_${project.id}`,
      version: "1.0.0",
      buildDate: new Date().toISOString(),
      engine: "Neuro-Agent Synthesis Engine",
      entryPoint: "app/index.html"
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    // 2. 项目文档：PRD 与 技术蓝图
    const docs = zip.folder("docs");
    if (docs) {
      const prd = project.steps[AgentRole.PRODUCT]?.versions?.slice(-1)[0]?.content || "等待产品设计...";
      const dev = project.steps[AgentRole.DEVELOPER]?.versions?.slice(-1)[0]?.content || "等待架构设计...";
      docs.file("产品需求说明(PRD).md", prd);
      docs.file("技术架构方案(Blueprint).md", dev);
      
      // 尝试包含 QA 报告
      const qaContent = project.steps[AgentRole.QA]?.versions?.slice(-1)[0]?.content;
      if (qaContent) {
        docs.file("测试验收报告(QA).md", qaContent);
      }
    }

    // 3. 核心应用：构建单页交互原型
    const designerVersion = project.steps[AgentRole.DESIGNER]?.versions?.slice(-1)[0];
    // 使用增强后的提取逻辑
    const sourceHtml = designerVersion ? extractHtml(designerVersion.content) : "";

    const shellHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.originalRequirement.substring(0, 20)} - AutoForge 交付件</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin:0; padding:0; overflow-x: hidden; background: #0f172a; color: #f8fafc; }
        .screen { display: none; min-height: 100vh; animation: fadeIn 0.4s ease-out; }
        .screen.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    </style>
</head>
<body>
    ${sourceHtml || `
    <div class="flex flex-col items-center justify-center min-h-screen text-center p-10">
        <div class="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl animate-bounce">
            <i class="fas fa-microchip text-3xl text-white"></i>
        </div>
        <h1 class="text-3xl font-black mb-4">内容生成为空</h1>
        <p class="text-slate-400 max-w-md">无法从设计文档中提取有效的 HTML 代码结构。这可能是因为模型输出格式不规范。</p>
    </div>
    `}

    <script>
        // 自动导航与激活逻辑
        function navigateTo(screenId) {
            console.log('Navigating to:', screenId);
            const screens = document.querySelectorAll('.screen');
            if (screens.length === 0) return;
            
            screens.forEach(s => s.classList.remove('active'));
            let target = document.getElementById(screenId);
            
            // 尝试模糊匹配
            if (!target) {
                 target = document.querySelector(\`[data-page="\${screenId}"]\`);
            }
            
            if (target) {
                target.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            const screens = document.querySelectorAll('.screen');
            if (screens.length > 0) {
                screens[0].classList.add('active');
            }
        });
    </script>
</body>
</html>
  `.trim();

    zip.file("app/index.html", shellHtml);

    // 4. Windows 引导程序
    const bootScript = `
@echo off
setlocal
chcp 65001 > nul
title AutoForge Project Runner
echo Starting AutoForge Application...
start "" "app\\index.html"
exit
`.trim();

    zip.file("RunApp.bat", bootScript);

    // 5. 最终交付：生成二进制流并触发浏览器下载
    const content = await zip.generateAsync({ 
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });
    
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `交付套件_${project.id}.zip`;
    document.body.appendChild(link);
    link.click();
    
    // 延迟清理资源
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 500);

    return true;

  } catch (err: any) {
    console.error("Export Engine Error:", err);
    throw new Error(err.message || "打包引擎发生未知错误");
  }
}
