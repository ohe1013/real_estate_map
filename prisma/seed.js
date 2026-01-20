const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const placeTemplateTitle = "🏙️ 단지 및 입지 평가 템플릿";
  const placeTemplateId = "00000000-0000-0000-0000-000000000001";

  const unitTemplateTitle = "🏠 세대 내부 상세 평가 템플릿";
  const unitTemplateId = "00000000-0000-0000-0000-000000000002";

  // 1. Create or Update PLACE Template
  const placeTemplate = await prisma.template.upsert({
    where: { id: placeTemplateId },
    update: {
      title: placeTemplateTitle,
      scope: "PLACE",
    },
    create: {
      id: placeTemplateId,
      title: placeTemplateTitle,
      scope: "PLACE",
    },
  });

  // 2. Create or Update UNIT Template
  const unitTemplate = await prisma.template.upsert({
    where: { id: unitTemplateId },
    update: {
      title: unitTemplateTitle,
      scope: "UNIT",
    },
    create: {
      id: unitTemplateId,
      title: unitTemplateTitle,
      scope: "UNIT",
    },
  });

  const placeQuestions = [
    {
      text: "01. 주변 유해 환경: 유흥가, 24시 업종, 야간 조명 및 밤길 분위기",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "02. 개발 리스크: 인접 필지 저층 건물의 고층 개발 가능성 및 재개발 예정지",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "yesno",
      criticalLevel: 3,
      isBad: true,
    },
    {
      text: "03. 혐오 시설: 변전실, 대형 종교시설, 물류시설 등 인접 여부",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "multiselect",
      options: ["변전실", "대형종교시설", "물류시설", "기타"],
      criticalLevel: 2,
      isBad: true,
    },
    {
      text: "04. 주차 편의성: 지하 주차장 직결 여부 및 야간 시간대 실제 주차 난이도",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "05. 승강기 효율: 세대 수 대비 승강기 대수 및 출퇴근 시간대 대기 체감",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "rating",
      criticalLevel: 1,
    },
    {
      text: "06. 보행 환경: 단지 내/외부 경사도 및 유모차·휠체어 이동 편의성",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "rating",
      criticalLevel: 1,
    },
    {
      text: "07. 관리 상태: 공용부(복도, 엘리베이터) 청결도 및 관리실 활성화 정도",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "rating",
      criticalLevel: 1,
    },
    {
      text: "08. 단지 내 동선: 쓰레기 분리수거장 위치(냄새/소음) 및 동별 출입구 보안",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "rating",
      criticalLevel: 1,
    },
    {
      text: "09. 학군 동선: 초등학교 통학로 안전성(횡단보도 유무) 및 학원가 접근성",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "10. 생활 인프라: 마트, 병원, 편의점 등 주요 편의시설 도보 이용 거리",
      category: "1. 단지 및 입지 관련 (외부/공용)",
      type: "rating",
      criticalLevel: 2,
    },
  ];

  const unitQuestions = [
    {
      text: "11. 실질 소음: 창문 개방 시 도로 차량 소음 및 오토바이 배달 동선 소음",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "rating",
      criticalLevel: 3,
    },
    {
      text: "12. 조망 및 채광: 영구 조망권 확보 여부 및 계절별(겨울) 직접광 유입 정도",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "13. 시선 간섭: 앞동과의 거리 및 거실/침실 내부 사생활 침해 수준",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "14. 누수/곰팡이: 천장 모서리, 싱크대 하단, 베란다 외벽 누수 흔적 확인",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "yesno",
      criticalLevel: 3,
      isBad: true,
    },
    {
      text: "15. 수압 및 배수: 욕실/주방 수압 및 변기/배수구 물 빠짐 상태",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "16. 환기 구조: 맞통풍 가능 구조 여부 및 주방 창문 유무 확인",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "yesno",
      criticalLevel: 2,
    },
    {
      text: "17. 평면 효율: 가구 배치가 애매한 기둥이나 버려지는 공간(데드 스페이스) 확인",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "rating",
      criticalLevel: 1,
    },
    {
      text: "18. 마감 퀄리티: 발코니 확장 마감 상태 및 창호(샤시) 노후도·기밀성",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "19. 수납 공간: 붙박이장, 팬트리, 다용도실 등 실질적인 수납 만족도",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "rating",
      criticalLevel: 1,
    },
    {
      text: "20. 매도 포인트: 해당 세대의 희소성(로얄동/층) 및 향후 매수 타겟층 명확성",
      category: "2. 세대 내부 관련 (실내/전용)",
      type: "text",
      criticalLevel: 2,
    },
  ];

  // Clean existing questions
  await prisma.question.deleteMany({
    where: { templateId: { in: [placeTemplateId, unitTemplateId] } },
  });

  // Insert Place Questions
  for (let i = 0; i < placeQuestions.length; i++) {
    const q = placeQuestions[i];
    await prisma.question.create({
      data: {
        templateId: placeTemplateId,
        text: q.text,
        type: q.type,
        orderIdx: i + 1,
        category: q.category,
        criticalLevel: q.criticalLevel || 1,
        isBad: q.isBad || false,
        options: q.options || null,
        isActive: true,
      },
    });
  }

  // Insert Unit Questions
  for (let i = 0; i < unitQuestions.length; i++) {
    const q = unitQuestions[i];
    await prisma.question.create({
      data: {
        templateId: unitTemplateId,
        text: q.text,
        type: q.type,
        orderIdx: i + 1,
        category: q.category,
        criticalLevel: q.criticalLevel || 1,
        isBad: q.isBad || false,
        options: q.options || null,
        isActive: true,
      },
    });
  }

  console.log("Seed completed: Split into PLACE and UNIT default templates!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
