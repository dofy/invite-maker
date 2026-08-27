(function () {
  'use strict';

  var LANGUAGE_KEY = 'invite-maker-language';
  var THEME_KEY = 'invite-maker-theme';
  var SUPPORTED_LANGUAGES = ['zh-CN', 'zh-TW', 'en', 'de', 'ja', 'ko', 'es', 'fr'];
  var THEME_VALUES = ['auto', 'light', 'dark'];
  var systemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  var messages = {
    'zh-CN': {
      common: {
        navLabel: '站点信息', about: '关于', privacy: '隐私', terms: '条款', contact: '联系',
        languageLabel: '语言', themeLabel: '主题', auto: '自动', light: '浅色', dark: '深色', back: '返回编辑器'
      },
      about: {
        title: '关于 Tsudoi｜隐私优先的在线邀请函生成器',
        description: '了解 Tsudoi 在线邀请函生成器的产品目标、隐私原则、技术架构、开源仓库与联系渠道。',
        h1: '关于 Tsudoi',
        lede: 'Tsudoi 是一款免费、开源、隐私优先的在线邀请函生成器，帮助用户从一张设计底图制作单张或整批个性化邀请函。',
        sections: [
          { title: '产品目标', body: ['Tsudoi 将可视化文字排版、CSV/TXT 数据填充与高清图片导出整合在浏览器中。用户可以直接拖动文本、调整样式和锚点，预览名单中的任意记录，并生成原图分辨率 PNG 或批量 ZIP。'] },
          { title: '设计原则', items: [
            { title: '所见即所得', body: '编辑预览与最终导出复用同一套 Canvas 场景、文字配置和百分比坐标，减少预览与成品之间的布局差异。' },
            { title: '素材留在设备上', body: '底图、名单、模板和生成文件都在当前浏览器内处理。编辑器会在浏览器站点数据中自动保存并恢复上一次工作区；产品不包含素材上传接口，也不依赖服务端图片渲染。' },
            { title: '开放且可验证', body: '项目源码与开发记录公开保存在 <a href="https://github.com/dofy/invite-maker">GitHub 仓库</a>。产品建议、兼容性报告或其他问题可以通过 <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> 联系维护者。' }
          ] },
          { title: '技术依据', body: ['本地文件读取使用浏览器 <a href="https://developer.mozilla.org/docs/Web/API/File_API">File API</a>，图片绘制与导出使用 <a href="https://developer.mozilla.org/docs/Web/API/Canvas_API">Canvas API</a>，离线支持基于 <a href="https://developer.mozilla.org/docs/Web/API/Service_Worker_API">Service Worker API</a>。相关链接指向 MDN 技术文档。'] }
        ]
      },
      privacy: {
        title: 'Tsudoi 隐私政策｜底图与名单仅在本地处理',
        description: 'Tsudoi 隐私政策：底图、名单、模板与生成结果在浏览器本地处理，并说明工作区自动保存、站点请求、字体和离线缓存。',
        h1: '隐私政策', meta: '发布日期：<time datetime="2026-08-26">2026-08-26</time> · 最近更新：<time datetime="2026-08-27">2026-08-27</time>',
        lede: 'Tsudoi 的核心隐私原则很简单：用于制作邀请函的素材在你的设备上处理，不会被上传到 Tsudoi 的服务器。',
        sections: [
          { title: '本地处理的内容', notice: true, body: ['你选择的底图、CSV/TXT 名单、模板 JSON、画布状态以及生成的 PNG/ZIP 均由当前浏览器处理。Tsudoi 没有接收这些内容的上传接口，也不提供服务端图片合成功能。'] },
          { title: '站点运行产生的请求', body: ['访问网页时，浏览器会向 Cloudflare Pages 请求 HTML、JavaScript、CSS、图标和占位图片。托管服务可能按照其基础设施政策处理常规网络信息，例如 IP 地址、User-Agent、请求时间和错误日志。Tsudoi 应用源码未集成广告 SDK 或行为分析 SDK。'] },
          { title: '字体与第三方链接', body: ['网络字体来自 Google Fonts。浏览器连接 Google Fonts 时，Google 可能收到常规网络请求信息；如果字体服务不可用，Tsudoi 会使用系统字体回退。访问 GitHub、MDN 或其他外部链接时，目标网站适用其自己的隐私政策。'] },
          { title: '本地存储与离线缓存', body: ['Tsudoi 使用浏览器本地存储保存界面语言与主题偏好，并使用 IndexedDB 自动保存上一次编辑工作区，包括底图、文字图层、画布设置和已导入的 CSV/TXT 名单，以便刷新或重新打开页面后恢复。工作区保留在当前浏览器中，直到被新数据覆盖，或由你通过编辑器高级功能中的“重置工作区数据”按钮或浏览器的站点数据设置清除。Service Worker 还会缓存应用静态资源以支持离线使用。'] },
          { title: '联系我们', body: ['如对隐私说明有疑问，请在 <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> 中提交问题。请勿在公开 Issue 中附上真实名单、私人底图或其他敏感信息。'] }
        ]
      },
      terms: {
        title: 'Tsudoi 使用条款｜在线邀请函生成工具',
        description: 'Tsudoi 使用条款：说明工具用途、用户内容责任、本地数据处理、服务可用性、功能变更和问题反馈渠道。',
        h1: '使用条款', meta: '生效日期：<time datetime="2026-08-27">2026-08-27</time>',
        lede: '使用 Tsudoi 即表示你同意在合法、谨慎且尊重他人权利的前提下使用本工具。',
        sections: [
          { title: '工具用途', body: ['Tsudoi 提供邀请函文字排版、CSV/TXT 数据填充、模板导入导出、单张 PNG 与批量 ZIP 生成功能。工具免费提供，主要计算在用户浏览器内完成。'] },
          { title: '用户内容与责任', body: ['你应确保有权使用所选择的图片、字体、文字和名单数据，并对生成内容及其分发负责。不得利用本工具侵犯隐私、知识产权或其他合法权益，也不得制作或传播违法内容。'] },
          { title: '隐私与数据', body: ['底图、名单、模板和生成结果在浏览器本地处理，具体说明见 <a href="/privacy.html">隐私政策</a>。请自行保管原始素材与导出文件，并在处理真实名单时采取适当的数据保护措施。'] },
          { title: '可用性与结果', body: ['Tsudoi 按现状提供。不同浏览器、设备性能、字体服务和文件内容可能影响排版或批量生成结果。正式分发前请检查预览与导出图片，并为重要素材保留备份。'] },
          { title: '功能与条款变更', body: ['项目可能修复问题、调整功能或更新这些条款。重要变更会通过源码仓库与页面更新时间反映；继续使用更新后的版本即表示接受当时有效的条款。'] },
          { title: '联系与反馈', body: ['兼容性问题、功能建议或条款疑问可以通过 <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> 提交。'] }
        ]
      }
    },
    'zh-TW': {
      common: {
        navLabel: '網站資訊', about: '關於', privacy: '隱私', terms: '條款', contact: '聯絡',
        languageLabel: '語言', themeLabel: '主題', auto: '自動', light: '淺色', dark: '深色', back: '返回編輯器'
      },
      about: {
        title: '關於 Tsudoi｜隱私優先的線上邀請函產生器',
        description: '了解 Tsudoi 線上邀請函產生器的產品目標、隱私原則、技術架構、開源儲存庫與聯絡方式。',
        h1: '關於 Tsudoi',
        lede: 'Tsudoi 是一款免費、開源、隱私優先的線上邀請函產生器，協助使用者從一張設計底圖製作單張或整批個人化邀請函。',
        sections: [
          { title: '產品目標', body: ['Tsudoi 將視覺化文字排版、CSV/TXT 資料填入與高畫質圖片匯出整合在瀏覽器中。你可以直接拖曳文字、調整樣式與錨點、預覽名單中的任一筆資料，並產生原圖解析度 PNG 或批次 ZIP。'] },
          { title: '設計原則', items: [
            { title: '所見即所得', body: '編輯預覽與最終匯出共用同一套 Canvas 場景、文字設定與百分比座標，以減少預覽與成品之間的版面差異。' },
            { title: '素材留在裝置上', body: '底圖、名單、範本與產生的檔案都在目前的瀏覽器內處理。編輯器會在瀏覽器網站資料中自動儲存並還原上一次工作區；產品不含素材上傳介面，也不依賴伺服器端圖片渲染。' },
            { title: '開放且可驗證', body: '專案原始碼與開發紀錄公開存放於 <a href="https://github.com/dofy/invite-maker">GitHub 儲存庫</a>。產品建議、相容性回報或其他問題可透過 <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> 聯絡維護者。' }
          ] },
          { title: '技術依據', body: ['本機檔案讀取使用瀏覽器 <a href="https://developer.mozilla.org/docs/Web/API/File_API">File API</a>，圖片繪製與匯出使用 <a href="https://developer.mozilla.org/docs/Web/API/Canvas_API">Canvas API</a>，離線支援則基於 <a href="https://developer.mozilla.org/docs/Web/API/Service_Worker_API">Service Worker API</a>。相關連結會前往 MDN 技術文件。'] }
        ]
      },
      privacy: {
        title: 'Tsudoi 隱私權政策｜底圖與名單僅在本機處理',
        description: 'Tsudoi 隱私權政策：底圖、名單、範本與產生結果在瀏覽器本機處理，並說明工作區自動儲存、網站請求、字型與離線快取。',
        h1: '隱私權政策', meta: '發布日期：<time datetime="2026-08-26">2026-08-26</time> · 最近更新：<time datetime="2026-08-27">2026-08-27</time>',
        lede: 'Tsudoi 的核心隱私原則很簡單：用於製作邀請函的素材在你的裝置上處理，不會上傳到 Tsudoi 的伺服器。',
        sections: [
          { title: '在本機處理的內容', notice: true, body: ['你選擇的底圖、CSV/TXT 名單、範本 JSON、畫布狀態以及產生的 PNG/ZIP 均由目前的瀏覽器處理。Tsudoi 沒有接收這些內容的上傳介面，也不提供伺服器端圖片合成功能。'] },
          { title: '網站運作產生的請求', body: ['瀏覽網頁時，瀏覽器會向 Cloudflare Pages 請求 HTML、JavaScript、CSS、圖示與預留位置圖片。託管服務可能依其基礎設施政策處理一般網路資訊，例如 IP 位址、User-Agent、請求時間與錯誤日誌。Tsudoi 應用程式原始碼未整合廣告 SDK 或行為分析 SDK。'] },
          { title: '字型與第三方連結', body: ['網路字型來自 Google Fonts。瀏覽器連線至 Google Fonts 時，Google 可能收到一般網路請求資訊；若字型服務無法使用，Tsudoi 會改用系統字型。造訪 GitHub、MDN 或其他外部連結時，適用目標網站自己的隱私權政策。'] },
          { title: '本機儲存與離線快取', body: ['Tsudoi 使用瀏覽器本機儲存保存介面語言與主題偏好，並使用 IndexedDB 自動保存上一次編輯工作區，包括底圖、文字圖層、畫布設定與已匯入的 CSV/TXT 名單，以便重新整理或再次開啟後還原。工作區會留在目前瀏覽器中，直到被新資料覆蓋，或由你透過編輯器進階功能中的「重設工作區資料」按鈕或瀏覽器的網站資料設定清除。Service Worker 也會快取應用程式靜態資源以支援離線使用。'] },
          { title: '聯絡我們', body: ['若對隱私說明有疑問，請在 <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> 提交問題。請勿在公開 Issue 中附上真實名單、私人底圖或其他敏感資訊。'] }
        ]
      },
      terms: {
        title: 'Tsudoi 使用條款｜線上邀請函產生工具',
        description: 'Tsudoi 使用條款：說明工具用途、使用者內容責任、本機資料處理、服務可用性、功能變更與問題回報管道。',
        h1: '使用條款', meta: '生效日期：<time datetime="2026-08-27">2026-08-27</time>',
        lede: '使用 Tsudoi 即表示你同意以合法、謹慎且尊重他人權利的方式使用本工具。',
        sections: [
          { title: '工具用途', body: ['Tsudoi 提供邀請函文字排版、CSV/TXT 資料填入、範本匯入匯出、單張 PNG 與批次 ZIP 產生功能。工具免費提供，主要運算在使用者瀏覽器內完成。'] },
          { title: '使用者內容與責任', body: ['你應確保有權使用所選擇的圖片、字型、文字與名單資料，並對產生內容及其散布負責。不得利用本工具侵犯隱私、智慧財產權或其他合法權益，也不得製作或傳播違法內容。'] },
          { title: '隱私與資料', body: ['底圖、名單、範本與產生結果均在瀏覽器本機處理，詳情請見<a href="/privacy.html">隱私權政策</a>。請自行保管原始素材與匯出檔案，並在處理真實名單時採取適當的資料保護措施。'] },
          { title: '可用性與結果', body: ['Tsudoi 依現狀提供。不同瀏覽器、裝置效能、字型服務與檔案內容可能影響排版或批次產生結果。正式散布前請檢查預覽與匯出圖片，並為重要素材保留備份。'] },
          { title: '功能與條款變更', body: ['專案可能修正問題、調整功能或更新這些條款。重要變更會透過原始碼儲存庫與頁面更新時間反映；繼續使用更新後版本，即表示接受當時有效的條款。'] },
          { title: '聯絡與回饋', body: ['相容性問題、功能建議或條款疑問可透過 <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> 提交。'] }
        ]
      }
    },
    en: {
      common: {
        navLabel: 'Site information', about: 'About', privacy: 'Privacy', terms: 'Terms', contact: 'Contact',
        languageLabel: 'Language', themeLabel: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark', back: 'Back to editor'
      },
      about: {
        title: 'About Tsudoi | Privacy-first online invitation maker',
        description: 'Learn about Tsudoi’s product goals, privacy principles, browser-based architecture, open-source repository, and support channels.',
        h1: 'About Tsudoi',
        lede: 'Tsudoi is a free, open-source, privacy-first invitation maker for creating one or many personalized invitations from your own design.',
        sections: [
          { title: 'Product goal', body: ['Tsudoi brings visual text layout, CSV/TXT data binding, and high-resolution image export together in the browser. Drag text, adjust styles and anchors, preview any recipient, then export at the source image resolution as PNG or a batch ZIP.'] },
          { title: 'Design principles', items: [
            { title: 'What you see is what you get', body: 'The editor preview and final export share the same Canvas scene, text configuration, and percentage-based coordinates to minimize layout differences.' },
            { title: 'Your materials stay on your device', body: 'Backgrounds, recipient lists, templates, and generated files are processed in the current browser. The editor saves and restores your last workspace in browser site data; there is no asset-upload endpoint or server-side image renderer.' },
            { title: 'Open and verifiable', body: 'Source code and development history are public in the <a href="https://github.com/dofy/invite-maker">GitHub repository</a>. Send product ideas, compatibility reports, or other questions through <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>.' }
          ] },
          { title: 'Technical foundation', body: ['Local files are read with the browser <a href="https://developer.mozilla.org/docs/Web/API/File_API">File API</a>, images are drawn and exported with the <a href="https://developer.mozilla.org/docs/Web/API/Canvas_API">Canvas API</a>, and offline support uses the <a href="https://developer.mozilla.org/docs/Web/API/Service_Worker_API">Service Worker API</a>. These links lead to MDN documentation.'] }
        ]
      },
      privacy: {
        title: 'Tsudoi Privacy Policy | Backgrounds and lists stay local',
        description: 'Tsudoi processes backgrounds, recipient lists, templates, and generated files locally and explains workspace recovery, hosting requests, fonts, and offline caching.',
        h1: 'Privacy Policy', meta: 'Published: <time datetime="2026-08-26">2026-08-26</time> · Last updated: <time datetime="2026-08-27">2026-08-27</time>',
        lede: 'Tsudoi’s core privacy principle is simple: the materials used to make invitations are processed on your device and are not uploaded to Tsudoi servers.',
        sections: [
          { title: 'Content processed locally', notice: true, body: ['Your selected background, CSV/TXT recipient list, template JSON, canvas state, and generated PNG/ZIP files are processed by the current browser. Tsudoi has no endpoint for uploading this content and no server-side image-compositing service.'] },
          { title: 'Requests needed to run the site', body: ['When you visit, the browser requests HTML, JavaScript, CSS, icons, and placeholder images from Cloudflare Pages. The hosting provider may process routine network information such as IP address, User-Agent, request time, and error logs under its infrastructure policies. Tsudoi’s application code contains no advertising or behavioral analytics SDK.'] },
          { title: 'Fonts and third-party links', body: ['Web fonts are served by Google Fonts. Google may receive ordinary network request information when your browser connects; Tsudoi falls back to system fonts if the service is unavailable. GitHub, MDN, and other external destinations apply their own privacy policies.'] },
          { title: 'Local storage and offline cache', body: ['Tsudoi uses browser local storage for language and theme preferences and IndexedDB to save the last editing workspace, including the background, text layers, canvas settings, and imported CSV/TXT data. This lets the workspace return after a refresh or later visit. It remains in the current browser until replaced or cleared with “Reset workspace data” in Advanced settings or through browser site-data settings. A Service Worker also caches static app resources for offline use.'] },
          { title: 'Contact', body: ['For privacy questions, open an issue in <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>. Do not attach real recipient lists, private backgrounds, or other sensitive information to a public issue.'] }
        ]
      },
      terms: {
        title: 'Tsudoi Terms of Use | Online invitation maker',
        description: 'Tsudoi terms covering intended use, responsibility for user content, local data processing, availability, changes, and feedback.',
        h1: 'Terms of Use', meta: 'Effective: <time datetime="2026-08-27">2026-08-27</time>',
        lede: 'By using Tsudoi, you agree to use the tool lawfully, carefully, and with respect for the rights of others.',
        sections: [
          { title: 'Purpose of the tool', body: ['Tsudoi provides invitation text layout, CSV/TXT data binding, template import and export, single PNG export, and batch ZIP generation. It is offered free of charge, with most computation performed in your browser.'] },
          { title: 'Your content and responsibilities', body: ['You must have the right to use the images, fonts, text, and recipient data you select, and you are responsible for generated content and its distribution. Do not use the tool to violate privacy, intellectual property, other legal rights, or applicable law.'] },
          { title: 'Privacy and data', body: ['Backgrounds, recipient lists, templates, and output are processed locally in the browser as described in the <a href="/privacy.html">Privacy Policy</a>. Keep your own source materials and exports safe, and apply suitable data protection when working with real recipient data.'] },
          { title: 'Availability and output', body: ['Tsudoi is provided as-is. Browser differences, device performance, font services, and file contents may affect layout or batch output. Review previews and exported images before distribution, and keep backups of important materials.'] },
          { title: 'Changes to features and terms', body: ['The project may fix issues, adjust features, or update these terms. Material changes are reflected in the source repository and the update date on this page. Continued use of an updated version means you accept the terms then in effect.'] },
          { title: 'Contact and feedback', body: ['Submit compatibility problems, feature ideas, or questions about these terms through <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>.'] }
        ]
      }
    },
    de: {
      common: {
        navLabel: 'Website-Informationen', about: 'Über', privacy: 'Datenschutz', terms: 'Bedingungen', contact: 'Kontakt',
        languageLabel: 'Sprache', themeLabel: 'Darstellung', auto: 'Automatisch', light: 'Hell', dark: 'Dunkel', back: 'Zurück zum Editor'
      },
      about: {
        title: 'Über Tsudoi | Datenschutzfreundlicher Einladungseditor',
        description: 'Erfahren Sie mehr über Ziele, Datenschutzprinzipien, Browser-Architektur, Open-Source-Repository und Support von Tsudoi.',
        h1: 'Über Tsudoi',
        lede: 'Tsudoi ist ein kostenloser, quelloffener und datenschutzfreundlicher Einladungseditor für einzelne oder viele personalisierte Einladungen auf Basis Ihres eigenen Designs.',
        sections: [
          { title: 'Produktziel', body: ['Tsudoi verbindet visuelles Textlayout, CSV/TXT-Daten und hochauflösenden Bildexport direkt im Browser. Verschieben Sie Texte, passen Sie Stile und Anker an, prüfen Sie beliebige Datensätze und exportieren Sie PNG-Dateien in Originalauflösung oder ein ZIP-Paket.'] },
          { title: 'Gestaltungsprinzipien', items: [
            { title: 'Was Sie sehen, wird exportiert', body: 'Editorvorschau und Export nutzen dieselbe Canvas-Szene, Textkonfiguration und prozentuale Koordinaten, um Layoutunterschiede zu minimieren.' },
            { title: 'Ihre Dateien bleiben auf Ihrem Gerät', body: 'Hintergründe, Empfängerlisten, Vorlagen und erzeugte Dateien werden im aktuellen Browser verarbeitet. Der letzte Arbeitsbereich wird in Browser-Websitedaten gespeichert und wiederhergestellt; es gibt weder einen Upload-Endpunkt noch serverseitiges Bild-Rendering.' },
            { title: 'Offen und überprüfbar', body: 'Quellcode und Entwicklungshistorie sind im <a href="https://github.com/dofy/invite-maker">GitHub-Repository</a> öffentlich. Ideen, Kompatibilitätsberichte und Fragen können über <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> eingereicht werden.' }
          ] },
          { title: 'Technische Grundlage', body: ['Lokale Dateien werden über die Browser-<a href="https://developer.mozilla.org/docs/Web/API/File_API">File API</a> gelesen, Bilder mit der <a href="https://developer.mozilla.org/docs/Web/API/Canvas_API">Canvas API</a> gezeichnet und exportiert und der Offlinebetrieb nutzt die <a href="https://developer.mozilla.org/docs/Web/API/Service_Worker_API">Service Worker API</a>. Die Links führen zur MDN-Dokumentation.'] }
        ]
      },
      privacy: {
        title: 'Tsudoi-Datenschutzerklärung | Dateien bleiben lokal',
        description: 'Tsudoi verarbeitet Hintergründe, Listen, Vorlagen und Ausgaben lokal und erläutert Wiederherstellung, Hosting-Anfragen, Schriften und Offline-Cache.',
        h1: 'Datenschutzerklärung', meta: 'Veröffentlicht: <time datetime="2026-08-26">26.08.2026</time> · Aktualisiert: <time datetime="2026-08-27">27.08.2026</time>',
        lede: 'Das zentrale Datenschutzprinzip von Tsudoi ist einfach: Materialien für Einladungen werden auf Ihrem Gerät verarbeitet und nicht auf Tsudoi-Server hochgeladen.',
        sections: [
          { title: 'Lokal verarbeitete Inhalte', notice: true, body: ['Ausgewählter Hintergrund, CSV/TXT-Empfängerliste, Vorlagen-JSON, Canvas-Status und erzeugte PNG/ZIP-Dateien werden im aktuellen Browser verarbeitet. Tsudoi hat keinen Upload-Endpunkt dafür und keinen serverseitigen Bilddienst.'] },
          { title: 'Für den Betrieb nötige Anfragen', body: ['Beim Besuch lädt der Browser HTML, JavaScript, CSS, Symbole und Platzhalterbilder von Cloudflare Pages. Der Hostinganbieter kann nach seinen Infrastrukturregeln übliche Netzwerkdaten wie IP-Adresse, User-Agent, Anfragezeit und Fehlerprotokolle verarbeiten. Tsudoi enthält keine Werbe- oder Verhaltensanalyse-SDKs.'] },
          { title: 'Schriften und externe Links', body: ['Webschriften kommen von Google Fonts. Beim Verbindungsaufbau kann Google übliche Anfrageinformationen erhalten; ist der Dienst nicht verfügbar, verwendet Tsudoi Systemschriften. Für GitHub, MDN und andere externe Ziele gelten deren eigene Datenschutzregeln.'] },
          { title: 'Lokaler Speicher und Offline-Cache', body: ['Tsudoi speichert Sprache und Darstellung im lokalen Browserspeicher und den letzten Arbeitsbereich in IndexedDB, einschließlich Hintergrund, Textebenen, Canvas-Einstellungen und importierten CSV/TXT-Daten. So wird er nach einem Neuladen oder späteren Besuch wiederhergestellt. Die Daten bleiben im aktuellen Browser, bis sie ersetzt, über „Arbeitsbereichsdaten zurücksetzen“ in den erweiterten Einstellungen oder über die Website-Daten des Browsers gelöscht werden. Ein Service Worker speichert außerdem statische Ressourcen für die Offline-Nutzung.'] },
          { title: 'Kontakt', body: ['Datenschutzfragen können über <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> gestellt werden. Fügen Sie öffentlichen Issues keine echten Empfängerlisten, privaten Hintergründe oder sonstige sensible Daten bei.'] }
        ]
      },
      terms: {
        title: 'Tsudoi-Nutzungsbedingungen | Online-Einladungseditor',
        description: 'Tsudoi-Bedingungen zu Zweck, Verantwortung für Inhalte, lokaler Datenverarbeitung, Verfügbarkeit, Änderungen und Feedback.',
        h1: 'Nutzungsbedingungen', meta: 'Gültig ab: <time datetime="2026-08-27">27.08.2026</time>',
        lede: 'Mit der Nutzung von Tsudoi stimmen Sie einer rechtmäßigen, sorgfältigen und die Rechte anderer achtenden Verwendung zu.',
        sections: [
          { title: 'Zweck des Werkzeugs', body: ['Tsudoi bietet Textlayout für Einladungen, CSV/TXT-Datenbindung, Vorlagenimport und -export, einzelne PNG-Dateien und ZIP-Stapel. Das Werkzeug ist kostenlos; die meisten Berechnungen laufen in Ihrem Browser.'] },
          { title: 'Ihre Inhalte und Verantwortung', body: ['Sie müssen zur Nutzung der ausgewählten Bilder, Schriften, Texte und Empfängerdaten berechtigt sein und tragen die Verantwortung für erzeugte Inhalte und deren Verteilung. Verletzen Sie damit weder Datenschutz, geistiges Eigentum, andere Rechte noch geltendes Recht.'] },
          { title: 'Datenschutz und Daten', body: ['Hintergründe, Empfängerlisten, Vorlagen und Ausgaben werden wie in der <a href="/privacy.html">Datenschutzerklärung</a> beschrieben lokal im Browser verarbeitet. Bewahren Sie Quellen und Exporte sicher auf und schützen Sie echte Empfängerdaten angemessen.'] },
          { title: 'Verfügbarkeit und Ergebnisse', body: ['Tsudoi wird wie besehen bereitgestellt. Browser, Geräteleistung, Schriftdienste und Dateiinhalte können Layout und Stapelausgabe beeinflussen. Prüfen Sie Vorschau und Export vor der Verteilung und sichern Sie wichtige Materialien.'] },
          { title: 'Änderungen an Funktionen und Bedingungen', body: ['Das Projekt kann Fehler beheben, Funktionen anpassen oder diese Bedingungen aktualisieren. Wesentliche Änderungen erscheinen im Quellcode-Repository und im Aktualisierungsdatum dieser Seite. Die weitere Nutzung einer neuen Version gilt als Zustimmung zu den dann gültigen Bedingungen.'] },
          { title: 'Kontakt und Feedback', body: ['Kompatibilitätsprobleme, Funktionsideen oder Fragen zu diesen Bedingungen können über <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> eingereicht werden.'] }
        ]
      }
    },
    ja: {
      common: {
        navLabel: 'サイト情報', about: '概要', privacy: 'プライバシー', terms: '利用規約', contact: 'お問い合わせ',
        languageLabel: '言語', themeLabel: 'テーマ', auto: '自動', light: 'ライト', dark: 'ダーク', back: 'エディターに戻る'
      },
      about: {
        title: 'Tsudoi について｜プライバシー重視の招待状メーカー',
        description: 'Tsudoi の目的、プライバシー原則、ブラウザ内の仕組み、オープンソースリポジトリ、問い合わせ先について説明します。',
        h1: 'Tsudoi について',
        lede: 'Tsudoi は、自分のデザインから一枚または複数のパーソナライズされた招待状を作成できる、無料・オープンソース・プライバシー重視のツールです。',
        sections: [
          { title: '製品の目的', body: ['Tsudoi は、視覚的な文字レイアウト、CSV/TXT データ差し込み、高解像度画像の書き出しをブラウザ内にまとめています。文字をドラッグし、スタイルやアンカーを調整し、任意の宛先をプレビューして、元画像の解像度の PNG または一括 ZIP を作成できます。'] },
          { title: '設計原則', items: [
            { title: '見たままを書き出す', body: '編集プレビューと最終出力は、同じ Canvas シーン、文字設定、パーセント座標を使用し、レイアウトの差を抑えます。' },
            { title: '素材は端末内に保持', body: '背景画像、宛先リスト、テンプレート、生成ファイルは現在のブラウザ内で処理されます。前回の作業内容はブラウザのサイトデータに保存・復元されます。素材アップロード用 API やサーバー側画像レンダリングはありません。' },
            { title: '公開され、検証可能', body: 'ソースコードと開発履歴は <a href="https://github.com/dofy/invite-maker">GitHub リポジトリ</a>で公開しています。提案、互換性報告、質問は <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> へお寄せください。' }
          ] },
          { title: '技術基盤', body: ['ローカルファイルの読み込みにはブラウザの <a href="https://developer.mozilla.org/docs/Web/API/File_API">File API</a>、描画と書き出しには <a href="https://developer.mozilla.org/docs/Web/API/Canvas_API">Canvas API</a>、オフライン対応には <a href="https://developer.mozilla.org/docs/Web/API/Service_Worker_API">Service Worker API</a> を使用します。リンク先は MDN の技術資料です。'] }
        ]
      },
      privacy: {
        title: 'Tsudoi プライバシーポリシー｜画像と名簿は端末内で処理',
        description: '背景画像、宛先リスト、テンプレート、生成物のローカル処理、作業復元、ホスティング通信、フォント、オフラインキャッシュを説明します。',
        h1: 'プライバシーポリシー', meta: '公開日：<time datetime="2026-08-26">2026-08-26</time> · 最終更新：<time datetime="2026-08-27">2026-08-27</time>',
        lede: 'Tsudoi の基本原則はシンプルです。招待状に使う素材はあなたの端末で処理され、Tsudoi のサーバーにはアップロードされません。',
        sections: [
          { title: 'ローカルで処理する内容', notice: true, body: ['選択した背景画像、CSV/TXT 宛先リスト、テンプレート JSON、キャンバス状態、生成した PNG/ZIP は現在のブラウザで処理されます。Tsudoi にはこれらを受け取るアップロード機能やサーバー側画像合成機能はありません。'] },
          { title: 'サイト運営に必要な通信', body: ['アクセス時、ブラウザは Cloudflare Pages から HTML、JavaScript、CSS、アイコン、プレースホルダー画像を取得します。ホスティング事業者はその方針に従い、IP アドレス、User-Agent、リクエスト時刻、エラーログなど通常のネットワーク情報を処理する場合があります。Tsudoi のアプリコードに広告 SDK や行動分析 SDK はありません。'] },
          { title: 'フォントと外部リンク', body: ['Web フォントは Google Fonts から取得します。接続時に Google が通常のネットワーク情報を受け取る場合があります。利用できない場合はシステムフォントに切り替わります。GitHub、MDN など外部サイトでは各サイトのプライバシーポリシーが適用されます。'] },
          { title: 'ローカル保存とオフラインキャッシュ', body: ['言語とテーマ設定はブラウザのローカルストレージに、前回の作業内容は IndexedDB に保存します。背景、文字レイヤー、キャンバス設定、取り込んだ CSV/TXT を含み、再読み込みや再訪問時に復元されます。データは、新しい内容で上書きするか、詳細設定の「作業データをリセット」またはブラウザのサイトデータ設定で削除するまで現在のブラウザに残ります。Service Worker はオフライン利用のため静的リソースもキャッシュします。'] },
          { title: 'お問い合わせ', body: ['プライバシーに関する質問は <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> へお寄せください。公開 Issue に実在の宛先リスト、非公開画像、その他の機密情報を添付しないでください。'] }
        ]
      },
      terms: {
        title: 'Tsudoi 利用規約｜オンライン招待状メーカー',
        description: 'ツールの用途、ユーザーコンテンツの責任、ローカルデータ処理、可用性、変更、フィードバックについて定めます。',
        h1: '利用規約', meta: '発効日：<time datetime="2026-08-27">2026-08-27</time>',
        lede: 'Tsudoi を利用することで、合法かつ慎重に、他者の権利を尊重して本ツールを使用することに同意します。',
        sections: [
          { title: 'ツールの用途', body: ['Tsudoi は招待状の文字レイアウト、CSV/TXT データ差し込み、テンプレートの読み込み・書き出し、単一 PNG と一括 ZIP の生成機能を無料で提供します。主な処理はブラウザ内で行われます。'] },
          { title: 'コンテンツと責任', body: ['選択した画像、フォント、文章、宛先データを利用する権利があることを確認し、生成物とその配布に責任を持ってください。プライバシー、知的財産権、その他の権利や法令を侵害する目的に使用してはなりません。'] },
          { title: 'プライバシーとデータ', body: ['背景、宛先リスト、テンプレート、生成物は、<a href="/privacy.html">プライバシーポリシー</a>に記載のとおりブラウザ内で処理されます。元の素材と出力を自身で管理し、実在する宛先データには適切な保護を行ってください。'] },
          { title: '可用性と出力', body: ['Tsudoi は現状有姿で提供されます。ブラウザ、端末性能、フォントサービス、ファイル内容によってレイアウトや一括出力が変わる場合があります。配布前にプレビューと出力画像を確認し、重要な素材はバックアップしてください。'] },
          { title: '機能と規約の変更', body: ['プロジェクトは不具合修正、機能調整、規約更新を行う場合があります。重要な変更はソースリポジトリとこのページの更新日で示します。更新後も利用を続けた場合、その時点の規約に同意したものとします。'] },
          { title: '連絡とフィードバック', body: ['互換性の問題、機能提案、規約に関する質問は <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a> へお寄せください。'] }
        ]
      }
    },
    ko: {
      common: {
        navLabel: '사이트 정보', about: '소개', privacy: '개인정보', terms: '이용약관', contact: '문의',
        languageLabel: '언어', themeLabel: '테마', auto: '자동', light: '라이트', dark: '다크', back: '편집기로 돌아가기'
      },
      about: {
        title: 'Tsudoi 소개 | 개인정보를 우선하는 온라인 초대장 제작기',
        description: 'Tsudoi의 제품 목표, 개인정보 원칙, 브라우저 기반 구조, 오픈 소스 저장소와 지원 채널을 안내합니다.',
        h1: 'Tsudoi 소개',
        lede: 'Tsudoi는 사용자의 디자인으로 한 장 또는 여러 장의 맞춤 초대장을 만드는 무료 오픈 소스 개인정보 보호 중심 도구입니다.',
        sections: [
          { title: '제품 목표', body: ['Tsudoi는 시각적 텍스트 배치, CSV/TXT 데이터 연결, 고해상도 이미지 내보내기를 브라우저 안에서 제공합니다. 텍스트를 끌고 스타일과 앵커를 조정하며 원하는 수신자를 미리 본 뒤 원본 해상도 PNG 또는 일괄 ZIP으로 내보낼 수 있습니다.'] },
          { title: '설계 원칙', items: [
            { title: '보이는 그대로 출력', body: '편집 미리보기와 최종 내보내기는 동일한 Canvas 장면, 텍스트 설정, 백분율 좌표를 사용해 레이아웃 차이를 줄입니다.' },
            { title: '자료는 기기에 유지', body: '배경, 수신자 목록, 템플릿과 생성 파일은 현재 브라우저에서 처리됩니다. 이전 작업 공간은 브라우저 사이트 데이터에 저장되고 복원됩니다. 자료 업로드 API나 서버 이미지 렌더링은 없습니다.' },
            { title: '공개되고 검증 가능', body: '소스 코드와 개발 기록은 <a href="https://github.com/dofy/invite-maker">GitHub 저장소</a>에 공개되어 있습니다. 제안, 호환성 보고, 질문은 <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>를 이용해 주세요.' }
          ] },
          { title: '기술 기반', body: ['로컬 파일은 브라우저 <a href="https://developer.mozilla.org/docs/Web/API/File_API">File API</a>로 읽고, 이미지는 <a href="https://developer.mozilla.org/docs/Web/API/Canvas_API">Canvas API</a>로 그려 내보내며, 오프라인 지원에는 <a href="https://developer.mozilla.org/docs/Web/API/Service_Worker_API">Service Worker API</a>를 사용합니다. 링크는 MDN 기술 문서로 연결됩니다.'] }
        ]
      },
      privacy: {
        title: 'Tsudoi 개인정보 처리방침 | 배경과 명단은 로컬에서 처리',
        description: '배경, 수신자 목록, 템플릿, 생성 파일의 로컬 처리와 작업 복원, 호스팅 요청, 글꼴, 오프라인 캐시를 설명합니다.',
        h1: '개인정보 처리방침', meta: '게시일: <time datetime="2026-08-26">2026-08-26</time> · 최근 업데이트: <time datetime="2026-08-27">2026-08-27</time>',
        lede: 'Tsudoi의 핵심 원칙은 간단합니다. 초대장 제작 자료는 사용자의 기기에서 처리되며 Tsudoi 서버로 업로드되지 않습니다.',
        sections: [
          { title: '로컬에서 처리하는 콘텐츠', notice: true, body: ['선택한 배경, CSV/TXT 수신자 목록, 템플릿 JSON, 캔버스 상태, 생성한 PNG/ZIP은 현재 브라우저에서 처리됩니다. Tsudoi에는 이를 받는 업로드 엔드포인트나 서버 측 이미지 합성 기능이 없습니다.'] },
          { title: '사이트 실행에 필요한 요청', body: ['방문 시 브라우저는 Cloudflare Pages에서 HTML, JavaScript, CSS, 아이콘과 자리 표시자 이미지를 요청합니다. 호스팅 제공자는 자체 정책에 따라 IP 주소, User-Agent, 요청 시각, 오류 로그 등 일반 네트워크 정보를 처리할 수 있습니다. Tsudoi 앱 코드에는 광고 SDK나 행동 분석 SDK가 없습니다.'] },
          { title: '글꼴과 외부 링크', body: ['웹 글꼴은 Google Fonts에서 제공됩니다. 연결 시 Google이 일반 네트워크 요청 정보를 받을 수 있으며, 서비스를 이용할 수 없으면 시스템 글꼴로 대체됩니다. GitHub, MDN 등 외부 사이트에는 각 사이트의 개인정보 정책이 적용됩니다.'] },
          { title: '로컬 저장소와 오프라인 캐시', body: ['Tsudoi는 언어와 테마 설정을 로컬 스토리지에, 이전 편집 작업 공간을 IndexedDB에 저장합니다. 배경, 텍스트 레이어, 캔버스 설정, 가져온 CSV/TXT를 포함하며 새로고침이나 재방문 시 복원됩니다. 데이터는 새 내용으로 대체하거나 고급 설정의 “작업 공간 데이터 재설정” 또는 브라우저 사이트 데이터 설정으로 삭제할 때까지 현재 브라우저에 남습니다. Service Worker는 오프라인 사용을 위해 정적 리소스도 캐시합니다.'] },
          { title: '문의', body: ['개인정보 관련 질문은 <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>에 남겨 주세요. 공개 Issue에 실제 수신자 목록, 비공개 배경 또는 기타 민감한 정보를 첨부하지 마세요.'] }
        ]
      },
      terms: {
        title: 'Tsudoi 이용약관 | 온라인 초대장 제작기',
        description: '도구의 목적, 사용자 콘텐츠 책임, 로컬 데이터 처리, 가용성, 변경과 피드백에 관한 Tsudoi 이용약관입니다.',
        h1: '이용약관', meta: '시행일: <time datetime="2026-08-27">2026-08-27</time>',
        lede: 'Tsudoi를 사용하면 합법적이고 신중하며 타인의 권리를 존중하는 방식으로 도구를 이용하는 데 동의하게 됩니다.',
        sections: [
          { title: '도구의 목적', body: ['Tsudoi는 초대장 텍스트 배치, CSV/TXT 데이터 연결, 템플릿 가져오기와 내보내기, 단일 PNG와 일괄 ZIP 생성을 무료로 제공합니다. 대부분의 계산은 브라우저에서 이루어집니다.'] },
          { title: '사용자 콘텐츠와 책임', body: ['선택한 이미지, 글꼴, 텍스트와 수신자 데이터를 사용할 권한이 있어야 하며 생성 콘텐츠와 배포에 책임을 져야 합니다. 개인정보, 지식재산권, 기타 권리 또는 법률을 침해하는 용도로 사용하지 마세요.'] },
          { title: '개인정보와 데이터', body: ['배경, 수신자 목록, 템플릿과 결과물은 <a href="/privacy.html">개인정보 처리방침</a>에 설명된 대로 브라우저에서 로컬 처리됩니다. 원본 자료와 결과물을 안전하게 보관하고 실제 수신자 데이터에는 적절한 보호 조치를 적용하세요.'] },
          { title: '가용성과 결과', body: ['Tsudoi는 현재 상태 그대로 제공됩니다. 브라우저, 기기 성능, 글꼴 서비스와 파일 내용이 배치나 일괄 결과에 영향을 줄 수 있습니다. 배포 전에 미리보기와 내보낸 이미지를 확인하고 중요한 자료를 백업하세요.'] },
          { title: '기능과 약관 변경', body: ['프로젝트는 문제를 수정하고 기능이나 약관을 변경할 수 있습니다. 중요한 변경은 소스 저장소와 이 페이지의 업데이트 날짜에 반영됩니다. 업데이트된 버전을 계속 사용하면 당시 적용되는 약관에 동의한 것으로 봅니다.'] },
          { title: '문의와 피드백', body: ['호환성 문제, 기능 제안 또는 약관 질문은 <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>로 제출할 수 있습니다.'] }
        ]
      }
    },
    es: {
      common: {
        navLabel: 'Información del sitio', about: 'Acerca de', privacy: 'Privacidad', terms: 'Términos', contact: 'Contacto',
        languageLabel: 'Idioma', themeLabel: 'Tema', auto: 'Automático', light: 'Claro', dark: 'Oscuro', back: 'Volver al editor'
      },
      about: {
        title: 'Acerca de Tsudoi | Creador de invitaciones privado',
        description: 'Conoce los objetivos, principios de privacidad, arquitectura en el navegador, repositorio abierto y soporte de Tsudoi.',
        h1: 'Acerca de Tsudoi',
        lede: 'Tsudoi es un creador de invitaciones gratuito, de código abierto y centrado en la privacidad para producir una o muchas invitaciones personalizadas a partir de tu diseño.',
        sections: [
          { title: 'Objetivo del producto', body: ['Tsudoi reúne en el navegador la maquetación visual de texto, los datos CSV/TXT y la exportación de imágenes de alta resolución. Arrastra texto, ajusta estilos y anclajes, previsualiza cualquier destinatario y exporta un PNG a la resolución original o un ZIP por lotes.'] },
          { title: 'Principios de diseño', items: [
            { title: 'Lo que ves es lo que exportas', body: 'La vista previa y la exportación final comparten la misma escena Canvas, configuración de texto y coordenadas porcentuales para reducir diferencias de diseño.' },
            { title: 'Tus materiales permanecen en tu dispositivo', body: 'Fondos, listas, plantillas y archivos generados se procesan en el navegador actual. El último espacio de trabajo se guarda y restaura en los datos del sitio; no existe un endpoint de carga ni renderizado de imágenes en el servidor.' },
            { title: 'Abierto y verificable', body: 'El código y el historial de desarrollo son públicos en el <a href="https://github.com/dofy/invite-maker">repositorio de GitHub</a>. Envía ideas, informes de compatibilidad o preguntas mediante <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>.' }
          ] },
          { title: 'Base técnica', body: ['Los archivos locales se leen con la <a href="https://developer.mozilla.org/docs/Web/API/File_API">File API</a>, las imágenes se dibujan y exportan con la <a href="https://developer.mozilla.org/docs/Web/API/Canvas_API">Canvas API</a> y el modo sin conexión usa la <a href="https://developer.mozilla.org/docs/Web/API/Service_Worker_API">Service Worker API</a>. Los enlaces llevan a la documentación de MDN.'] }
        ]
      },
      privacy: {
        title: 'Privacidad de Tsudoi | Fondos y listas permanecen locales',
        description: 'Tsudoi procesa fondos, listas, plantillas y resultados localmente y explica la recuperación, alojamiento, fuentes y caché sin conexión.',
        h1: 'Política de privacidad', meta: 'Publicada: <time datetime="2026-08-26">26-08-2026</time> · Última actualización: <time datetime="2026-08-27">27-08-2026</time>',
        lede: 'El principio central de Tsudoi es sencillo: los materiales de tus invitaciones se procesan en tu dispositivo y no se suben a servidores de Tsudoi.',
        sections: [
          { title: 'Contenido procesado localmente', notice: true, body: ['El fondo seleccionado, la lista CSV/TXT, el JSON de plantilla, el estado del lienzo y los PNG/ZIP generados se procesan en el navegador actual. Tsudoi no dispone de un endpoint para subirlos ni de composición de imágenes en el servidor.'] },
          { title: 'Solicitudes necesarias para el sitio', body: ['Al visitar el sitio, el navegador solicita HTML, JavaScript, CSS, iconos e imágenes de muestra a Cloudflare Pages. El proveedor puede procesar información de red habitual, como dirección IP, User-Agent, hora y errores, conforme a sus políticas. El código de Tsudoi no integra SDK de publicidad ni de análisis de comportamiento.'] },
          { title: 'Fuentes y enlaces externos', body: ['Las fuentes web provienen de Google Fonts. Google puede recibir información normal de la solicitud al conectarse el navegador; si el servicio no está disponible, Tsudoi usa fuentes del sistema. GitHub, MDN y otros destinos externos aplican sus propias políticas.'] },
          { title: 'Almacenamiento local y caché sin conexión', body: ['Tsudoi guarda el idioma y el tema en el almacenamiento local y el último espacio de trabajo en IndexedDB, incluidos el fondo, las capas de texto, el lienzo y los CSV/TXT importados. Así puede restaurarse tras recargar o volver más tarde. Los datos permanecen en el navegador hasta ser sustituidos o eliminados con “Restablecer datos del espacio de trabajo” en ajustes avanzados o desde los datos del sitio del navegador. Un Service Worker también almacena recursos estáticos para uso sin conexión.'] },
          { title: 'Contacto', body: ['Para preguntas de privacidad, abre una incidencia en <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>. No adjuntes listas reales, fondos privados ni otra información sensible a una incidencia pública.'] }
        ]
      },
      terms: {
        title: 'Términos de uso de Tsudoi | Creador de invitaciones',
        description: 'Términos de Tsudoi sobre uso, responsabilidad por contenido, tratamiento local, disponibilidad, cambios y comentarios.',
        h1: 'Términos de uso', meta: 'Vigentes desde: <time datetime="2026-08-27">27-08-2026</time>',
        lede: 'Al usar Tsudoi aceptas utilizar la herramienta de forma legal, cuidadosa y respetando los derechos de otras personas.',
        sections: [
          { title: 'Finalidad de la herramienta', body: ['Tsudoi ofrece maquetación de texto, datos CSV/TXT, importación y exportación de plantillas, PNG individuales y ZIP por lotes. Es gratuito y la mayor parte del cálculo se realiza en tu navegador.'] },
          { title: 'Tu contenido y responsabilidades', body: ['Debes tener derecho a usar las imágenes, fuentes, textos y datos seleccionados, y eres responsable del contenido generado y su distribución. No uses la herramienta para vulnerar la privacidad, la propiedad intelectual, otros derechos ni la ley.'] },
          { title: 'Privacidad y datos', body: ['Fondos, listas, plantillas y resultados se procesan localmente según la <a href="/privacy.html">Política de privacidad</a>. Protege tus materiales y exportaciones y aplica medidas adecuadas al trabajar con datos reales.'] },
          { title: 'Disponibilidad y resultados', body: ['Tsudoi se ofrece tal cual. El navegador, el rendimiento del dispositivo, las fuentes y los archivos pueden afectar el diseño o los lotes. Revisa las vistas previas y exportaciones antes de distribuirlas y conserva copias de seguridad.'] },
          { title: 'Cambios en funciones y términos', body: ['El proyecto puede corregir errores, ajustar funciones o actualizar estos términos. Los cambios importantes aparecen en el repositorio y en la fecha de esta página. Seguir usando una versión actualizada implica aceptar los términos vigentes entonces.'] },
          { title: 'Contacto y comentarios', body: ['Envía problemas de compatibilidad, ideas o preguntas sobre estos términos mediante <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>.'] }
        ]
      }
    },
    fr: {
      common: {
        navLabel: 'Informations du site', about: 'À propos', privacy: 'Confidentialité', terms: 'Conditions', contact: 'Contact',
        languageLabel: 'Langue', themeLabel: 'Thème', auto: 'Automatique', light: 'Clair', dark: 'Sombre', back: 'Retour à l’éditeur'
      },
      about: {
        title: 'À propos de Tsudoi | Créateur d’invitations confidentiel',
        description: 'Découvrez les objectifs, les principes de confidentialité, l’architecture navigateur, le dépôt ouvert et l’assistance de Tsudoi.',
        h1: 'À propos de Tsudoi',
        lede: 'Tsudoi est un créateur d’invitations gratuit, open source et respectueux de la vie privée, conçu pour produire une ou plusieurs invitations personnalisées à partir de votre visuel.',
        sections: [
          { title: 'Objectif du produit', body: ['Tsudoi réunit dans le navigateur la mise en page visuelle du texte, les données CSV/TXT et l’export d’images haute résolution. Déplacez le texte, ajustez styles et ancrages, prévisualisez chaque destinataire, puis exportez un PNG à la résolution d’origine ou un lot ZIP.'] },
          { title: 'Principes de conception', items: [
            { title: 'Le résultat correspond à l’aperçu', body: 'L’aperçu et l’export final partagent la même scène Canvas, les mêmes réglages de texte et les mêmes coordonnées en pourcentage afin de limiter les écarts.' },
            { title: 'Vos fichiers restent sur votre appareil', body: 'Fonds, listes, modèles et fichiers générés sont traités dans le navigateur actuel. Le dernier espace de travail est enregistré et restauré dans les données du site ; aucun endpoint d’envoi ni rendu d’image côté serveur n’est utilisé.' },
            { title: 'Ouvert et vérifiable', body: 'Le code et l’historique de développement sont publics dans le <a href="https://github.com/dofy/invite-maker">dépôt GitHub</a>. Suggestions, rapports de compatibilité et questions peuvent être envoyés via <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>.' }
          ] },
          { title: 'Base technique', body: ['Les fichiers locaux sont lus avec la <a href="https://developer.mozilla.org/docs/Web/API/File_API">File API</a>, les images dessinées et exportées avec la <a href="https://developer.mozilla.org/docs/Web/API/Canvas_API">Canvas API</a>, et le mode hors ligne utilise la <a href="https://developer.mozilla.org/docs/Web/API/Service_Worker_API">Service Worker API</a>. Ces liens mènent à la documentation MDN.'] }
        ]
      },
      privacy: {
        title: 'Confidentialité Tsudoi | Fonds et listes restent locaux',
        description: 'Tsudoi traite localement fonds, listes, modèles et résultats et explique la restauration, l’hébergement, les polices et le cache hors ligne.',
        h1: 'Politique de confidentialité', meta: 'Publication : <time datetime="2026-08-26">26/08/2026</time> · Mise à jour : <time datetime="2026-08-27">27/08/2026</time>',
        lede: 'Le principe de Tsudoi est simple : les éléments de vos invitations sont traités sur votre appareil et ne sont pas envoyés aux serveurs de Tsudoi.',
        sections: [
          { title: 'Contenu traité localement', notice: true, body: ['Le fond choisi, la liste CSV/TXT, le JSON du modèle, l’état du canevas et les PNG/ZIP générés sont traités par le navigateur actuel. Tsudoi ne dispose d’aucun endpoint pour les envoyer ni de service de composition d’image côté serveur.'] },
          { title: 'Requêtes nécessaires au site', body: ['Lors de la visite, le navigateur demande à Cloudflare Pages le HTML, le JavaScript, le CSS, les icônes et les images d’exemple. L’hébergeur peut traiter des informations réseau ordinaires — adresse IP, User-Agent, heure et erreurs — selon ses politiques. Le code de Tsudoi n’intègre aucun SDK publicitaire ni d’analyse comportementale.'] },
          { title: 'Polices et liens externes', body: ['Les polices web proviennent de Google Fonts. Google peut recevoir les informations réseau habituelles lors de la connexion ; Tsudoi utilise des polices système si le service est indisponible. GitHub, MDN et les autres sites externes appliquent leurs propres politiques.'] },
          { title: 'Stockage local et cache hors ligne', body: ['Tsudoi conserve la langue et le thème dans le stockage local, et le dernier espace de travail dans IndexedDB, notamment le fond, les calques de texte, les réglages du canevas et les données CSV/TXT importées. Il peut ainsi être restauré après actualisation ou lors d’une visite ultérieure. Les données restent dans ce navigateur jusqu’à leur remplacement ou suppression avec « Réinitialiser les données de l’espace de travail » dans les réglages avancés, ou via les données de site du navigateur. Un Service Worker met aussi en cache les ressources statiques pour le mode hors ligne.'] },
          { title: 'Contact', body: ['Pour toute question de confidentialité, ouvrez un ticket dans <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>. Ne joignez pas de listes réelles, de fonds privés ni d’autres informations sensibles à un ticket public.'] }
        ]
      },
      terms: {
        title: 'Conditions d’utilisation de Tsudoi | Créateur d’invitations',
        description: 'Conditions de Tsudoi sur l’usage, la responsabilité des contenus, le traitement local, la disponibilité, les changements et les retours.',
        h1: 'Conditions d’utilisation', meta: 'Entrée en vigueur : <time datetime="2026-08-27">27/08/2026</time>',
        lede: 'En utilisant Tsudoi, vous acceptez d’employer l’outil légalement, avec prudence et dans le respect des droits d’autrui.',
        sections: [
          { title: 'Objet de l’outil', body: ['Tsudoi fournit gratuitement la mise en page de texte, les données CSV/TXT, l’import-export de modèles, les PNG individuels et les lots ZIP. L’essentiel du calcul est réalisé dans votre navigateur.'] },
          { title: 'Vos contenus et responsabilités', body: ['Vous devez avoir le droit d’utiliser les images, polices, textes et données sélectionnés et êtes responsable du contenu produit et de sa diffusion. N’utilisez pas l’outil pour enfreindre la vie privée, la propriété intellectuelle, d’autres droits ou la loi.'] },
          { title: 'Confidentialité et données', body: ['Fonds, listes, modèles et résultats sont traités localement comme indiqué dans la <a href="/privacy.html">Politique de confidentialité</a>. Protégez vos sources et exports et appliquez des mesures adaptées aux données réelles.'] },
          { title: 'Disponibilité et résultats', body: ['Tsudoi est fourni en l’état. Le navigateur, les performances de l’appareil, les services de polices et les fichiers peuvent affecter la mise en page ou les lots. Vérifiez les aperçus et exports avant diffusion et sauvegardez les éléments importants.'] },
          { title: 'Évolution des fonctions et conditions', body: ['Le projet peut corriger des problèmes, modifier des fonctions ou mettre à jour ces conditions. Les changements importants apparaissent dans le dépôt et la date de cette page. Continuer à utiliser une version mise à jour vaut acceptation des conditions alors applicables.'] },
          { title: 'Contact et retours', body: ['Signalez les problèmes de compatibilité, suggestions ou questions sur ces conditions via <a href="https://github.com/dofy/invite-maker/issues">GitHub Issues</a>.'] }
        ]
      }
    }
  };

  function resolveLanguage(value) {
    if (!value) return null;
    var normalized = String(value).trim().replace('_', '-').toLowerCase();
    if (normalized === 'zh-tw' || normalized === 'zh-hk' || normalized === 'zh-mo' || normalized.indexOf('zh-hant') === 0) return 'zh-TW';
    if (normalized === 'zh-cn' || normalized === 'zh-sg' || normalized === 'zh' || normalized.indexOf('zh-hans') === 0) return 'zh-CN';
    var base = normalized.split('-')[0];
    return SUPPORTED_LANGUAGES.indexOf(base) >= 0 ? base : null;
  }

  function getStored(key) {
    try { return localStorage.getItem(key); } catch (_error) { return null; }
  }

  function setStored(key, value) {
    try { localStorage.setItem(key, value); } catch (_error) {}
  }

  function detectLanguage() {
    var stored = resolveLanguage(getStored(LANGUAGE_KEY));
    if (stored) return stored;
    var candidates = navigator.languages || [navigator.language];
    for (var index = 0; index < candidates.length; index += 1) {
      var resolved = resolveLanguage(candidates[index]);
      if (resolved) return resolved;
    }
    return 'en';
  }

  function resolveTheme(value) {
    var preference = THEME_VALUES.indexOf(value) >= 0 ? value : 'auto';
    if (preference === 'auto') return systemTheme && systemTheme.matches ? 'dark' : 'light';
    return preference;
  }

  function renderPage(page) {
    var html = '<h1>' + page.h1 + '</h1>';
    if (page.meta) html += '<p class="meta">' + page.meta + '</p>';
    html += '<p class="lede">' + page.lede + '</p>';
    page.sections.forEach(function (section) {
      html += '<section><h2>' + section.title + '</h2>';
      (section.body || []).forEach(function (paragraph) {
        html += '<p' + (section.notice ? ' class="notice"' : '') + '>' + paragraph + '</p>';
      });
      (section.items || []).forEach(function (item) {
        html += '<h3>' + item.title + '</h3><p>' + item.body + '</p>';
      });
      html += '</section>';
    });
    return html;
  }

  function applyCommon(common) {
    document.querySelectorAll('[data-common]').forEach(function (element) {
      var value = common[element.getAttribute('data-common')];
      if (value) element.textContent = value;
    });
    var nav = document.querySelector('.page-nav');
    if (nav) nav.setAttribute('aria-label', common.navLabel);
    var languageSelect = document.getElementById('legal-language');
    var themeSelect = document.getElementById('legal-theme');
    if (languageSelect) languageSelect.setAttribute('aria-label', common.languageLabel);
    if (themeSelect) themeSelect.setAttribute('aria-label', common.themeLabel);
  }

  function applyLanguage(language, persist) {
    var resolved = resolveLanguage(language) || 'en';
    var pageName = document.body.getAttribute('data-legal-page');
    var bundle = messages[resolved] || messages.en;
    var page = bundle[pageName] || bundle.about;
    document.documentElement.lang = resolved;
    document.title = page.title;
    var description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', page.description);
    var content = document.getElementById('legal-content');
    if (content) content.innerHTML = renderPage(page);
    applyCommon(bundle.common);
    var select = document.getElementById('legal-language');
    if (select) select.value = resolved;
    if (persist) setStored(LANGUAGE_KEY, resolved);
  }

  function applyTheme(preference, persist) {
    var normalized = THEME_VALUES.indexOf(preference) >= 0 ? preference : 'auto';
    var resolved = resolveTheme(normalized);
    document.documentElement.setAttribute('data-mantine-color-scheme', resolved);
    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', resolved === 'dark' ? '#0c0e12' : '#f1f3f4');
    var select = document.getElementById('legal-theme');
    if (select) select.value = normalized;
    if (persist) setStored(THEME_KEY, normalized);
  }

  var languageSelect = document.getElementById('legal-language');
  var themeSelect = document.getElementById('legal-theme');
  if (languageSelect) {
    languageSelect.addEventListener('change', function (event) { applyLanguage(event.target.value, true); });
  }
  if (themeSelect) {
    themeSelect.addEventListener('change', function (event) { applyTheme(event.target.value, true); });
  }
  if (systemTheme) {
    var onSystemThemeChange = function () {
      if ((getStored(THEME_KEY) || 'auto') === 'auto') applyTheme('auto', false);
    };
    if (systemTheme.addEventListener) systemTheme.addEventListener('change', onSystemThemeChange);
    else if (systemTheme.addListener) systemTheme.addListener(onSystemThemeChange);
  }

  window.addEventListener('storage', function (event) {
    if (event.key === LANGUAGE_KEY) applyLanguage(event.newValue || detectLanguage(), false);
    if (event.key === THEME_KEY) applyTheme(event.newValue || 'auto', false);
  });

  applyTheme(getStored(THEME_KEY) || 'auto', false);
  applyLanguage(detectLanguage(), false);
})();
