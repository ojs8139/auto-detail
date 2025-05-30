# 상세페이지 자동 생성 애플리케이션

이 프로젝트는 Next.js App Router를 사용하여 개발된 상세페이지 자동 생성 애플리케이션입니다. 사용자가 등록한 로컬 이미지, 제품 설명 문서, 기존 쇼핑몰의 분위기(URL)를 바탕으로 쇼핑몰용 상품 상세페이지 이미지를 자동 생성합니다.

## 기술 스택

- **프레임워크**: Next.js (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: ShadCn UI
- **데이터베이스**: Supabase
- **AI 통합**: OpenAI API

## 개발자를 위한 설정 안내

### 환경 변수 설정 (개발자용)

1. 프로젝트 루트에 `.env` 또는 `.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```bash
# OpenAI API 설정
OPENAI_API_KEY=your-api-key-here
```

> 참고: 애플리케이션을 배포할 때 이러한 환경 변수들을 호스팅 플랫폼에 설정해야 합니다.
> 
> 또한, 애플리케이션 내부에서도 설정 화면을 통해 API 키를 설정할 수 있습니다. 설정한 API 키는 로컬 스토리지에 저장됩니다.

## 시작하기

```bash
# 패키지 설치
npm install
# 또는
pnpm install
# 또는
yarn install

# 개발 서버 실행
npm run dev
# 또는
pnpm dev
# 또는
yarn dev
```

개발 서버가 시작되면 [http://localhost:3000](http://localhost:3000)에서 애플리케이션에 접근할 수 있습니다.

## 주요 기능

- **이미지 자동 선택**: 품질, 다양성, 내용 분석을 통한 최적의 이미지 선택
- **섹션별 이미지 매칭**: 상세페이지 섹션(헤더, 특징, 세부사항 등)에 적합한 이미지 자동 매칭
- **쇼핑몰 스타일 분석**: URL을 기반으로 기존 쇼핑몰의 디자인 스타일 분석
- **텍스트 자동 생성**: 제품 설명 문서를 기반으로 마케팅 문구 자동 생성
- **드래그 앤 드롭 에디터**: 상세페이지 레이아웃 커스터마이징
- **이미지 내보내기**: 완성된 상세페이지 고품질 이미지로 내보내기

## 문의

문제가 발생하거나 질문이 있으면 이슈를 생성해주세요.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
