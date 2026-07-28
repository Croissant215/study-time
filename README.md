# 📚 스마트 공부 시간 예측기 (Study Time Estimator)

> **교재와 문제 수를 입력하면 사용자 실력 및 공부 습관, 그리고 오차율 자동 보정 엔진(α)을 통해 현실적인 공부 시간을 예측해 주는 웹 애플리케이션**

![Google Stitch Theme](https://img.shields.io/badge/Design-Google%20Stitch%20Warm%20White-D96B43)
![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 주요 핵심 기능

### 1. 🐣 사용자 기초 실력 진단 온보딩 (Onboarding)
- 최초 접속 시 사용자의 기초 실력 수준을 진단하여 개인 맞춤형 속도 가중치($S_{skill}$)를 설정합니다:
  - **노베이스/기초 부족**: `1.35x`
  - **보통/중위권**: `1.00x`
  - **상위권/풀이 빠름**: `0.75x`

### 2. 🧠 웹 내장 스마트 AI 교재 난이도 분류기 (Zero-Key Built-in AI)
- API 키 입력 필요 없는 **100% 무료 & 자동 내장 분류 엔진** 탑재!
- 200개 이상의 시중 교재, 기출문제, 유명 강사 교재(마플시너지, 쎈, 블랙라벨, 시대인재, 고쟁이, 자이스토리 등)의 난이도를 5단계 세부 티어로 자동 파싱 및 분석 이유 제시:
  - **Tier 1 (2.7x - 최고난도/킬러)**: `블랙라벨`, `모의고사 30번`, `시대인재 N제`
  - **Tier 2 (2.2x - 심화/준킬러)**: `고쟁이`, `일품`, `짱어려운유형`
  - **Tier 3 (1.9x - 유형 준심화/마플)**: `마플시너지`, `마플교과서`, `자이스토리`, `마더텅`
  - **Tier 4 (1.5x - 유형/표준)**: `쎈`, `수능특강`, `수능완성`
  - **Tier 5 (1.0x - 개념/기초)**: `개념원리`, `수력충전`, `라이트쎈`

### 3. ⏱️ 예측 연산 공식 & 실시간 스톱워치
$$T_{predicted} = \left( N_{problems} \times 2.5\text{분} \times W_{diff} \times S_{skill} + N_{problems} \times P_{error} \times T_{wrong} \right) \times \alpha_{correction}$$
- 순수 풀이 시간과 오답 복습 및 노트 정리 시간을 분리 산출
- ⏱️ 실시간 스톱워치 타이머 모드 및 나중에 완료 수동 피드백 기록 지원

### 4. 📈 지수 이동 평균(EMA) 기반 자동 오차 보정 ($\alpha$)
- 공부 완료 후 실제 걸린 시간($T_{actual}$)을 입력하면 지수 이동 평균으로 보정 알파 가중치($\alpha$)를 자동 업데이트하여 다음 예측 정확도를 계속해서 상향 조정합니다.

### 5. 🎨 Google Stitch 화이트 웜톤 디자인
- 눈이 편안한 포근한 아이보리 웜 화이트(`#FAF8F5`) 및 테라코타 코랄(`#D96B43`) 포인트 디자인 시스템이 적용되어 있습니다.

---

## 🚀 시작하기

별도의 패키지 설치나 파이썬 서버 없이 브라우저에서 `index.html` 파일을 열거나 웹 서버를 띄워 실행하실 수 있습니다.

```bash
# 로컬 개발 서버 실행 예시 (Python 3)
python -m http.server 8080
```
브라우저에서 `http://localhost:8080` 으로 접속하세요.

---

## 📄 라이선스

MIT License.
