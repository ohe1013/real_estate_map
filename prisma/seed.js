const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const templateTitle = "🏠 실거주 최우선 판단 템플릿 (Noise-first)";
  const templateId = "00000000-0000-0000-0000-000000000001";

  // 1. Create or Update Template
  const template = await prisma.template.upsert({
    where: { id: templateId },
    update: { title: templateTitle },
    create: {
      id: templateId,
      title: templateTitle,
    },
  });

  const questions = [
    // 1️⃣ 실거주 소음 (최우선)
    {
      text: "창 열었을 때 도로/차량/오토바이 소음 수준은?",
      type: "rating",
      orderIdx: 1,
      category: "1️⃣ 실거주 소음 (최우선)",
      isCritical: true,
    },
    {
      text: "버스 정차 / 신호 대기 소음이 반복적으로 들리는가?",
      type: "yesno",
      orderIdx: 2,
      category: "1️⃣ 실거주 소음 (최우선)",
      isCritical: true,
    },
    {
      text: "학교 종소리 / 교회·사찰 / 상가 음악 소음 존재 여부",
      type: "multiselect",
      orderIdx: 3,
      category: "1️⃣ 실거주 소음 (최우선)",
      isCritical: true,
      options: ["없음", "학교", "교회/사찰", "상가 음악", "기타"],
    },
    {
      text: "밤에도 시끄러울 구조인가? (24시간 업종, 유흥, 배달 동선)",
      type: "yesno",
      orderIdx: 4,
      category: "1️⃣ 실거주 소음 (최우선)",
      isCritical: true,
    },
    {
      text: "소음 관련 종합 메모",
      type: "text",
      orderIdx: 5,
      category: "1️⃣ 실거주 소음 (최우선)",
      isCritical: false,
    },

    // 2️⃣ 일조 & 채광 (계절 기준)
    {
      text: "실제 남향 기준, 앞동/빌라/산에 가려지는가?",
      type: "yesno",
      orderIdx: 6,
      category: "2️⃣ 일조 & 채광 (계절 기준)",
    },
    {
      text: "직접광이 들어오는 시간대는?",
      type: "multiselect",
      orderIdx: 7,
      category: "2️⃣ 일조 & 채광 (계절 기준)",
      options: ["오전", "정오", "오후", "직접광 거의 없음"],
    },
    {
      text: "겨울 기준에도 해가 건물 사이로 들어오는 구조인가?",
      type: "yesno",
      orderIdx: 8,
      category: "2️⃣ 일조 & 채광 (계절 기준)",
    },
    {
      text: "채광 관련 메모",
      type: "text",
      orderIdx: 9,
      category: "2️⃣ 일조 & 채광 (계절 기준)",
    },

    // 3️⃣ 주변 개발 리스크 (악재 먼저)
    {
      text: "앞 필지 저층/주차장 → 고층 개발 가능성?",
      type: "yesno",
      orderIdx: 10,
      category: "3️⃣ 주변 개발 리스크 (악재 먼저)",
    },
    {
      text: "인접 재개발/재건축 예정지 존재 여부",
      type: "yesno",
      orderIdx: 11,
      category: "3️⃣ 주변 개발 리스크 (악재 먼저)",
    },
    {
      text: "대형 악재 가능 시설 계획 (물류·종교·학교 이전 등)",
      type: "multiselect",
      orderIdx: 12,
      category: "3️⃣ 주변 개발 리스크 (악재 먼저)",
      options: ["없음", "물류시설", "종교시설", "학교 이전", "기타"],
    },
    {
      text: "개발 리스크 종합 판단",
      type: "rating",
      orderIdx: 13,
      category: "3️⃣ 주변 개발 리스크 (악재 먼저)",
    },

    // 4️⃣ 단지 / 건물 노후 포인트
    {
      text: "외벽 균열·누수 흔적 확인 여부",
      type: "yesno",
      orderIdx: 14,
      category: "4️⃣ 단지 / 건물 노후 포인트",
    },
    {
      text: "공용부 냄새(하수/곰팡이) 체감",
      type: "rating",
      orderIdx: 15,
      category: "4️⃣ 단지 / 건물 노후 포인트",
    },
    {
      text: "승강기 수 대비 세대 수 체감은?",
      type: "rating",
      orderIdx: 16,
      category: "4️⃣ 단지 / 건물 노후 포인트",
    },

    // 5️⃣ 동·라인 위치
    {
      text: "단지 입구 / 쓰레기장 / 변전실 인접 여부",
      type: "multiselect",
      orderIdx: 17,
      category: "5️⃣ 동·라인 위치",
      options: ["해당 없음", "입구 인접", "쓰레기장 인접", "변전실 인접"],
    },
    {
      text: "맞은편 동과 시선 간섭 수준",
      type: "rating",
      orderIdx: 18,
      category: "5️⃣ 동·라인 위치",
    },
    {
      text: "엘리베이터 바로 앞 세대인가?",
      type: "yesno",
      orderIdx: 19,
      category: "5️⃣ 동·라인 위치",
    },

    // 6️⃣ 주차 현실성
    {
      text: "밤 시간대 실제 주차 가능했는가?",
      type: "yesno",
      orderIdx: 20,
      category: "6️⃣ 주차 현실성",
    },
    {
      text: "이중주차/외부차량 체감 여부",
      type: "yesno",
      orderIdx: 21,
      category: "6️⃣ 주차 현실성",
    },
    {
      text: "세대당 주차대수 체감 점수",
      type: "rating",
      orderIdx: 22,
      category: "6️⃣ 주차 현실성",
    },

    // 7️⃣ 생활 동선 체감
    {
      text: "마트·편의점 체감 거리",
      type: "select",
      orderIdx: 23,
      category: "7️⃣ 생활 동선 체감",
      options: ["가깝다", "애매하다", "멀다"],
    },
    {
      text: "엘베→현관→차 동선 체감",
      type: "rating",
      orderIdx: 24,
      category: "7️⃣ 생활 동선 체감",
    },
    {
      text: "비 오는 날 우산 동선 불편 여부",
      type: "yesno",
      orderIdx: 25,
      category: "7️⃣ 생활 동선 체감",
    },

    // 8️⃣ 학군·환경 ‘진짜 체감’
    {
      text: "등하교 시간 소음/혼잡 체감",
      type: "rating",
      orderIdx: 26,
      category: "8️⃣ 학군·환경 ‘진짜 체감’",
    },
    {
      text: "학원가 불빛·밤 유동인구 체감",
      type: "rating",
      orderIdx: 27,
      category: "8️⃣ 학군·환경 ‘진짜 체감’",
    },
    {
      text: "놀이터 위치 영향",
      type: "select",
      orderIdx: 28,
      category: "8️⃣ 학군·환경 ‘진짜 체감’",
      options: ["가깝지만 장점", "가까워서 단점", "적당함", "멀다"],
    },

    // 9️⃣ 내부 구조 & 확장 상태
    {
      text: "발코니 확장 마감 퀄리티",
      type: "rating",
      orderIdx: 29,
      category: "9️⃣ 내부 구조 & 확장 상태",
    },
    {
      text: "욕실 배수/환기 상태",
      type: "rating",
      orderIdx: 30,
      category: "9️⃣ 내부 구조 & 확장 상태",
    },
    {
      text: "수납 구조 만족도 (붙박이·팬트리 등)",
      type: "rating",
      orderIdx: 31,
      category: "9️⃣ 내부 구조 & 확장 상태",
    },

    // 🔟 매도 포인트 (미래의 나 관점)
    {
      text: "이 집을 살 사람을 바로 떠올릴 수 있는가?",
      type: "yesno",
      orderIdx: 32,
      category: "🔟 매도 포인트 (미래의 나 관점)",
    },
    {
      text: "비슷한 매물 대비 차별 포인트 1가지",
      type: "text",
      orderIdx: 33,
      category: "🔟 매도 포인트 (미래의 나 관점)",
    },
    {
      text: "전세/월세 수요 상상 가능 여부",
      type: "yesno",
      orderIdx: 34,
      category: "🔟 매도 포인트 (미래의 나 관점)",
    },
  ];

  for (const q of questions) {
    const qId = `00000000-0000-0000-0000-${String(q.orderIdx).padStart(
      12,
      "0"
    )}`;
    await prisma.question.upsert({
      where: { id: qId },
      update: {
        text: q.text,
        type: q.type,
        orderIdx: q.orderIdx,
        category: q.category,
        isCritical: !!q.isCritical,
        options: q.options || null,
      },
      create: {
        id: qId,
        templateId: template.id,
        text: q.text,
        type: q.type,
        orderIdx: q.orderIdx,
        category: q.category,
        isCritical: !!q.isCritical,
        options: q.options || null,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
