import type { Tag, PostFilterItem } from "./tag.type"

export const SAMPLE_TAGS: Tag[] = [
  { slug: "nextjs", label: "Next.js", count: 4 },
  { slug: "react", label: "React", count: 6 },
  { slug: "typescript", label: "TypeScript", count: 8 },
  { slug: "security", label: "보안", count: 3 },
  { slug: "protocol", label: "프로토콜", count: 2 },
  { slug: "devops", label: "DevOps", count: 3 },
  { slug: "database", label: "데이터베이스", count: 2 },
  { slug: "algorithm", label: "알고리즘", count: 2 },
  { slug: "network", label: "네트워크", count: 2 },
  { slug: "linux", label: "Linux", count: 1 },
]

export const QUICK_TAG_LIMIT = 7

export const SAMPLE_POSTS: PostFilterItem[] = [
  {
    id: 1,
    title: "Next.js App Router 완벽 가이드",
    excerpt: "App Router의 서버 컴포넌트, 레이아웃, 중첩 라우팅을 깊이 있게 알아봅니다.",
    tags: ["nextjs", "react", "typescript"],
    publishedAt: "2025-05-01",
  },
  {
    id: 2,
    title: "TypeScript 타입 체계 심화",
    excerpt: "조건부 타입, 매핑 타입, infer 키워드를 활용한 고급 타입 패턴을 소개합니다.",
    tags: ["typescript"],
    publishedAt: "2025-04-20",
  },
  {
    id: 3,
    title: "React Query와 서버 상태 관리",
    excerpt: "TanStack Query를 사용해 서버 상태를 효율적으로 관리하는 방법을 다룹니다.",
    tags: ["react", "nextjs"],
    publishedAt: "2025-04-15",
  },
  {
    id: 4,
    title: "TLS 1.3 프로토콜 분석",
    excerpt: "TLS 1.3의 핸드셰이크 과정과 이전 버전 대비 보안 개선 사항을 분석합니다.",
    tags: ["protocol", "security", "network"],
    publishedAt: "2025-04-10",
  },
  {
    id: 5,
    title: "웹 애플리케이션 보안 취약점 정리",
    excerpt: "OWASP Top 10을 기준으로 실제 공격 패턴과 방어 방법을 정리합니다.",
    tags: ["security"],
    publishedAt: "2025-04-05",
  },
  {
    id: 6,
    title: "Docker와 Kubernetes 기반 배포 자동화",
    excerpt: "컨테이너 오케스트레이션과 CI/CD 파이프라인 구성 방법을 단계별로 설명합니다.",
    tags: ["devops", "linux"],
    publishedAt: "2025-03-30",
  },
  {
    id: 7,
    title: "PostgreSQL 쿼리 최적화 실전",
    excerpt: "인덱스 설계부터 실행 계획 분석까지 쿼리 성능 개선 방법론을 공유합니다.",
    tags: ["database"],
    publishedAt: "2025-03-25",
  },
  {
    id: 8,
    title: "알고리즘 문제 풀이: 그래프 탐색",
    excerpt: "BFS/DFS를 활용한 다양한 그래프 문제 풀이 전략을 TypeScript로 구현합니다.",
    tags: ["algorithm", "typescript"],
    publishedAt: "2025-03-20",
  },
  {
    id: 9,
    title: "HTTP/2와 HTTP/3 비교 분석",
    excerpt: "멀티플렉싱, 헤더 압축, QUIC 프로토콜의 차이와 실전 적용 방법을 비교합니다.",
    tags: ["protocol", "network"],
    publishedAt: "2025-03-15",
  },
  {
    id: 10,
    title: "React 서버 컴포넌트 패턴",
    excerpt: "RSC를 활용한 데이터 페칭 패턴과 클라이언트-서버 컴포넌트 경계 설계를 다룹니다.",
    tags: ["react", "nextjs"],
    publishedAt: "2025-03-10",
  },
  {
    id: 11,
    title: "DevOps 환경에서의 보안 설정",
    excerpt: "컨테이너 보안, 시크릿 관리, 네트워크 정책 설정을 실무 관점에서 정리합니다.",
    tags: ["devops", "security"],
    publishedAt: "2025-03-05",
  },
  {
    id: 12,
    title: "Redis 캐싱 전략과 데이터 구조",
    excerpt: "캐싱 패턴 선택 기준과 Redis 자료구조별 실전 활용 사례를 소개합니다.",
    tags: ["database"],
    publishedAt: "2025-03-01",
  },
]
