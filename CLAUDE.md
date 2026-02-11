# 來去走走一下 - Travel Planner

## 專案概述
日式和風旅行規劃器，提供行程管理、討論建議、記名投票等功能。

## 技術偏好
- 使用 TypeScript 確保型別安全。
- 圖片路徑：預設放在 `/public/images/` 資料夾下。
- 使用 Tailwind CSS 進行樣式設計。
- 使用 Firebase 進行資料庫管理。

## 程式碼風格
- 使用 React 19 開發。
- 使用 Vite 進行建置（dev server port: 3000）。
- 使用 Lucide React 進行圖示。
- 使用 React Hook Form 進行表單管理。
- 使用 React Query 進行資料管理。
- 使用 React Router 進行路由管理。
- 使用 React Toastify 進行提示管理。
- 使用 React Icons 進行圖示管理。
- 使用 React Datepicker 進行日期選擇管理。
- 使用 React Select 進行選擇管理。
- 使用 React Table 進行表格管理。
- 使用 React Modal 進行彈窗管理。
- 使用 React Tooltip 進行提示管理。
- 使用 React Confirm Dialog 進行確認管理。

## 網站風格指南

### 設計主題
- **風格**：和風（日式）暖色調設計，圓潤現代感
- **語言**：繁體中文為主，副標題可用英文

### 色彩系統
| 用途 | 色碼 | 說明 |
|------|------|------|
| 主色（強調） | `#B91C1C` | 深紅色，用於按鈕、標題、重點元素 |
| 背景主色 | `#FDF6F0` | 淺米色，頁面底色 |
| 背景次色 | `#FFFBF7` | 更淺的米白，Sidebar / 卡片內底 |
| 裝飾邊框 | `#E8D5C4` | 暖棕色，分隔線與邊框 |
| 輔助文字 | `#A19183` | 棕灰色，次要說明文字 |
| 主要文字 | `#4A3E3E` | 深棕色，標題文字 |
| 內文文字 | `#6D5D5D` | 中棕色，描述內容 |
| 次要文字 | `#8C7A6B` | 暖灰棕，標籤 / meta 資訊 |
| 選中高亮背景 | `#FFEDED` | 淺粉紅，選中狀態背景 |
| 選中高亮邊框 | `#FFD1D1` | 粉紅色，選中狀態 ring |
| 狀態標籤背景 | `#E8F3E8` | 淺綠，Active 狀態 |
| 狀態標籤文字 | `#2D5A27` | 深綠，Active 文字 |
| 區塊裝飾底色 | `#F5EFE6` | 暖灰米，裝飾區塊 |

### 圓角規範
- 卡片：`rounded-[2rem]`（超大圓角）
- Modal 容器：`rounded-[2.5rem]`
- 按鈕：`rounded-full`（膠囊按鈕）或 `rounded-2xl`
- 輸入框：`rounded-2xl`
- 頭像 / 徽章：`rounded-full`

### 陰影與動效
- 卡片 hover：`hover:shadow-xl hover:-translate-y-1 transition-all duration-300`
- 主按鈕：`shadow-lg shadow-red-200`，hover 加深色
- Modal 背景：`bg-black/50 backdrop-blur-md`
- 投票按鈕：`active:scale-90` / `active:scale-95`

### 字型規範
- 標題：`font-black`（900 weight）
- 次標題 / 按鈕：`font-bold`（700 weight）
- 小標籤：`text-[10px]` + `uppercase tracking-widest`
- 內文：`text-sm`（14px）

### 佈局結構
- 左側 Sidebar（`md:w-72`）+ 右側主內容區
- Sidebar 固定，主內容區 `overflow-y-auto`
- 響應式：手機為上下排列（`flex-col`），桌面為左右排列（`md:flex-row`）

### 元件風格
- **卡片**：白底 + 暖棕邊框 + 超大圓角，圖片上方帶有投票徽章
- **Modal**：置中浮動 + 磨砂背景，表單內底色 `#FFFBF7`
- **按鈕**：膠囊形主按鈕（紅底白字）、幽靈按鈕（文字灰色）
- **投票頭像**：`-space-x-2` 重疊排列，圓形 + 首字母顯示
- **空狀態**：虛線邊框 + 居中提示文字 + 櫻花 emoji

### 裝飾元素
- 和風幾何底紋（SVG pattern，opacity-5）
- Emoji 裝飾：⛩️ 🌸 🎐 🗳️ 💮 🍣 🍡 🍵 🦊
- 右下角版本標籤（`Traveler Edition v2.0`）+ 紅色脈衝圓點
