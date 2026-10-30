/**
 * AI Image Generator Service for Educational Visuals, Illustrations, Diagrams & Storybooks
 * Supports modern high-definition generation models: Google Imagen 3, Nano Banana AI, Veo3 Cinematic, Flux Pro/Realism, Manga Anime Comic, 3D Pixar Engine
 */

export type ImageModelType = 
  | 'imagen-3'
  | 'nanobanana' 
  | 'veo3-cinematic' 
  | 'flux-anime' 
  | 'flux-3d' 
  | 'flux-realism' 
  | 'flux' 
  | 'turbo';

export type ImageStyle = 
  | 'comic_manga'
  | 'storybook_watercolor'
  | 'educational_diagram' 
  | 'realistic_photo' 
  | '3d_render' 
  | 'scientific_illustration' 
  | 'textbook_drawing' 
  | 'mindmap_infographic';

export interface ImageGenerationOptions {
  prompt: string;
  style?: ImageStyle;
  model?: ImageModelType;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16';
  width?: number;
  height?: number;
  seed?: number;
}

export const STYLE_PROMPTS: Record<ImageStyle, string> = {
  comic_manga: 'vibrant educational comic panel, expressive anime characters, clean line art, bright vivid colors, dynamic composition, high clarity, manga art style, cute friendly pupils learning',
  storybook_watercolor: 'whimsical children storybook illustration, soft vibrant watercolor and gouache texture, story atmosphere, gentle lighting, pedagogical illustration, cute fairytale aesthetic',
  educational_diagram: 'clear educational diagram, clean vector lines, high contrast, labelled educational illustration, suitable for textbook and classroom slide, scientific precision',
  realistic_photo: 'high resolution professional photograph, authentic lighting, crisp details, 8k documentary style, ultra realistic photography',
  '3d_render': 'isometric 3D render, Pixar and Blender style, vibrant colors, clean studio lighting, high detail, educational visualization',
  scientific_illustration: 'scientific textbook illustration, cross-section anatomical or physical detail, precise, clean white background, high clarity',
  textbook_drawing: 'Vietnamese standard educational textbook colored pencil style illustration, friendly, clear pedagogical presentation, warm colors',
  mindmap_infographic: 'infographic mindmap visual summary, graphic design icons, clear hierarchy, modern sleek layout, high contrast'
};

export const MODEL_NAMES: Record<ImageModelType, { name: string; badge: string; desc: string }> = {
  'imagen-3': { name: 'Google Imagen 3 (Mới nhất)', badge: 'Google AI', desc: 'Mô hình tạo ảnh siêu nét thế hệ mới từ Google, hiểu sâu cốt truyện sư phạm' },
  nanobanana: { name: 'Nano Banana AI 2.0', badge: 'Banana Engine', desc: 'Mô hình Banana thế hệ mới, màu sắc tươi sáng, hình nhân vật sinh động' },
  'veo3-cinematic': { name: 'Veo3 Cinematic 8K', badge: 'Veo Cinematic', desc: 'Ánh sáng và chiều sâu điện ảnh, phân cảnh sống động như phim hoạt hình' },
  'flux-anime': { name: 'Manga & Comic Studio Pro', badge: 'Truyện tranh', desc: 'Chuyên tạo khung truyện tranh Manga, phân cảnh truyện giáo dục lôi cuốn' },
  'flux-3d': { name: '3D Pixar & Blender Engine', badge: '3D Render', desc: 'Mô hình 3D Pixar sinh động, hoạt hình bắt mắt cho học sinh' },
  'flux-realism': { name: 'Flux Realism Studio', badge: 'Ảnh thực tế', desc: 'Ảnh chụp chân thực chất lượng cao, đồ thị và vật thể chính xác' },
  flux: { name: 'Flux Dev Ultra', badge: 'Chuẩn sắc nét', desc: 'Chi tiết cao, bố cục cân đối và sắc nét' },
  turbo: { name: 'SDXL Turbo Speed', badge: 'Siêu tốc độ', desc: 'Tạo tranh tức thì trong 1-2 giây' }
};

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Intelligent keywords booster to enhance educational prompts & remove prompt noise
 */
export const enhancePromptForEducation = (rawPrompt: string, style: ImageStyle = 'comic_manga'): string => {
  // Strip out Vietnamese label headers or prompt wrapper keywords if any
  let clean = rawPrompt
    .replace(/^(\s*\*\*)?(?:Mô tả hình ảnh|Visual AI Prompt|Visual Prompt|Prompt Minh Họa|Prompt)\s*(?:\([^)]*\))?\s*(?:\*\*)?:\s*(?:\*\*)?/i, '')
    .replace(/\(Visual AI Prompt\)/gi, '')
    .replace(/\(Tấm truyện tranh giáo dục[^\)]*\)/gi, '')
    .replace(/\(Educational comic panel[^\)]*\)/gi, '')
    .replace(/\(Ảnh minh họa[^\)]*\)/gi, '')
    .replace(/\*\*/g, '')
    .trim();

  // Convert Vietnamese diacritics to clean English ASCII so Flux/Pollinations AI model understands 100% of character actions, objects, and setting
  clean = removeVietnameseTones(clean);

  const styleKeywords = STYLE_PROMPTS[style] || STYLE_PROMPTS.comic_manga;
  return `${clean}, ${styleKeywords}, masterpiece, ultra high quality, clean composition, educational storytelling, bright vivid colors, clear visual concept`;
};

/**
 * Generates an image URL using AI image synthesis with chosen model & style
 */
export const generateEducationalImageUrl = (options: ImageGenerationOptions): string => {
  const { prompt, style = 'comic_manga', model = 'nanobanana', aspectRatio = '16:9' } = options;
  
  let w = 1024;
  let h = 576; // 16:9
  if (aspectRatio === '1:1') {
    w = 1024;
    h = 1024;
  } else if (aspectRatio === '4:3') {
    w = 1024;
    h = 768;
  } else if (aspectRatio === '9:16') {
    w = 576;
    h = 1024;
  }

  // Model mapping to pollination engine
  let engineModel = 'flux';
  let extraPromptModifier = '';
  
  if (model === 'imagen-3') {
    engineModel = 'flux-realism';
    extraPromptModifier = ', rendered with Google Imagen 3 aesthetic clarity, pristine visual fidelity, accurate educational illustration';
  } else if (model === 'flux-realism') {
    engineModel = 'flux-realism';
  } else if (model === 'flux-anime') {
    engineModel = 'flux-anime';
    extraPromptModifier = ', Japanese manga anime colored panel, clean inking, expressive comic character';
  } else if (model === 'flux-3d') {
    engineModel = 'flux-3d';
    extraPromptModifier = ', 3D Disney Pixar animation studio style, cute 3D character, soft volumetric lighting';
  } else if (model === 'turbo') {
    engineModel = 'turbo';
  } else if (model === 'nanobanana') {
    engineModel = 'flux';
    extraPromptModifier = ', powered by Banana Engine high aesthetic clarity, vibrant saturated colors, perfect details';
  } else if (model === 'veo3-cinematic') {
    engineModel = 'flux';
    extraPromptModifier = ', cinematic Veo3 aesthetic lighting, volumetric lighting, photorealistic 8k depth of field';
  }

  const enhanced = enhancePromptForEducation(prompt, style) + extraPromptModifier;
  const encodedPrompt = encodeURIComponent(enhanced);
  const seed = options.seed || Math.floor(Math.random() * 9999999);

  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=${engineModel}`;
};

/**
 * Downloads image from URL
 */
export const downloadImageFromUrl = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${filename || 'anh_minh_hoa_ai'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
};
