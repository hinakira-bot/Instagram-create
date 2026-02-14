import React, { useState, useRef, useCallback } from 'react';
import {
  Copy, Sparkles, Type, Image as ImageIcon, User, Palette, MonitorPlay, Check,
  Layout, List, FileText, Plus, Trash2, Instagram, Smile, MessageCircle,
  AlignLeft, AlignRight, AlignCenter, MousePointerClick, LayoutTemplate,
  Upload, X, Info, BoxSelect, Highlighter, Maximize, MinusSquare, Droplets,
  Layers, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  Settings, Download, Loader2, AlertCircle, Wand2, Eye, EyeOff, RefreshCw,
  ChevronDown, ArrowRight, Hash, Award, Star, Zap, Grid3x3, Columns, Square
} from 'lucide-react';
import { generateImage, generateImageWithReference, generateImageWithMultipleReferences, generatePostStructure } from './geminiClient';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- データ定義 ---
const THEMES = {
  modern_lifestyle: {
    name: 'モダン・ライフスタイル',
    bg: 'clean white marble background, soft shadows, dried flowers, kinfolk style',
    atmosphere: 'aesthetic, clean, minimalist, high key lighting, instagrammable',
    colors: { text: 'text-slate-800', band: 'bg-stone-200', bg: 'from-stone-50 to-stone-100', accent: 'text-stone-600' }
  },
  anime_art: {
    name: 'アニメ調',
    bg: 'anime art style background, beautiful blue sky with huge cumulus clouds, school rooftop, makoto shinkai style',
    atmosphere: 'emotional, vivid, 2D animation style, sparkling, nostalgic, high quality anime art',
    colors: { text: 'text-slate-900', band: 'bg-indigo-400', bg: 'from-sky-100 to-indigo-200', accent: 'text-indigo-600' }
  },
  high_sense: {
    name: 'ハイセンス・モード',
    bg: 'stylish matte monochrome background with minimal vivid color accents, abstract geometric patterns, architectural shapes, noise grain, high-end editorial design',
    atmosphere: 'avant-garde, fashionable, modern art, cool, sophisticated, luxury brand aesthetic. Monotone base with striking color accents.',
    colors: { text: 'text-black', band: 'bg-lime-400', bg: 'from-slate-200 to-slate-400', accent: 'text-stone-800' }
  },
  tech_gadget: {
    name: 'ガジェット・黒背景',
    bg: 'dark matte workspace, neon blue rim light, sleek gadgets layout',
    atmosphere: 'tech-savvy, futuristic, professional, dark mode style',
    colors: { text: 'text-white', band: 'bg-blue-600', bg: 'from-slate-900 to-black', accent: 'text-blue-400' }
  },
  pop_color: {
    name: 'ポップ・カラフル',
    bg: 'solid pastel color background, memphis pattern elements',
    atmosphere: 'energetic, playful, gen-z aesthetic, bold colors',
    colors: { text: 'text-slate-900', band: 'bg-yellow-400', bg: 'from-pink-200 to-yellow-100', accent: 'text-pink-600' }
  },
  emotional_sky: {
    name: 'エモ・空/風景',
    bg: 'beautiful sunset sky, emotional clouds, grainy film photography style',
    atmosphere: 'nostalgic, emotional, sentimental, warm lighting',
    colors: { text: 'text-white', band: 'bg-orange-500/80', bg: 'from-orange-100 to-blue-200', accent: 'text-orange-200' }
  },
  business_clean: {
    name: 'ビジネス・信頼',
    bg: 'blurred office background, geometric blue overlays',
    atmosphere: 'trustworthy, informative, corporate, educational',
    colors: { text: 'text-white', band: 'bg-navy-900', bg: 'from-blue-50 to-white', accent: 'text-blue-800' }
  },
  soft_feminine: {
    name: 'やわらかく女性的',
    bg: 'soft beige and pastel pink gradient, lace texture overlay, dried flowers, warm morning sunlight, airy composition, cozy atmosphere',
    atmosphere: 'feminine, gentle, soft, elegant, airy, bright and warm, lovely',
    colors: { text: 'text-slate-600', band: 'bg-rose-200', bg: 'from-rose-50 to-orange-50', accent: 'text-rose-400' }
  }
};

const FONT_STYLES = [
  { id: 'bold_sans', name: '太字ゴシック', prompt: 'heavy bold sans-serif typography, impact font', css: 'font-sans font-black' },
  { id: 'mincho', name: '明朝体', prompt: 'elegant serif typography, japanese mincho style', css: 'font-serif font-bold' },
  { id: 'handwritten', name: '手書き風', prompt: 'playful handwritten style typography, marker font', css: 'font-mono' },
];

// --- 表紙3層デザイン定義 ---
const COVER_LAYOUTS = [
  { id: 'simple', name: 'シンプル', icon: MinusSquare, prompt: 'No overlay box, text floats directly on background with subtle drop shadow' },
  { id: 'band', name: '帯', icon: Maximize, prompt: 'Text on a distinct solid colored horizontal banner strip across the image' },
  { id: 'dark_overlay', name: 'ダークオーバーレイ', icon: Droplets, prompt: 'Semi-transparent dark black blurred glass effect overlay box, modern luxury UI style' },
  { id: 'pop_frame', name: 'ポップ枠', icon: Layers, prompt: 'Pop style design with a white inner frame border, decorative elements and cute layout' },
  { id: 'split', name: '上下分割', icon: Layout, prompt: 'Split layout: top half is visual/image area, bottom half is clean solid color text zone' },
  { id: 'left_right', name: '左右分割', icon: Columns, prompt: 'Left-right split layout: left side has title text area, right side has character/visual image area, vertically divided' },
  { id: 'card', name: 'カード型', icon: Square, prompt: 'A centered white/light card panel floating on the full-bleed background image. Text is inside the card with rounded corners and shadow. Background visible around the card edges' },
  { id: 'diagonal', name: '対角線', icon: Zap, prompt: 'Dynamic diagonal layout with title text placed at an angle, diagonal divider line splitting the composition into two color/image zones, energetic and modern' },
];

const TITLE_DESIGNS = [
  { id: 'shadow', name: 'ドロップシャドウ', icon: Type, prompt: 'Bold text with strong dramatic drop shadow for depth and impact' },
  { id: 'frame', name: '枠文字', icon: BoxSelect, prompt: 'Text with visible border/outline stroke around each character, outlined typography' },
  { id: 'marker', name: 'マーカー', icon: Highlighter, prompt: 'Text with highlight marker/brush stroke color behind it, hand-drawn highlight effect' },
  { id: 'gradient', name: 'グラデーション', icon: Palette, prompt: 'Text with gradient color fill effect, colorful typography' },
  { id: 'outline', name: '白フチ', icon: Layers, prompt: 'White outlined text with dark fill, manga/comic style bold text' },
];

const SUBTITLE_DESIGNS = [
  { id: 'pill', name: 'ピル型', icon: MessageCircle, prompt: 'Subtitle in a rounded pill/capsule shaped badge with shadow' },
  { id: 'tag', name: 'タグ風', icon: FileText, prompt: 'Subtitle styled as a tag/label with angled left edge, like a price tag' },
  { id: 'bubble', name: '吹き出し', icon: Smile, prompt: 'Subtitle in a speech bubble shape with a small triangle pointer' },
  { id: 'underline', name: '下線', icon: AlignCenter, prompt: 'Subtitle with a decorative thick underline accent below it' },
  { id: 'none', name: 'なし', icon: MinusSquare, prompt: 'Subtitle displayed as plain text without any decoration' },
];

const BG_IMAGE_STYLES = [
  { id: 'marble', name: '大理石', prompt: 'elegant white and grey marble stone texture background, luxury natural pattern' },
  { id: 'nature', name: '自然', prompt: 'lush green nature background, soft bokeh leaves and sunlight, fresh outdoor' },
  { id: 'city', name: '都市', prompt: 'blurred city skyline background, soft bokeh lights, urban atmosphere' },
  { id: 'abstract', name: '抽象', prompt: 'abstract colorful gradient background, smooth flowing shapes, modern art' },
  { id: 'texture', name: 'テクスチャ', prompt: 'subtle fabric linen texture background, clean muted tones, minimalist' },
  { id: 'wood', name: '木目', prompt: 'warm natural wood grain texture background, rustic table top surface' },
  { id: 'sky', name: '空', prompt: 'beautiful clear blue sky with soft white clouds, dreamy atmosphere' },
];

const DEFAULT_SECTION_BG = { type: null, color: '#E2E8F0', image: null, imageStyle: null, desc: '' };

// --- 表紙追加オプション定義 ---
const SWIPE_GUIDES = [
  { id: 'none', name: 'なし', prompt: '' },
  { id: 'page_count', name: '枚数バッジ', prompt: 'A small page count badge "全10枚" or "1/10" in the top-right or bottom-right corner of the cover' },
  { id: 'swipe_arrow', name: 'スワイプ矢印', prompt: 'A "Swipe →" or "→ スワイプ" indicator with arrow icon at the bottom of the cover to encourage swiping' },
  { id: 'peek', name: 'チラ見せ', prompt: 'The right edge of the cover shows a slight peek/preview of the next slide content, as if the next page is slightly visible behind this one' },
];

const EYE_CATCH_BADGES = [
  { id: 'none', name: 'なし', prompt: '' },
  { id: 'number_big', name: '数字強調', prompt: 'A large bold emphasized number or statistic (like "TOP5" "3選" "100%") is prominently displayed as a huge eye-catching element' },
  { id: 'label', name: 'ラベル', prompt: 'A decorative label badge like "保存版" "完全攻略" "初心者OK" "永久保存版" in a rounded badge/chip placed prominently' },
  { id: 'ribbon', name: 'リボン', prompt: 'A ribbon or seal-shaped badge decoration (like "NEW" "人気" "おすすめ") in the corner of the image, like a gift ribbon or award seal' },
];

const DECO_EFFECTS = [
  { id: 'none', name: 'なし', prompt: '' },
  { id: 'sparkle', name: 'キラキラ', prompt: 'Sparkle/glitter particle effects scattered around the text and edges, twinkling light dots, magical atmosphere' },
  { id: 'geometric', name: '幾何学', prompt: 'Geometric decorative shapes (circles, triangles, lines, dots) scattered as accent elements around the layout' },
  { id: 'gradient_overlay', name: 'グラデオーバーレイ', prompt: 'A subtle gradient color overlay flowing across the design, adding depth and modern aesthetic' },
  { id: 'grain', name: 'ノイズ/グレイン', prompt: 'Film grain/noise texture overlay for a retro vintage analog feel, slightly grainy matte finish' },
];

const MARGIN_LEVELS = [
  { id: 'none', name: 'フルブリード', prompt: 'Full-bleed design with no margins, content extends to all edges' },
  { id: 'small', name: '少し余白', prompt: 'Slight padding/margin around the content, about 3-5% from each edge' },
  { id: 'medium', name: '標準余白', prompt: 'Standard comfortable margins with balanced whitespace around all content, about 8-10% padding' },
  { id: 'large', name: 'たっぷり余白', prompt: 'Generous whitespace margins (15%+ from edges), luxurious airy breathing room, high-end editorial feel' },
];

const TITLE_EMPHASIS_OPTIONS = [
  { id: 'none', name: '均一', prompt: '' },
  { id: 'keyword_large', name: 'キーワード特大', prompt: 'The most important keyword/number in the title should be displayed 2-3x larger than the rest of the title text, creating dramatic size contrast for visual hierarchy' },
  { id: 'first_line_large', name: '1行目特大', prompt: 'The first line of the title text should be much larger (2x) than subsequent lines, creating a bold header with smaller subtext below' },
];

const POSITIONS = [
  { id: 'top_left', icon: ArrowUpLeft, label: '左上' },
  { id: 'top_right', icon: ArrowUpRight, label: '右上' },
  { id: 'bottom_left', icon: ArrowDownLeft, label: '左下' },
  { id: 'bottom_right', icon: ArrowDownRight, label: '右下' },
];

// --- カラーユーティリティ ---
function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return { r: parseInt(c.substring(0, 2), 16), g: parseInt(c.substring(2, 4), 16), b: parseInt(c.substring(4, 6), 16) };
}
function rgbToHex(r, g, b) {
  const h = (c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function lightenColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}
function darkenColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}
function isLightColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

// --- サブコンポーネント ---

