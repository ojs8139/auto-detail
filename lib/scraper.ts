/**
 * 웹 스크래핑 관련 유틸리티 함수 모음
 * 웹사이트의 콘텐츠를 추출하고 분석하는 기능을 제공합니다.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { 
  filterRelevantImages, 
  groupSimilarColors, 
  identifyDominantColors,
  analyzeMultipleImages,
  extractCommonStyleFeatures,
  estimateImageType
} from './services/imageAnalysisService';

/**
 * 웹사이트로부터 HTML을 가져옵니다.
 * @param url 스크래핑할 웹사이트 URL
 * @returns HTML 문자열
 */
export const fetchHtml = async (url: string): Promise<string> => {
  try {
    // 사용자 에이전트 설정으로 봇 차단 방지
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('웹사이트 콘텐츠 가져오기 실패:', error);
    throw new Error(`웹사이트 콘텐츠를 가져오는 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 웹사이트에서 이미지 URL을 추출합니다.
 * @param html 웹사이트 HTML 콘텐츠
 * @param baseUrl 웹사이트 기본 URL (상대 경로 해결용)
 * @returns 추출된 이미지 URL 배열
 */
export const extractImages = (html: string, baseUrl: string): string[] => {
  try {
    const $ = cheerio.load(html);
    const imageUrls: string[] = [];
    
    // 이미지 요소에서 URL 추출
    $('img').each((_: any, img: any) => {
      // 지연 로딩 이미지 속성 처리 (다양한 data-* 속성 지원)
      const src = $(img).attr('src');
      const dataSrc = $(img).attr('data-src') || 
                     $(img).attr('data-lazy-src') || 
                     $(img).attr('data-original') ||
                     $(img).attr('data-srcset');
      const srcset = $(img).attr('srcset');
      
      const imageUrl = src || dataSrc;
      
      if (imageUrl) {
        try {
          // 상대 경로를 절대 경로로 변환
          const absoluteUrl = new URL(imageUrl, baseUrl).href;
          imageUrls.push(absoluteUrl);
        } catch (error) {
          // 잘못된 URL 형식 무시
        }
      }
      
      // srcset이 있는 경우 처리
      if (srcset) {
        const srcsetUrls = srcset.split(',')
          .map((s: string) => s.trim().split(' ')[0])
          .filter(Boolean);
        
        srcsetUrls.forEach((srcsetUrl: string) => {
          try {
            const absoluteUrl = new URL(srcsetUrl, baseUrl).href;
            imageUrls.push(absoluteUrl);
          } catch (error) {
            // 잘못된 URL 형식 무시
          }
        });
      }
    });

    // 배경 이미지가 포함된 요소 추출 (CSS background-image 속성)
    $('[style*="background-image"]').each((_: any, el: any) => {
      const style = $(el).attr('style') || '';
      const match = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
      if (match && match[1]) {
        try {
          const absoluteUrl = new URL(match[1], baseUrl).href;
          imageUrls.push(absoluteUrl);
        } catch (error) {
          // 잘못된 URL 형식 무시
        }
      }
    });
    
    // picture 요소 내 source 태그 처리
    $('picture source').each((_: any, source: any) => {
      const srcset = $(source).attr('srcset');
      if (srcset) {
        const srcsetUrls = srcset.split(',')
          .map((s: string) => s.trim().split(' ')[0])
          .filter(Boolean);
        
        srcsetUrls.forEach((srcsetUrl: string) => {
          try {
            const absoluteUrl = new URL(srcsetUrl, baseUrl).href;
            imageUrls.push(absoluteUrl);
          } catch (error) {
            // 잘못된 URL 형식 무시
          }
        });
      }
    });
    
    // a 태그 중 이미지로 끝나는 href 추출
    $('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".gif"], a[href$=".webp"]').each((_: any, a: any) => {
      const href = $(a).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          imageUrls.push(absoluteUrl);
        } catch (error) {
          // 잘못된 URL 형식 무시
        }
      }
    });

    // 이미지 필터링 및 중복 제거
    const uniqueUrls = Array.from(new Set(imageUrls));
    const relevantImages = filterRelevantImages(uniqueUrls);
    
    return relevantImages;
  } catch (error) {
    console.error('이미지 URL 추출 실패:', error);
    throw new Error(`이미지 URL 추출 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 웹사이트에서 사용된 색상을 추출합니다.
 * @param html 웹사이트 HTML 콘텐츠
 * @returns 추출된 색상 배열 (HEX 형식)
 */
export const extractColors = (html: string): string[] => {
  try {
    const $ = cheerio.load(html);
    const colors = new Set<string>();
    
    // 인라인 스타일에서 색상 추출
    $('[style*="color"],[style*="background"],[style*="border"]').each((_: any, el: any) => {
      const style = $(el).attr('style') || '';
      
      // 색상 형식 추출 (HEX, RGB, RGBA)
      const colorRegex = /#[0-9a-f]{3,8}|rgba?\([^)]+\)/gi;
      const matches = style.match(colorRegex);
      
      if (matches) {
        matches.forEach((color: string) => {
          // RGB, RGBA 형식을 HEX로 변환하는 로직 추가 필요
          if (color.startsWith('#')) {
            colors.add(color.toLowerCase());
          }
        });
      }
    });
    
    // CSS 속성으로 지정된 색상 추출
    $('[color], [bgcolor], [bordercolor]').each((_: any, el: any) => {
      const color = $(el).attr('color') || $(el).attr('bgcolor') || $(el).attr('bordercolor');
      if (color && color.startsWith('#')) {
        colors.add(color.toLowerCase());
      }
    });
    
    // 메타 태그에서 테마 색상 추출
    const themeColor = $('meta[name="theme-color"]').attr('content');
    if (themeColor && themeColor.startsWith('#')) {
      colors.add(themeColor.toLowerCase());
    }
    
    // CSS 파일에서 색상 추출 (외부 CSS 파일의 경우 추가적인 요청이 필요)
    
    // 추출된 색상 그룹화 (유사한 색상 합치기)
    const colorArray = Array.from(colors);
    const groupedColors = groupSimilarColors(colorArray);
    
    return groupedColors;
  } catch (error) {
    console.error('색상 추출 실패:', error);
    throw new Error(`색상 추출 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 웹사이트에서 사용된 폰트 정보를 추출합니다.
 * @param html 웹사이트 HTML 콘텐츠
 * @returns 추출된 폰트 정보 배열
 */
export const extractFonts = (html: string): string[] => {
  try {
    const $ = cheerio.load(html);
    const fonts = new Set<string>();
    
    // 인라인 스타일에서 폰트 추출
    $('[style*="font-family"],[style*="font"]').each((_: any, el: any) => {
      const style = $(el).attr('style') || '';
      const fontRegex = /font-family:\s*([^;]+)/i;
      const match = style.match(fontRegex);
      
      if (match && match[1]) {
        // 폰트 이름에서 따옴표 제거 및 정규화
        const fontNames = match[1].trim()
          .split(',')
          .map(font => font.trim()
            .replace(/["']/g, '')
            .toLowerCase());
        
        fontNames.forEach((font: string) => fonts.add(font));
      }
    });
    
    // font 태그 추출
    $('font[face]').each((_: any, el: any) => {
      const face = $(el).attr('face');
      if (face) {
        face.split(',')
          .map((font: string) => font.trim().toLowerCase())
          .forEach((font: string) => fonts.add(font));
      }
    });
    
    // 링크된 웹폰트 추출
    $('link[rel="stylesheet"][href*="fonts.googleapis.com"]').each((_: any, el: any) => {
      const href = $(el).attr('href') || '';
      if (href.includes('family=')) {
        const familyPart = href.split('family=')[1].split('&')[0];
        const families = familyPart.split('|');
        
        families.forEach(family => {
          const fontName = family.split(':')[0].replace(/\+/g, ' ');
          fonts.add(fontName.toLowerCase());
        });
      }
    });
    
    // 외부 CSS 파일 탐색
    $('link[rel="stylesheet"]').each((_: any, el: any) => {
      const href = $(el).attr('href') || '';
      if (href && !href.includes('fonts.googleapis.com')) {
        // 실제 구현에서는 외부 CSS 파일을 가져와 폰트 정보 추출 가능
        // 여기서는 파일명에서 힌트 추출
        const cssFileName = href.split('/').pop()?.toLowerCase() || '';
        if (cssFileName.includes('font')) {
          // CSS 파일명에 'font'가 포함된 경우 추가 분석
          const fontHints = ['sans', 'serif', 'mono', 'roboto', 'open-sans', 'lato', 'noto', 'pretendard', 'spoqa'];
          fontHints.forEach(hint => {
            if (cssFileName.includes(hint)) {
              fonts.add(hint);
            }
          });
        }
      }
    });
    
    // @font-face 규칙 탐색 (스타일 태그 내)
    $('style').each((_: any, el: any) => {
      const styleContent = $(el).html() || '';
      const fontFaceRegex = /@font-face\s*{[^}]*font-family:\s*["']?([^"';]+)["']?/gi;
      let fontFaceMatch;
      
      while ((fontFaceMatch = fontFaceRegex.exec(styleContent)) !== null) {
        if (fontFaceMatch[1]) {
          fonts.add(fontFaceMatch[1].toLowerCase());
        }
      }
    });
    
    // 일반적인 폰트 속성이 있는 요소 검사
    $('[class*="font"],[id*="font"]').each((_: any, el: any) => {
      const className = $(el).attr('class') || '';
      const id = $(el).attr('id') || '';
      
      // 클래스명이나 ID에서 폰트 이름 추출 시도
      const fontClassRegex = /font-([a-zA-Z0-9_-]+)/i;
      const fontClassMatch = className.match(fontClassRegex) || id.match(fontClassRegex);
      
      if (fontClassMatch && fontClassMatch[1]) {
        const possibleFontName = fontClassMatch[1].toLowerCase()
          .replace(/-/g, ' ')
          .replace(/_/g, ' ');
        
        // 일반적인 스타일 단어 제외
        const styleWords = ['bold', 'italic', 'weight', 'style', 'size'];
        if (!styleWords.includes(possibleFontName)) {
          fonts.add(possibleFontName);
        }
      }
    });
    
    // 일반적으로 많이 사용되는 폰트 클래스 탐색
    const commonFontClasses = [
      '.helvetica', '.arial', '.roboto', '.lato', '.montserrat', 
      '.opensans', '.noto-sans', '.noto-serif', '.pretendard', '.spoqa', 
      '.gothic', '.myungjo', '.batang', '.dotum', '.gulim'
    ];
    
    commonFontClasses.forEach(fontClass => {
      if ($(fontClass).length > 0) {
        const fontName = fontClass.substring(1).replace(/-/g, ' ');
        fonts.add(fontName);
      }
    });
    
    return Array.from(fonts);
  } catch (error) {
    console.error('폰트 추출 실패:', error);
    throw new Error(`폰트 추출 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 웹사이트의 메타데이터(타이틀, 설명 등)를 추출합니다.
 * @param html 웹사이트 HTML 콘텐츠
 * @returns 메타데이터 객체
 */
export const extractMetadata = (html: string) => {
  try {
    const $ = cheerio.load(html);
    
    // 기본 메타데이터 추출
    const metadata = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      ogTitle: $('meta[property="og:title"]').attr('content') || '',
      ogDescription: $('meta[property="og:description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || '',
      // 추가 메타데이터
      themeColor: $('meta[name="theme-color"]').attr('content') || '',
      viewport: $('meta[name="viewport"]').attr('content') || '',
      charset: $('meta[charset]').attr('charset') || '',
      language: $('html').attr('lang') || '',
      // 스타일 관련 메타데이터
      cssFiles: [] as string[],
      hasResponsiveDesign: false,
      favicon: $('link[rel="icon"], link[rel="shortcut icon"]').attr('href') || '',
      touchIcon: $('link[rel="apple-touch-icon"]').attr('href') || '',
      lastModified: $('meta[http-equiv="last-modified"]').attr('content') || '',
    };
    
    // CSS 파일 경로 추출
    $('link[rel="stylesheet"]').each((_: any, el: any) => {
      const href = $(el).attr('href');
      if (href) {
        metadata.cssFiles.push(href);
      }
    });
    
    // 반응형 디자인 확인
    metadata.hasResponsiveDesign = metadata.viewport.includes('width=device-width');
    
    return metadata;
  } catch (error) {
    console.error('메타데이터 추출 실패:', error);
    throw new Error(`메타데이터 추출 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 웹사이트에서 제품 정보를 추출합니다.
 * @param html 웹사이트 HTML 콘텐츠
 * @param baseUrl 웹사이트 기본 URL (상대 경로 해결용)
 * @returns 추출된 제품 정보 배열
 */
export const extractProducts = (html: string, baseUrl: string): any[] => {
  try {
    const $ = cheerio.load(html);
    const products: any[] = [];
    
    // 일반적인 제품 목록 패턴 감지
    const productSelectors = [
      '.product', '.item', '[class*="product"]', '[class*="item"]',
      '[class*="goods"]', '[class*="product-card"]', '[class*="product-item"]',
      '[class*="card"]', '[class*="product-container"]', '[class*="product-box"]',
      '[class*="product-list"] > li', '[class*="item-list"] > li',
      '.products > *', '.items > *'
    ];
    
    // 제품 목록을 포함할 수 있는 컨테이너 선택자
    const containerSelectors = [
      '.products', '.items', '.product-list', '.item-list',
      '.product-grid', '.item-grid', '.product-container', '.shop-items',
      '[class*="product-list"]', '[class*="item-list"]',
      '[class*="product-grid"]', '[class*="shop-list"]'
    ];
    
    // 제품 컨테이너가 있으면 해당 컨테이너 내부의 항목 탐색
    let foundInContainer = false;
    for (const containerSelector of containerSelectors) {
      const container = $(containerSelector);
      if (container.length > 0) {
        container.children().each((_: any, el: any) => {
          const product = extractProductInfo($, $(el), baseUrl);
          if (product && (product.name || product.imageUrl)) {
            products.push(product);
            foundInContainer = true;
          }
        });
        
        // 첫 번째 일치하는 컨테이너만 처리
        if (foundInContainer && products.length > 0) {
          break;
        }
      }
    }
    
    // 컨테이너에서 제품을 찾지 못한 경우 개별 제품 선택자 사용
    if (!foundInContainer || products.length === 0) {
      for (const selector of productSelectors) {
        $(selector).each((_: any, el: any) => {
          const product = extractProductInfo($, $(el), baseUrl);
          if (product && (product.name || product.imageUrl)) {
            products.push(product);
          }
        });
        
        // 제품을 충분히 찾았으면 중단
        if (products.length >= 10) {
          break;
        }
      }
    }
    
    // 제품 정보 중복 제거 (이름과 이미지 URL 기준)
    const uniqueProducts: any[] = [];
    const productKeys = new Set();
    
    products.forEach(product => {
      const key = `${product.name}|${product.imageUrl}`;
      if (!productKeys.has(key)) {
        productKeys.add(key);
        uniqueProducts.push(product);
      }
    });
    
    return uniqueProducts;
  } catch (error) {
    console.error('제품 정보 추출 실패:', error);
    throw new Error(`제품 정보 추출 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 단일 제품 요소에서 제품 정보를 추출합니다.
 * @param $ Cheerio 객체
 * @param $el 제품 요소
 * @param baseUrl 기본 URL
 * @returns 제품 정보 객체
 */
function extractProductInfo($: any, $el: any, baseUrl: string): any {
  // 제품 정보 추출
  const product: any = {
    name: '',
    price: '',
    imageUrl: '',
    description: '',
    category: '',
    ratings: '',
    link: '',
    currency: '',
    availability: '',
    discount: '',
    originalPrice: '',
    brand: '',
    productId: '',
    tags: [] as string[],
    isNew: false,
    isFeatured: false,
    isOnSale: false,
  };
  
  // 제품명 추출
  const nameSelectors = [
    'h2, h3, h4, h5', 
    '[class*="title"], [class*="name"]',
    '[class*="product-title"], [class*="product-name"]',
    '[class*="item-title"], [class*="item-name"]',
    'a[title]'
  ];
  
  for (const selector of nameSelectors) {
    const nameElement = $el.find(selector).first();
    if (nameElement.length > 0) {
      product.name = nameElement.text().trim();
      break;
    }
  }
  
  // 링크가 있는 요소에서 title 속성으로 제품명 추출 시도
  if (!product.name) {
    const linkWithTitle = $el.find('a[title]').first();
    if (linkWithTitle.length > 0) {
      product.name = linkWithTitle.attr('title').trim();
    }
  }
  
  // 제품명이 없으면 alt 텍스트에서 추출 시도
  if (!product.name) {
    const imgWithAlt = $el.find('img[alt]').first();
    if (imgWithAlt.length > 0) {
      product.name = imgWithAlt.attr('alt').trim();
    }
  }
  
  // 가격 추출
  const priceSelectors = [
    '[class*="price"]:not([class*="original"]):not([class*="regular"]):not([class*="old"])',
    '[class*="current-price"], [class*="sale-price"], [class*="new-price"]',
    '.price, .current-price, .sale-price',
    'span:contains("₩"), span:contains("$"), span:contains("€"), span:contains("£")'
  ];
  
  for (const selector of priceSelectors) {
    const priceElement = $el.find(selector).first();
    if (priceElement.length > 0) {
      product.price = priceElement.text().trim();
      break;
    }
  }
  
  // 원래 가격 추출 (할인 전 가격)
  const originalPriceSelectors = [
    '[class*="original-price"], [class*="regular-price"], [class*="old-price"]',
    'del, s, [class*="was-price"]',
    '[class*="compare-at-price"]'
  ];
  
  for (const selector of originalPriceSelectors) {
    const originalPriceElement = $el.find(selector).first();
    if (originalPriceElement.length > 0) {
      product.originalPrice = originalPriceElement.text().trim();
      break;
    }
  }
  
  // 할인율 계산 또는 추출
  if (product.originalPrice && product.price) {
    // 할인율 텍스트 직접 추출 시도
    const discountSelectors = [
      '[class*="discount"], [class*="save"], [class*="off"]',
      '[class*="reduction"], [class*="percent"]'
    ];
    
    for (const selector of discountSelectors) {
      const discountElement = $el.find(selector).first();
      if (discountElement.length > 0) {
        product.discount = discountElement.text().trim();
        product.isOnSale = true;
        break;
      }
    }
    
    // 추출 실패 시 계산 시도
    if (!product.discount) {
      const originalPrice = parseFloat(product.originalPrice.replace(/[^0-9.]/g, ''));
      const currentPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
      
      if (!isNaN(originalPrice) && !isNaN(currentPrice) && originalPrice > 0) {
        const discountRate = Math.round((1 - currentPrice / originalPrice) * 100);
        if (discountRate > 0) {
          product.discount = `${discountRate}%`;
          product.isOnSale = true;
        }
      }
    }
  }
  
  // 이미지 URL 추출
  const imgElement = $el.find('img').first();
  if (imgElement.length > 0) {
    const src = imgElement.attr('src') || 
               imgElement.attr('data-src') || 
               imgElement.attr('data-lazy-src') || 
               imgElement.attr('data-original') || '';
    
    if (src) {
      try {
        product.imageUrl = new URL(src, baseUrl).href;
      } catch (e) {
        product.imageUrl = src;
      }
    }
  }
  
  // 백그라운드 이미지 확인
  if (!product.imageUrl) {
    const elementsWithBg = $el.find('[style*="background-image"]');
    if (elementsWithBg.length > 0) {
      const style = elementsWithBg.first().attr('style') || '';
      const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
      
      if (bgMatch && bgMatch[1]) {
        try {
          product.imageUrl = new URL(bgMatch[1], baseUrl).href;
        } catch (e) {
          product.imageUrl = bgMatch[1];
        }
      }
    }
  }
  
  // 제품 링크 추출
  const linkElement = $el.find('a').first();
  if (linkElement.length > 0) {
    const href = linkElement.attr('href');
    if (href) {
      try {
        product.link = new URL(href, baseUrl).href;
      } catch (e) {
        product.link = href;
      }
    }
  }
  
  // 제품 설명 추출
  const descriptionSelectors = [
    '[class*="description"], [class*="desc"], p:not(:has(*))',
    '[class*="product-desc"], [class*="item-desc"]',
    '[class*="summary"], [class*="caption"]'
  ];
  
  for (const selector of descriptionSelectors) {
    const descElement = $el.find(selector).first();
    if (descElement.length > 0 && descElement.text().trim().length > 5) {
      product.description = descElement.text().trim();
      break;
    }
  }
  
  // 카테고리 추출
  const categorySelectors = [
    '[class*="category"], [class*="tag"]',
    '[class*="product-type"], [class*="product-cat"]'
  ];
  
  for (const selector of categorySelectors) {
    const catElement = $el.find(selector).first();
    if (catElement.length > 0) {
      product.category = catElement.text().trim();
      break;
    }
  }
  
  // 평점 추출
  const ratingSelectors = [
    '[class*="rating"], [class*="star"], [class*="review-score"]',
    '[class*="stars"], [class*="score"]'
  ];
  
  for (const selector of ratingSelectors) {
    const ratingElement = $el.find(selector).first();
    if (ratingElement.length > 0) {
      product.ratings = ratingElement.text().trim();
      break;
    }
  }
  
  // 브랜드 추출
  const brandSelectors = [
    '[class*="brand"], [class*="manufacturer"], [class*="vendor"]',
    '[class*="maker"], [class*="company"]'
  ];
  
  for (const selector of brandSelectors) {
    const brandElement = $el.find(selector).first();
    if (brandElement.length > 0) {
      product.brand = brandElement.text().trim();
      break;
    }
  }
  
  // 통화 기호 추출
  if (product.price) {
    const currencyMatch = product.price.match(/[₩$€£]/);
    if (currencyMatch) {
      product.currency = currencyMatch[0];
      // 통화 기호에 따른 형식화
      switch (product.currency) {
        case '₩': product.currency = 'KRW'; break;
        case '$': product.currency = 'USD'; break;
        case '€': product.currency = 'EUR'; break;
        case '£': product.currency = 'GBP'; break;
      }
    }
  }
  
  // 재고 상태 추출
  const availabilitySelectors = [
    '[class*="availability"], [class*="stock"], [class*="inventory"]',
    '[class*="in-stock"], [class*="out-of-stock"]'
  ];
  
  for (const selector of availabilitySelectors) {
    const availElement = $el.find(selector).first();
    if (availElement.length > 0) {
      product.availability = availElement.text().trim();
      break;
    }
  }
  
  // 특별 태그 확인 (New, Featured, Sale 등)
  product.isNew = $el.find('[class*="new"], [class*="new-label"]').length > 0 || 
                 $el.text().toLowerCase().includes('new');
  
  product.isFeatured = $el.find('[class*="featured"], [class*="hot"]').length > 0 || 
                      $el.text().toLowerCase().includes('featured');
  
  if (!product.isOnSale) {
    product.isOnSale = $el.find('[class*="sale"], [class*="discount"]').length > 0 || 
                      $el.text().toLowerCase().includes('sale');
  }
  
  // 제품 ID 추출
  const idAttr = $el.attr('id') || $el.attr('data-product-id') || $el.attr('data-id');
  if (idAttr) {
    product.productId = idAttr;
  }
  
  // 태그 추출
  const tagSelectors = [
    '[class*="tag"], [class*="label"]',
    '[class*="badge"], [class*="marker"]'
  ];
  
  for (const selector of tagSelectors) {
    $el.find(selector).each((_: any, tagEl: any) => {
      const tagText = $(tagEl).text().trim();
      if (tagText) {
        product.tags.push(tagText);
      }
    });
  }
  
  return product;
}

/**
 * 웹사이트의 레이아웃 구조를 분석합니다.
 * @param html 웹사이트 HTML 콘텐츠
 * @returns 레이아웃 구조 정보
 */
export const analyzeLayout = (html: string) => {
  try {
    const $ = cheerio.load(html);
    
    const layoutInfo = {
      hasHeader: $('header, .header, #header').length > 0,
      hasFooter: $('footer, .footer, #footer').length > 0,
      hasNavigation: $('nav, .nav, #nav, .navigation, #navigation').length > 0,
      hasSidebar: $('aside, .sidebar, #sidebar').length > 0,
      hasHero: $('.hero, #hero, [class*="hero"], [class*="banner"], .banner, #banner').length > 0,
      gridSystem: false,
      flexboxUsed: false,
      containerCount: $('.container, .wrapper, [class*="container"], [class*="wrapper"]').length,
      sectionCount: $('section, .section, [class*="section"]').length,
      layoutType: 'unknown',
      contentStructure: [] as string[],
      navigationPosition: 'unknown',
      footerComplexity: 'simple',
      headerStyle: 'unknown',
      colorScheme: 'unknown',
      spacing: 'unknown',
      hasSearchFeature: false,
      hasSlider: false,
      hasPagination: false,
      hasFilterSystem: false,
      hasSortingOptions: false,
      hasResponsiveDesign: false,
      mobileFriendly: false,
      estimatedBreakpoints: [] as string[],
    };
    
    // Flexbox와 Grid 사용 확인 (인라인 스타일 기준)
    $('[style*="display"]').each((_: any, el: any) => {
      const style = $(el).attr('style') || '';
      if (style.includes('display: flex') || style.includes('display:flex')) {
        layoutInfo.flexboxUsed = true;
      }
      if (style.includes('display: grid') || style.includes('display:grid')) {
        layoutInfo.gridSystem = true;
      }
    });
    
    // 클래스 기반 Flexbox와 Grid 사용 확인
    if ($('[class*="flex"], [class*="grid"]').length > 0) {
      if ($('[class*="flex"]').length > 0) {
        layoutInfo.flexboxUsed = true;
      }
      if ($('[class*="grid"]').length > 0) {
        layoutInfo.gridSystem = true;
      }
    }
    
    // 레이아웃 유형 추정
    if ($('body > .container > .row, body > .wrapper > .row').length > 0) {
      layoutInfo.layoutType = 'grid-based';
    } else if (layoutInfo.hasSidebar) {
      layoutInfo.layoutType = 'sidebar-layout';
    } else if (layoutInfo.hasHero && $('main section, #main section, .main section').length >= 3) {
      layoutInfo.layoutType = 'landing-page';
    } else if ($('body > header, body > main, body > footer').length === 3) {
      layoutInfo.layoutType = 'standard-layout';
    }
    
    // 컨텐츠 구조 분석
    const sections: string[] = [];
    $('body > *, body > main > *, body > .container > *').each((_: any, el: any) => {
      const $el = $(el);
      let sectionType = 'unknown';
      
      if ($el.is('header, .header, #header')) {
        sectionType = 'header';
      } else if ($el.is('footer, .footer, #footer')) {
        sectionType = 'footer';
      } else if ($el.is('nav, .nav, #nav')) {
        sectionType = 'navigation';
      } else if ($el.is('.hero, #hero, [class*="hero"]')) {
        sectionType = 'hero';
      } else if ($el.is('.banner, #banner, [class*="banner"]')) {
        sectionType = 'banner';
      } else if ($el.is('.products, #products, [class*="products"]')) {
        sectionType = 'product-list';
      } else if ($el.is('.features, #features, [class*="features"]')) {
        sectionType = 'features';
      } else if ($el.is('.testimonials, #testimonials, [class*="testimonials"]')) {
        sectionType = 'testimonials';
      } else if ($el.is('.about, #about, [class*="about"]')) {
        sectionType = 'about';
      } else if ($el.is('section, .section')) {
        sectionType = 'section';
      }
      
      if (sectionType !== 'unknown') {
        sections.push(sectionType);
      }
    });
    
    layoutInfo.contentStructure = sections;
    
    // 내비게이션 위치 확인
    if ($('header nav, .header nav, #header nav').length > 0) {
      layoutInfo.navigationPosition = 'header';
    } else if ($('body > nav, body > .nav, body > #nav').length > 0) {
      layoutInfo.navigationPosition = 'top';
    } else if ($('aside nav, .sidebar nav, #sidebar nav').length > 0) {
      layoutInfo.navigationPosition = 'sidebar';
    } else if ($('footer nav, .footer nav, #footer nav').length > 0) {
      layoutInfo.navigationPosition = 'footer';
    }
    
    // 헤더 스타일 분석
    if (layoutInfo.hasHeader) {
      const headerElement = $('header, .header, #header');
      const headerHeight = headerElement.attr('style')?.includes('height') ? 'fixed-height' : 'auto-height';
      const headerPosition = headerElement.attr('style')?.includes('position: fixed') || 
                           headerElement.attr('style')?.includes('position:fixed') ? 'fixed' : 'static';
      
      layoutInfo.headerStyle = `${headerPosition}-${headerHeight}`;
      
      // 헤더에 검색 기능 여부 확인
      if (headerElement.find('input[type="search"], [class*="search"], [id*="search"]').length > 0) {
        layoutInfo.hasSearchFeature = true;
      }
    }
    
    // 푸터 복잡도 확인
    const footerLinks = $('footer a, .footer a, #footer a').length;
    const footerSections = $('footer section, footer div[class], .footer section, .footer div[class], #footer section, #footer div[class]').length;
    
    if (footerLinks > 20 || footerSections > 3) {
      layoutInfo.footerComplexity = 'complex';
    } else if (footerLinks > 10 || footerSections > 1) {
      layoutInfo.footerComplexity = 'medium';
    }
    
    // 컬러 스킴 분석
    const bodyBgColor = $('body').attr('style')?.match(/background-color:\s*([^;]+)/i)?.[1] || '';
    if (bodyBgColor.includes('dark') || bodyBgColor.includes('#000') || bodyBgColor.includes('#333') || 
        bodyBgColor.includes('rgb(0') || bodyBgColor.includes('rgba(0')) {
      layoutInfo.colorScheme = 'dark';
    } else {
      layoutInfo.colorScheme = 'light';
    }
    
    // 다크 모드 관련 클래스 확인
    if ($('body.dark, body.dark-mode, body.theme-dark, .dark-theme, .dark-mode').length > 0) {
      layoutInfo.colorScheme = 'dark';
    }
    
    // 반응형 디자인 확인
    const metaViewport = $('meta[name="viewport"]').attr('content') || '';
    layoutInfo.hasResponsiveDesign = metaViewport.includes('width=device-width');
    
    // 모바일 친화적 여부 확인
    const hasMobileNav = $('[class*="mobile-nav"], [class*="mobile-menu"], [id*="mobile-nav"], [id*="mobile-menu"]').length > 0;
    const hasBurgerMenu = $('[class*="hamburger"], [class*="burger"], .navbar-toggler').length > 0;
    
    layoutInfo.mobileFriendly = layoutInfo.hasResponsiveDesign && (hasMobileNav || hasBurgerMenu);
    
    // 미디어 쿼리 관련 스타일 태그에서 브레이크포인트 추정
    $('style').each((_: any, style: any) => {
      const styleContent = $(style).html() || '';
      const breakpointRegex = /@media\s*\(\s*max-width\s*:\s*(\d+)px\s*\)/g;
      let match;
      
      const breakpoints: string[] = [];
      while ((match = breakpointRegex.exec(styleContent)) !== null) {
        if (match[1]) {
          breakpoints.push(`${match[1]}px`);
        }
      }
      
      if (breakpoints.length > 0) {
        layoutInfo.estimatedBreakpoints = [...new Set(breakpoints)];
      }
    });
    
    // 슬라이더, 페이지네이션, 필터링 시스템 확인
    layoutInfo.hasSlider = $('[class*="slider"], [class*="carousel"], [class*="slideshow"], [id*="slider"], [id*="carousel"]').length > 0;
    layoutInfo.hasPagination = $('.pagination, .pager, [class*="pagination"], [id*="pagination"]').length > 0;
    layoutInfo.hasFilterSystem = $('.filter, .filters, [class*="filter"], [id*="filter"]').length > 0;
    layoutInfo.hasSortingOptions = $('.sort, [class*="sort"], [id*="sort"], [class*="order-by"], [id*="order-by"]').length > 0;
    
    // 간격 스타일 분석
    const bodyPadding = $('body').attr('style')?.match(/padding:\s*([^;]+)/i)?.[1] || '';
    const containerMargin = $('.container, .wrapper').first().attr('style')?.match(/margin:\s*([^;]+)/i)?.[1] || '';
    
    if (bodyPadding.includes('0') && containerMargin.includes('0')) {
      layoutInfo.spacing = 'compact';
    } else if (bodyPadding.includes('px') || containerMargin.includes('px')) {
      const paddingValue = parseInt(bodyPadding.match(/(\d+)px/)?.[1] || '0', 10);
      const marginValue = parseInt(containerMargin.match(/(\d+)px/)?.[1] || '0', 10);
      
      if (paddingValue > 20 || marginValue > 20) {
        layoutInfo.spacing = 'spacious';
      } else {
        layoutInfo.spacing = 'balanced';
      }
    } else {
      layoutInfo.spacing = 'balanced';
    }
    
    return layoutInfo;
  } catch (error) {
    console.error('레이아웃 분석 실패:', error);
    throw new Error(`레이아웃 분석 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 웹사이트 스크래핑 결과를 종합합니다.
 * @param url 분석할 웹사이트 URL
 * @returns 스크래핑 결과 객체
 */
export const scrapeSite = async (url: string) => {
  try {
    // URL 유효성 검사
    const parsedUrl = new URL(url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    
    // HTML 가져오기
    const html = await fetchHtml(url);
    
    // 다양한 요소 추출
    const images = extractImages(html, baseUrl);
    const colors = extractColors(html);
    const fonts = extractFonts(html);
    const metadata = extractMetadata(html);
    const products = extractProducts(html, baseUrl);
    const layout = analyzeLayout(html);
    
    // 색상에서 주요 색상 식별
    const dominantColorInfos = identifyDominantColors(colors);
    const dominantColors = dominantColorInfos.map(info => info.color);
    
    // 이미지 분석 (클라이언트 측에서 실행할 때만 작동)
    let imageAnalysis: ReturnType<typeof extractCommonStyleFeatures> = null;
    try {
      // 서버 사이드 렌더링인 경우 이 부분은 건너뜁니다
      if (typeof window !== 'undefined' && images.length > 0) {
        const analyzedImages = await analyzeMultipleImages(images.slice(0, 10)); // 최대 10개 이미지만 분석
        imageAnalysis = extractCommonStyleFeatures(analyzedImages);
      }
    } catch (error) {
      console.error('이미지 분석 실패:', error);
      // 분석 실패 시 기본 구조만 제공
      imageAnalysis = {
        dominantColors: dominantColorInfos,
        styleElements: [],
        commonTags: [],
        avgBrightness: 0.5,
        avgContrast: 0.5,
        avgSaturation: 0.5,
        colorPalette: {
          primary: [],
          secondary: [],
          accent: [],
          background: []
        }
      };
    }
    
    // 이미지 유형 분류
    const categorizedImages = images.map(imageUrl => ({
      url: imageUrl,
      type: estimateImageType(imageUrl),
    }));
    
    // 이미지를 유형별로 그룹화
    const imagesByType: Record<string, string[]> = {};
    categorizedImages.forEach(img => {
      if (!imagesByType[img.type]) {
        imagesByType[img.type] = [];
      }
      imagesByType[img.type].push(img.url);
    });
    
    return {
      url,
      baseUrl,
      metadata,
      images,
      categorizedImages,
      imagesByType,
      colors,
      dominantColors,
      fonts,
      products,
      layout,
      imageAnalysis,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('웹사이트 스크래핑 실패:', error);
    throw new Error(`웹사이트 스크래핑 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
}; 
