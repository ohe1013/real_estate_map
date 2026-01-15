-- 1. Create the Template
INSERT INTO templates (id, title, created_at)
VALUES (uuid_generate_v4(), '🏠 실거주 최우선 판단 템플릿 (Noise-first)', now());

-- 2. Define a function or variable to hold the template ID (or just use a subquery)
-- In SQL Editor, we can use a temporary variable in some environments, but let's just use the subquery approach for portability.

-- 1️⃣ 실거주 소음 (최우선)
INSERT INTO template_questions (id, template_id, category, text, type, order_idx, is_critical)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '1️⃣ 실거주 소음 (최우선)', '창 열었을 때 도로/차량/오토바이 소음 수준은?', 'rating', 1, true),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '1️⃣ 실거주 소음 (최우선)', '버스 정차 / 신호 대기 소음이 반복적으로 들리는가?', 'yesno', 2, true),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '1️⃣ 실거주 소음 (최우선)', '학교 종소리 / 교회·사찰 / 상가 음악 소음 존재 여부', 'multiselect', 3, true),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '1️⃣ 실거주 소음 (최우선)', '밤에도 시끄러울 구조인가? (24시간 업종, 유흥, 배달 동선)', 'yesno', 4, true),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '1️⃣ 실거주 소음 (최우선)', '소음 관련 종합 메모', 'text', 5, false);

-- Set options for multiselect Q3
UPDATE template_questions SET options = '["없음","학교","교회/사찰","상가 음악","기타"]'::jsonb 
WHERE text = '학교 종소리 / 교회·사찰 / 상가 음악 소음 존재 여부';

-- 2️⃣ 일조 & 채광 (계절 기준)
INSERT INTO template_questions (id, template_id, category, text, type, order_idx)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '2️⃣ 일조 & 채광 (계절 기준)', '실제 남향 기준, 앞동/빌라/산에 가려지는가?', 'yesno', 6),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '2️⃣ 일조 & 채광 (계절 기준)', '직접광이 들어오는 시간대는?', 'multiselect', 7),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '2️⃣ 일조 & 채광 (계절 기준)', '겨울 기준에도 해가 건물 사이로 들어오는 구조인가?', 'yesno', 8),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '2️⃣ 일조 & 채광 (계절 기준)', '채광 관련 메모', 'text', 9);

UPDATE template_questions SET options = '["오전","정오","오후","직접광 거의 없음"]'::jsonb 
WHERE text = '직접광이 들어오는 시간대는?';

-- 3️⃣ 주변 개발 리스크 (악재 먼저)
INSERT INTO template_questions (id, template_id, category, text, type, order_idx)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '3️⃣ 주변 개발 리스크 (악재 먼저)', '앞 필지 저층/주차장 → 고층 개발 가능성?', 'yesno', 10),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '3️⃣ 주변 개발 리스크 (악재 먼저)', '인접 재개발/재건축 예정지 존재 여부', 'yesno', 11),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '3️⃣ 주변 개발 리스크 (악재 먼저)', '대형 악재 가능 시설 계획 (물류·종교·학교 이전 등)', 'multiselect', 12),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '3️⃣ 주변 개발 리스크 (악재 먼저)', '개발 리스크 종합 판단', 'rating', 13);

UPDATE template_questions SET options = '["없음","물류시설","종교시설","학교 이전","기타"]'::jsonb 
WHERE text = '대형 악재 가능 시설 계획 (물류·종교·학교 이전 등)';

-- 4️⃣ 단지 / 건물 노후 포인트
INSERT INTO template_questions (id, template_id, category, text, type, order_idx)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '4️⃣ 단지 / 건물 노후 포인트', '외벽 균열·누수 흔적 확인 여부', 'yesno', 14),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '4️⃣ 단지 / 건물 노후 포인트', '공용부 냄새(하수/곰팡이) 체감', 'rating', 15),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '4️⃣ 단지 / 건물 노후 포인트', '승강기 수 대비 세대 수 체감은?', 'rating', 16);

-- 5️⃣ 동·라인 위치
INSERT INTO template_questions (id, template_id, category, text, type, order_idx)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '5️⃣ 동·라인 위치', '단지 입구 / 쓰레기장 / 변전실 인접 여부', 'multiselect', 17),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '5️⃣ 동·라인 위치', '맞은편 동과 시선 간섭 수준', 'rating', 18),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '5️⃣ 동·라인 위치', '엘리베이터 바로 앞 세대인가?', 'yesno', 19);

UPDATE template_questions SET options = '["해당 없음","입구 인접","쓰레기장 인접","변전실 인접"]'::jsonb 
WHERE text = '단지 입구 / 쓰레기장 / 변전실 인접 여부';

-- 6️⃣ 주차 현실성
INSERT INTO template_questions (id, template_id, category, text, type, order_idx)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '6️⃣ 주차 현실성', '밤 시간대 실제 주차 가능했는가?', 'yesno', 20),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '6️⃣ 주차 현실성', '이중주차/외부차량 체감 여부', 'yesno', 21),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '6️⃣ 주차 현실성', '세대당 주차대수 체감 점수', 'rating', 22);

-- 7️⃣ 생활 동선 체감
INSERT INTO template_questions (id, template_id, category, text, type, order_idx)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '7️⃣ 생활 동선 체감', '마트·편의점 체감 거리', 'select', 23),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '7️⃣ 생활 동선 체감', '엘베→현관→차 동선 체감', 'rating', 24),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '7️⃣ 생활 동선 체감', '비 오는 날 우산 동선 불편 여부', 'yesno', 25);

UPDATE template_questions SET options = '["가깝다","애매하다","멀다"]'::jsonb 
WHERE text = '마트·편의점 체감 거리';

-- 8️⃣ 학군·환경 ‘진짜 체감’
INSERT INTO template_questions (id, template_id, category, text, type, order_idx)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '8️⃣ 학군·환경 ‘진짜 체감’', '등하교 시간 소음/혼잡 체감', 'rating', 26),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '8️⃣ 학군·환경 ‘진짜 체감’', '학원가 불빛·밤 유동인구 체감', 'rating', 27),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '8️⃣ 학군·환경 ‘진짜 체감’', '놀이터 위치 영향', 'select', 28);

UPDATE template_questions SET options = '["가깝지만 장점","가까워서 단점","적당함","멀다"]'::jsonb 
WHERE text = '놀이터 위치 영향';

-- 9️⃣ 내부 구조 & 확장 상태
INSERT INTO template_questions (id, template_id, category, text, type, order_idx)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '9️⃣ 내부 구조 & 확장 상태', '발코니 확장 마감 퀄리티', 'rating', 29),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '9️⃣ 내부 구조 & 확장 상태', '욕실 배수/환기 상태', 'rating', 30),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '9️⃣ 내부 구조 & 확장 상태', '수납 구조 만족도 (붙박이·팬트리 등)', 'rating', 31);

-- 🔟 매도 포인트 (미래의 나 관점)
INSERT INTO template_questions (id, template_id, category, text, type, order_idx)
VALUES 
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '🔟 매도 포인트 (미래의 나 관점)', '이 집을 살 사람을 바로 떠올릴 수 있는가?', 'yesno', 32),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '🔟 매도 포인트 (미래의 나 관점)', '비슷한 매물 대비 차별 포인트 1가지', 'text', 33),
(uuid_generate_v4(), (SELECT id FROM templates WHERE title = '🏠 실거주 최우선 판단 템플릿 (Noise-first)' LIMIT 1), '🔟 매도 포인트 (미래의 나 관점)', '전세/월세 수요 상상 가능 여부', 'yesno', 34);
