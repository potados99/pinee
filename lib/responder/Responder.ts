/**
 * 이벤트에 반응하는 객체입니다.
 * 사용자의 행동에 의해 주어진 일을 처리한 뒤 그 결과를 다시 사용자에게 전달합니다.
 */
export default interface Responder {
  handle(): void;
}
