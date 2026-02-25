let prisma;

async function getPrismaClient() {
  if (!prisma) {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
  }
  return prisma;
}

async function main() {
  const prisma = await getPrismaClient();
  const placeTemplateTitle = "공통 단지 현장 점검 템플릿";
  const placeTemplateId = "00000000-0000-0000-0000-000000000001";

  const unitTemplateTitle = "세대 내부 상세 점검 템플릿";
  const unitTemplateId = "00000000-0000-0000-0000-000000000002";

  await prisma.template.upsert({
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

  await prisma.template.upsert({
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
      text: "01. 단지 접근성과 보행 동선은 안전하고 편리한가?",
      category: "1. 단지 환경",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "02. 주차 동선과 출입 동선이 혼잡하지 않은가?",
      category: "1. 단지 환경",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "03. 관리 상태(복도, 엘리베이터, 로비)가 양호한가?",
      category: "1. 단지 환경",
      type: "rating",
      criticalLevel: 1,
    },
    {
      text: "04. 소음/악취/유해시설 등 부정 요인이 있는가?",
      category: "1. 단지 환경",
      type: "yesno",
      criticalLevel: 3,
      isBad: true,
    },
    {
      text: "05. 교육/생활 인프라 접근성은 충분한가?",
      category: "1. 단지 환경",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "06. 단지 내 보안(출입통제, CCTV)은 적절한가?",
      category: "1. 단지 환경",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "07. 커뮤니티 시설 및 공용 편의시설은 만족스러운가?",
      category: "1. 단지 환경",
      type: "rating",
      criticalLevel: 1,
    },
    {
      text: "08. 향후 개발/호재 또는 악재 가능성이 있는가?",
      category: "1. 단지 환경",
      type: "text",
      criticalLevel: 2,
    },
    {
      text: "09. 교통 접근성(지하철/버스/도로)은 양호한가?",
      category: "1. 단지 환경",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "10. 단지 종합 평가 코멘트를 작성하라",
      category: "1. 단지 환경",
      type: "text",
      criticalLevel: 2,
    },
  ];

  const unitQuestions = [
    {
      text: "11. 세대 채광과 통풍은 만족스러운가?",
      category: "2. 세대 내부",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "12. 층간/외부 소음 수준은 허용 가능한가?",
      category: "2. 세대 내부",
      type: "rating",
      criticalLevel: 3,
    },
    {
      text: "13. 누수/곰팡이/결로 흔적이 있는가?",
      category: "2. 세대 내부",
      type: "yesno",
      criticalLevel: 3,
      isBad: true,
    },
    {
      text: "14. 주방/욕실/설비 상태는 양호한가?",
      category: "2. 세대 내부",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "15. 수납공간과 가구 배치 효율은 충분한가?",
      category: "2. 세대 내부",
      type: "rating",
      criticalLevel: 1,
    },
    {
      text: "16. 마감 상태(벽지, 바닥, 창호)가 양호한가?",
      category: "2. 세대 내부",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "17. 평면 구조가 실사용 동선에 적합한가?",
      category: "2. 세대 내부",
      type: "rating",
      criticalLevel: 2,
    },
    {
      text: "18. 확장/리모델링 필요 항목이 있는가?",
      category: "2. 세대 내부",
      type: "multiselect",
      options: ["주방", "욕실", "창호", "수납", "없음"],
      criticalLevel: 1,
    },
    {
      text: "19. 매도자/중개사 제공 정보와 현장 상태가 일치하는가?",
      category: "2. 세대 내부",
      type: "yesno",
      criticalLevel: 2,
    },
    {
      text: "20. 세대 종합 평가 코멘트를 작성하라",
      category: "2. 세대 내부",
      type: "text",
      criticalLevel: 2,
    },
  ];

  await prisma.question.deleteMany({
    where: { templateId: { in: [placeTemplateId, unitTemplateId] } },
  });

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

  console.log("Seed completed: PLACE/UNIT default templates refreshed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const client = await getPrismaClient();
    await client.$disconnect();
  });