/** 小型画像アップロードUI（キャラ画像・参考画像の共通コンポーネント） */
const MiniImageUpload = ({ label, icon: IconComp, image, setImage, accentColor = 'pink' }) => {
  // setImageの最新参照を保持（非同期コールバック内で古いクロージャにならないように）
  const setImageRef = useRef(setImage);
  setImageRef.current = setImage;

  const colors = {
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-500', hover: 'hover:bg-pink-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-500', hover: 'hover:bg-blue-100' },
  }[accentColor] || { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-500', hover: 'hover:bg-pink-100' };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageRef.current(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className={`${colors.bg} p-2 rounded-lg border ${colors.border}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <IconComp className={`w-3.5 h-3.5 ${colors.text}`} />
        <span className="text-[10px] font-bold text-slate-500">{label}</span>
      </div>
      <div
        className={`border border-dashed ${colors.border} bg-white rounded-md cursor-pointer ${colors.hover} transition-colors overflow-hidden`}
        onClick={handleFileSelect}
      >
        {image ? (
          <div className="relative h-20 flex items-center justify-center p-1">
            <img src={image} alt="" className="h-full object-contain rounded" />
            <button
              onClick={(e) => { e.stopPropagation(); setImageRef.current(null); }}
              className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full shadow-md hover:bg-red-600"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : (
          <div className="py-2 text-center">
            <Upload className={`w-4 h-4 ${colors.text} mx-auto mb-0.5`} />
            <p className={`text-[9px] ${colors.text} font-bold`}>画像を選択</p>
          </div>
        )}
      </div>
    </div>
  );
};

/** 参考画像アップロードUI（テイスト参考用） */
const RefImageUpload = ({ refImage, setRefImage }) => (
  <MiniImageUpload
    label="参考画像（テイスト参考）"
    icon={ImageIcon}
    image={refImage}
    setImage={setRefImage}
    accentColor="blue"
  />
);

