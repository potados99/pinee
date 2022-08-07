# 📌pinee📌

<img src="https://user-images.githubusercontent.com/35878712/102021709-14b21980-3dc5-11eb-9192-b4dc8470a6e2.png" alt="pinee" width="128"/>

메시지가 고정되면 아카이브 채널에 기록해주는 봇입니다.

## 설치

- ### [서버에 pinee 설치하기](https://discord.com/api/oauth2/authorize?client_id=786477765205426176&permissions=76880&scope=bot)

- [개발중인 pinee 테스트하기](https://discord.com/api/oauth2/authorize?client_id=786876831181045781&permissions=76880&scope=bot)

## 사용

### *pinee*가 하는 일

누군가가 메시지를 고정하면 해당 메시지를 아카이브 채널로 복사합니다.

> *"어떤 채널에다가 복사하나요?"*

토픽에 '[아카이브](https://github.com/potados99/tarvern-pin-archiver/blob/9bb1824ac8eabbf4ffd4d8dc7bdffb9b322e0e18/config.ts#L29)'라는 단어가 들어 있는 채널을 사용합니다.

> *"그런 채널이 없으면요?"*

메시지를 옮길 일이 생기면 *pinee*가 새 채널을 생성할지 물어봅니다. 이때 자동으로 만들어주는 채널을 사용할 수 있습니다. 채널을 미리 만들어 놓는 것도 좋습니다.

> *"실수로 메시지가 날아간다든가도 할 수 있나요?"*

원본은 건드리지 않습니다. *pinee*는 자기가 보낸 메시지만 수정/삭제합니다.

> *"고정한 메시지를 고정 해제하면 어떻게 되나요?"*

아무 일 안 생깁니다. 아카이브 채널에 그대로 남아 있습니다.

> *"그럼 삭제하면요?"*

삭제해도 그대로 남아있습니다.

> *"그럼..메시지 내용을 수정하면요?"*

실시간으로 반영됩니다. 해당 메시지의 복사본을 아카이브 채널에서 찾아서 최신 내용으로 업데이트합니다.

단, 메시지가 고정된 상태에만 수정 내용이 실시간으로 반영됩니다. 메시지가 고정 해제된 상태이면 수정되어도 아무 행동도 하지 않습니다.

## 권한

다음 권한을 사용합니다.

- `Manage Channels`: 아카이브 채널을 만들기 위해 사용합니다.
- `View Channels`: 전체 채널 중 아카이브 채널을 찾기 위해 사용합니다.
- `Send Messages`: 아카이브 채널에서 메시지를 보내기 위해 사용합니다.
- `Manage Messages`: 보낸 메시지를 수정하기 위해(진행상태 표시 등) 사용합니다.
- `Read Message History`: 지난 고정 메시지들을 가져오기 위해 사용합니다.
- `Add Reaction`: 사용자에게 계속할 것인지 물을 때에 예시 리액션(✅, ❌)을 추가하기 위해 사용합니다.

## 기타

> *"*pinee*는 어디에 사나요?"*

미국에 살아요.

> *"서버 비용은요?"*

무료입니다.

## 업데이트 로그

### 2022.8.7 v1.6.2
- 주사위 명령 추가!
- 마법의소라고동 명령 추가!

### 2022.8.7 v1.6.1
- Redis 서비스 제공자 바꾸면서 환경변수 이름도 변경!

### 2022.8.7 v1.6.0
- 이제 고정 해제된 메시지는 건드리지 않아요.
- 슬래시(/) 명령을 지원해요!

### 2022.2.12 v1.5.1
- 멘션에도 반응!

### 2022.2.12 v1.5.0
- DM 가능! 심심이 빙의했어요.

### 2022.2.12 v1.4.0
- 이제 안 쓰는 싱크 명령 관련 코드 제거!
- Redis 캐시 적극 활용하여 퍼포먼스 개선!

### 2022.2.11 v1.3.1
- 버그 해결! 이제 오래된 메시지도 고정할 수 있습니다!!

### 2021.1.3 v1.3.0
- 3명이 힘을 합치면 메시지를 고정할 수 있습니다!!!

### 2020.12.20 v1.2.0
- API 문제에 안전하게 대응.
- 발견한 고정메시지 캐싱.

### 2020.12.20 v1.1.3
- 메모리 효율 개선.

### 2020.12.14 v1.1.2
- Discord API의 메시지 fetch 최대 100개 제한 대응.
- 메시지 가져올 때에 진행상황 표시.
- 최종 확인할 때에 `onlyForOwner` 옵션을 활성화시키지 않은 어이없는 버그 수정.

### 2020.12.14 v1.1.1
- 용어 약간 변경.
- DM 왔을때 답장함.
- 로그 메시지 이제 쓸모있어짐.

### 2020.12.12 v1.1.0
- 메시지 원본으로 건너뛰는 링크 추가.
- 고정메시지 변경에 실시간으로 대응.
- 개선된 아카이브 명령 `!!싱크` 제공.

### 2020.12.10 v1.0.0
- 새로 고정된 메시지 아카이브.
- 수동 아카이브 명령 `!!고정메시지모두백업` 제공.

## 프로젝트 구조

### 소스 구조

~~~
pinee/
  └ lib/           
    └ command/      → 명령어의 선언과 구현체.
    └ interactor/   → 사용자와 양방향 소통하는 루틴.
    └ repository/   → 채널, 메시지 등을 가져올 수 있는 저장소.
    └ responder/    → 이벤트에 대한 적절한 응답을 제공하는 응답기.
    └ routes/       → 이벤트를 처리하는 최상위 라우터.
    └ services/     → 복잡하고 오래 걸리는 이벤트 로직을 정의하는 서비스.
    └ utils/        → 구현에 필요한 유틸리티.
    bot.ts          → 봇의 기본 동작 정의.
  └ config.ts       → 설정 파일.
  ...
  └ package.json    → 프로젝트 정보.
  └ index.ts        → 프로그램의 진입점.
  └ README.md       → 이 문서.
~~~

### 실행 흐름

~~~
event 
    -> route 
        -> responder 
            -> command
                -> interactor
                -> utils
                -> ...
            -> service
                -> ...
            -> repository
                -> ...
~~~

이벤트가 발생하면 `bot.ts`에서 지정한 이벤트 리스너가 호출됩니다. 해당 리스너는 적절한 `router`를 호출합니다.

`router`는 요청의 유효성을 검증하는 역할을 합니다. 유효한 요청은 `responder`에게로 전달됩니다.

각 `responder`는 이벤트를 처리하기 위해 `command`, `service`에게 작업을 맡기거나 직접 `repository`에 접근하여 요청을 처리할 수 있습니다.

`command`, `service`, `repository`는 주어진 일을 수행하기 위해 `interactor`나 `utils`, 혹은 모두를 사용할 수 있습니다.