/** セクション別背景設定UI */
const SectionBgSettings = ({ bg, setBg, frameColor }) => {
  const isCustom = bg.type !== null;
  const currentType = bg.type || 'theme';

  const updateBg = (field, value) => {
    setBg({ ...bg, [field]: value });
  };

  return (
    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500">背景設定</span>
        </div>
        <button
          onClick={() => updateBg('type', isCustom ? null : 'theme')}
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
            isCustom ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'
          }`}
        >
          {isCustom ? '個別設定ON' : 'グローバル設定'}
        </button>
      </div>

      {isCustom && (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-1">
            {[
              { id: 'white', label: '白' },
              { id: 'solid', label: '無地' },
              { id: 'theme', label: 'テーマ' },
              { id: 'frame', label: '枠+白' },
              { id: 'image', label: '画像' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => updateBg('type', opt.id)}
                className={`py-1 rounded text-[10px] font-bold border transition-all ${
                  currentType === opt.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {currentType === 'solid' && (
            <div className="flex items-center gap-2">
              <input type="color" value={bg.color || '#E2E8F0'} onChange={(e) => updateBg('color', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none" />
              <input type="text" value={bg.color || '#E2E8F0'} onChange={(e) => updateBg('color', e.target.value)} className="flex-1 text-[10px] border border-slate-200 rounded px-2 py-1 uppercase font-mono" />
            </div>
          )}

          {currentType === 'frame' && (
            <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200">
              <div className="w-8 aspect-[4/5] rounded border-[2px] bg-white" style={{ borderColor: frameColor }}></div>
              <span className="text-[9px] text-slate-400">枠カラー: {frameColor}</span>
            </div>
          )}

          {currentType === 'image' && (
            <div className="space-y-2">
              <MiniImageUpload
                label="背景画像"
                icon={ImageIcon}
                image={bg.image}
                setImage={(v) => updateBg('image', v)}
                accentColor="blue"
              />
              <div className="flex items-center gap-1.5">
                <div className="flex-1 border-t border-slate-200"></div>
                <span className="text-[8px] text-slate-400 font-bold">または AIスタイル</span>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {BG_IMAGE_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => updateBg('imageStyle', bg.imageStyle === style.id ? null : style.id)}
                    className={`py-1 px-0.5 rounded text-[9px] font-bold border transition-all ${
                      bg.imageStyle === style.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
              {bg.image && bg.imageStyle && (
                <p className="text-[8px] text-amber-600 bg-amber-50 p-1 rounded">アップロード画像が優先されます</p>
              )}
            </div>
          )}

          {/* 背景の特徴テキスト入力 */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">背景の特徴・詳細</label>
            <textarea
              value={bg.desc || ''}
              onChange={(e) => updateBg('desc', e.target.value)}
              placeholder="例: 桜が舞う春の公園、夕焼けのビーチ、カフェの内装..."
              className="w-full text-[11px] p-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none resize-none bg-white"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const CharacterSettingsUI = ({ exp, setExp, pos, setPos, bubble, setBubble, bubbleText, setBubbleText, charImage, setCharImage }) => (
  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 space-y-3">
    <div className="flex items-center gap-2 mb-1">
      <Smile className="w-4 h-4 text-pink-500" />
      <span className="text-xs font-bold text-slate-500">このスライドのキャラ設定</span>
    </div>

    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400">表情・ポーズ</label>
      <input
        type="text"
        value={exp || ''}
        onChange={(e) => setExp(e.target.value)}
        placeholder="例: 笑顔で指差し"
        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm outline-none focus:border-pink-500 placeholder:text-slate-300"
      />
    </div>

    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {/* 配置 (4隅) */}
        <div className="flex gap-1 bg-white rounded border border-slate-200 p-1">
          {POSITIONS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setPos(p.id)}
                className={`p-1.5 rounded hover:bg-slate-100 ${pos === p.id ? 'bg-pink-100 text-pink-600' : 'text-slate-400'}`}
                title={p.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setBubble(!bubble)}
          className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs border transition-all ${
            bubble ? 'bg-pink-50 border-pink-200 text-pink-600 font-bold' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <MessageCircle className={`w-3 h-3 ${bubble ? 'fill-current' : ''}`} />
          {bubble ? 'ON' : 'OFF'}
        </button>
      </div>

      {bubble && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
          <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> ふきだし
          </label>
          <input
            type="text"
            value={bubbleText || ''}
            onChange={(e) => setBubbleText && setBubbleText(e.target.value)}
            placeholder="ふきだしのセリフを入力..."
            className="w-full bg-white border border-pink-200 rounded px-2 py-1.5 text-xs outline-none focus:border-pink-500"
          />
        </div>
      )}
    </div>

    {/* セクション別キャラ画像 */}
    {setCharImage && (
      <MiniImageUpload
        label="このスライドのキャラ画像（個別設定）"
        icon={User}
        image={charImage}
        setImage={setCharImage}
        accentColor="pink"
      />
    )}
  </div>
);

export default function InstaFeedMaker() {
  // --- State ---
  const [selectedTheme, setSelectedTheme] = useState('modern_lifestyle');
  const [fontStyle, setFontStyle] = useState('bold_sans');
  const [globalTextAlign, setGlobalTextAlign] = useState('center');
  const [bgType, setBgType] = useState('theme');
  const [customBgColor, setCustomBgColor] = useState('#E2E8F0');
  const [bgDesc, setBgDesc] = useState('');
  const [coverBg, setCoverBg] = useState({ ...DEFAULT_SECTION_BG });
  const [introBg, setIntroBg] = useState({ ...DEFAULT_SECTION_BG });
  const [summaryBg, setSummaryBg] = useState({ ...DEFAULT_SECTION_BG });

  const [useCustomMainColor, setUseCustomMainColor] = useState(false);
  const [customMainColor, setCustomMainColor] = useState('#E91E63');

  const [useCharacter, setUseCharacter] = useState(true);
  const [characterSource, setCharacterSource] = useState('ai');
  const [characterDesc, setCharacterDesc] = useState('カジュアルな服装の笑顔の日本人女性');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [characterSize, setCharacterSize] = useState('medium');


  const [coverTitle, setCoverTitle] = useState('2024年版\nインスタ運用の\n完全攻略ガイド');
  const [coverSubtitle, setCoverSubtitle] = useState('初心者さんOK！');
  const [coverLayout, setCoverLayout] = useState('band');
  const [titleDesign, setTitleDesign] = useState('shadow');
  const [subtitleDesign, setSubtitleDesign] = useState('pill');
  const [swipeGuide, setSwipeGuide] = useState('none');
  const [eyeCatchBadge, setEyeCatchBadge] = useState('none');
  const [decoEffect, setDecoEffect] = useState('none');
  const [marginLevel, setMarginLevel] = useState('medium');
  const [titleEmphasis, setTitleEmphasis] = useState('none');
  const [coverCharExp, setCoverCharExp] = useState('自信満々な笑顔で指差し');
  const [coverCharPos, setCoverCharPos] = useState('bottom_right');
  const [coverBubble, setCoverBubble] = useState(false);
  const [coverBubbleText, setCoverBubbleText] = useState('保存必須！');
  const [coverCharImage, setCoverCharImage] = useState(null);
  const [coverRefImage, setCoverRefImage] = useState(null);

  const [introText, setIntroText] = useState('「フォロワーが増えない...」\n「投稿ネタがない...」\nそんな悩みを解決する\n最強のメソッドを公開します。');
  const [introCharExp, setIntroCharExp] = useState('困った顔で悩んでいるポーズ');
  const [introCharPos, setIntroCharPos] = useState('top_right');
  const [introBubble, setIntroBubble] = useState(true);
  const [introBubbleText, setIntroBubbleText] = useState('要チェック！');
  const [introCharImage, setIntroCharImage] = useState(null);
  const [introRefImage, setIntroRefImage] = useState(null);

  const [mainSlides, setMainSlides] = useState([
    {
      title: '1. プロフィール設定',
      imageDesc: 'スマートフォンのインスタグラムのプロフィール画面',
      text: 'まずはプロフィールを整えよう。\n誰に何を届けるアカウントなのか\n一目でわかるように設定します。',
      charExp: '真剣な顔で解説するポーズ', charPos: 'bottom_right', bubble: true, bubbleText: 'ここ重要！',
      charImage: null, refImage: null, bg: { ...DEFAULT_SECTION_BG }
    },
    {
      title: '2. 統一感のある投稿',
      imageDesc: 'トーンの揃ったインスタグラムの写真グリッドレイアウト',
      text: 'フィード全体のトーン＆マナーを\n揃えることで、フォロー率が\n劇的にアップします。',
      charExp: 'プレゼンボードを示すポーズ', charPos: 'bottom_left', bubble: false, bubbleText: '',
      charImage: null, refImage: null, bg: { ...DEFAULT_SECTION_BG }
    },
    {
      title: '3. ハッシュタグ選定',
      imageDesc: '分析チャートと共に浮かぶハッシュタグ記号',
      text: 'ビッグワードだけでなく、\nミドル・スモールワードを\n組み合わせて流入を狙います。',
      charExp: '虫眼鏡を持っているポーズ', charPos: 'bottom_right', bubble: true, bubbleText: '検索対策',
      charImage: null, refImage: null, bg: { ...DEFAULT_SECTION_BG }
    },
  ]);

  const [summaryItems, setSummaryItems] = useState([
    'プロフィールを整える',
    '世界観（トンマナ）を統一',
    '適切なタグ付けを行う',
    'ストーリーズで交流する',
    '保存される投稿を作る'
  ]);
  const [summaryCharExp, setSummaryCharExp] = useState('幸せそうな笑顔でサムズアップ');
  const [summaryCharPos, setSummaryCharPos] = useState('bottom_right');
  const [summaryBubble, setSummaryBubble] = useState(true);
  const [summaryBubbleText, setSummaryBubbleText] = useState('試してみてね');
  const [summaryCharImage, setSummaryCharImage] = useState(null);
  const [summaryRefImage, setSummaryRefImage] = useState(null);

  const [activeTab, setActiveTab] = useState('edit');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [contentTab, setContentTab] = useState('cover');
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // --- AI構成生成 ---
  const [aiSourceText, setAiSourceText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  // --- API Settings ---
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('gemini_api_key') || '');

  // --- Image Generation ---
  const [generatedImages, setGeneratedImages] = useState({});
  const [generatingIndex, setGeneratingIndex] = useState(null);
  const [genError, setGenError] = useState(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({});
  const batchCancelRef = useRef(false);

  // --- Logic ---
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImage(reader.result);
          setCharacterSource('upload');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setCharacterSource('ai');
  };

  const addMainSlide = () => {
    if (mainSlides.length >= 7) return;
    setMainSlides([...mainSlides, {
      title: `ポイント ${mainSlides.length + 1}`,
      imageDesc: '',
      text: 'ここに説明文が入ります。',
      charExp: '解説している',
      charPos: 'bottom_right',
      bubble: false,
      bubbleText: '',
      charImage: null,
      refImage: null,
      bg: { ...DEFAULT_SECTION_BG }
    }]);
  };

  const updateMainSlide = (index, field, value) => {
    const newSlides = [...mainSlides];
    newSlides[index][field] = value;
    setMainSlides(newSlides);
  };

  const removeMainSlide = (index) => {
    const newSlides = [...mainSlides];
    newSlides.splice(index, 1);
    setMainSlides(newSlides);
  };

  const updateSummaryItem = (index, value) => {
    const newItems = [...summaryItems];
    newItems[index] = value;
    setSummaryItems(newItems);
  };

  const addSummaryItem = () => {
    if (summaryItems.length >= 7) return;
    setSummaryItems([...summaryItems, '']);
  };

  const generatePrompt = (type, data) => {
    const theme = THEMES[selectedTheme];
    const font = FONT_STYLES.find(f => f.id === fontStyle) || FONT_STYLES[0];
    const layoutObj = COVER_LAYOUTS.find(s => s.id === coverLayout) || COVER_LAYOUTS[1];
    const titleDesignObj = TITLE_DESIGNS.find(s => s.id === titleDesign) || TITLE_DESIGNS[0];
    const subtitleDesignObj = SUBTITLE_DESIGNS.find(s => s.id === subtitleDesign) || SUBTITLE_DESIGNS[0];

    let p = "";

    // 一貫性維持のための指示（メインまたはまとめスライドの場合）
    if (type === 'main' || type === 'summary') {
      p += `【重要】ここで作成するキャラクターは{1.表紙}のキャラクターを使用してください (Use the SAME character as Slide 1). `;
    }

    p += `Instagram feed post design, aspect ratio 4:5 vertical. `;

    // Background Logic (セクション別背景対応)
    const slideBg = getSlideBg(type, data);
    if (slideBg.type === 'white') {
      p += `Background: Pure clean white studio background. `;
    } else if (slideBg.type === 'solid') {
      p += `Background: Solid flat color background (hex color code ${slideBg.color}). `;
    } else if (slideBg.type === 'frame') {
      p += `Background: Clean white background with a thick decorative border frame (color: ${frameColor}) around the entire image edges, about 5-8% width on each side, creating an elegant bordered look. `;
    } else if (slideBg.type === 'image') {
      if (slideBg.image) {
        p += `Background: Use the uploaded background image as the full-bleed background behind all content. `;
      } else if (slideBg.imageStyle) {
        const styleObj = BG_IMAGE_STYLES.find(s => s.id === slideBg.imageStyle);
        if (styleObj) p += `Background: ${styleObj.prompt}. `;
        else p += `Background: Clean neutral background. `;
      } else {
        p += `Background: Clean neutral background. `;
      }
    } else {
      p += `Background: ${theme.bg}. `;
    }

    if (slideBg.desc && slideBg.desc.trim()) {
      p += `Background Details: ${slideBg.desc.trim()}. `;
    }

    p += `Style: ${theme.atmosphere}. High quality, 8k, trending on pinterest. `;
    if (useCustomMainColor) {
      p += `Main Theme Color: ${validMainColor}. Use this color prominently for header bands, accent elements, decorative shapes, highlights, and borders. Derive lighter tints for backgrounds and darker shades for emphasis. `;
    }
    p += `Text Layout: ${globalTextAlign === 'left' ? 'Left aligned text' : 'Center aligned text'} with generous whitespace margins/padding. `;
    p += `Language: Japanese. All text included in the image must be in Japanese. `;

    if (useCharacter) {
      const desc = characterDesc || 'Person';

      let expression = '';
      let position = 'bottom_right';
      let bubble = false;
      let bubbleText = '';

      if (type === 'cover') {
        expression = coverCharExp; position = coverCharPos; bubble = coverBubble; bubbleText = coverBubbleText;
      } else if (type === 'intro') {
        expression = introCharExp; position = introCharPos; bubble = introBubble; bubbleText = introBubbleText;
      } else if (type === 'summary') {
        expression = summaryCharExp; position = summaryCharPos; bubble = summaryBubble; bubbleText = summaryBubbleText;
      } else if (type === 'main' && data) {
        expression = data.charExp; position = data.charPos; bubble = data.bubble; bubbleText = data.bubbleText;
      }

      if (!expression) expression = 'neutral expression';

      let sizePrompt = 'Upper body shot (waist up)';
      if (characterSize === 'small') sizePrompt = 'Full body shot, wide shot showing entire figure';
      if (characterSize === 'large') sizePrompt = 'Close-up shot, bust up shot';
      if (characterSize === 'chibi') sizePrompt = 'Chibi style, super deformed, tiny full body shot, occupying 1/10 of the screen area';

      const posString = position.replace('_', ' ');

      let clothingPrompt = '';
      if (selectedTheme === 'high_sense') {
        clothingPrompt = 'wearing monotone/black-and-white mode fashion (chic, edgy style)';
      }

      // セクション別キャラ画像の判定
      let sectionCharImage = null;
      if (type === 'cover') sectionCharImage = coverCharImage;
      else if (type === 'intro') sectionCharImage = introCharImage;
      else if (type === 'summary') sectionCharImage = summaryCharImage;
      else if (type === 'main' && data) sectionCharImage = data.charImage;

      const hasCharImage = sectionCharImage || (characterSource === 'upload' && uploadedImage);

      if (hasCharImage) {
        p += `**IMPORTANT**: I have uploaded a reference image of the character. Please Generate the character based on the uploaded reference image provided in the prompt context. `;
        p += `Character Description: ${desc} ${clothingPrompt}. `;
        p += `Pose/Expression: ${expression}. `;
      } else {
        if (selectedTheme === 'high_sense') {
          p += `Character: (${desc} ${clothingPrompt}) with (${expression}) in FULL VIVID NATURAL COLOR (Skin, Hair, Eyes). `;
        } else {
          p += `Character: (${desc} ${clothingPrompt}) with (${expression}). `;
        }
      }

      p += `Shot Type: ${sizePrompt}. `;
      p += `Position: Character is positioned at the ${posString} of the layout. `;

      if (bubble && bubbleText) {
        p += `A speech bubble (balloon) containing Japanese text "${bubbleText}" is near the character. `;
      }
    }

    // セクション別参考画像の判定
    let sectionRefImage = null;
    if (type === 'cover') sectionRefImage = coverRefImage;
    else if (type === 'intro') sectionRefImage = introRefImage;
    else if (type === 'summary') sectionRefImage = summaryRefImage;
    else if (type === 'main' && data) sectionRefImage = data.refImage;

    if (sectionRefImage) {
      p += `**STYLE REFERENCE**: I have uploaded a style reference image. Please match the overall visual style, color tone, layout composition, and atmosphere of the reference image as closely as possible. `;
    }

    if (type === 'cover') {
      p += `LAYOUT: Title Slide. Huge typography design. `;

      if (coverSubtitle) {
        p += `Subtitle: "${coverSubtitle}" (in Japanese) is placed at the top. `;
        if (subtitleDesignObj.id !== 'none') {
          p += `Subtitle Decoration: ${subtitleDesignObj.prompt}. `;
        }
      }

      p += `Main Title: "${coverTitle.replace(/\n/g, ' ')}" (in Japanese) in center, ${font.prompt}. `;
      p += `Cover Layout: ${layoutObj.prompt}. `;
      p += `Title Text Design: ${titleDesignObj.prompt}. `;

      // --- 新デザイン機能 ---
      const swipeObj = SWIPE_GUIDES.find(s => s.id === swipeGuide);
      if (swipeObj && swipeObj.prompt) p += `Swipe Guide: ${swipeObj.prompt}. `;

      const badgeObj = EYE_CATCH_BADGES.find(s => s.id === eyeCatchBadge);
      if (badgeObj && badgeObj.prompt) p += `Eye-Catch Badge: ${badgeObj.prompt}. `;

      const decoObj = DECO_EFFECTS.find(s => s.id === decoEffect);
      if (decoObj && decoObj.prompt) p += `Decoration: ${decoObj.prompt}. `;

      const marginObj = MARGIN_LEVELS.find(s => s.id === marginLevel);
      if (marginObj && marginObj.prompt) p += `Spacing: ${marginObj.prompt}. `;

      const emphObj = TITLE_EMPHASIS_OPTIONS.find(s => s.id === titleEmphasis);
      if (emphObj && emphObj.prompt) p += `Title Emphasis: ${emphObj.prompt}. `;

      if (selectedTheme === 'high_sense') {
        p += `Design: Stylish Matte Mode, using abstract geometric patterns or architectural shapes to create a cool, avant-garde look. Not glossy, but sophisticated and high-end. `;
      } else {
        p += `Design: Eye-catching, high contrast. `;
      }
    } else if (type === 'intro') {
      p += `LAYOUT: Introduction Slide. `;
      p += `TOP HEADER: Display the main title "${coverTitle.replace(/\n/g, ' ')}" on a stylish header band strip at the very top. `;
      p += `TEXT: "${introText.replace(/\n/g, ' ')}" (in Japanese) clearly written in the main area. `;
      p += `Design: Storytelling vibe.`;
    } else if (type === 'main' && data) {
      p += `LAYOUT: Content Slide. Structure: Top header band, Center Image, Bottom text area. `;
      p += `TOP: Header strip band with title "${data.title}" (in Japanese). `;
      p += `CENTER: Main visual is (${data.imageDesc}). `;
      p += `BOTTOM: Short explanation text area "${data.text.replace(/\n/g, ' ')}" (in Japanese). `;
    } else if (type === 'summary') {
      p += `LAYOUT: Summary/Conclusion Slide. `;
      p += `TOP: Header strip band with title "まとめ" or "SUMMARY". `;
      p += `CONTENT: Bullet point list in Japanese: ${summaryItems.join(', ')}. `;
    }

    if (slideBg.type === 'theme') {
      if (useCustomMainColor) {
        p += ` Color palette: The main/brand color is ${validMainColor}. Use this hex color for header bands, accent borders, highlights, and decorative elements. Background should use a very light tint of this color.`;
      } else {
        if (theme.colors.band.includes('yellow')) p += ` Color palette: Yellow and Pop accents.`;
        if (theme.colors.band.includes('blue')) p += ` Color palette: Blue and Professional accents.`;
      }

      if (selectedTheme === 'high_sense') {
        if (useCustomMainColor) {
          p += ` **CRITICAL STYLE INSTRUCTION**: MONOTONE BASE with ${validMainColor} as the vivid accent color. The character/subject MUST be in FULL COLOR.`;
        } else {
          p += ` **CRITICAL STYLE INSTRUCTION**: The overall image should be MONOTONE BASE (grayscale/black and white) but with STYLISH COLOR ACCENTS. The background should be primarily matte monochrome with geometric/architectural patterns, but can feature minimal, sharp splashes of vivid color (like neon lines or geometric shapes) as accents. The character/subject MUST be in FULL COLOR (Natural Skin tones) to serve as the main focal point against the monotone backdrop. Create a high-end, edgy contrast between the grayscale elements and the specific color accents.`;
        }
      }
    } else if (slideBg.type === 'frame') {
      if (useCustomMainColor) {
        p += ` Frame/Border Color: ${validMainColor}. Use this as the frame border color and accent color for header bands and decorative elements.`;
      } else {
        p += ` Frame/Border Color: Use the theme's accent color for the frame border.`;
      }
    } else if (useCustomMainColor) {
      p += ` Accent/Brand Color: Use ${validMainColor} as the main accent color for text bands, highlights, borders, and decorative elements.`;
    }

    return p;
  };

  const copyToClipboard = (text, index) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  // --- API Settings Logic ---
  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKeyInput);
    setApiKey(apiKeyInput);
    setShowSettings(false);
  };

  // --- AI構成生成ロジック ---
  const handleAiGenerate = async () => {
    if (!apiKey) { setAiError('APIキーを設定してください。'); return; }
    if (!aiSourceText.trim()) { setAiError('文章を入力してください。'); return; }
    setAiGenerating(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await generatePostStructure(apiKey, aiSourceText);
      setAiResult(result);
    } catch (err) {
      setAiError(err.message || 'AI構成の生成に失敗しました。');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    setCoverTitle(aiResult.coverTitle || '');
    setCoverSubtitle(aiResult.coverSubtitle || '');
    setIntroText(aiResult.introText || '');
    if (aiResult.mainSlides && Array.isArray(aiResult.mainSlides)) {
      setMainSlides(aiResult.mainSlides.map((s, i) => ({
        title: s.title || `ページ ${i + 1}`,
        imageDesc: s.imageDesc || '',
        text: s.text || '',
        charExp: '', charPos: 'bottom_right', bubble: false, bubbleText: '',
        charImage: null, refImage: null, bg: { ...DEFAULT_SECTION_BG }
      })));
    }
    if (aiResult.summaryItems && Array.isArray(aiResult.summaryItems)) {
      setSummaryItems(aiResult.summaryItems);
    }
    setActiveTab('edit');
    setContentTab('cover');
  };

  // --- Image Generation Logic ---
  // セクション別の画像を取得するヘルパー
  const getSlideImages = (slideType, slideContent) => {
    let charImg = null;
    let refImg = null;

    if (slideType === 'cover') { charImg = coverCharImage; refImg = coverRefImage; }
    else if (slideType === 'intro') { charImg = introCharImage; refImg = introRefImage; }
    else if (slideType === 'summary') { charImg = summaryCharImage; refImg = summaryRefImage; }
    else if (slideType === 'main' && slideContent) { charImg = slideContent.charImage; refImg = slideContent.refImage; }

    // セクション別キャラ画像がない場合、グローバル設定にフォールバック
    if (!charImg && characterSource === 'upload' && uploadedImage) {
      charImg = uploadedImage;
    }

    // 背景画像
    const slideBgInfo = getSlideBg(slideType, slideContent);
    const bgImg = (slideBgInfo.type === 'image' && slideBgInfo.image) ? slideBgInfo.image : null;

    return { charImg, refImg, bgImg };
  };

  // --- 表紙プレビュー用ヘルパー ---
  const renderSubtitleBadge = (text) => {
    if (!text) return null;
    const isDarkLayout = coverLayout === 'dark_overlay';
    const baseColor = useCustomMainColor ? validMainColor : '#ec4899';
    switch (subtitleDesign) {
      case 'pill':
        return (
          <div
            className={`mb-4 px-4 py-1.5 rounded-full shadow-md text-xs font-bold inline-block ${isDarkLayout ? 'bg-yellow-400 text-black' : (!useCustomMainColor ? 'bg-white text-pink-500 border border-pink-200' : 'bg-white border border-slate-200')}`}
            style={useCustomMainColor && !isDarkLayout ? { color: baseColor } : undefined}
          >{text}</div>
        );
      case 'tag':
        return (
          <div className="mb-4 inline-block">
            <div
              className={`relative pl-5 pr-3 py-1.5 text-xs font-bold shadow ${isDarkLayout ? 'bg-yellow-400 text-black' : 'bg-white'}`}
              style={{
                clipPath: 'polygon(12px 0%, 100% 0%, 100% 100%, 12px 100%, 0% 50%)',
                ...(useCustomMainColor && !isDarkLayout ? { color: baseColor } : !isDarkLayout ? { color: '#ec4899' } : {})
              }}
            >{text}</div>
          </div>
        );
      case 'bubble':
        return (
          <div className="mb-4 inline-block relative">
            <div
              className={`relative rounded-xl px-4 py-2 text-xs font-bold shadow ${isDarkLayout ? 'bg-yellow-400 text-black' : 'bg-white'}`}
              style={useCustomMainColor && !isDarkLayout ? { color: baseColor } : !isDarkLayout ? { color: '#ec4899' } : {}}
            >
              {text}
              <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${isDarkLayout ? 'bg-yellow-400' : 'bg-white'}`}></div>
            </div>
          </div>
        );
      case 'underline':
        return (
          <div className="mb-4 inline-block">
            <span
              className={`text-xs font-bold pb-1 ${isDarkLayout ? 'text-yellow-400' : effectiveColors.text}`}
              style={{
                borderBottom: `3px solid ${isDarkLayout ? '#facc15' : (useCustomMainColor ? baseColor : '#ec4899')}`,
                ...(effectiveColors.textColor && !isDarkLayout ? { color: effectiveColors.textColor } : {})
              }}
            >{text}</span>
          </div>
        );
      case 'none':
        return (
          <div className="mb-3">
            <span
              className={`text-xs font-bold ${isDarkLayout ? 'text-yellow-400' : effectiveColors.text}`}
              style={effectiveColors.textColor && !isDarkLayout ? { color: effectiveColors.textColor } : undefined}
            >{text}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getTitleH1Style = () => {
    const isDarkLayout = coverLayout === 'dark_overlay';
    const baseColor = useCustomMainColor ? validMainColor : '#ec4899';
    const darkBaseColor = useCustomMainColor ? darkenColor(validMainColor, 0.2) : '#be185d';

    let className = 'text-2xl font-black leading-tight w-full whitespace-pre-wrap ';
    let style = {};

    // Layout-based text color
    if (isDarkLayout) {
      className += 'text-white ';
    } else if (coverLayout === 'pop_frame') {
      className += 'text-white text-3xl ';
    } else {
      className += effectiveColors.text + ' ';
      if (effectiveColors.textColor) style.color = effectiveColors.textColor;
    }

    // Title design effects
    switch (titleDesign) {
      case 'shadow':
        className += 'drop-shadow-xl ';
        break;
      case 'frame':
        style.WebkitTextStroke = isDarkLayout ? '1.5px rgba(255,255,255,0.6)' : `1.5px ${darkBaseColor}`;
        break;
      case 'marker':
        // Marker handled via separate element
        break;
      case 'gradient':
        style.background = `linear-gradient(135deg, ${baseColor}, ${isDarkLayout ? '#facc15' : darkenColor(baseColor, 0.3)})`;
        style.WebkitBackgroundClip = 'text';
        style.WebkitTextFillColor = 'transparent';
        style.backgroundClip = 'text';
        break;
      case 'outline':
        style.textShadow = '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff, 0 -2px 0 #fff, 0 2px 0 #fff, -2px 0 0 #fff, 2px 0 0 #fff';
        if (isDarkLayout) {
          style.textShadow = '-2px -2px 0 rgba(255,255,255,0.3), 2px -2px 0 rgba(255,255,255,0.3), -2px 2px 0 rgba(255,255,255,0.3), 2px 2px 0 rgba(255,255,255,0.3)';
        }
        break;
    }

    return { className: className.trim(), style };
  };

  const handleGenerateSingle = useCallback(async (slideIndex) => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    const slides = [
      { type: 'cover', title: '1. 表紙', content: coverTitle },
      { type: 'intro', title: '2. 導入', content: introText },
      ...mainSlides.map((s, i) => ({ type: 'main', title: `${i + 3}. ${s.title}`, content: s, index: i })),
      { type: 'summary', title: '10. まとめ', content: summaryItems }
    ];
    const slide = slides[slideIndex];
    if (!slide) return;

    setGeneratingIndex(slideIndex);
    setGenError(null);

    try {
      const prompt = generatePrompt(slide.type, slide.content);
      const { charImg, refImg, bgImg } = getSlideImages(slide.type, slide.content);
      let imageUrl;

      const refImages = [charImg, refImg, bgImg].filter(Boolean);
      if (refImages.length > 1) {
        imageUrl = await generateImageWithMultipleReferences(apiKey, prompt, refImages);
      } else if (refImages.length === 1) {
        imageUrl = await generateImageWithReference(apiKey, prompt, refImages[0]);
      } else {
        imageUrl = await generateImage(apiKey, prompt);
      }

      setGeneratedImages(prev => ({ ...prev, [slideIndex]: imageUrl }));
    } catch (err) {
      console.error('Generation failed:', err);
      setGenError(err.message || '画像生成に失敗しました');
    } finally {
      setGeneratingIndex(null);
    }
  }, [apiKey, coverTitle, introText, mainSlides, summaryItems, characterSource, uploadedImage, coverCharImage, coverRefImage, introCharImage, introRefImage, summaryCharImage, summaryRefImage, generatePrompt]);

  const handleBatchGenerate = useCallback(async () => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    const slides = [
      { type: 'cover', title: '1. 表紙', content: coverTitle },
      { type: 'intro', title: '2. 導入', content: introText },
      ...mainSlides.map((s, i) => ({ type: 'main', title: `${i + 3}. ${s.title}`, content: s, index: i })),
      { type: 'summary', title: '10. まとめ', content: summaryItems }
    ];

    setBatchGenerating(true);
    batchCancelRef.current = false;
    const progress = {};
    slides.forEach((_, i) => { progress[i] = 'pending'; });
    setBatchProgress({ ...progress });

    for (let i = 0; i < slides.length; i++) {
      if (batchCancelRef.current) break;
      if (generatedImages[i]) {
        progress[i] = 'done';
        setBatchProgress({ ...progress });
        continue;
      }

      progress[i] = 'generating';
      setBatchProgress({ ...progress });
      setPreviewSlideIndex(i);

      try {
        const prompt = generatePrompt(slides[i].type, slides[i].content);
        const { charImg, refImg, bgImg } = getSlideImages(slides[i].type, slides[i].content);
        let imageUrl;

        const refImages = [charImg, refImg, bgImg].filter(Boolean);
        if (refImages.length > 1) {
          imageUrl = await generateImageWithMultipleReferences(apiKey, prompt, refImages);
        } else if (refImages.length === 1) {
          imageUrl = await generateImageWithReference(apiKey, prompt, refImages[0]);
        } else {
          imageUrl = await generateImage(apiKey, prompt);
        }
        setGeneratedImages(prev => ({ ...prev, [i]: imageUrl }));
        progress[i] = 'done';
      } catch (err) {
        console.error(`Slide ${i} failed:`, err);
        progress[i] = 'error';
      }
      setBatchProgress({ ...progress });

      // Rate limit: wait 2s between requests
      if (i < slides.length - 1 && !batchCancelRef.current) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    setBatchGenerating(false);
  }, [apiKey, coverTitle, introText, mainSlides, summaryItems, characterSource, uploadedImage, coverCharImage, coverRefImage, introCharImage, introRefImage, summaryCharImage, summaryRefImage, generatedImages, generatePrompt]);

  const handleCancelBatch = () => {
    batchCancelRef.current = true;
  };

  const handleDownloadSingle = (slideIndex, title) => {
    const dataUrl = generatedImages[slideIndex];
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `slide_${String(slideIndex + 1).padStart(2, '0')}_${title.replace(/[^a-zA-Z0-9\u3000-\u9FFF]/g, '_')}.png`;
    link.click();
  };

  const handleDownloadAll = async () => {
    const slides = [
      { type: 'cover', title: 'cover' },
      { type: 'intro', title: 'intro' },
      ...mainSlides.map((s, i) => ({ type: 'main', title: `main_${i + 1}` })),
      { type: 'summary', title: 'summary' }
    ];
    const zip = new JSZip();
    let hasAny = false;

    for (let i = 0; i < slides.length; i++) {
      const dataUrl = generatedImages[i];
      if (dataUrl) {
        const base64 = dataUrl.split(',')[1];
        zip.file(`slide_${String(i + 1).padStart(2, '0')}_${slides[i].title}.png`, base64, { base64: true });
        hasAny = true;
      }
    }

    if (!hasAny) return;
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'insta_feed_slides.zip');
  };

  const allSlides = [
    { type: 'cover', title: '1. 表紙', content: coverTitle },
    { type: 'intro', title: '2. 導入', content: introText },
    ...mainSlides.map((s, i) => ({ type: 'main', title: `${i + 3}. ${s.title}`, content: s, index: i })),
    { type: 'summary', title: '10. まとめ', content: summaryItems }
  ];

  const currentTheme = THEMES[selectedTheme];

  // カスタムカラー有効時のバリデーション
  const validMainColor = /^#[0-9A-Fa-f]{6}$/.test(customMainColor) ? customMainColor : '#E91E63';

  // effectiveColors: カスタムカラーON時はinline style、OFF時はTailwindクラス
  const effectiveColors = useCustomMainColor
    ? {
        band: '',
        bg: '',
        text: '',
        accent: '',
        bandStyle: { backgroundColor: validMainColor },
        bgGradientStyle: { background: `linear-gradient(to bottom right, ${lightenColor(validMainColor, 0.85)}, ${lightenColor(validMainColor, 0.92)})` },
        textColor: isLightColor(validMainColor) ? '#1e293b' : '#ffffff',
        accentColor: darkenColor(validMainColor, 0.3),
      }
    : {
        band: currentTheme.colors.band,
        bg: currentTheme.colors.bg,
        text: currentTheme.colors.text,
        accent: currentTheme.colors.accent,
        bandStyle: null,
        bgGradientStyle: null,
        textColor: null,
        accentColor: null,
      };

  // 枠カラー（frame背景用）
  const frameColor = useCustomMainColor
    ? validMainColor
    : (() => {
        const bandColorMap = {
          'bg-stone-200': '#a8a29e', 'bg-indigo-400': '#818cf8', 'bg-lime-400': '#a3e635',
          'bg-blue-600': '#2563eb', 'bg-yellow-400': '#facc15', 'bg-orange-500/80': '#f97316',
          'bg-navy-900': '#1e3a5f', 'bg-rose-200': '#fda4af',
        };
        return bandColorMap[currentTheme.colors.band] || '#ec4899';
      })();

  // セクション別背景ヘルパー
  const getSlideBg = (slideType, slideContent) => {
    let sectionBg = null;
    if (slideType === 'cover') sectionBg = coverBg;
    else if (slideType === 'intro') sectionBg = introBg;
    else if (slideType === 'summary') sectionBg = summaryBg;
    else if (slideType === 'main' && slideContent) sectionBg = slideContent.bg;
    const effectiveType = sectionBg?.type || bgType;
    const effectiveColor = sectionBg?.color || customBgColor;
    const effectiveImage = sectionBg?.image || null;
    const effectiveImageStyle = sectionBg?.imageStyle || null;
    const effectiveDesc = sectionBg?.desc || bgDesc;
    return { type: effectiveType, color: effectiveColor, image: effectiveImage, imageStyle: effectiveImageStyle, desc: effectiveDesc };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-pink-500 p-1.5 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">Insta Feed <span className="text-pink-600">Generator</span></h1>
            <h1 className="text-lg font-bold text-slate-800 sm:hidden">Insta Gen</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button onClick={() => setActiveTab('edit')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 ${activeTab === 'edit' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><Layout className="w-3 h-3" /> 手動作成</button>
              <button onClick={() => setActiveTab('ai')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 ${activeTab === 'ai' ? 'bg-white shadow-sm text-purple-700' : 'text-slate-500'}`}><Wand2 className="w-3 h-3" /> AI構成</button>
              <button onClick={() => setActiveTab('preview')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 ${activeTab === 'preview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}><MonitorPlay className="w-3 h-3" /> 出力</button>
            </div>
            <button
              onClick={() => { setApiKeyInput(apiKey); setShowSettings(true); }}
              className={`p-2 rounded-lg border transition-all ${apiKey ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100' : 'text-slate-400 border-slate-200 hover:bg-slate-50'}`}
              title="API設定"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* --- Settings Modal --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-700 flex items-center gap-2"><Settings className="w-5 h-5" /> API設定</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Gemini APIキー</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIza..."
                      className="w-full pr-10 text-sm p-3 border border-slate-200 rounded-lg focus:border-pink-500 outline-none font-mono"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Google AI Studio で取得できます。APIキーはこのブラウザにのみ保存されます。</p>
              </div>

              <button
                onClick={saveApiKey}
                disabled={!apiKeyInput.trim()}
                className="w-full py-3 bg-pink-600 text-white rounded-lg font-bold text-sm hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                保存
              </button>

              {apiKey && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg">
                  <Check className="w-4 h-4" />
                  APIキー設定済み
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">

        {activeTab === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            <div className="lg:col-span-4 space-y-6">

              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">
                <button
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="w-full bg-slate-50 px-4 py-2.5 flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase">テーマ</span>
                    <span className="text-sm font-bold text-slate-800">{THEMES[selectedTheme].name}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {themeDropdownOpen && (
                  <div className="border-t border-slate-200 p-3 grid grid-cols-1 gap-1.5">
                    {Object.entries(THEMES).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => { setSelectedTheme(key); setThemeDropdownOpen(false); }}
                        className={`text-left px-3 py-2 rounded-lg text-sm border transition-all flex items-center justify-between ${
                          selectedTheme === key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{theme.name}</span>
                        {selectedTheme === key && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* メインカラー */}
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Droplets className="w-4 h-4" /> メインカラー
                  </h2>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={useCustomMainColor} onChange={() => setUseCustomMainColor(!useCustomMainColor)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                  </label>
                </div>

                {useCustomMainColor && (
                  <div className="p-4 space-y-3">
                    <p className="text-[10px] text-slate-400">帯・背景・アクセント色をカスタムカラーで統一します</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={validMainColor}
                        onChange={(e) => setCustomMainColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={customMainColor}
                        onChange={(e) => setCustomMainColor(e.target.value)}
                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 uppercase font-mono focus:border-pink-500 outline-none"
                        placeholder="#E91E63"
                      />
                    </div>
                    {/* プレビュースウォッチ */}
                    <div className="flex gap-1.5 items-center">
                      <div className="w-7 h-7 rounded-md border border-slate-200 shadow-sm" style={{ backgroundColor: validMainColor }} title="帯の色"></div>
                      <div className="w-7 h-7 rounded-md border border-slate-200 shadow-sm" style={{ backgroundColor: lightenColor(validMainColor, 0.85) }} title="背景 (薄)"></div>
                      <div className="w-7 h-7 rounded-md border border-slate-200 shadow-sm" style={{ backgroundColor: lightenColor(validMainColor, 0.92) }} title="背景 (最薄)"></div>
                      <div className="w-7 h-7 rounded-md border border-slate-200 shadow-sm" style={{ backgroundColor: darkenColor(validMainColor, 0.3) }} title="アクセント"></div>
                      <div className="flex flex-col ml-1">
                        <span className="text-[9px] text-slate-400 leading-tight">帯 / 背景 / アクセント</span>
                        <span className="text-[9px] text-slate-300 leading-tight">テキスト: {isLightColor(validMainColor) ? '暗色' : '白色'}自動</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* テキスト */}
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <h2 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Type className="w-4 h-4" /> テキスト
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2">フォントスタイル</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FONT_STYLES.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFontStyle(f.id)}
                          className={`py-1.5 rounded-md text-xs font-bold border transition-all ${
                            fontStyle === f.id
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2">文字の配置</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => setGlobalTextAlign('left')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold ${globalTextAlign === 'left' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}><AlignLeft className="w-3 h-3" /> 左揃え</button>
                      <button onClick={() => setGlobalTextAlign('center')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold ${globalTextAlign === 'center' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}><AlignCenter className="w-3 h-3" /> 中央揃え</button>
                    </div>
                  </div>
                </div>
              </section>

              {/* 背景 */}
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <h2 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> 背景
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2">背景タイプ（デフォルト）</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <button onClick={() => setBgType('white')} className={`py-2 rounded-md text-xs font-bold border ${bgType === 'white' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-500'}`}>白背景</button>
                      <button onClick={() => setBgType('solid')} className={`py-2 rounded-md text-xs font-bold border ${bgType === 'solid' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-500'}`}>無地(色)</button>
                      <button onClick={() => setBgType('theme')} className={`py-2 rounded-md text-xs font-bold border ${bgType === 'theme' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-500'}`}>テーマ</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button onClick={() => setBgType('frame')} className={`py-2 rounded-md text-xs font-bold border flex items-center justify-center gap-1 ${bgType === 'frame' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-500'}`}>
                        <BoxSelect className="w-3 h-3" /> 枠+白
                      </button>
                      <button onClick={() => setBgType('image')} className={`py-2 rounded-md text-xs font-bold border flex items-center justify-center gap-1 ${bgType === 'image' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-500'}`}>
                        <ImageIcon className="w-3 h-3" /> 画像
                      </button>
                    </div>
                    {bgType === 'solid' && (
                      <div className="flex items-center gap-2">
                        <input type="color" value={customBgColor} onChange={(e) => setCustomBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none" />
                        <input type="text" value={customBgColor} onChange={(e) => setCustomBgColor(e.target.value)} className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 uppercase font-mono" placeholder="#FFFFFF" />
                      </div>
                    )}
                    {bgType === 'frame' && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="w-10 aspect-[4/5] rounded border-[3px] bg-white" style={{ borderColor: frameColor }}></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500">枠カラー: {frameColor}</span>
                          <span className="text-[9px] text-slate-400">{useCustomMainColor ? 'メインカラー準拠' : 'テーマカラー準拠'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">背景の特徴・詳細（デフォルト）</label>
                    <textarea
                      value={bgDesc}
                      onChange={(e) => setBgDesc(e.target.value)}
                      placeholder="例: 桜が舞う春の公園、夕焼けのビーチ、カフェの内装..."
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:border-pink-500 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400">※各セクションで個別設定も可能です</p>
                </div>
              </section>

              {/* キャラクター基本設定 */}
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <User className="w-4 h-4" /> キャラクター基本設定
                  </h2>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={useCharacter} onChange={() => setUseCharacter(!useCharacter)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                  </label>
                </div>

                {useCharacter && (
                  <div className="p-4 space-y-4">

                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-2">サイズ（表示の大きさ）</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['chibi', 'small', 'medium', 'large'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setCharacterSize(size)}
                            className={`py-1.5 text-xs font-bold rounded border ${characterSize === size ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-white border-slate-200 text-slate-500'}`}
                          >
                            {size === 'chibi' ? 'ちびキャラ (極小)' :
                             size === 'small' ? '小 (全身)' :
                             size === 'medium' ? '中 (上半身)' : '大 (胸から上)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-100 p-1 rounded-lg flex">
                      <button onClick={() => setCharacterSource('ai')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${characterSource === 'ai' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>AI生成用テキスト</button>
                      <button onClick={() => setCharacterSource('upload')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${characterSource === 'upload' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>画像アップロード利用</button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 block">
                        {characterSource === 'upload' ? '画像の特徴を詳細に言語化してください（AI生成用）' : 'キャラクターの特徴を入力'}
                      </label>
                      <textarea
                        className="w-full text-sm p-3 border rounded-md focus:ring-2 focus:ring-pink-200 outline-none resize-none"
                        rows={3}
                        value={characterDesc}
                        onChange={(e) => setCharacterDesc(e.target.value)}
                        placeholder={characterSource === 'upload'
                          ? "アップロード画像の特徴（例：茶髪ショートヘア、青いパーカーの女性...）\n※このテキストはプロンプトに使用されます"
                          : "例：眼鏡をかけた知的な女性、スーツ姿..."
                        }
                      />
                    </div>

                    {characterSource === 'upload' && (
                      <div className="space-y-3 bg-pink-50 p-3 rounded-lg border border-pink-100">
                        <div
                          className="border-2 border-dashed border-pink-300 bg-white/50 rounded-lg p-4 text-center cursor-pointer hover:bg-white transition-colors relative overflow-hidden"
                          onClick={uploadedImage ? undefined : handleImageUpload}
                        >
                          {uploadedImage ? (
                            <div className="relative h-32 w-full flex items-center justify-center group">
                              <img src={uploadedImage} alt="Uploaded Character" className="h-full object-contain" />
                              <div className="absolute top-1 right-1 flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleImageUpload(); }}
                                  className="bg-blue-500 text-white p-1 rounded-full shadow-md hover:bg-blue-600"
                                  title="画像を変更"
                                >
                                  <Upload className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeUploadedImage(); }}
                                  className="bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                                  title="画像を削除"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2">
                              <Upload className="w-6 h-6 text-pink-400 mx-auto mb-1" />
                              <p className="text-xs text-pink-600 font-bold">画像をアップロード</p>
                              <p className="text-[10px] text-pink-400">プレビュー用 (PNG/JPG)</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                          <Info className="w-4 h-4 text-pink-500 flex-shrink-0" />
                          <div>
                            アップロード画像はAPI呼び出し時にキャラクター参照として自動送信されます。
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Right: Content Edit (Tabbed) */}
            <div className="lg:col-span-8">

              <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden">
                {['cover', 'intro', 'main', 'summary'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setContentTab(tab)}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${contentTab === tab ? 'bg-pink-50 text-pink-600 border-b-2 border-pink-500' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {tab === 'cover' && <MousePointerClick className="w-4 h-4" />}
                    {tab === 'intro' && <FileText className="w-4 h-4" />}
                    {tab === 'main' && <ImageIcon className="w-4 h-4" />}
                    {tab === 'summary' && <List className="w-4 h-4" />}
                    {tab === 'cover' ? '表紙' : tab === 'intro' ? '導入' : tab === 'main' ? 'コンテンツ' : 'まとめ'}
                  </button>
                ))}
              </div>

              <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-6 min-h-[400px]">

                {/* Cover Tab */}
                {contentTab === 'cover' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-slate-700 text-lg">投稿の表紙を作成</h3>
                      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-bold">1枚目</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1">サブタイトル（強調表示）</label>
                        <input
                          type="text"
                          className="w-full text-sm font-bold p-2 border border-slate-200 rounded-lg focus:border-pink-500 outline-none"
                          value={coverSubtitle}
                          onChange={(e) => setCoverSubtitle(e.target.value)}
                          placeholder="例：初心者さんOK！"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1">メインタイトル</label>
                        <textarea className="w-full text-lg font-bold p-3 border-2 border-slate-100 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none resize-none" rows={3} value={coverTitle} onChange={(e) => setCoverTitle(e.target.value)} />
                      </div>
                    </div>

                    {/* 表紙デザイン3層選択 */}
                    <div className="space-y-3">
                      {/* Layer 1: レイアウト */}
                      <div>
                        <label className="text-xs font-bold text-pink-400 block mb-1.5">🎨 レイアウト</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {COVER_LAYOUTS.map((style) => {
                            const Icon = style.icon;
                            return (
                              <button
                                key={style.id}
                                onClick={() => setCoverLayout(style.id)}
                                className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  coverLayout === style.id
                                    ? 'bg-pink-50 border-pink-500 text-pink-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {style.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Layer 2: タイトルデザイン */}
                      <div>
                        <label className="text-xs font-bold text-violet-400 block mb-1.5">✏️ タイトルデザイン</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {TITLE_DESIGNS.map((style) => {
                            const Icon = style.icon;
                            return (
                              <button
                                key={style.id}
                                onClick={() => setTitleDesign(style.id)}
                                className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  titleDesign === style.id
                                    ? 'bg-violet-50 border-violet-500 text-violet-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {style.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Layer 3: サブタイトル装飾 */}
                      <div>
                        <label className="text-xs font-bold text-amber-400 block mb-1.5">🏷️ サブタイトル装飾</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {SUBTITLE_DESIGNS.map((style) => {
                            const Icon = style.icon;
                            return (
                              <button
                                key={style.id}
                                onClick={() => setSubtitleDesign(style.id)}
                                className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  subtitleDesign === style.id
                                    ? 'bg-amber-50 border-amber-500 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {style.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 表紙追加デザインオプション */}
                    <div className="space-y-3 border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Star className="w-3 h-3" /> 追加デザインオプション</p>

                      {/* スワイプ誘導 */}
                      <div>
                        <label className="text-xs font-bold text-cyan-500 block mb-1.5">👆 スワイプ誘導</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {SWIPE_GUIDES.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setSwipeGuide(item.id)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                swipeGuide === item.id
                                  ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* アイキャッチバッジ */}
                      <div>
                        <label className="text-xs font-bold text-orange-500 block mb-1.5">🏅 アイキャッチバッジ</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {EYE_CATCH_BADGES.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setEyeCatchBadge(item.id)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                eyeCatchBadge === item.id
                                  ? 'bg-orange-50 border-orange-500 text-orange-700'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 装飾エフェクト */}
                      <div>
                        <label className="text-xs font-bold text-purple-500 block mb-1.5">✨ 装飾エフェクト</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {DECO_EFFECTS.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setDecoEffect(item.id)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                decoEffect === item.id
                                  ? 'bg-purple-50 border-purple-500 text-purple-700'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 余白・マージン */}
                      <div>
                        <label className="text-xs font-bold text-teal-500 block mb-1.5">📐 余白・マージン</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {MARGIN_LEVELS.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setMarginLevel(item.id)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                marginLevel === item.id
                                  ? 'bg-teal-50 border-teal-500 text-teal-700'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* タイトル文字サイズ強弱 */}
                      <div>
                        <label className="text-xs font-bold text-rose-500 block mb-1.5">🔤 タイトル強弱</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {TITLE_EMPHASIS_OPTIONS.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setTitleEmphasis(item.id)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                titleEmphasis === item.id
                                  ? 'bg-rose-50 border-rose-500 text-rose-700'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {useCharacter && <CharacterSettingsUI exp={coverCharExp} setExp={setCoverCharExp} pos={coverCharPos} setPos={setCoverCharPos} bubble={coverBubble} setBubble={setCoverBubble} bubbleText={coverBubbleText} setBubbleText={setCoverBubbleText} charImage={coverCharImage} setCharImage={setCoverCharImage} />}
                    <RefImageUpload refImage={coverRefImage} setRefImage={setCoverRefImage} />
                    <SectionBgSettings bg={coverBg} setBg={setCoverBg} frameColor={frameColor} />
                  </div>
                )}

                {/* Intro Tab */}
                {contentTab === 'intro' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-slate-700 text-lg">導入（リード文）を作成</h3>
                      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-bold">2枚目</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">導入テキスト</label>
                      <textarea className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:border-pink-500 outline-none resize-none" rows={4} value={introText} onChange={(e) => setIntroText(e.target.value)} />
                    </div>
                    {useCharacter && <CharacterSettingsUI exp={introCharExp} setExp={setIntroCharExp} pos={introCharPos} setPos={setIntroCharPos} bubble={introBubble} setBubble={setIntroBubble} bubbleText={introBubbleText} setBubbleText={setIntroBubbleText} charImage={introCharImage} setCharImage={setIntroCharImage} />}
                    <RefImageUpload refImage={introRefImage} setRefImage={setIntroRefImage} />
                    <SectionBgSettings bg={introBg} setBg={setIntroBg} frameColor={frameColor} />
                  </div>
                )}

                {/* Main Tab */}
                {contentTab === 'main' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-700 text-lg">メインコンテンツ</h3>
                      <button onClick={addMainSlide} disabled={mainSlides.length >= 7} className="text-xs bg-pink-600 text-white px-3 py-1.5 rounded-full font-bold hover:bg-pink-700 disabled:opacity-50 flex items-center gap-1"><Plus className="w-3 h-3" /> ページ追加</button>
                    </div>
                    <div className="space-y-8">
                      {mainSlides.map((slide, index) => (
                        <div key={index} className="bg-slate-50 rounded-xl border border-slate-200 p-4 relative transition-all group hover:border-pink-300">
                          <div className="absolute -left-2 -top-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm z-10">{index + 3}</div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-bold text-slate-400 block mb-1">ページタイトル</label>
                              <input type="text" value={slide.title} onChange={(e) => updateMainSlide(index, 'title', e.target.value)} className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-1.5 focus:border-pink-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">画像の説明</label>
                                <textarea rows={3} value={slide.imageDesc} onChange={(e) => updateMainSlide(index, 'imageDesc', e.target.value)} className="w-full text-sm bg-white border border-slate-200 rounded px-2 py-1.5 focus:border-pink-500 outline-none resize-none" />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">下部の説明文</label>
                                <textarea value={slide.text} onChange={(e) => updateMainSlide(index, 'text', e.target.value)} rows={4} className="w-full text-sm bg-white border border-slate-200 rounded px-2 py-1.5 focus:border-pink-500 outline-none resize-none" />
                              </div>
                            </div>
                            {useCharacter && (
                              <CharacterSettingsUI
                                exp={slide.charExp} setExp={(v) => updateMainSlide(index, 'charExp', v)}
                                pos={slide.charPos} setPos={(v) => updateMainSlide(index, 'charPos', v)}
                                bubble={slide.bubble} setBubble={(v) => updateMainSlide(index, 'bubble', v)}
                                bubbleText={slide.bubbleText} setBubbleText={(v) => updateMainSlide(index, 'bubbleText', v)}
                                charImage={slide.charImage} setCharImage={(v) => updateMainSlide(index, 'charImage', v)}
                              />
                            )}
                            <RefImageUpload refImage={slide.refImage} setRefImage={(v) => updateMainSlide(index, 'refImage', v)} />
                            <SectionBgSettings bg={slide.bg || DEFAULT_SECTION_BG} setBg={(v) => updateMainSlide(index, 'bg', v)} frameColor={frameColor} />
                          </div>
                          {mainSlides.length > 1 && <button onClick={() => removeMainSlide(index)} className="absolute top-2 right-2 text-slate-300 p-1.5 rounded-full hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Tab */}
                {contentTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-slate-700 text-lg">まとめページを作成</h3>
                      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-bold">10枚目</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-400 block mb-2">箇条書きリスト</label>
                      <div className="space-y-2">
                        {summaryItems.map((item, index) => (
                          <div key={index} className="flex gap-2 items-center bg-white p-1 rounded border border-slate-100">
                            <span className="text-pink-500 font-bold px-2">•</span>
                            <input type="text" value={item} onChange={(e) => updateSummaryItem(index, e.target.value)} className="w-full border-none outline-none py-1 text-sm text-slate-700" placeholder="まとめのポイント" />
                          </div>
                        ))}
                        {summaryItems.length < 7 && <button onClick={addSummaryItem} className="w-full py-2 text-xs text-pink-500 font-bold border border-dashed border-pink-300 rounded hover:bg-pink-50 flex items-center justify-center gap-1 mt-2"><Plus className="w-3 h-3" /> 項目を追加</button>}
                      </div>
                    </div>
                    {useCharacter && <CharacterSettingsUI exp={summaryCharExp} setExp={setSummaryCharExp} pos={summaryCharPos} setPos={setSummaryCharPos} bubble={summaryBubble} setBubble={setSummaryBubble} bubbleText={summaryBubbleText} setBubbleText={setSummaryBubbleText} charImage={summaryCharImage} setCharImage={setSummaryCharImage} />}
                    <RefImageUpload refImage={summaryRefImage} setRefImage={setSummaryRefImage} />
                    <SectionBgSettings bg={summaryBg} setBg={setSummaryBg} frameColor={frameColor} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- AI COMPOSITION MODE --- */}
        {activeTab === 'ai' && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* 入力セクション */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  AI自動構成
                </h2>
                <p className="text-xs text-slate-500 mt-1">ブログ記事や文字起こしなどの文章を入力すると、AIが10枚のインスタ投稿構成を自動で作成します</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-600">元になる文章</label>
                    <span className="text-xs text-slate-400">{aiSourceText.length.toLocaleString()} 文字</span>
                  </div>
                  <textarea
                    value={aiSourceText}
                    onChange={(e) => setAiSourceText(e.target.value)}
                    placeholder={"ここにブログ記事、動画の文字起こし、メモなどを貼り付けてください...\n\n例:\n・ブログ記事のコピペ\n・YouTubeの文字起こしデータ\n・箇条書きのメモ\n・企画のアイデアテキスト"}
                    className="w-full text-sm p-4 border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none resize-none bg-slate-50/50"
                    rows={12}
                  />
                </div>

                {aiError && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}

                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiSourceText.trim()}
                  className="w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
                >
                  {aiGenerating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> AIが構成を考えています...</>
                  ) : (
                    <><Wand2 className="w-5 h-5" /> AIに構成を考えてもらう</>
                  )}
                </button>

                {!apiKey && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
                    右上の設定ボタンからAPIキーを設定してください
                  </p>
                )}
              </div>
            </section>

            {/* 生成結果 */}
            {aiResult && (
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    構成案が完成しました
                  </h2>
                  <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">
                    全{2 + (aiResult.mainSlides?.length || 0)}枚
                  </span>
                </div>
                <div className="p-6 space-y-3">

                  {/* 表紙カード */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">1</span>
                      <span className="text-xs font-bold text-pink-600">表紙</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 leading-snug whitespace-pre-line">{aiResult.coverTitle}</h3>
                    {aiResult.coverSubtitle && (
                      <span className="inline-block mt-1.5 text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{aiResult.coverSubtitle}</span>
                    )}
                  </div>

                  {/* 導入カード */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">2</span>
                      <span className="text-xs font-bold text-blue-600">導入</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{aiResult.introText}</p>
                  </div>

                  {/* メインスライドカード */}
                  {aiResult.mainSlides?.map((slide, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-slate-700 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{i + 3}</span>
                        <span className="text-xs font-bold text-slate-600">コンテンツ</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{slide.title}</h4>
                      <p className="text-xs text-slate-500 mb-1.5 italic">{slide.imageDesc}</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{slide.text}</p>
                    </div>
                  ))}

                  {/* まとめカード */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{2 + (aiResult.mainSlides?.length || 0) + 1}</span>
                      <span className="text-xs font-bold text-amber-600">まとめ</span>
                    </div>
                    <ul className="space-y-1.5">
                      {aiResult.summaryItems?.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">✔</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-3 pt-3">
                    <button
                      onClick={applyAiResult}
                      className="flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-200"
                    >
                      <Check className="w-4 h-4" /> この構成を採用する
                    </button>
                    <button
                      onClick={handleAiGenerate}
                      disabled={aiGenerating}
                      className="px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${aiGenerating ? 'animate-spin' : ''}`} /> 再生成
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* --- PREVIEW MODE --- */}
        {activeTab === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Visual Preview List */}
            <div className="lg:col-span-4 h-[calc(100vh-140px)] overflow-y-auto pr-2 space-y-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase sticky top-0 bg-slate-50 py-2 z-10">スライド一覧</h2>

              {/* Batch Generate Button */}
              <div className="sticky top-8 z-10 pb-2">
                {!batchGenerating ? (
                  <button
                    onClick={handleBatchGenerate}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-xs hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Wand2 className="w-4 h-4" /> 全スライドを一括生成
                  </button>
                ) : (
                  <button
                    onClick={handleCancelBatch}
                    className="w-full py-2.5 bg-red-500 text-white rounded-lg font-bold text-xs hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> 生成を中止
                  </button>
                )}

                {/* Download All */}
                {Object.keys(generatedImages).length > 0 && (
                  <button
                    onClick={handleDownloadAll}
                    className="w-full mt-2 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> 全画像をZIPダウンロード ({Object.keys(generatedImages).length}枚)
                  </button>
                )}
              </div>

              {allSlides.map((slide, idx) => {
                const thumbBg = getSlideBg(slide.type, slide.content);
                return (
                <div key={idx} onClick={() => setPreviewSlideIndex(idx)} className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex gap-3 items-center ${previewSlideIndex === idx ? 'border-pink-500 bg-white shadow-md' : 'border-transparent bg-white hover:border-pink-200'}`}>
                  <div className="w-12 aspect-[4/5] rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold border border-slate-200 overflow-hidden relative"
                    style={{
                      background: thumbBg.type === 'solid' ? thumbBg.color
                        : (thumbBg.type === 'white' || thumbBg.type === 'frame') ? '#fff'
                        : thumbBg.type === 'image' && thumbBg.image ? `url(${thumbBg.image}) center/cover no-repeat`
                        : undefined
                    }}
                  >
                    {generatedImages[idx] ? (
                      <img src={generatedImages[idx]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        {thumbBg.type === 'theme' && (
                          <div
                            className={`absolute inset-0 ${!useCustomMainColor ? `bg-gradient-to-br ${currentTheme.colors.bg}` : ''}`}
                            style={effectiveColors.bgGradientStyle || undefined}
                          ></div>
                        )}
                        {thumbBg.type === 'frame' && (
                          <div className="absolute inset-0 border-2 rounded" style={{ borderColor: frameColor }}></div>
                        )}
                        {thumbBg.type === 'image' && !thumbBg.image && thumbBg.imageStyle && (
                          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                            <span className="text-[7px] text-slate-400 font-bold">{BG_IMAGE_STYLES.find(s => s.id === thumbBg.imageStyle)?.name}</span>
                          </div>
                        )}
                        <div
                          className={`absolute inset-x-0 ${slide.type === 'main' ? 'top-0 h-1/4' : 'hidden'} ${effectiveColors.band} opacity-50 z-10`}
                          style={effectiveColors.bandStyle || undefined}
                        ></div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                      {batchProgress[idx] === 'generating' && <Loader2 className="w-3 h-3 animate-spin text-pink-500 flex-shrink-0" />}
                      {batchProgress[idx] === 'done' && <Check className="w-3 h-3 text-green-500 flex-shrink-0" />}
                      {batchProgress[idx] === 'error' && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                      {generatedImages[idx] && !batchGenerating && <Check className="w-3 h-3 text-green-500 flex-shrink-0" />}
                      {slide.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{typeof slide.content === 'string' ? slide.content : 'コンテンツ詳細'}</div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Right: Detail & Prompt */}
            <div className="lg:col-span-8 space-y-6">

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                {/* Generated Image or Mock Preview */}
                {generatedImages[previewSlideIndex] ? (
                  <div className="w-full max-w-[320px] aspect-[4/5] relative rounded shadow-2xl overflow-hidden">
                    <img src={generatedImages[previewSlideIndex]} alt="Generated" className="w-full h-full object-cover" />
                    {/* Overlay buttons */}
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={() => handleDownloadSingle(previewSlideIndex, allSlides[previewSlideIndex].title)}
                        className="p-2 bg-white/90 rounded-lg shadow-md hover:bg-white transition-colors"
                        title="ダウンロード"
                      >
                        <Download className="w-4 h-4 text-slate-700" />
                      </button>
                      <button
                        onClick={() => handleGenerateSingle(previewSlideIndex)}
                        className="p-2 bg-white/90 rounded-lg shadow-md hover:bg-white transition-colors"
                        title="再生成"
                        disabled={generatingIndex === previewSlideIndex}
                      >
                        <RefreshCw className={`w-4 h-4 text-slate-700 ${generatingIndex === previewSlideIndex ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                ) : generatingIndex === previewSlideIndex ? (
                  <div className="w-full max-w-[320px] aspect-[4/5] relative rounded shadow-2xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                    <div className="text-sm font-bold text-slate-500">画像を生成中...</div>
                    <div className="text-[10px] text-slate-400">30秒〜1分ほどかかります</div>
                  </div>
                ) : (() => {
                    const previewBg = getSlideBg(allSlides[previewSlideIndex].type, allSlides[previewSlideIndex].content);
                    return (
                  <div className="w-full max-w-[320px] aspect-[4/5] relative rounded shadow-2xl overflow-hidden text-center flex flex-col"
                    style={{
                      backgroundColor: previewBg.type === 'solid' ? previewBg.color
                        : (previewBg.type === 'white' || previewBg.type === 'frame') ? '#fff'
                        : undefined
                    }}
                  >
                    {previewBg.type === 'theme' && (
                      <div
                        className={`absolute inset-0 ${!useCustomMainColor ? `bg-gradient-to-br ${currentTheme.colors.bg}` : ''}`}
                        style={effectiveColors.bgGradientStyle || undefined}
                      ></div>
                    )}
                    {previewBg.type === 'frame' && (
                      <div className="absolute inset-0 pointer-events-none z-20" style={{ border: `8px solid ${frameColor}`, borderRadius: '4px' }}></div>
                    )}
                    {previewBg.type === 'image' && previewBg.image && (
                      <div className="absolute inset-0" style={{ backgroundImage: `url(${previewBg.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    )}
                    {previewBg.type === 'image' && !previewBg.image && previewBg.imageStyle && (
                      <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                        <span className="text-xs text-slate-400 font-bold">{BG_IMAGE_STYLES.find(s => s.id === previewBg.imageStyle)?.name} スタイル</span>
                      </div>
                    )}
                    {previewBg.type === 'image' && !previewBg.image && !previewBg.imageStyle && (
                      <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-200" />
                      </div>
                    )}

                    {useCharacter && (
                      <>
                        <div className={`absolute flex items-end justify-center z-0 transition-all duration-300
                          ${(() => {
                              let pos = 'bottom_right';
                              if (allSlides[previewSlideIndex].type === 'cover') pos = coverCharPos;
                              else if (allSlides[previewSlideIndex].type === 'intro') pos = introCharPos;
                              else if (allSlides[previewSlideIndex].type === 'summary') pos = summaryCharPos;
                              else if (allSlides[previewSlideIndex].type === 'main') pos = allSlides[previewSlideIndex].content.charPos;

                              let sizeClass = 'h-[60%] w-[50%]';
                              if (characterSize === 'small') sizeClass = 'h-[75%] w-[50%]';
                              if (characterSize === 'large') sizeClass = 'h-[45%] w-[60%]';
                              if (characterSize === 'chibi') sizeClass = 'h-[25%] w-[25%]';

                              let posClass = '';
                              if (pos === 'top_left') posClass = `top-0 left-[-5%] items-start pt-4`;
                              if (pos === 'top_right') posClass = `top-0 right-[-5%] items-start pt-4`;
                              if (pos === 'bottom_left') posClass = `bottom-0 left-[-5%] items-end pb-0`;
                              if (pos === 'bottom_right') posClass = `bottom-0 right-[-5%] items-end pb-0`;

                              if (characterSize === 'chibi') {
                                if (pos === 'top_left') posClass = `top-4 left-4 items-center`;
                                if (pos === 'top_right') posClass = `top-4 right-4 items-center`;
                                if (pos === 'bottom_left') posClass = `bottom-4 left-4 items-center`;
                                if (pos === 'bottom_right') posClass = `bottom-4 right-4 items-center`;
                              }

                              return `${sizeClass} ${posClass}`;
                          })()}
                        `}>
                          {characterSource === 'upload' && uploadedImage ? (
                            <img src={uploadedImage} alt="Char" className="h-full w-full object-contain drop-shadow-lg" />
                          ) : (
                            <div className={`w-full h-full bg-slate-800/10 rounded-t-full blur-sm flex items-end justify-center pb-4 ${characterSize === 'chibi' ? 'rounded-full' : ''}`}>
                              <span className="text-slate-500/50 text-[10px] font-bold">
                                {(() => {
                                  let exp = '';
                                  if (allSlides[previewSlideIndex].type === 'cover') exp = coverCharExp;
                                  else if (allSlides[previewSlideIndex].type === 'intro') exp = introCharExp;
                                  else if (allSlides[previewSlideIndex].type === 'summary') exp = summaryCharExp;
                                  else if (allSlides[previewSlideIndex].type === 'main') exp = allSlides[previewSlideIndex].content.charExp;
                                  return exp ? exp.split(',')[0] : 'Char';
                                })()}
                              </span>
                            </div>
                          )}
                        </div>

                        {(() => {
                            let bubble = false;
                            let pos = 'bottom_right';
                            let bubbleText = '';
                            const slide = allSlides[previewSlideIndex];

                            if (slide.type === 'cover') { bubble = coverBubble; pos = coverCharPos; bubbleText = coverBubbleText; }
                            else if (slide.type === 'intro') { bubble = introBubble; pos = introCharPos; bubbleText = introBubbleText; }
                            else if (slide.type === 'summary') { bubble = summaryBubble; pos = summaryCharPos; bubbleText = summaryBubbleText; }
                            else if (slide.type === 'main') { bubble = slide.content.bubble; pos = slide.content.charPos; bubbleText = slide.content.bubbleText; }

                            if (!bubble) return null;

                            let bubblePosClass = '';
                            if (pos === 'top_left') bubblePosClass = 'top-32 left-24 rounded-tl-none';
                            if (pos === 'top_right') bubblePosClass = 'top-32 right-24 rounded-tr-none';
                            if (pos === 'bottom_left') bubblePosClass = 'bottom-1/2 left-20 rounded-bl-none';
                            if (pos === 'bottom_right') bubblePosClass = 'bottom-1/2 right-20 rounded-br-none';

                            if (characterSize === 'chibi') {
                              if (pos === 'top_left') bubblePosClass = 'top-4 left-20 rounded-tl-none';
                              if (pos === 'top_right') bubblePosClass = 'top-4 right-20 rounded-tr-none';
                              if (pos === 'bottom_left') bubblePosClass = 'bottom-16 left-20 rounded-bl-none';
                              if (pos === 'bottom_right') bubblePosClass = 'bottom-16 right-20 rounded-br-none';
                            }

                            return (
                              <div className={`absolute bg-white rounded-2xl flex items-center justify-center shadow-lg z-10 opacity-95 border-2 border-slate-100 p-2 min-w-[70px] ${bubblePosClass}`}>
                                <div className="text-[10px] font-bold text-slate-700 leading-tight text-center whitespace-pre-wrap">
                                  {bubbleText || '...'}
                                </div>
                              </div>
                            );
                        })()}
                      </>
                    )}

                    <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
                      {allSlides[previewSlideIndex].type === 'intro' && (
                        <div className={`w-full py-4 px-2 ${effectiveColors.band} shadow-md`} style={effectiveColors.bandStyle || undefined}>
                          <h3 className={`text-sm font-bold truncate ${effectiveColors.text} text-center`} style={effectiveColors.textColor ? { color: effectiveColors.textColor } : undefined}>{coverTitle}</h3>
                        </div>
                      )}
                      {(allSlides[previewSlideIndex].type === 'main' || allSlides[previewSlideIndex].type === 'summary') && (
                        <div className={`w-full py-4 px-2 ${effectiveColors.band} shadow-md`} style={effectiveColors.bandStyle || undefined}>
                          <h3 className={`text-sm font-bold truncate ${effectiveColors.text}`} style={effectiveColors.textColor ? { color: effectiveColors.textColor } : undefined}>{allSlides[previewSlideIndex].type === 'main' ? allSlides[previewSlideIndex].content.title : 'まとめ'}</h3>
                        </div>
                      )}
                      <div className={`flex-1 flex flex-col justify-center p-10 ${globalTextAlign === 'left' ? 'items-start text-left' : 'items-center text-center'}`}>
                        {allSlides[previewSlideIndex].type === 'cover' && (() => {
                          const titleProps = getTitleH1Style();
                          const marginPadding = marginLevel === 'none' ? 'p-2' : marginLevel === 'small' ? 'p-6' : marginLevel === 'large' ? 'p-14' : 'p-10';

                          // 左右分割レイアウト
                          if (coverLayout === 'left_right') {
                            return (
                              <div className={`w-full h-full relative flex flex-row ${marginPadding}`}>
                                {decoEffect === 'sparkle' && <div className="absolute inset-0 pointer-events-none z-20 opacity-40" style={{ background: 'radial-gradient(circle at 20% 30%, gold 0px, transparent 2px), radial-gradient(circle at 80% 60%, gold 0px, transparent 2px), radial-gradient(circle at 50% 10%, gold 0px, transparent 1.5px)' }}></div>}
                                {decoEffect === 'geometric' && <div className="absolute top-4 right-4 w-12 h-12 border-2 border-pink-300/40 rounded-full pointer-events-none z-20"></div>}
                                <div className="flex-1 flex flex-col justify-center pr-4 z-10">
                                  {renderSubtitleBadge(coverSubtitle)}
                                  <h1 className={titleProps.className} style={titleProps.style}>{coverTitle}</h1>
                                </div>
                                <div className="w-2/5 bg-slate-200/50 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-slate-300" />
                                </div>
                                {swipeGuide === 'page_count' && <div className="absolute top-2 right-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded z-20">全10枚</div>}
                                {swipeGuide === 'swipe_arrow' && <div className="absolute bottom-3 right-3 text-white/80 text-[9px] font-bold flex items-center gap-0.5 z-20 bg-black/40 px-1.5 py-0.5 rounded">Swipe <ArrowRight className="w-3 h-3" /></div>}
                                {eyeCatchBadge === 'ribbon' && <div className="absolute top-0 left-0 bg-red-500 text-white text-[7px] font-bold px-2 py-1 z-20" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}>人気</div>}
                                {eyeCatchBadge === 'label' && <div className="absolute top-2 left-2 bg-pink-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full z-20">保存版</div>}
                              </div>
                            );
                          }

                          // カード型レイアウト
                          if (coverLayout === 'card') {
                            return (
                              <div className={`w-full h-full relative flex items-center justify-center ${marginPadding}`}>
                                {decoEffect === 'sparkle' && <div className="absolute inset-0 pointer-events-none z-20 opacity-40" style={{ background: 'radial-gradient(circle at 20% 30%, gold 0px, transparent 2px), radial-gradient(circle at 80% 60%, gold 0px, transparent 2px)' }}></div>}
                                {decoEffect === 'geometric' && <><div className="absolute top-6 left-6 w-8 h-8 border-2 border-violet-300/40 rotate-45 pointer-events-none z-20"></div><div className="absolute bottom-8 right-8 w-6 h-6 border-2 border-pink-300/40 rounded-full pointer-events-none z-20"></div></>}
                                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-[85%] flex flex-col items-center z-10 border border-white/50">
                                  {renderSubtitleBadge(coverSubtitle)}
                                  <div className="relative w-full">
                                    {titleDesign === 'marker' && <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 -skew-y-2 z-[-1] rounded-sm mix-blend-multiply ${!useCustomMainColor ? 'bg-yellow-300/60' : ''}`} style={useCustomMainColor ? { backgroundColor: `${validMainColor}60` } : undefined}></div>}
                                    <h1 className={titleProps.className} style={titleProps.style}>{coverTitle}</h1>
                                  </div>
                                </div>
                                {swipeGuide === 'page_count' && <div className="absolute top-2 right-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded z-20">全10枚</div>}
                                {swipeGuide === 'swipe_arrow' && <div className="absolute bottom-3 right-3 text-white/80 text-[9px] font-bold flex items-center gap-0.5 z-20 bg-black/40 px-1.5 py-0.5 rounded">Swipe <ArrowRight className="w-3 h-3" /></div>}
                                {eyeCatchBadge === 'ribbon' && <div className="absolute top-0 left-0 bg-red-500 text-white text-[7px] font-bold px-2 py-1 z-20" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}>人気</div>}
                                {eyeCatchBadge === 'label' && <div className="absolute top-2 left-2 bg-pink-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full z-20">保存版</div>}
                              </div>
                            );
                          }

                          // 対角線レイアウト
                          if (coverLayout === 'diagonal') {
                            return (
                              <div className={`w-full h-full relative overflow-hidden ${marginPadding}`}>
                                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, transparent 45%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.1) 55%, transparent 55%)' }}></div>
                                {decoEffect === 'sparkle' && <div className="absolute inset-0 pointer-events-none z-20 opacity-40" style={{ background: 'radial-gradient(circle at 20% 30%, gold 0px, transparent 2px), radial-gradient(circle at 80% 60%, gold 0px, transparent 2px)' }}></div>}
                                <div className="relative z-10 flex flex-col justify-center items-start h-full pl-2">
                                  {renderSubtitleBadge(coverSubtitle)}
                                  <div className="relative" style={{ transform: 'rotate(-3deg)' }}>
                                    <h1 className={titleProps.className} style={titleProps.style}>{coverTitle}</h1>
                                  </div>
                                </div>
                                {swipeGuide === 'page_count' && <div className="absolute top-2 right-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded z-20">全10枚</div>}
                                {swipeGuide === 'swipe_arrow' && <div className="absolute bottom-3 right-3 text-white/80 text-[9px] font-bold flex items-center gap-0.5 z-20 bg-black/40 px-1.5 py-0.5 rounded">Swipe <ArrowRight className="w-3 h-3" /></div>}
                                {eyeCatchBadge === 'ribbon' && <div className="absolute top-0 left-0 bg-red-500 text-white text-[7px] font-bold px-2 py-1 z-20" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}>人気</div>}
                                {eyeCatchBadge === 'label' && <div className="absolute top-2 left-2 bg-pink-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full z-20">保存版</div>}
                              </div>
                            );
                          }

                          // 既存レイアウト (simple, band, dark_overlay, pop_frame, split)
                          return (
                            <div
                              className={`w-full relative flex flex-col justify-center items-center h-full
                                ${coverLayout === 'band' ? `${effectiveColors.band} py-12 -mx-10 px-10 shadow-lg` : ''}
                                ${coverLayout === 'dark_overlay' ? 'bg-black/60 backdrop-blur-md p-8 rounded-xl border border-white/10' : ''}
                                ${coverLayout === 'pop_frame' ? 'p-2' : ''}
                                ${coverLayout === 'split' ? 'justify-end pb-4' : ''}
                              `}
                              style={coverLayout === 'band' && effectiveColors.bandStyle ? { ...effectiveColors.bandStyle, opacity: 0.9 } : undefined}
                            >
                              {coverLayout === 'pop_frame' && <div className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none"></div>}
                              {coverLayout === 'split' && (
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/90 backdrop-blur-sm"></div>
                              )}
                              {decoEffect === 'sparkle' && <div className="absolute inset-0 pointer-events-none z-20 opacity-40" style={{ background: 'radial-gradient(circle at 20% 30%, gold 0px, transparent 2px), radial-gradient(circle at 80% 60%, gold 0px, transparent 2px), radial-gradient(circle at 50% 10%, gold 0px, transparent 1.5px)' }}></div>}
                              {decoEffect === 'geometric' && <><div className="absolute top-4 right-4 w-10 h-10 border-2 border-pink-300/30 rounded-full pointer-events-none z-20"></div><div className="absolute bottom-8 left-6 w-6 h-6 border-2 border-violet-300/30 rotate-45 pointer-events-none z-20"></div></>}
                              <div className={`relative z-10 flex flex-col items-center ${coverLayout === 'split' ? 'mt-auto' : ''}`}>
                                {renderSubtitleBadge(coverSubtitle)}
                                <div className="relative w-full">
                                  {titleDesign === 'marker' && (
                                    <div
                                      className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 -skew-y-2 z-[-1] rounded-sm mix-blend-multiply ${!useCustomMainColor ? 'bg-yellow-300/60' : ''}`}
                                      style={useCustomMainColor ? { backgroundColor: `${validMainColor}60` } : undefined}
                                    ></div>
                                  )}
                                  <h1 className={titleProps.className} style={titleProps.style}>{coverTitle}</h1>
                                </div>
                              </div>
                              {swipeGuide === 'page_count' && <div className="absolute top-2 right-2 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded z-20">全10枚</div>}
                              {swipeGuide === 'swipe_arrow' && <div className="absolute bottom-3 right-3 text-white/80 text-[9px] font-bold flex items-center gap-0.5 z-20 bg-black/40 px-1.5 py-0.5 rounded">Swipe <ArrowRight className="w-3 h-3" /></div>}
                              {swipeGuide === 'peek' && <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-300/60 to-transparent z-20 pointer-events-none"></div>}
                              {eyeCatchBadge === 'number_big' && <div className="absolute top-4 left-1/2 -translate-x-1/2 text-3xl font-black opacity-20 z-0" style={{ color: useCustomMainColor ? validMainColor : '#ec4899' }}>5</div>}
                              {eyeCatchBadge === 'ribbon' && <div className="absolute top-0 left-0 bg-red-500 text-white text-[7px] font-bold px-2 py-1 z-20" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}>人気</div>}
                              {eyeCatchBadge === 'label' && <div className="absolute top-2 left-2 bg-pink-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full z-20">保存版</div>}
                            </div>
                          );
                        })()}
                        {allSlides[previewSlideIndex].type === 'intro' && (
                          <div className="w-full h-full flex flex-col justify-center">
                            <p className={`text-sm font-medium leading-loose w-full ${effectiveColors.text} bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow-sm`} style={effectiveColors.textColor ? { color: effectiveColors.textColor } : undefined}>{introText}</p>
                          </div>
                        )}
                        {allSlides[previewSlideIndex].type === 'main' && (
                          <div className="w-full h-full flex flex-col gap-2 pt-2">
                            <div className="flex-1 bg-slate-900/10 rounded-lg flex items-center justify-center text-slate-400 text-xs"><ImageIcon className="w-8 h-8 opacity-50" /></div>
                            <div className={`p-3 bg-white/80 backdrop-blur-sm rounded-lg text-xs shadow-sm ${effectiveColors.accent} ${globalTextAlign === 'left' ? 'text-left' : 'text-center'}`} style={effectiveColors.accentColor ? { color: effectiveColors.accentColor } : undefined}>{allSlides[previewSlideIndex].content.text}</div>
                          </div>
                        )}
                        {allSlides[previewSlideIndex].type === 'summary' && (
                          <div className="w-full h-full bg-white/60 rounded-lg p-6 flex flex-col justify-center space-y-3">
                            {summaryItems.map((item, i) => item && <div key={i} className="flex gap-2 text-xs font-bold text-slate-700"><span className="text-pink-500">✔</span> {item}</div>)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                    );
                  })()}
                <p className="mt-4 text-xs text-slate-400">
                  {generatedImages[previewSlideIndex] ? '✨ AI生成画像' : '※プレビューはイメージです。実際の生成画像とは異なります。'}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                  <div className="text-xs font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400" /> 生成プロンプト ({allSlides[previewSlideIndex].title})</div>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs font-mono text-slate-300 leading-relaxed break-words max-h-32 overflow-y-auto">{(() => { const slide = allSlides[previewSlideIndex]; return generatePrompt(slide.type, slide.content); })()}</p>

                  {/* Error Display */}
                  {genError && generatingIndex === null && (
                    <div className="flex items-start gap-2 text-xs text-red-400 bg-red-900/30 p-2 rounded">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{genError}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { const slide = allSlides[previewSlideIndex]; copyToClipboard(generatePrompt(slide.type, slide.content), previewSlideIndex); }}
                      className={`flex-1 py-2 rounded font-bold text-sm transition-all flex items-center justify-center gap-2 ${copiedIndex === previewSlideIndex ? 'bg-green-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'}`}
                    >
                      {copiedIndex === previewSlideIndex ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedIndex === previewSlideIndex ? 'コピー済' : 'コピー'}
                    </button>
                    <button
                      onClick={() => handleGenerateSingle(previewSlideIndex)}
                      disabled={generatingIndex !== null || batchGenerating}
                      className="flex-1 py-2 rounded font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingIndex === previewSlideIndex ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</>
                      ) : (
                        <><Wand2 className="w-4 h-4" /> この画像を生成</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
